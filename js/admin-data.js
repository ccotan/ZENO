import { sdk, state, codeOf, generation, loadCatalog } from "./market.js";
export const access = {
  uid: null,
  role: "none",
  blocked: false,
  block: null,
  error: null,
  ready: false,
};
let stops = [],
  epoch = 0,
  lastUid;
const fail = (c) => Object.assign(new Error(c), { code: c });
const changed = () => window.dispatchEvent(new Event("zeno-access"));
export const isStaff = () =>
  access.ready &&
  !access.blocked &&
  ["owner", "admin", "moderator"].includes(access.role);
export const isManager = () =>
  isStaff() && ["owner", "admin"].includes(access.role);
export const isOwner = () => isStaff() && access.role === "owner";
export function initAccess() {
  window.addEventListener("zeno-data", refreshAccess);
  refreshAccess();
}
async function refreshAccess() {
  const uid = state.user?.uid || null;
  if (uid === lastUid) return;
  lastUid = uid;
  const v = ++epoch;
  stops.forEach((s) => s());
  stops = [];
  Object.assign(access, {
    uid,
    role: "none",
    blocked: false,
    block: null,
    error: null,
    ready: !uid,
  });
  changed();
  if (!uid) return;
  try {
    const { f, db, instance } = await sdk();
    if (v !== epoch || instance.currentUser?.uid !== uid) return;
    let ready = new Set();
    const watch = (collection, apply) =>
      f.onSnapshot(
        f.doc(db, collection, uid),
        (d) => {
          if (v !== epoch) return;
          apply(d.exists() ? d.data() : null);
          ready.add(collection);
          access.ready = ready.size === 2;
          access.error = null;
          changed();
        },
        (e) => {
          if (v !== epoch) return;
          access.ready = false;
          access.error = codeOf(e);
          changed();
        },
      );
    stops.push(
      watch("staff", (d) => (access.role = d?.role || "none")),
      watch("userBlocks", (d) => {
        access.block = d;
        access.blocked = d?.blocked === true;
      }),
    );
  } catch (e) {
    if (v === epoch) {
      access.error = codeOf(e);
      changed();
    }
  }
}
async function session(staff = false) {
  const a = await sdk();
  if (!a.instance.currentUser || a.instance.currentUser.uid !== access.uid)
    throw fail("auth/sign-in-required");
  if (staff && !isStaff()) throw fail("permission-denied");
  return a;
}
export async function listRecords(col, cursor = null) {
  const { f, db } = await session(true),
    parts = [
      col === "users"
        ? f.orderBy(f.documentId())
        : f.orderBy(
            ["staff", "userBlocks"].includes(col) ? "updatedAt" : "createdAt",
            "desc",
          ),
      f.limit(50),
    ];
  if (cursor) parts.push(f.startAfter(cursor));
  const s = await f.getDocsFromServer(f.query(f.collection(db, col), ...parts));
  return {
    rows: s.docs.map((d) => ({ ...d.data(), docId: d.id })),
    cursor: s.docs.at(-1) || null,
    more: s.size === 50,
  };
}
export async function findUser(key) {
  const { f, db } = await session(true);
  if (!/^discord:[0-9]{17,20}$/.test(key)) {
    if (!/^[A-Za-z0-9_]{3,16}$/.test(key)) throw fail("account-id-invalid");
    const profiles = await f.getDocsFromServer(
      f.query(
        f.collection(db, "publicProfiles"),
        f.where("minecraftName", "==", key),
        f.limit(20),
      ),
    );
    if (profiles.size > 1) throw fail("nickname-ambiguous");
    if (profiles.empty) return null;
    const users = await f.getDocsFromServer(
      f.query(
        f.collection(db, "users"),
        f.where("publicId", "==", profiles.docs[0].id),
        f.limit(20),
      ),
    );
    return users.empty
      ? null
      : { ...users.docs[0].data(), docId: users.docs[0].id };
  }
  const d = await f.getDocFromServer(f.doc(db, "users", key));
  return d.exists() ? { ...d.data(), docId: d.id } : null;
}
export async function userDetails(uid) {
  const { f, db } = await session(true);
  const [r, b] = await Promise.all(
    ["staff", "userBlocks"].map((c) => f.getDocFromServer(f.doc(db, c, uid))),
  );
  return {
    role: r.exists() ? r.data().role : "none",
    blocked: b.exists() && b.data().blocked === true,
    reason: b.exists() ? b.data().reason : "",
  };
}
function audit(a, action, kind, id, gen, reason, from, to) {
  return {
    actorUid: a.instance.currentUser.uid,
    action,
    targetKind: kind,
    targetId: id,
    targetGeneration: gen,
    reason,
    from,
    to,
    createdAt: a.f.serverTimestamp(),
  };
}
export async function moderate(action, target, reason, value) {
  reason = reason.trim();
  if (reason.length < 8 || reason.length > 500) throw fail("reason-invalid");
  const a = await session(true),
    { f, db } = a,
    uid = a.instance.currentUser.uid;
  await f.runTransaction(db, async (tx) => {
    let ref,
      before,
      id = crypto.randomUUID(),
      patch,
      entry;
    if (["lot-hide", "lot-show", "lot-delete"].includes(action)) {
      ref = f.doc(db, "lots", target.docId);
      const d = await tx.get(ref);
      if (!d.exists() || d.data().id !== target.id)
        throw fail("listing-changed");
      before = d.data();
      const from = before.visibility || "active";
      if (action === "lot-delete") {
        if (!isManager()) throw fail("permission-denied");
        if ((before.reservedQty || 0) > 0) throw fail("listing-reserved");
        id = "delete_" + target.docId + "_" + before.id;
        entry = audit(
          a,
          action,
          "lot",
          target.docId,
          before.id,
          reason,
          from,
          "deleted",
        );
        tx.delete(f.doc(db, "lotPhotos", target.docId));
        tx.delete(ref);
      } else {
        const to = action === "lot-hide" ? "hidden" : "active";
        if (from === to) throw fail("no-change");
        patch = {
          visibility: to,
          moderationReason: reason,
          moderatedAt: f.serverTimestamp(),
          lastAuditId: id,
        };
        entry = audit(
          a,
          action,
          "lot",
          target.docId,
          before.id,
          reason,
          from,
          to,
        );
        tx.update(ref, patch);
      }
    } else if (action === "role-set") {
      if (!isOwner()) throw fail("permission-denied");
      if (
        !["admin", "moderator", "none"].includes(value) ||
        target.docId === uid
      )
        throw fail("permission-denied");
      ref = f.doc(db, "staff", target.docId);
      const d = await tx.get(ref),
        old = d.exists() ? d.data() : null;
      const [u, b] = await Promise.all([
        tx.get(f.doc(db, "users", target.docId)),
        tx.get(f.doc(db, "userBlocks", target.docId)),
      ]);
      if (
        !u.exists() ||
        (b.exists() && b.data().blocked) ||
        old?.role === "owner"
      )
        throw fail("permission-denied");
      const from = old?.role || "none";
      if (from === value) throw fail("no-change");
      entry = audit(a, action, "user", target.docId, "", reason, from, value);
      tx.set(ref, {
        role: value,
        assignedBy: uid,
        createdAt: old?.createdAt || f.serverTimestamp(),
        updatedAt: f.serverTimestamp(),
        lastAuditId: id,
      });
    } else if (["user-block", "user-unblock"].includes(action)) {
      if (!isManager() || target.docId === uid) throw fail("permission-denied");
      ref = f.doc(db, "userBlocks", target.docId);
      const d = await tx.get(ref),
        s = await tx.get(f.doc(db, "staff", target.docId)),
        u = await tx.get(f.doc(db, "users", target.docId));
      const role = s.exists() ? s.data().role : "none";
      if (!u.exists() || role === "owner" || (!isOwner() && role !== "none"))
        throw fail("permission-denied");
      const from = d.exists() && d.data().blocked === true,
        to = action === "user-block";
      if (from === to) throw fail("no-change");
      entry = audit(
        a,
        action,
        "user",
        target.docId,
        "",
        reason,
        String(from),
        String(to),
      );
      tx.set(ref, {
        blocked: to,
        reason,
        updatedAt: f.serverTimestamp(),
        lastAuditId: id,
      });
    } else if (action === "report-update") {
      ref = f.doc(db, "reports", target.docId);
      const d = await tx.get(ref);
      if (
        !d.exists() ||
        !["open", "reviewing"].includes(d.data().status) ||
        !["reviewing", "resolved", "rejected"].includes(value) ||
        d.data().status === value
      )
        throw fail("no-change");
      entry = audit(
        a,
        action,
        "report",
        target.docId,
        "",
        reason,
        d.data().status,
        value,
      );
      tx.update(ref, {
        status: value,
        resolution: reason,
        handledBy: uid,
        lastAuditId: id,
        updatedAt: f.serverTimestamp(),
      });
    } else throw fail("permission-denied");
    tx.set(f.doc(db, "auditLog", id), entry);
  });
  if (action.startsWith("lot-")) await loadCatalog();
}
export async function submitReport(target, category, text) {
  const { f, db, instance } = await session();
  if (!state.publicId) throw fail("profile-required");
  const uid = instance.currentUser.uid,
    gen = target.generation || "",
    id = target.kind + "_" + target.id + (gen ? "_" + gen : "") + "_" + uid;
  const reportId = target.kind === "appeal" ? "appeal_" + uid + "_" + gen : id;
  if (
    !["fraud", "spam", "prohibited", "other"].includes(category) ||
    text.trim().length < 10 ||
    text.trim().length > 1500
  )
    throw fail("report-invalid");
  await f.setDoc(f.doc(db, "reports", reportId), {
    reporterUid: uid,
    targetKind: target.kind,
    targetId: target.id,
    targetGeneration: gen,
    category,
    text: text.trim(),
    status: "open",
    resolution: "",
    handledBy: "",
    lastAuditId: "",
    createdAt: f.serverTimestamp(),
    updatedAt: f.serverTimestamp(),
  });
}
export async function myReports() {
  const { f, db, instance } = await session(),
    s = await f.getDocsFromServer(
      f.query(
        f.collection(db, "reports"),
        f.where("reporterUid", "==", instance.currentUser.uid),
        f.limit(50),
      ),
    );
  return s.docs
    .map((d) => ({ ...d.data(), docId: d.id }))
    .sort(
      (a, b) =>
        (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0),
    );
}

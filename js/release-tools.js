import { pair, markLocalized } from "./localization.js";
import * as market from "./market.js";
import * as staff from "./admin-data.js";
import { config } from "./config.js";
import { activeTask } from "./active-scheduler.js";
const en = () => document.documentElement.lang === "en",
  text = (ru, eng) => (en() ? eng : ru);
const node = (tag, value) => {
  const e = document.createElement(tag);
  if (value !== undefined) {
    e.textContent = value;
    markLocalized(e, value);
  }
  return e;
};
export function initReleaseTools() {
  // Diagnostics are opt-in and staff-only. No polling, no body/token/error-message telemetry.
  const host = document.querySelector("#admin-dialog .a-main");
  if (!host) return;
  const panel = node("details");
  panel.className = "release-diagnostics";
  panel.hidden = true;
  panel.id = "release-diagnostics";
  const title = node("summary", text(...pair("inline", "t646e2b8ba40d"))),
    refresh = node("button", text(...pair("inline", "t4ec5905243c5"))),
    result = node("pre"),
    estimate = node("p");
  refresh.type = "button";
  result.setAttribute("role", "status");
  const count = node("input"),
    hours = node("input");
  count.type = hours.type = "number";
  count.min = hours.min = "1";
  count.max = "10000";
  hours.max = "24";
  count.value = "40";
  hours.value = "8";
  for (const [input, ru, eng] of [
    [count, "Активных аккаунтов в сутки", "Active accounts per day"],
    [hours, "Часов видимой вкладки на аккаунт", "Visible hours per account"],
  ]) {
    const label = node("label", text(ru, eng));
    label.append(input);
    panel.append(label);
  }
  function budget() {
    const n = Math.min(10000, Math.max(1, Number(count.value) || 1)),
      h = Math.min(24, Math.max(1, Number(hours.value) || 1)),
      writes = Math.ceil(h * 20 + 1) * n,
      reads = writes;
    estimate.textContent =
      text(...pair("inline", "t049eb1fa8153")) +
      new Intl.NumberFormat(en() ? "en" : "ru").format(writes) +
      text(...pair("inline", "t231b3674dfeb")) +
      (writes >= 16000 ? text(...pair("inline", "t6e0804b5078f")) : "");
  }
  count.oninput = hours.oninput = budget;
  budget();
  panel.prepend(title, refresh, result);
  panel.append(estimate, node("p", text(...pair("inline", "t6268770d3341"))));
  host.append(panel);
  refresh.onclick = async () => {
    if (!staff.isStaff()) return;
    refresh.disabled = true;
    result.textContent = text(...pair("inline", "t4845882afd69"));
    const lines = [];
    try {
      const r = await fetch(
          (config.marketApiOrigin || config.discordAuthOrigin) +
            "/api/market/health",
          { credentials: "omit", signal: AbortSignal.timeout(8000) },
        ),
        d = await r.json();
      lines.push(
        "Worker: " +
          (r.ok && d.ok ? "OK" : text(...pair("inline", "t435c82cad368"))),
      );
      if (r.ok) lines.push("Policy: " + JSON.stringify(d.accessPolicy || {}));
    } catch {
      lines.push("Worker: " + text(...pair("inline", "tea47c2882dbb")));
    }
    try {
      const { f, db } = await market.sdk(),
        d = await f.getDocFromServer(f.doc(db, "systemStatus", "trading")),
        a = await f.getDocFromServer(f.doc(db, "systemStatus", "access"));
      lines.push("Firestore: OK");
      const v = d.data(),
        s = a.data();
      lines.push(
        "Cron: " +
          (v?.lastRunAt
            ? new Intl.DateTimeFormat(en() ? "en" : "ru", {
                dateStyle: "short",
                timeStyle: "medium",
              }).format(v.lastRunAt.toDate())
            : text(...pair("inline", "td7f405ae3938"))),
      );
      if (s)
        lines.push(
          "Access queue: " +
            JSON.stringify({
              lagSeconds: s.lagSeconds ?? null,
              failed: s.failed ?? null,
              capacityPerMinute: s.capacityPerMinute ?? 1,
            }),
        );
      else lines.push(text(...pair("inline", "t2d14d856e96a")));
    } catch {
      lines.push("Firestore: " + text(...pair("inline", "tde003ec66efb")));
    }
    try {
      const r = await fetch("https://chromacube.deforce.site/api/status", {
        credentials: "omit",
        signal: AbortSignal.timeout(5000),
      });
      lines.push("Chromacube: " + (r.ok ? "HTTP OK" : String(r.status)));
    } catch {
      lines.push("Chromacube: " + text(...pair("inline", "t27c99277fffa")));
    }
    lines.push(
      text(...pair("inline", "t0643ce14f786")) +
        JSON.stringify(window.zenoDiagnostics?.counts || {}),
    );
    result.textContent = lines.join("\n");
    refresh.disabled = false;
  };
  function access() {
    panel.hidden = !staff.isStaff();
  }
  window.addEventListener("zeno-access", access);
  access();
  // Apply label and numeric input improvements only to unlabelled controls.
  const applyLabels = () => {
    for (const e of document.querySelectorAll("input,textarea,select")) {
      if (e.type === "hidden") continue;
      if (e.type === "number") e.inputMode = "numeric";
      if (
        e.labels?.length ||
        e.getAttribute("aria-label") ||
        e.getAttribute("aria-labelledby")
      )
        continue;
      const visible =
        e.closest("label")?.textContent?.trim() || e.placeholder || e.title;
      if (visible) e.setAttribute("aria-label", visible);
    }
    for (const form of document.querySelectorAll("form")) {
      const status = form.querySelector(".p-status[id],[role=status][id]");
      if (status)
        for (const e of form.querySelectorAll("input,textarea,select")) {
          const ids = new Set(
            (e.getAttribute("aria-describedby") || "")
              .split(" ")
              .filter(Boolean),
          );
          ids.add(status.id);
          e.setAttribute("aria-describedby", [...ids].join(" "));
        }
    }
  };
  applyLabels();
  window.addEventListener("zeno-data", applyLabels);
  // Only a lightweight timestamp formatter; shared scheduler pauses while hidden.
  activeTask(() => {
    for (const b of document.querySelectorAll("[data-bump-deadline]")) {
      const left = Number(b.dataset.bumpDeadline) - Date.now();
      b.textContent =
        left > 0
          ? text(...pair("inline", "t454303a4b8d7")) +
            Math.ceil(left / 3600000) +
            text(...pair("inline", "t4edabe5e6c9a"))
          : text(...pair("inline", "tec77475684f2"));
    }
  }, 60000);
}

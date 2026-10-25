// Durable jobs are written in the SAME Firestore batch as the source mutation.
// Security Rules validate the corresponding source, timestamp and owner/staff role.
export function enqueue(batch, a, kind, target, sellerId = "") {
  const { f, db } = a,
    id = kind + "_" + (sellerId ? sellerId + "_" : "") + target;
  batch.set(f.doc(db, "marketJobs", id), {
    kind,
    target,
    sellerId,
    createdAt: f.serverTimestamp(),
    queuedAt: f.serverTimestamp(),
  });
}

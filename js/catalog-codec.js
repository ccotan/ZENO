// Public catalog data only. Encode before JSON invokes Timestamp.toJSON().
const validMillis = (n) =>
  Number.isFinite(n) && Math.abs(n) <= 8640000000000000;
function timestamp(n) {
  if (!validMillis(n)) throw new TypeError("Invalid cached timestamp");
  return { toMillis: () => n, toDate: () => new Date(n) };
}
function walk(value, decode, depth = 0, ancestors = new Set()) {
  if (depth > 40) throw new TypeError("Catalog nesting limit");
  if (value === null || typeof value !== "object") return value;
  if (ancestors.has(value)) throw new TypeError("Cyclic catalog");
  if (!decode && typeof value.toMillis === "function") {
    const n = value.toMillis();
    if (!validMillis(n)) throw new TypeError("Invalid catalog timestamp");
    return { __zenoTimestamp: n };
  }
  if (!decode && value instanceof Date) {
    const n = value.getTime();
    if (!validMillis(n)) throw new TypeError("Invalid catalog date");
    return { __zenoTimestamp: n };
  }
  if (decode && !Array.isArray(value)) {
    const keys = Object.keys(value);
    if (keys.length === 1 && keys[0] === "__zenoTimestamp")
      return timestamp(value.__zenoTimestamp);
    // Migrate the previous Firebase Timestamp.toJSON() cache format.
    if (
      keys.length === 3 &&
      keys.every((k) => ["type", "seconds", "nanoseconds"].includes(k)) &&
      value.type === "firestore/timestamp/1.0" &&
      Number.isInteger(value.seconds) &&
      value.seconds >= -62135596800 &&
      value.seconds <= 253402300799 &&
      Number.isInteger(value.nanoseconds) &&
      value.nanoseconds >= 0 &&
      value.nanoseconds < 1e9
    )
      return timestamp(value.seconds * 1000 + value.nanoseconds / 1e6);
  }
  ancestors.add(value);
  const result = Array.isArray(value)
    ? value.map((v) => walk(v, decode, depth + 1, ancestors))
    : Object.fromEntries(
        Object.entries(value).map(([k, v]) => [
          k,
          walk(v, decode, depth + 1, ancestors),
        ]),
      );
  ancestors.delete(value);
  return result;
}
export const encodeCatalog = (value) => walk(value, false);
export const decodeCatalog = (value) => walk(value, true);

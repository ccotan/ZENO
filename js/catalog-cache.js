import { config } from "./config.js";
import { encodeCatalog, decodeCatalog } from "./catalog-codec.js";
export const CATALOG_TTL = 300000;
const key = "catalog:" + config.firebase.projectId;
function db() {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (error, value) => {
      if (done) {
        value?.close();
        return;
      }
      done = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(value);
    };
    const timer = setTimeout(
      () => finish(new Error("Catalog cache timeout")),
      1500,
    );
    let r;
    try {
      r = indexedDB.open("zeno-public-cache", 1);
    } catch (error) {
      finish(error);
      return;
    }
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains("public"))
        r.result.createObjectStore("public");
    };
    r.onblocked = () => finish(new Error("Catalog cache blocked"));
    r.onsuccess = () => {
      r.result.onversionchange = () => r.result.close();
      finish(null, r.result);
    };
    r.onerror = () => finish(r.error || new Error("Catalog cache unavailable"));
  });
}
export async function readCatalog() {
  let d;
  try {
    d = await db();
    const e = await new Promise((resolve, reject) => {
      const r = d.transaction("public").objectStore("public").get(key);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    if (
      !e ||
      !Array.isArray(e.rows) ||
      e.rows.length > 500 ||
      !Number.isFinite(e.savedAt) ||
      e.savedAt > Date.now() ||
      Date.now() - e.savedAt > 7 * 86400000
    )
      return null;
    return {
      ...e,
      rows: decodeCatalog(e.rows),
      stale: Date.now() - e.savedAt > CATALOG_TTL,
    };
  } catch {
    return null;
  } finally {
    d?.close();
  }
}
export async function saveCatalog(rows) {
  let d;
  try {
    if (!Array.isArray(rows)) return;
    const value = encodeCatalog({
      rows: rows.slice(0, 500),
      savedAt: Date.now(),
    });
    d = await db();
    await new Promise((resolve, reject) => {
      const tx = d.transaction("public", "readwrite");
      tx.objectStore("public").put(value, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Catalog write aborted"));
    });
  } catch {
  } finally {
    d?.close();
  }
}

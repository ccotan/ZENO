export const normalizeSearch = (v) =>
  String(v ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ru")
    .replaceAll("ё", "е");
export function recentSearches() {
  try {
    return JSON.parse(localStorage.getItem("zeno-searches") || "[]")
      .filter((x) => typeof x === "string")
      .slice(0, 8);
  } catch {
    return [];
  }
}
export function rememberSearch(v) {
  v = String(v).trim().slice(0, 100);
  if (!v) return;
  try {
    localStorage.setItem(
      "zeno-searches",
      JSON.stringify(
        [v, ...recentSearches().filter((s) => s !== v)].slice(0, 8),
      ),
    );
  } catch {}
}

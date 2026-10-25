// Small startup index; the complete registry is fetched only by the listing editor.
export function inflateIndex(index) {
  if (!index?.meta || !Array.isArray(index.rows) || index.rows.length > 2000)
    throw Error("catalog-unavailable");
  return {
    meta: index.meta,
    items: index.rows.map(([key, ru, en, category, index]) => ({
      key,
      id: "minecraft:" + key,
      ru,
      en,
      category,
      index,
    })),
  };
}
export async function loadItemIndex(fetcher = fetch) {
  const r = await fetcher("./data/items-index.json", {
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw Error("catalog-unavailable");
  return inflateIndex(await r.json());
}
let fullFlight;
export function loadFullCatalog(fetcher = fetch) {
  if (!fullFlight)
    fullFlight = (async () => {
      const r = await fetcher("./data/items.json", {
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) throw Error("catalog-unavailable");
      const v = await r.json();
      if (!Array.isArray(v.items) || v.items.length > 2000)
        throw Error("catalog-unavailable");
      return v;
    })().catch((e) => {
      fullFlight = null;
      throw e;
    });
  return fullFlight;
}

export const THUMBNAIL_KEYS = new Set([
  "diamond",
  "diamond_block",
  "grass_block",
  "shulker_box",
  "crafting_table",
  "diamond_pickaxe",
  "diamond_chestplate",
  "diamond_sword",
  "potion",
  "enchanted_book",
  "golden_apple",
  "nether_star",
]);

let dictionaries = null,
  flight;
export async function loadLocales() {
  if (dictionaries) return dictionaries;
  if (!flight)
    flight = Promise.all(
      ["ru", "en"].map(async (lang) => {
        const r = await fetch("./locales/" + lang + ".json");
        if (!r.ok) throw Error("locale-unavailable");
        return [lang, await r.json()];
      }),
    )
      .then((rows) => (dictionaries = Object.fromEntries(rows)))
      .catch((e) => {
        flight = null;
        throw e;
      });
  return flight;
}
export function pair(group, key) {
  return [
    dictionaries?.ru?.ui?.[group]?.[key] ?? String(key),
    dictionaries?.en?.ui?.[group]?.[key] ?? String(key),
  ];
}

let textKeys;
function flatten(o, prefix = "") {
  const rows = [];
  for (const [k, v] of Object.entries(o || {})) {
    const key = prefix ? prefix + "." + k : k;
    if (v && typeof v === "object") rows.push(...flatten(v, key));
    else if (typeof v === "string") rows.push([key, v]);
  }
  return rows;
}
const valueAt = (locale, key) =>
  key.split(".").reduce((o, k) => o?.[k], dictionaries?.[locale]);
export function markLocalized(el, text) {
  if (typeof text !== "string" || !dictionaries) return el;
  if (!textKeys) {
    textKeys = new Map();
    for (const lang of ["ru", "en"])
      for (const [key, value] of flatten(dictionaries[lang]))
        textKeys.set(value, key);
  }
  const key = textKeys.get(text);
  if (key) el.dataset.localeText = key;
  return el;
}
export function translateMarked() {
  const lang = document.documentElement.lang === "en" ? "en" : "ru";
  for (const el of document.querySelectorAll("[data-locale-text]")) {
    const key = el.dataset.localeText,
      ru = valueAt("ru", key),
      en = valueAt("en", key);
    if (el.textContent === ru || el.textContent === en)
      el.textContent = valueAt(lang, key);
  }
}

export function message(group, key, values = {}) {
  const lang = document.documentElement.lang === "en" ? "en" : "ru";
  const template = dictionaries?.[lang]?.ui?.[group]?.[key] ?? String(key);
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (_, name) =>
    String(values[name] ?? ""),
  );
}

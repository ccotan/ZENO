/* Independent classic bootstrap: still runs if a module or the CDN cannot load. */
(() => {
  const errors = Object.create(null);
  window.zenoDiagnostics = { counts: errors, startedAt: Date.now() };
  const safe = (code) => {
    errors[code] = Math.min(999, (errors[code] || 0) + 1);
    console.error("[ZENO]", code);
  };
  function show(code) {
    safe(code);
    const box = document.getElementById("boot-screen"),
      text = document.getElementById("boot-text");
    if (!box || !text) return;
    box.classList.add("has-error");
    text.textContent =
      document.documentElement.lang === "en"
        ? "Could not load this part of the site. Check your connection and retry."
        : "Не удалось загрузить часть сайта. Проверь соединение и попробуй ещё раз.";
    box.setAttribute("role", "alert");
    document.getElementById("boot-retry").onclick = () => location.reload();
  }
  window.addEventListener(
    "error",
    (e) => {
      if (e.target?.tagName === "IMG") return;
      const boot = !document.documentElement.classList.contains("app-ready");
      if (boot) show("boot-resource");
      else safe("runtime-error");
    },
    true,
  );
  window.addEventListener("unhandledrejection", () => {
    if (!document.documentElement.classList.contains("app-ready"))
      show("boot-promise");
    else safe("runtime-promise");
  });
  window.addEventListener("DOMContentLoaded", () => {
    const banner = document.createElement("div");
    banner.id = "network-banner";
    banner.setAttribute("role", "status");
    document.body.prepend(banner);
    function sync() {
      banner.hidden = navigator.onLine !== false;
      banner.textContent =
        document.documentElement.lang === "en"
          ? "Offline. Only saved information may be available."
          : "Нет сети. Доступны только сохранённые данные.";
    }
    window.addEventListener("offline", sync);
    window.addEventListener("online", sync);
    new MutationObserver(sync).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });
    sync();
    document.getElementById("boot-retry").onclick = () => location.reload();
    setTimeout(() => {
      if (document.documentElement.classList.contains("app-loading"))
        show("boot-timeout");
    }, 20000);
  });
})();

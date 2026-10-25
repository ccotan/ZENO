import { pair } from "./localization.js";
export function initFinishUI() {
  // Report native constraints consistently; never replace server validation.
  for (const el of document.querySelectorAll(
    "input:not([type=hidden]),textarea,select",
  )) {
    const validate = () => {
      if (el.disabled || !el.willValidate) return;
      el.setAttribute("aria-invalid", String(!el.validity.valid));
    };
    el.addEventListener("blur", validate);
    el.addEventListener("input", () => {
      if (el.getAttribute("aria-invalid") === "true") validate();
    });
    el.addEventListener("invalid", validate);
  }
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Tab") return;
      const dialog = [...document.querySelectorAll("dialog[open]")].at(-1);
      if (!dialog) return;
      const focusable = [
        ...dialog.querySelectorAll(
          "button,input,textarea,select,a[href],summary,[tabindex]",
        ),
      ].filter(
        (e) => !e.disabled && e.tabIndex >= 0 && e.getClientRects().length,
      );
      if (!focusable.length) {
        event.preventDefault();
        dialog.tabIndex = -1;
        dialog.focus();
        return;
      }
      const index = focusable.indexOf(document.activeElement);
      if (
        index < 0 ||
        (!event.shiftKey && index === focusable.length - 1) ||
        (event.shiftKey && index === 0)
      ) {
        event.preventDefault();
        focusable[event.shiftKey ? focusable.length - 1 : 0].focus();
      }
    },
    true,
  );
  document.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const dialog = button.closest("dialog[open]");
      if (!dialog) return;
      const close =
        button.hasAttribute("data-close") ||
        button.id === "auth-close" ||
        button.textContent.trim() === "×";
      if (
        close &&
        dialog.dataset.qDirty === "1" &&
        dialog.querySelector("form")
      ) {
        const lang = document.documentElement.lang === "en" ? 1 : 0;
        if (!confirm(pair("inline", "tfdb1a273cdde")[lang])) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }
    },
    true,
  );
}

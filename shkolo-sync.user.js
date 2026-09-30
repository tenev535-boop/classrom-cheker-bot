// ==UserScript==
// @name         Школо → Училищен дашборд
// @namespace    local.school-dash
// @version      1.0
// @description  Опреснява Школо на 44 мин, филтрира важните редове и ги подава на локалния дашборд.
// @match        https://app.shkolo.bg/*
// @match        http://localhost/*
// @match        http://127.0.0.1/*
// @match        file:///*dashboard.html
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  const STORE = "shkolo-sync";
  const RELOAD_MS = 44 * 60 * 1000;
  const SETTLE_MS = 4000; // Школо дорисува съдържание след зареждане
  const RX = /((?<!\p{L})час(?:а|ът|ове|овете)?(?!\p{L})|кабинет\p{L}*|промен\p{L}*|промяна|замест\p{L}*|няма да има)/iu;

  // ---------- Страна „Школо“: извличане, филтър, опресняване ----------
  if (location.hostname.endsWith("shkolo.bg")) {
    const extract = () => {
      const seen = new Set();
      const lines = (document.body.innerText || "")
        .split(/\r?\n/)
        .map((l) => l.replace(/\s+/g, " ").trim())
        .filter((l) => l && l.length <= 300 && RX.test(l) && !seen.has(l) && seen.add(l));
      GM_setValue(STORE, { lines, ts: Date.now(), source: location.pathname });
    };

    const reload = () => {
      // Не прекъсвай, ако в момента пишеш в поле
      const a = document.activeElement;
      if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) {
        setTimeout(reload, 60 * 1000);
        return;
      }
      location.reload();
    };

    setTimeout(extract, SETTLE_MS);
    setTimeout(reload, RELOAD_MS);
    return;
  }

  // ---------- Страна „Дашборд“: подаване на данните към страницата ----------
  if (!document.getElementById("shkolo")) return; // не е нашият дашборд

  const push = (data) => {
    if (!data || !Array.isArray(data.lines)) return;
    window.postMessage({ type: "shkolo-sync", lines: data.lines, ts: data.ts }, "*");
  };

  push(GM_getValue(STORE, null));
  GM_addValueChangeListener(STORE, (_key, _old, data) => push(data));
})();

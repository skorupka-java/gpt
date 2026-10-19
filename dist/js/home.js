/* Strona główna: klikalne demo i kalkulator. Bez zależności zewnętrznych. */
(function () {
  "use strict";

  /* 1. Zakładki demo ---------------------------------------------------- */
  var tabs = document.querySelectorAll(".demo__tab");
  var panels = document.querySelectorAll(".demo__panel");
  tabs.forEach(function (tab, index) {
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.addEventListener("keydown", function(e) {
      var next = e.key === "ArrowRight" ? (index+1)%tabs.length : e.key === "ArrowLeft" ? (index+tabs.length-1)%tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length-1 : null;
      if(next !== null) { e.preventDefault(); tabs[next].click(); tabs[next].focus(); }
    });
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); t.tabIndex = -1; });
      panels.forEach(function (p) { p.hidden = true; });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true"); tab.tabIndex = 0;
      var panel = document.getElementById(tab.getAttribute("aria-controls"));
      if (panel) panel.hidden = false;
    });
  });

  /* 2. Magazyn: przesunięcie między punktami ---------------------------- */
  var moveBtn = document.getElementById("demo-move");
  var focus = document.getElementById("stock-focus");
  var wyspa = document.getElementById("stock-wyspa");
  var moveLog = document.getElementById("demo-move-log");
  if (moveBtn && focus && wyspa) {
    moveBtn.addEventListener("click", function () {
      var f = parseInt(focus.textContent, 10);
      var w = parseInt(wyspa.textContent, 10);
      if (f <= 0) { moveLog.textContent = "W Focusie już pusto. Czas zamówić do dostawcy: system sam to podpowie."; return; }
      focus.textContent = String(f - 1);
      wyspa.textContent = String(w + 1);
      wyspa.classList.remove("is-zero");
      [focus, wyspa].forEach(function (el) {
        el.classList.add("is-bump");
        setTimeout(function () { el.classList.remove("is-bump"); }, 250);
      });
      moveLog.textContent = "Prośba o przesunięcie wysłana. Focus pakuje, Wyspa potwierdza odbiór skanem. Zero telefonów.";
    });
  }

  /* 3. Grafik: klikanie zmian ------------------------------------------- */
  var grid = document.getElementById("demo-grid");
  var gridLog = document.getElementById("demo-grid-log");
  var LABELS = ["wolne", "9–18", "12–21"];
  var HOURS = [0, 9, 9];
  if (grid) {
    grid.querySelectorAll("td").forEach(function(td) {
      td.tabIndex = 0; td.setAttribute("role", "button");
      td.setAttribute("aria-label", "Zmień zmianę: " + td.textContent);
      td.addEventListener("keydown", function(e) { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); td.click(); } });
    });
    grid.addEventListener("click", function (e) {
      var td = e.target.closest("td");
      if (!td) return;
      var s = (parseInt(td.getAttribute("data-s"), 10) + 1) % 3;
      td.setAttribute("data-s", String(s));
      td.textContent = LABELS[s];
      td.setAttribute("aria-label", "Zmień zmianę: " + LABELS[s]);
      var parts = [];
      grid.querySelectorAll("tbody tr").forEach(function (tr) {
        var h = 0;
        tr.querySelectorAll("td").forEach(function (c) { h += HOURS[parseInt(c.getAttribute("data-s"), 10)]; });
        parts.push(tr.querySelector("th").textContent + " " + h);
      });
      var days = grid.querySelectorAll("thead th").length - 1;
      var gaps = 0;
      for (var d = 1; d <= days; d++) {
        var open = false, close = false;
        grid.querySelectorAll("tbody tr").forEach(function (tr) {
          var c = tr.querySelectorAll("td")[d - 1].getAttribute("data-s");
          if (c === "1") open = true;
          if (c === "2") close = true;
        });
        if (!open || !close) gaps++;
      }
      gridLog.textContent = "Godziny w tygodniu: " + parts.join(" · ") +
        (gaps ? ". Uwaga: " + gaps + (gaps === 1 ? " dzień bez pełnej obsady." : " dni bez pełnej obsady.") : ". Każdy dzień obsadzony.");
    });
  }

  /* 4. Serwis: status i SMS --------------------------------------------- */
  var srvBtn = document.getElementById("demo-srv");
  var srvStatus = document.getElementById("srv-status");
  var sms = document.getElementById("demo-sms");
  if (srvBtn && srvStatus && sms) {
    srvBtn.addEventListener("click", function () {
      srvStatus.textContent = "Gotowe do odbioru";
      srvStatus.className = "chip chip--ok";
      sms.hidden = false;
      srvBtn.disabled = true;
      srvBtn.textContent = "Klient powiadomiony";
    });
  }

  /* 5. Kalkulator ------------------------------------------------------- */
  var calc = document.getElementById("calc");
  if (!calc) return;
  var PACKAGE = 19900, UPKEEP = 249, LEFTOVER = 0.3;
  var ids = ["ppl", "sub", "hrs", "rate"];
  var inputs = {};
  ids.forEach(function (id) { inputs[id] = document.getElementById("c-" + id); });
  var subTouched = false;

  function pln(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " zł";
  }
  function suggestSub(ppl) {
    // 99 zł kasa/POS + 59 zł CRM na osobę + 15 zł grafik na osobę (średnie z rynku, wrzesień 2026)
    return 99 + ppl * 59 + ppl * 15;
  }
  function render() {
    var ppl = +inputs.ppl.value, sub = +inputs.sub.value, hrs = +inputs.hrs.value, rate = +inputs.rate.value;
    document.getElementById("c-ppl-out").textContent = ppl;
    document.getElementById("c-sub-out").textContent = sub;
    document.getElementById("c-hrs-out").textContent = hrs;
    document.getElementById("c-rate-out").textContent = rate;
    var manualMonthly = hrs * 52 / 12 * rate;
    var better = null;
    [3, 5].forEach(function (y) {
      var m = y * 12;
      var subTotal = sub * m + manualMonthly * m;
      var ownTotal = PACKAGE + UPKEEP * m + manualMonthly * LEFTOVER * m;
      var a = document.getElementById("r-sub-" + y), b = document.getElementById("r-own-" + y);
      a.textContent = pln(subTotal); b.textContent = pln(ownTotal);
      a.classList.toggle("is-better", subTotal < ownTotal);
      b.classList.toggle("is-better", ownTotal <= subTotal);
      if (y === 5) better = { diff: subTotal - ownTotal };
    });
    var v = document.getElementById("c-verdict");
    if (better.diff > 0) {
      v.textContent = "W 5 lat własny system wychodzi taniej o około " + pln(better.diff) + ". Do tego zostaje Twój i nie drożeje z każdą nową osobą.";
    } else {
      v.textContent = "Przy tych liczbach abonamenty są tańsze o około " + pln(-better.diff) + " w 5 lat. Własny system ma sens, jeśli potrzebujesz funkcji, których gotowce nie mają, albo zespół urośnie.";
    }
  }
  inputs.ppl.addEventListener("input", function () {
    if (!subTouched) inputs.sub.value = Math.min(3000, suggestSub(+inputs.ppl.value));
    render();
  });
  inputs.sub.addEventListener("input", function () { subTouched = true; render(); });
  inputs.hrs.addEventListener("input", render);
  inputs.rate.addEventListener("input", render);
  render();
})();

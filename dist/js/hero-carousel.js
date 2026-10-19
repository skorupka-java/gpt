/* Nowa karuzela główna. Zmiana ręczna; odtwarzanie wyłącznie na życzenie. */
(function () {
  "use strict";

  document.querySelectorAll("[data-hero-carousel]").forEach(function (root) {
    var slides = Array.from(root.querySelectorAll("[data-hero-slide]"));
    var tabs = Array.from(root.querySelectorAll("[data-hero-to]"));
    var viewport = root.querySelector("[data-hero-viewport]");
    var controls = root.querySelector("[data-hero-controls]");
    var previous = root.querySelector("[data-hero-prev]");
    var next = root.querySelector("[data-hero-next]");
    var play = root.querySelector("[data-hero-play]");
    var playLabel = root.querySelector("[data-hero-play-label]");
    var count = root.querySelector("[data-hero-count]");
    var status = root.querySelector("[data-hero-status]");
    if (root.dataset.heroInitialized || slides.length < 2 || !viewport || !controls ||
        !previous || !next || !play || !playLabel || tabs.length !== slides.length) return;

    var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var index = 0;
    var timer = null;
    var rotating = false;
    var hovered = false;
    var visible = true;
    var touch = null;

    function schedule() {
      window.clearTimeout(timer);
      timer = null;
      play.disabled = motion.matches;
      play.setAttribute("aria-pressed", String(rotating));
      play.setAttribute("aria-label", rotating ? "Wstrzymaj zmianę slajdów" : "Odtwarzaj slajdy automatycznie");
      playLabel.textContent = rotating ? "Wstrzymaj" : "Odtwarzaj";
      if (rotating && !motion.matches && !hovered && visible && !document.hidden) {
        timer = window.setTimeout(function () { go(index + 1, false); }, 8000);
      }
    }

    function render() {
      slides.forEach(function (slide, i) {
        var active = i === index;
        slide.hidden = !active;
        slide.inert = !active;
        slide.setAttribute("aria-hidden", String(!active));
        slide.classList.toggle("is-active", active);
      });
      tabs.forEach(function (tab) {
        if (Number(tab.dataset.heroTo) === index) tab.setAttribute("aria-current", "true");
        else tab.removeAttribute("aria-current");
      });
      if (count) count.textContent = String(index + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
    }

    function go(target, manual) {
      var destination = (target + slides.length) % slides.length;
      if (manual) rotating = false;
      if (destination !== index && slides[index].contains(document.activeElement)) {
        // Przenieś fokus przed ukryciem dotychczasowego slajdu.
        (tabs.find(function (tab) { return Number(tab.dataset.heroTo) === destination; }) || next).focus({ preventScroll: true });
      }
      index = destination;
      render();
      if (manual && status) {
        status.textContent = "Slajd " + (index + 1) + " z " + slides.length + ": " + (slides[index].dataset.title || "");
      }
      schedule();
    }

    previous.addEventListener("click", function () { go(index - 1, true); });
    next.addEventListener("click", function () { go(index + 1, true); });
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = Number(tab.dataset.heroTo);
        if (Number.isInteger(target) && target >= 0 && target < slides.length) go(target, true);
      });
    });
    play.addEventListener("click", function () {
      if (motion.matches) return;
      rotating = !rotating;
      schedule();
    });

    root.addEventListener("keydown", function (event) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.target.isContentEditable ||
          event.target.closest("input, textarea, select")) return;
      var target = event.key === "ArrowLeft" ? index - 1 : event.key === "ArrowRight" ? index + 1 :
        event.key === "Home" ? 0 : event.key === "End" ? slides.length - 1 : null;
      if (target === null) return;
      event.preventDefault();
      go(target, true);
    });
    root.addEventListener("focusin", function (event) {
      if (!play.contains(event.target)) { rotating = false; schedule(); }
    });
    root.addEventListener("mouseenter", function () { hovered = true; schedule(); });
    root.addEventListener("mouseleave", function () { hovered = false; schedule(); });
    document.addEventListener("visibilitychange", schedule);
    function motionChanged() {
      if (motion.matches) rotating = false;
      schedule();
    }
    if (motion.addEventListener) motion.addEventListener("change", motionChanged);
    else motion.addListener(motionChanged);

    viewport.addEventListener("touchstart", function (event) {
      touch = null;
      if (event.touches.length !== 1 || event.target.closest("a, button, input, textarea, select, label, [contenteditable]")) return;
      touch = { x: event.touches[0].clientX, y: event.touches[0].clientY, id: event.touches[0].identifier };
    }, { passive: true });
    viewport.addEventListener("touchmove", function (event) {
      if (event.touches.length !== 1) touch = null;
    }, { passive: true });
    viewport.addEventListener("touchend", function (event) {
      if (!touch) return;
      var end = Array.from(event.changedTouches).find(function (point) { return point.identifier === touch.id; });
      if (!end) { touch = null; return; }
      var dx = end.clientX - touch.x;
      var dy = end.clientY - touch.y;
      touch = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) go(index + (dx < 0 ? 1 : -1), true);
    }, { passive: true });
    viewport.addEventListener("touchcancel", function () { touch = null; }, { passive: true });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.15;
        schedule();
      }, { threshold: [0, 0.15] }).observe(root);
    }

    render();
    schedule();
    root.dataset.heroInitialized = "true";
    root.classList.add("is-enhanced");
    controls.hidden = false;
  });
}());

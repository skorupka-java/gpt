/* Niezależne karuzele: klawiatura, gesty, pauza i ograniczenie animacji. */
(function () {
  "use strict";

  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var slides = Array.from(root.querySelectorAll("[data-slide]"));
    var dots = Array.from(root.querySelectorAll("[data-slide-to]"));
    var controls = root.querySelector("[data-carousel-controls]");
    var pause = root.querySelector("[data-pause]");
    var count = root.querySelector("[data-slide-count]");
    var status = root.querySelector("[data-carousel-status]");
    var viewport = root.querySelector("[data-carousel-viewport]");
    var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var index = 0;
    var timer = null;
    var hover = false;
    var visible = true;
    var rotating = root.hasAttribute("data-autoplay") && !motion.matches;
    var touch = null;
    if (slides.length < 2 || !controls || !viewport) return;

    function render() {
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
        slide.setAttribute("aria-hidden", String(i !== index));
        slide.inert = i !== index;
        slide.hidden = false;
      });
      dots.forEach(function (dot, i) {
        if (i === index) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      if (count) count.textContent = String(index + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
    }

    function schedule() {
      window.clearTimeout(timer);
      timer = null;
      if (pause) {
        pause.setAttribute("aria-label", rotating ? "Wstrzymaj automatyczną zmianę banerów" : "Włącz automatyczną zmianę banerów");
        pause.querySelector("[data-pause-icon]").textContent = rotating ? "Ⅱ" : "▷";
      }
      if (rotating && !hover && visible && !document.hidden) {
        timer = window.setTimeout(function () { go(index + 1, false); }, 7000);
      }
    }

    function go(next, manual) {
      index = (next + slides.length) % slides.length;
      if (manual) rotating = false;
      render();
      if (manual && status) status.textContent = "Slajd " + (index + 1) + " z " + slides.length + ": " + slides[index].dataset.title;
      schedule();
    }

    root.querySelector("[data-prev]").addEventListener("click", function () { go(index - 1, true); });
    root.querySelector("[data-next]").addEventListener("click", function () { go(index + 1, true); });
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () { go(Number(dot.dataset.slideTo), true); });
    });
    if (pause) pause.addEventListener("click", function () { rotating = !rotating; schedule(); });

    root.addEventListener("keydown", function (event) {
      if (event.target.closest("input, textarea, select, [contenteditable]")) return;
      var next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? slides.length - 1 : null;
      if (next === null) return;
      event.preventDefault();
      // Nie pozostawiaj fokusu w slajdzie, który zostanie ukryty.
      if (event.target.closest("[data-slide]")) root.querySelector("[data-next]").focus();
      go(next, true);
    });
    root.addEventListener("mouseenter", function () { hover = true; schedule(); });
    root.addEventListener("mouseleave", function () { hover = false; schedule(); });
    root.addEventListener("focusin", function (event) {
      // Przycisk pauzy zachowuje stan do kliknięcia; inne elementy zatrzymują obrót.
      if (event.target !== pause) { rotating = false; schedule(); }
    });
    document.addEventListener("visibilitychange", schedule);
    motion.addEventListener("change", function () { if (motion.matches) rotating = false; schedule(); });

    viewport.addEventListener("touchstart", function (event) {
      if (event.touches.length !== 1 || event.target.closest("a, button")) { touch = null; return; }
      touch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      rotating = false;
      schedule();
    }, { passive: true });
    viewport.addEventListener("touchend", function (event) {
      if (!touch || !event.changedTouches.length) return;
      var dx = event.changedTouches[0].clientX - touch.x;
      var dy = event.changedTouches[0].clientY - touch.y;
      touch = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) go(index + (dx < 0 ? 1 : -1), true);
    }, { passive: true });
    viewport.addEventListener("touchcancel", function () { touch = null; });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        schedule();
      }, { threshold: 0.15 }).observe(root);
    }

    root.classList.add("is-enhanced");
    render();
    controls.hidden = false;
    schedule();
  });
}());

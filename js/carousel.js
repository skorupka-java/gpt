/* Karuzela historii: klawiatura, gesty i opcjonalne odtwarzanie. Bez zależności. */
(function () {
  "use strict";

  document.querySelectorAll("[data-carousel]").forEach(function (carousel) {
    var viewport = carousel.querySelector(".story-carousel__viewport");
    var track = carousel.querySelector(".story-carousel__track");
    var slides = Array.from(carousel.querySelectorAll("[data-slide]"));
    var selectors = Array.from(carousel.querySelectorAll("[data-carousel-go]"));
    var previous = carousel.querySelector("[data-carousel-prev]");
    var next = carousel.querySelector("[data-carousel-next]");
    var play = carousel.querySelector("[data-carousel-play]");
    var count = carousel.querySelector("[data-carousel-count]");
    var status = carousel.querySelector("[data-carousel-status]");
    var controls = carousel.querySelector(".story-carousel__controls");
    if (!viewport || !track || !slides.length || carousel.classList.contains("is-ready")) return;

    var index = 0;
    var playing = false;
    var hovered = false;
    var timer = null;
    var gesture = null;
    var delay = 6500;
    var supportsInert = "inert" in HTMLElement.prototype;
    var savedTabIndexes = new WeakMap();
    var focusable = "a[href], area[href], button, input, select, textarea, iframe, object, embed, audio[controls], video[controls], summary, [tabindex], [contenteditable]";

    function twoDigits(number) {
      return String(number).padStart(2, "0");
    }

    function clearTimer() {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    }

    function canAdvance() {
      return playing && slides.length > 1 && !document.hidden && !hovered && !gesture &&
        !carousel.contains(document.activeElement);
    }

    function schedule() {
      clearTimer();
      if (!canAdvance()) return;
      timer = window.setTimeout(function () {
        timer = null;
        if (!canAdvance()) return;
        show(index + 1, false);
        schedule();
      }, delay);
    }

    function updatePlayButton() {
      if (!play) return;
      play.setAttribute("aria-pressed", String(playing));
      play.setAttribute("aria-label", playing ? "Wyłącz automatyczne przewijanie slajdów" : "Włącz automatyczne przewijanie slajdów");
      play.textContent = playing ? "Zatrzymaj" : "Odtwarzaj";
    }

    function setSlideAccess(slide, active) {
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
      if (active) slide.removeAttribute("inert");
      else slide.setAttribute("inert", "");

      // Zachowaj kolejność tabulacji także w przeglądarkach bez obsługi inert.
      if (!supportsInert) {
        slide.querySelectorAll(focusable).forEach(function (element) {
          if (!active) {
            if (!savedTabIndexes.has(element)) savedTabIndexes.set(element, element.getAttribute("tabindex"));
            element.setAttribute("tabindex", "-1");
          } else if (savedTabIndexes.has(element)) {
            var original = savedTabIndexes.get(element);
            if (original === null) element.removeAttribute("tabindex");
            else element.setAttribute("tabindex", original);
            savedTabIndexes.delete(element);
          }
        });
      }
    }

    function show(target, announce) {
      var destination = ((target % slides.length) + slides.length) % slides.length;
      if (destination !== index && slides[index].contains(document.activeElement)) {
        viewport.focus({ preventScroll: true });
      }
      index = destination;
      track.style.transform = "translateX(-" + index * 100 + "%)";
      slides.forEach(function (slide, slideIndex) {
        var active = slideIndex === index;
        slide.classList.toggle("is-active", active);
        setSlideAccess(slide, active);
      });
      selectors.forEach(function (selector) {
        var active = Number(selector.getAttribute("data-carousel-go")) === index;
        selector.classList.toggle("is-active", active);
        if (active) selector.setAttribute("aria-current", "true");
        else selector.removeAttribute("aria-current");
      });
      if (count) count.textContent = twoDigits(index + 1) + " / " + twoDigits(slides.length);
      if (announce && status) {
        var title = slides[index].querySelector("h3");
        status.textContent = "Slajd " + (index + 1) + " z " + slides.length +
          (title ? ": " + title.innerText.replace(/\s+/g, " ").trim() : "");
      }
    }

    function navigate(target) {
      playing = false;
      clearTimer();
      updatePlayButton();
      show(target, true);
    }

    if (previous) previous.addEventListener("click", function () { navigate(index - 1); });
    if (next) next.addEventListener("click", function () { navigate(index + 1); });
    selectors.forEach(function (selector) {
      selector.addEventListener("click", function () {
        var target = Number(selector.getAttribute("data-carousel-go"));
        if (Number.isInteger(target) && target >= 0 && target < slides.length) navigate(target);
      });
    });

    viewport.addEventListener("keydown", function (event) {
      if (event.target !== viewport || event.altKey || event.ctrlKey || event.metaKey) return;
      var target;
      if (event.key === "ArrowLeft") target = index - 1;
      else if (event.key === "ArrowRight") target = index + 1;
      else if (event.key === "Home") target = 0;
      else if (event.key === "End") target = slides.length - 1;
      else return;
      event.preventDefault();
      navigate(target);
    });

    if (play) {
      play.addEventListener("click", function () {
        playing = !playing;
        updatePlayButton();
        schedule();
      });
    }
    carousel.addEventListener("focusin", clearTimer);
    carousel.addEventListener("focusout", function (event) {
      if (event.relatedTarget && carousel.contains(event.relatedTarget)) return;
      // Poczekaj, aż activeElement wskaże nowy element; nie przenoś fokusu.
      window.setTimeout(schedule, 0);
    });
    carousel.addEventListener("pointerenter", function (event) {
      if (event.pointerType === "touch") return;
      hovered = true;
      clearTimer();
    });
    carousel.addEventListener("pointerleave", function (event) {
      if (event.pointerType === "touch") return;
      hovered = false;
      schedule();
    });
    document.addEventListener("visibilitychange", schedule);

    viewport.addEventListener("pointerdown", function (event) {
      if ((event.pointerType !== "touch" && event.pointerType !== "pen") || !event.isPrimary || event.button !== 0) return;
      if (event.target.closest("a, button, input, select, textarea, summary, [contenteditable], [role='button']")) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
      clearTimer();
      if (viewport.setPointerCapture) viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener("pointerup", function (event) {
      if (!gesture || event.pointerId !== gesture.id) return;
      var distanceX = event.clientX - gesture.x;
      var distanceY = event.clientY - gesture.y;
      gesture = null;
      if (Math.abs(distanceX) >= Math.max(45, viewport.clientWidth * 0.08) && Math.abs(distanceX) > Math.abs(distanceY) * 1.25) {
        navigate(index + (distanceX < 0 ? 1 : -1));
      } else {
        schedule();
      }
    });
    function cancelGesture(event) {
      if (!gesture || gesture.id !== event.pointerId) return;
      gesture = null;
      schedule();
    }
    viewport.addEventListener("pointercancel", cancelGesture);
    viewport.addEventListener("lostpointercapture", cancelGesture);
    viewport.addEventListener("dragstart", function (event) {
      if (event.target instanceof HTMLImageElement) event.preventDefault();
    });

    updatePlayButton();
    show(0, false);
    if (controls) controls.hidden = false;
    carousel.classList.add("is-ready");
  });
})();

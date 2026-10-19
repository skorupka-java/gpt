/* Skorupka – skrypt strony. Bez zależności zewnętrznych. */
(function () {
  "use strict";

  /* 1. Menu mobilne ---------------------------------------------------- */
  var toggle = document.getElementById("nav-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    var setOpen = function (open) {
      links.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Zamknij menu" : "Otwórz menu");
    };
    toggle.addEventListener("click", function () {
      setOpen(!links.classList.contains("is-open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a") && links.classList.contains("is-open")) setOpen(false);
    });
  }

  /* 2. Rok w stopce ---------------------------------------------------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());


  /* 3. Formularz kontaktowy ------------------------------------------- */
  var form = document.getElementById("contact-form");
  if (!form) return;

  var cfg = window.SITE_CONFIG || {};
  if (location.hostname.endsWith(".chatgpt.site")) {
    var note = document.createElement("p");
    note.className = "notice preview-form-note";
    note.textContent = "W tej wersji formularz przygotuje wiadomość w Twoim programie pocztowym. Możesz też zadzwonić lub napisać na WhatsApp.";
    form.insertBefore(note, form.firstChild);
    form.setAttribute("action", "mailto:skorupka@skorupkastore.pl");
  }
  var status = document.getElementById("form-status");
  var submitBtn = form.querySelector('button[type="submit"]');

  function showStatus(type, text) {
    if (!status) return;
    status.className = "form__status is-" + type;
    status.textContent = text;
    status.focus();
  }

  function value(name) {
    var el = form.elements[name];
    return el ? String(el.value || "").trim() : "";
  }

  function buildMessage() {
    return [
      "Branża: " + value("branza"),
      "Imię: " + (value("name") || "-"),
      "Telefon: " + value("phone"),
      "E-mail: " + (value("email") || "-"),
      "",
      "Co boli:",
      value("message")
    ].join("\n");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Pole-pułapka na boty: prawdziwy użytkownik go nie widzi i nie wypełnia.
    if (value("company_website")) {
      form.reset();
      showStatus("success", "Dziękuję! Wiadomość została wysłana.");
      return;
    }

    var subject = "Prośba o wycenę: " + value("branza");
    var message = buildMessage();
    var contactEmail = cfg.CONTACT_EMAIL || "";
    var endpoint = null;
    var payload = null;

    if (cfg.FORMSPREE_URL) {
      endpoint = cfg.FORMSPREE_URL;
      payload = {
        name: value("name"),
        branza: value("branza"),
        email: value("email"),
        phone: value("phone"),
        message: value("message"),
        _subject: subject
      };
    } else if (cfg.WEB3FORMS_KEY) {
      endpoint = "https://api.web3forms.com/submit";
      payload = {
        access_key: cfg.WEB3FORMS_KEY,
        subject: subject,
        from_name: "Formularz – " + (cfg.SITE_NAME || "strona"),
        name: value("name"),
        branza: value("branza"),
        email: value("email"),
        phone: value("phone"),
        message: value("message")
      };
    }

    // Netlify Forms: wysyłka na ten sam serwer, format formularza.
    var useNetlify = !endpoint && cfg.USE_NETLIFY_FORMS && /^https?:$/.test(location.protocol) &&
      /^(systemy\.skorupkastore\.pl|(?:[a-z0-9-]+--)?skorupka-systemy\.netlify\.app)$/.test(location.hostname);
    if (useNetlify) {
      endpoint = "/";
      payload = null;
    }

    // Brak konfiguracji: otwieramy program pocztowy z gotową wiadomością.
    if (!endpoint) {
      var href = "mailto:" + encodeURIComponent(contactEmail) +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(message);
      window.location.href = href;
      showStatus("info", "Otworzyliśmy Twój program pocztowy z gotową wiadomością. " +
        "Jeśli nic się nie stało, napisz bezpośrednio na " + contactEmail + ".");
      return;
    }

    var originalLabel = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Wysyłanie…"; }

    var request = useNetlify
      ? fetch("/dziekujemy.html", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(new FormData(form)).toString()
        })
      : fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(payload)
        });

    request
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          return { ok: r.ok, data: data || {} };
        });
      })
      .then(function (res) {
        var failed = !res.ok || res.data.success === false || res.data.errors;
        if (failed) throw new Error("send failed");
        form.reset();
        showStatus("success", "Dziękuję! Wiadomość dotarła. Oddzwonię, a wycenę dostaniesz w dwa dni robocze.");
      })
      .catch(function () {
        // Netlify: gdy wysyłka w tle zawiedzie (blokada, sieć), wysyłamy formularz
        // klasycznie. Przeglądarka przejdzie na stronę /dziekujemy.html.
        if (useNetlify) {
          HTMLFormElement.prototype.submit.call(form);
          return;
        }
        showStatus("error", "Nie udało się wysłać wiadomości. Napisz do nas bezpośrednio na " +
          contactEmail + " albo zadzwoń.");
      })
      .then(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
      });
  });
})();

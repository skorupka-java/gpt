/* =========================================================================
   KONFIGURACJA STRONY
   To jedyny plik, który trzeba edytować, żeby uruchomić wysyłkę formularza.
   ========================================================================= */
window.SITE_CONFIG = {
  // 1) Web3Forms (polecane, darmowe). Wejdź na https://web3forms.com, podaj
  //    e-mail, na który mają przychodzić wiadomości, i wklej otrzymany klucz.
  //    Pusty klucz = formularz otwiera program pocztowy (mailto) zamiast wysyłać.
  // 0) Netlify Forms (włączone). Na hostingu Netlify formularz działa bez klucza.
  //    Wiadomości widać w panelu Netlify: Forms → kontakt. Powiadomienia e-mail
  //    ustawisz w: Project configuration → Notifications → Form submission.
  USE_NETLIFY_FORMS: true,

  WEB3FORMS_KEY: "",

  // 2) Alternatywa: Formspree. Wklej pełny adres formularza,
  //    np. "https://formspree.io/f/abcdwxyz". Jeśli ustawiony, ma pierwszeństwo.
  FORMSPREE_URL: "",

  // Adres używany przez awaryjne mailto i w komunikatach o błędzie.
  // Adres widoczny na stronie (kontakt.html, stopki) zmieniasz osobno w plikach HTML.
  CONTACT_EMAIL: "skorupka@skorupkastore.pl",

  // Nazwa nadawcy w powiadomieniach e-mail z formularza.
  SITE_NAME: "Skorupka"
};

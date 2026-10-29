// Tiny i18n runtime. Locale files in ./locales register their messages on
// window.I18N_MESSAGES before this script loads.
//
// Static HTML:  data-i18n="key"            → textContent
//               data-i18n-html="key"       → innerHTML (trusted locale strings only)
//               data-i18n-placeholder / -title / -aria-label / -alt="key" → that attribute
// Dynamic UI:   t("key", { name: "value" }) with {name} placeholders.
//               Pass { count } and add "key_one" for singular forms.
// On change:    window fires "localechange"; re-render anything built in JS.

(function () {
  const STORAGE_KEY = "dls-ai-locale";
  const FALLBACK_LOCALE = "en-US";
  const SUPPORTED_LOCALES = ["en-US", "zh-CN", "es", "ja"];
  // Native names for the language picker.
  const LOCALE_NAMES = {
    "en-US": "English",
    "zh-CN": "简体中文",
    es: "Español",
    ja: "日本語",
  };
  // English names, used when telling the model which language to answer in.
  const REPLY_LANGUAGE_NAMES = {
    "en-US": "English",
    "zh-CN": "Simplified Chinese",
    es: "Spanish",
    ja: "Japanese",
  };
  const ATTRIBUTE_BINDINGS = [
    ["data-i18n-placeholder", "placeholder"],
    ["data-i18n-title", "title"],
    ["data-i18n-aria-label", "aria-label"],
    ["data-i18n-alt", "alt"],
  ];

  const messages = window.I18N_MESSAGES || {};
  const pluralRulesCache = new Map();

  function matchSupportedLocale(tag) {
    if (!tag) return null;
    const lower = String(tag).toLowerCase();
    const exact = SUPPORTED_LOCALES.find((loc) => loc.toLowerCase() === lower);
    if (exact) return exact;
    const base = lower.split("-")[0];
    return SUPPORTED_LOCALES.find((loc) => loc.toLowerCase().split("-")[0] === base) || null;
  }

  function detectLocale() {
    try {
      const saved = matchSupportedLocale(localStorage.getItem(STORAGE_KEY));
      if (saved) return saved;
    } catch {
      /* localStorage unavailable: fall through to the browser languages */
    }
    const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const tag of candidates) {
      const match = matchSupportedLocale(tag);
      if (match) return match;
    }
    return FALLBACK_LOCALE;
  }

  let currentLocale = detectLocale();

  function lookup(locale, key) {
    const table = messages[locale];
    return table && Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined;
  }

  function pluralCategory(locale, count) {
    if (!pluralRulesCache.has(locale)) {
      pluralRulesCache.set(locale, new Intl.PluralRules(locale));
    }
    return pluralRulesCache.get(locale).select(count);
  }

  function resolve(key, params) {
    if (typeof params?.count === "number" && pluralCategory(currentLocale, params.count) === "one") {
      const singular = lookup(currentLocale, `${key}_one`) ?? lookup(FALLBACK_LOCALE, `${key}_one`);
      if (singular !== undefined) return singular;
    }
    return lookup(currentLocale, key) ?? lookup(FALLBACK_LOCALE, key);
  }

  function t(key, params) {
    const template = resolve(key, params);
    if (template === undefined) {
      console.warn(`[i18n] Missing message: ${key}`);
      return key;
    }
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
    );
  }

  function has(key) {
    return lookup(currentLocale, key) !== undefined || lookup(FALLBACK_LOCALE, key) !== undefined;
  }

  function applyTranslations(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-html]").forEach((el) => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });
    for (const [dataAttr, targetAttr] of ATTRIBUTE_BINDINGS) {
      root.querySelectorAll(`[${dataAttr}]`).forEach((el) => {
        el.setAttribute(targetAttr, t(el.getAttribute(dataAttr)));
      });
    }
  }

  function syncLocaleSelects() {
    document.querySelectorAll("[data-locale-select]").forEach((select) => {
      select.value = currentLocale;
    });
  }

  function setLocale(locale) {
    const next = matchSupportedLocale(locale) || FALLBACK_LOCALE;
    if (next === currentLocale) return;
    currentLocale = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* keep the choice for this page view only */
    }
    document.documentElement.lang = next;
    applyTranslations();
    syncLocaleSelects();
    window.dispatchEvent(new CustomEvent("localechange", { detail: { locale: next } }));
  }

  function initLocaleSelects() {
    document.querySelectorAll("[data-locale-select]").forEach((select) => {
      select.innerHTML = SUPPORTED_LOCALES.map(
        (loc) => `<option value="${loc}" lang="${loc}">${LOCALE_NAMES[loc]}</option>`,
      ).join("");
      select.value = currentLocale;
      select.addEventListener("change", () => setLocale(select.value));
    });
  }

  window.I18n = {
    t,
    has,
    setLocale,
    applyTranslations,
    getLocale: () => currentLocale,
    getReplyLanguageName: () => REPLY_LANGUAGE_NAMES[currentLocale] || REPLY_LANGUAGE_NAMES[FALLBACK_LOCALE],
    supportedLocales: SUPPORTED_LOCALES.slice(),
  };
  window.t = t;

  // Scripts load at the end of <body>, so the DOM is ready here.
  document.documentElement.lang = currentLocale;
  initLocaleSelects();
  applyTranslations();
})();

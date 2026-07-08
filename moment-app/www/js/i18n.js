/**
 * 此刻 Moment - 前端国际化模块
 *
 * 用法：
 *   t('home.title')           → 返回当前语言的翻译
 *   t('gallery.photosCount', {count: 5}) → 模板替换
 *   setLang('zh-Hans')        → 切换语言并重新渲染
 *   getLang()                 → 获取当前语言代码
 *
 * 必须最先加载（在 app.js 之前）。
 */
var I18N = (function() {
  'use strict';

  var DEFAULT_LANG = 'en';
  var SUPPORTED = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko'];
  var LANG_LABELS = {
    'en': 'English',
    'zh-Hans': '简体中文',
    'zh-Hant': '繁體中文',
    'ja': '日本語',
    'ko': '한국어'
  };

  var _currentLang = null;
  var _locale = null;
  var _loaded = false;
  var _listeners = [];

  /**
   * Detect browser language. Returns a supported locale string.
   */
  function detectBrowserLang() {
    var nav = navigator.language || navigator.userLanguage || '';
    // Check stored preference first
    var stored = localStorage.getItem('mv_lang');
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    // Parse browser language
    var tags = nav.split(',');
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i].trim().split(';')[0];
      // Exact match
      if (SUPPORTED.indexOf(tag) !== -1) return tag;
      // zh-CN → zh-Hans, zh-TW → zh-Hant
      if (tag === 'zh-CN' || tag === 'zh-SG') return 'zh-Hans';
      if (tag === 'zh-TW' || tag === 'zh-HK' || tag === 'zh-MO') return 'zh-Hant';
      if (tag === 'zh') return 'zh-Hans';
      if (tag === 'ja' || tag.indexOf('ja') === 0) return 'ja';
      if (tag === 'ko' || tag.indexOf('ko') === 0) return 'ko';
    }
    return DEFAULT_LANG;
  }

  /**
   * Load locale JSON from server.
   */
  function loadLocale(lang, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/locales/' + lang + '.json', true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          _locale = JSON.parse(xhr.responseText);
          _currentLang = lang;
          _loaded = true;
          localStorage.setItem('mv_lang', lang);
        } catch(e) {
          // Fallback to English
          if (lang !== 'en') { loadLocale('en', cb); return; }
          _locale = {};
          _currentLang = 'en';
          _loaded = true;
        }
      } else {
        if (lang !== 'en') { loadLocale('en', cb); return; }
        _locale = {};
        _currentLang = 'en';
        _loaded = true;
      }
      if (cb) cb();
      // Notify listeners of language change
      for (var i = 0; i < _listeners.length; i++) {
        try { _listeners[i](_currentLang); } catch(e) {}
      }
    };
    xhr.onerror = function() {
      if (lang !== 'en') { loadLocale('en', cb); return; }
      _locale = {};
      _currentLang = 'en';
      _loaded = true;
      if (cb) cb();
    };
    xhr.send();
  }

  /**
   * Translate key path (e.g. 'auth.loginRequired') with optional template vars.
   */
  function t(key, vars) {
    if (!_locale) return key;
    var parts = key.split('.');
    var val = _locale;
    for (var i = 0; i < parts.length; i++) {
      if (val == null) break;
      val = val[parts[i]];
    }
    if (typeof val !== 'string') return key;
    if (vars) {
      for (var k in vars) {
        if (vars.hasOwnProperty(k)) {
          val = val.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
        }
      }
    }
    return val;
  }

  /**
   * Get current language code.
   */
  function getLang() {
    return _currentLang || detectBrowserLang();
  }

  /**
   * Set language, reload locale, and invoke callback.
   */
  function setLang(lang, cb) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    loadLocale(lang, cb);
  }

  /**
   * Get list of supported languages with labels.
   */
  function getSupportedLanguages() {
    return SUPPORTED.map(function(code) {
      return { code: code, label: LANG_LABELS[code] || code };
    });
  }

  /**
   * Register a callback for language change events.
   */
  function onChange(fn) {
    _listeners.push(fn);
  }

  /**
   * Initialize: detect language and load locale.
   */
  function init(cb) {
    var lang = detectBrowserLang();
    loadLocale(lang, cb);
  }

  // Auto-init on script load
  init();

  return {
    t: t,
    getLang: getLang,
    setLang: setLang,
    getSupportedLanguages: getSupportedLanguages,
    onChange: onChange,
    init: init,
    isLoaded: function() { return _loaded; }
  };
})();

// Global shorthand
function t(key, vars) { return I18N.t(key, vars); }
function getLang() { return I18N.getLang(); }
function setLang(lang, cb) { return I18N.setLang(lang, cb); }

/** Convert internal lang code to Intl locale for date formatting */
function getLocaleForIntl() {
  var map = { 'en': 'en-US', 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW', 'ja': 'ja-JP', 'ko': 'ko-KR' };
  return map[getLang()] || 'en-US';
}

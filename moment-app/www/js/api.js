/**
 * 此刻 Moment — Frontend API Client v2
 *
 * Features: retry with backoff, network detection, unified error handling.
 *
 * Usage:
 *   API.post('/api/auth/login', { phone, password })
 *      .then(r => { if (r.error) ... else ... })
 */
var API_CLIENT = (function() {
  'use strict';

  var _baseURL = (localStorage.getItem('mv_api') || '').replace(/\/+$/, '') ||
    (location.protocol === 'https:' ? 'https://cikemoment.cn' : 'http://124.156.163.213:3000');

  var _timeout = 8000;  // 8s default (reduced from 15s)
  var _maxRetries = 1; // One automatic retry for GET requests

  function getBaseURL() { return _baseURL; }
  function setBaseURL(url) { _baseURL = url.replace(/\/+$/, ''); localStorage.setItem('mv_api', _baseURL); }

  /** Check if online; show toast if offline > 2s */
  var _isOnline = navigator.onLine;
  var _offlineTimer = null;

  window.addEventListener('online', function() {
    _isOnline = true;
    clearTimeout(_offlineTimer);
    if (typeof showToast === 'function') showToast(t('common.onlineBack'));
    if (typeof processPendingQueue === 'function') processPendingQueue();
  });

  window.addEventListener('offline', function() {
    _isOnline = false;
    _offlineTimer = setTimeout(function() {
      if (!navigator.onLine && typeof showToast === 'function') {
        showToast(t('common.offline'));
      }
    }, 2000);
  });

  function isOnline() { return _isOnline; }

  /**
   * Core request with retry support.
   */
  function request(method, path, body, opts) {
    opts = opts || {};
    var retries = opts.retries !== undefined ? opts.retries : (method === 'GET' ? _maxRetries : 0);
    var attempt = 0;

    function doRequest() {
      var url = _baseURL + path;
      var headers = { 'x-auth-token': AUTH.token || '' };
      if (body) headers['Content-Type'] = 'application/json';

      var fetchOpts = { method: method, headers: headers };
      if (body) fetchOpts.body = JSON.stringify(body);

      var timeoutMs = opts.timeout || _timeout;
      var controller = new AbortController();
      var timer = setTimeout(function() { controller.abort(); }, timeoutMs);
      fetchOpts.signal = controller.signal;

      return fetch(url, fetchOpts)
        .then(function(r) {
          clearTimeout(timer);
          if (r.status === 401 && !opts._retryAuth) {
            return r.json().then(function(d) {
              var errCode = (d && d.code) || '';
              if (errCode === 'TOKEN_REQUIRED' || errCode === 'TOKEN_EXPIRED' || errCode === 'UNAUTHORIZED') {
                if (typeof handleAuthExpired === 'function') handleAuthExpired();
              }
              throw new Error((d && d.message) || 'auth_required');
            }).catch(function(e) { if (e.message === 'auth_required') throw e; throw new Error('auth_required'); });
          }
          return r.json().catch(function() { throw new Error('Invalid JSON response'); });
        })
        .then(function normalizeResponse(d) {
          if (d && d.error) return { error: d.error, code: d.code };
          if (d && d.success === false) return { error: d.message || 'Unknown error', code: d.code };
          return d;
        })
        .catch(function(err) {
          // Retry on network errors with exponential backoff
          if (attempt < retries && (err.name === 'AbortError' || err.message === 'Failed to fetch' || err.message === 'Network request failed')) {
            attempt++;
            var delay = Math.min(1000 * Math.pow(2, attempt), 4000);
            return new Promise(function(resolve) {
              setTimeout(function() { resolve(doRequest()); }, delay);
            });
          }
          if (err.name === 'AbortError') {
            return { error: t('common.requestTimeout') };
          }
          throw err;
        });
    }

    return doRequest();
  }

  return {
    get:      function(path, opts)        { return request('GET', path, null, opts); },
    post:     function(path, body, opts)  { return request('POST', path, body, opts); },
    put:      function(path, body, opts)  { return request('PUT', path, body, opts); },
    delete:   function(path, opts)        { return request('DELETE', path, null, opts); },
    getBaseURL: getBaseURL,
    setBaseURL: setBaseURL,
    isOnline:   isOnline,
  };
})();

// Legacy compat
function api(path, opts) {
  opts = opts || {};
  var m = (opts.method || 'GET').toLowerCase();
  if (m === 'get')    return API_CLIENT.get(path, opts);
  if (m === 'post')   return API_CLIENT.post(path, opts.body, opts);
  if (m === 'put')    return API_CLIENT.put(path, opts.body, opts);
  if (m === 'delete') return API_CLIENT.delete(path, opts);
  return API_CLIENT.get(path, opts);
}
var API = API_CLIENT;

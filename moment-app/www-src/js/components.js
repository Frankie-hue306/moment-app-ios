/**
 * 此刻 Moment — Design System Components
 *
 * Factory functions that return plain DOM elements styled with
 * the design-tokens.css + components.css class system.
 *
 * Usage:
 *   var btn = DS.createButton({ label: 'Save', variant: 'primary', size: 'lg', block: true });
 *   document.body.appendChild(btn);
 *
 *   DS.showToast('Saved!');
 *   DS.showDialog({ message: 'Are you sure?', onConfirm: function() { ... } });
 *   DS.showLoading(document.getElementById('container'));
 */

var DS = (function() {
  'use strict';

  // ==================== BUTTON ====================
  /**
   * opts: { label, variant, size, block, icon, className, onClick, disabled }
   * variant: 'primary' | 'secondary' | 'ghost' | 'danger'
   * size:    'sm' | null | 'lg'
   */
  function createButton(opts) {
    opts = opts || {};
    var el = document.createElement('button');
    el.className = 'ds-btn';
    if (opts.variant) el.classList.add('ds-btn--' + opts.variant);
    if (opts.size)    el.classList.add('ds-btn--' + opts.size);
    if (opts.block)   el.classList.add('ds-btn--block');
    if (opts.className) el.className += ' ' + opts.className;
    el.textContent = opts.label || '';
    if (opts.disabled) el.disabled = true;
    if (opts.onClick)  el.addEventListener('click', opts.onClick);
    return el;
  }

  // ==================== INPUT ====================
  /**
   * opts: { placeholder, value, type, center, className, onChange, onInput, maxlength }
   */
  function createInput(opts) {
    opts = opts || {};
    var el = document.createElement('input');
    el.className = 'ds-input';
    if (opts.center) el.classList.add('ds-input--center');
    if (opts.className) el.className += ' ' + opts.className;
    el.type = opts.type || 'text';
    if (opts.placeholder) el.placeholder = opts.placeholder;
    if (opts.value)       el.value = opts.value;
    if (opts.maxlength)   el.maxLength = opts.maxlength;
    if (opts.onInput)     el.addEventListener('input', opts.onInput);
    if (opts.onChange)    el.addEventListener('change', opts.onChange);
    return el;
  }

  // ==================== CARD ====================
  /**
   * opts: { children, flat, raised, clickable, className, onClick, padding }
   * children can be a string or DOM element(s)
   */
  function createCard(opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'ds-card';
    if (opts.flat)       el.classList.add('ds-card--flat');
    if (opts.raised)     el.classList.add('ds-card--raised');
    if (opts.clickable)  el.classList.add('ds-card--clickable');
    if (opts.className)  el.className += ' ' + opts.className;
    if (opts.padding)    el.style.padding = opts.padding;
    if (opts.onClick)    el.addEventListener('click', opts.onClick);
    if (opts.children) {
      if (typeof opts.children === 'string') el.innerHTML = opts.children;
      else if (Array.isArray(opts.children)) opts.children.forEach(function(c) { el.appendChild(c); });
      else el.appendChild(opts.children);
    }
    return el;
  }

  // ==================== DIALOG ====================
  /**
   * opts: { message, confirmLabel, cancelLabel, onConfirm, onCancel, variant }
   * Returns the backdrop element (already appended to body).
   * Call .remove() on it to dismiss.
   */
  function showDialog(opts) {
    opts = opts || {};
    var backdrop = document.createElement('div');
    backdrop.className = 'ds-dialog-backdrop';

    var dlg = document.createElement('div');
    dlg.className = 'ds-dialog';

    var msg = document.createElement('div');
    msg.className = 'ds-dialog__message';
    msg.textContent = opts.message || '';

    var actions = document.createElement('div');
    actions.className = 'ds-dialog__actions';

    var cancelBtn = createButton({
      label: opts.cancelLabel || t('common.cancel'),
      variant: 'secondary',
      onClick: function() {
        backdrop.remove();
        if (opts.onCancel) opts.onCancel();
      }
    });

    var confirmVariant = opts.variant || 'primary';
    var confirmBtn = createButton({
      label: opts.confirmLabel || t('common.confirm'),
      variant: confirmVariant,
      onClick: function() {
        backdrop.remove();
        if (opts.onConfirm) opts.onConfirm();
      }
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    dlg.appendChild(msg);
    dlg.appendChild(actions);
    backdrop.appendChild(dlg);

    // Close on backdrop click
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) {
        backdrop.remove();
        if (opts.onCancel) opts.onCancel();
      }
    });

    document.body.appendChild(backdrop);
    return backdrop;
  }

  // ==================== MODAL ====================
  /**
   * opts: { title, body (DOM element), onClose, className }
   * Returns the backdrop element (appended to body).
   */
  function showModal(opts) {
    opts = opts || {};
    var backdrop = document.createElement('div');
    backdrop.className = 'ds-modal-backdrop';
    if (opts.className) backdrop.className += ' ' + opts.className;

    var header = document.createElement('div');
    header.className = 'ds-modal__header';

    var title = document.createElement('span');
    title.className = 'ds-modal__title';
    title.textContent = opts.title || '';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'ds-modal__close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', function() {
      backdrop.remove();
      if (opts.onClose) opts.onClose();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    backdrop.appendChild(header);

    var body = document.createElement('div');
    body.className = 'ds-modal__body';
    if (opts.body) {
      if (typeof opts.body === 'string') body.innerHTML = opts.body;
      else body.appendChild(opts.body);
    }
    backdrop.appendChild(body);

    // Close on backdrop click (but not on body click)
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) {
        backdrop.remove();
        if (opts.onClose) opts.onClose();
      }
    });

    document.body.appendChild(backdrop);
    return backdrop;
  }

  // ==================== TOAST ====================
  var _toastTimer = null;
  /**
   * msg: string
   * duration: ms (default 1500)
   */
  function showToast(msg, duration) {
    duration = duration || 1500;
    // Remove existing toast
    var existing = document.querySelector('.ds-toast');
    if (existing) existing.remove();
    clearTimeout(_toastTimer);

    var el = document.createElement('div');
    el.className = 'ds-toast';
    el.textContent = msg;
    document.body.appendChild(el);

    requestAnimationFrame(function() { el.classList.add('ds-toast--visible'); });

    _toastTimer = setTimeout(function() {
      el.classList.remove('ds-toast--visible');
      setTimeout(function() { el.remove(); }, 300);
    }, duration);

    return el;
  }

  // ==================== LOADING ====================
  /**
   * container: DOM element to append the loading spinner into.
   * opts: { label }
   * Returns the loading element.
   */
  function showLoading(container, opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'ds-loading';

    var spinner = document.createElement('div');
    spinner.className = 'ds-spinner';
    el.appendChild(spinner);

    if (opts.label) {
      var label = document.createElement('span');
      label.textContent = opts.label;
      el.appendChild(label);
    }

    if (container) container.appendChild(el);
    return el;
  }

  /**
   * Remove loading element from container.
   */
  function hideLoading(container) {
    if (!container) return;
    var el = container.querySelector('.ds-loading');
    if (el) el.remove();
  }

  // ==================== BADGE ====================
  function createBadge(label, variant) {
    var el = document.createElement('span');
    el.className = 'ds-badge ds-badge--' + (variant || 'info');
    el.textContent = label;
    return el;
  }

  // ==================== SECTION TITLE ====================
  function createSectionTitle(label) {
    var el = document.createElement('div');
    el.className = 'ds-section-title';
    el.textContent = label;
    return el;
  }

  // ==================== DIVIDER ====================
  function createDivider() {
    var el = document.createElement('div');
    el.className = 'ds-divider';
    return el;
  }

  // ==================== SHEET HELPER ====================
  /**
   * Create a bottom sheet.
   * opts: { title, rows: [{label, onClick, danger, checkVisible}], onCancel, cancelLabel }
   * Returns the sheet element. Call .classList.add('ds-sheet--open') to show.
   */
  function createSheet(opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'ds-sheet';

    var title = document.createElement('div');
    title.className = 'ds-sheet__title';
    title.textContent = opts.title || '';
    el.appendChild(title);

    (opts.rows || []).forEach(function(row) {
      var rowEl = document.createElement('div');
      rowEl.className = 'ds-sheet__row';
      if (row.danger) rowEl.classList.add('ds-sheet__row--danger');
      rowEl.textContent = (row.label || '') + ' ';
      if (row.checkVisible) {
        var check = document.createElement('span');
        check.style.cssText = 'color:var(--color-primary)';
        check.textContent = '✓';
        rowEl.appendChild(check);
      }
      rowEl.addEventListener('click', function() {
        if (row.onClick) row.onClick();
      });
      el.appendChild(rowEl);
    });

    var cancelBtn = createButton({
      label: opts.cancelLabel || t('common.cancel'),
      variant: 'secondary',
      block: true,
      className: 'ds-sheet__cancel',
      onClick: function() {
        el.classList.remove('ds-sheet--open');
        if (opts.onCancel) opts.onCancel();
      }
    });
    cancelBtn.style.margin = '12px 20px 0';
    cancelBtn.style.width = 'calc(100% - 40px)';
    el.appendChild(cancelBtn);

    document.body.appendChild(el);
    return el;
  }

  // ==================== EXPORT ====================
  return {
    createButton:       createButton,
    createInput:        createInput,
    createCard:         createCard,
    showDialog:         showDialog,
    showModal:          showModal,
    showToast:          showToast,
    showLoading:        showLoading,
    hideLoading:        hideLoading,
    createBadge:        createBadge,
    createSectionTitle: createSectionTitle,
    createDivider:      createDivider,
    createSheet:        createSheet,
  };
})();

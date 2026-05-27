// js/modal.js
let confirmCallback = null;
let passcodeCallback = null;

function initModal() {
  // Confirm Modal
  const confirmModal = document.getElementById('confirm-modal');
  const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
  const confirmOkBtn = document.getElementById('confirm-ok-btn');
  
  if (confirmModal && confirmCancelBtn && confirmOkBtn) {
    confirmCancelBtn.addEventListener('click', () => {
      if (confirmCallback) confirmCallback(false);
      closeConfirmModal();
    });

    confirmOkBtn.addEventListener('click', () => {
      if (confirmCallback) confirmCallback(true);
      closeConfirmModal();
    });
  }

  // Passcode Modal
  const passcodeCancelBtn = document.getElementById('passcode-cancel-btn');
  const passcodeOkBtn = document.getElementById('passcode-ok-btn');
  
  if (passcodeCancelBtn) {
    passcodeCancelBtn.addEventListener('click', closePasscodeModal);
  }
  
  if (passcodeOkBtn) {
    passcodeOkBtn.addEventListener('click', handlePasscodeSubmit);
  }

  const passcodeInput = document.getElementById('passcode-input');
  if (passcodeInput) {
    passcodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handlePasscodeSubmit();
      }
    });
  }

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        if (overlay.id === 'confirm-modal') closeConfirmModal();
        if (overlay.id === 'passcode-modal') closePasscodeModal();
      }
    });
  });
}

/**
 * Universal Promise-based Confirmation
 */
window.customConfirm = function(message, title = 'Confirm Action') {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');
    
    if (modal && titleEl && messageEl) {
      titleEl.textContent = title;
      messageEl.textContent = message;
      confirmCallback = resolve;
      modal.classList.add('visible');
    } else {
      resolve(confirm(message));
    }
  });
};

/**
 * Compatibility wrapper for callback-based confirmation
 */
window.showConfirmModal = function(message, callback) {
  window.customConfirm(message).then(result => {
    if (result && typeof callback === 'function') {
      callback();
    }
  });
};

function closeConfirmModal() {
  const modal = document.getElementById('confirm-modal');
  if (modal) modal.classList.remove('visible');
  confirmCallback = null;
}

function showPasscodeModal(title, message, onComplete) {
  const modal = document.getElementById('passcode-modal');
  const titleEl = document.getElementById('passcode-modal-title');
  const msgEl = document.getElementById('passcode-modal-message');
  const input = document.getElementById('passcode-input');
  const err = document.getElementById('passcode-error');

  if (modal && titleEl && msgEl && input) {
    titleEl.textContent = title;
    msgEl.textContent = message;
    input.value = '';
    err.textContent = '';
    passcodeCallback = onComplete;
    modal.classList.add('visible');
    setTimeout(() => input.focus(), 50);
  }
}

function handlePasscodeSubmit() {
  const pwInput = document.getElementById('passcode-input');
  const val = pwInput.value.trim();
  if (!val || val.length !== 4 || isNaN(val)) {
    const errEl = document.getElementById('passcode-error');
    if (errEl) errEl.textContent = "PIN must be exactly 4 digits.";
    return;
  }
  if (passcodeCallback) {
    passcodeCallback(val);
  }
  closePasscodeModal();
}

function closePasscodeModal() {
  const modal = document.getElementById('passcode-modal');
  if (modal) modal.classList.remove('visible');
  passcodeCallback = null;
}

// initModal is called explicitly by main.js after all components have been loaded.
window.initModal = initModal;

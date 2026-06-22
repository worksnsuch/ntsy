/**
 * authManager.js
 * Handles all authentication flows: login, signup, OAuth, forgot password,
 * session management, and UI transitions.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Display an inline error message within a form instead of using alert().
 * @param {string} containerId - ID of the error <p> element
 * @param {string} message     - Error text to display
 */
function showAuthError(containerId, message) {
  const el = document.getElementById(containerId);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
  }
}

function clearAuthError(containerId) {
  const el = document.getElementById(containerId);
  if (el) {
    el.textContent = '';
    el.style.display = 'none';
  }
}

/**
 * Basic disposable-email blocklist validation.
 */
function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;

  const disposableDomains = [
    'mailinator.com', 'tempmail.com', '10minutemail.com', '10minutemail.co.za',
    'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
    'guerrillamailblock.com', 'guerrillamail.biz', 'guerrillamail.de',
    'throwawaymail.com', 'yopmail.com', 'maildrop.cc', 'dispostable.com',
    'getairmail.com', 'sharklasers.com', 'guerrillamail.la',
  ];
  const domain = email.split('@')[1].toLowerCase();
  return !disposableDomains.includes(domain);
}

/**
 * Set a button's loading state.
 */
function setButtonLoading(btn, isLoading, loadingText = 'Please wait...') {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = loadingText;
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Typewriter Effect
// ---------------------------------------------------------------------------

window.startTypewriter = function () {
  const textEl = document.getElementById('typewriter-text');
  if (!textEl) return;

  const words = ['Studying', 'Working', 'Writing', 'Planning', 'Creating'];
  let wordIndex = 0;
  let charIndex = words[wordIndex].length;
  let isDeleting = true;

  setTimeout(type, 2000);

  function type() {
    if (!document.getElementById('typewriter-text')) return;

    const currentWord = words[wordIndex];
    charIndex = isDeleting ? charIndex - 1 : charIndex + 1;
    textEl.textContent = currentWord.substring(0, charIndex);

    let typingSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === currentWord.length) {
      isDeleting = true;
      typingSpeed = 2000;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      typingSpeed = 500;
    }

    setTimeout(type, typingSpeed);
  }
};

// ---------------------------------------------------------------------------
// Auth View Switching
// ---------------------------------------------------------------------------

window.switchAuthView = function (targetViewId) {
  const views = document.querySelectorAll('.auth-view');
  views.forEach((v) => {
    if (v.id === targetViewId) {
      v.classList.remove('swipe-left-out', 'swipe-right');
      v.classList.add('active-auth');
    } else if (v.classList.contains('active-auth')) {
      v.classList.remove('active-auth');
      v.classList.add('swipe-left-out');
    } else {
      v.classList.remove('swipe-left-out');
      v.classList.add('swipe-right');
    }
  });

  window.safeCreateIcons();
};

// ---------------------------------------------------------------------------
// App Visibility
// ---------------------------------------------------------------------------

window.completeLogin = function () {
  const authWrapper = document.getElementById('auth-wrapper');
  const appContainer = document.querySelector('.app-container');

  if (authWrapper) {
    authWrapper.style.transition = 'opacity 0.6s ease';
    authWrapper.style.opacity = '0';
    setTimeout(() => { authWrapper.style.display = 'none'; }, 600);
  }

  if (appContainer) {
    appContainer.style.display = 'flex';
    appContainer.style.animation = 'appEntrance 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  }
};

window.toggleAppVisibility = function (isLoggedIn, justLoggedOut) {
  const authWrapper = document.getElementById('auth-wrapper');
  const appContainer = document.querySelector('.app-container');

  if (isLoggedIn) {
    if (authWrapper) authWrapper.style.display = 'none';
    if (appContainer) {
      appContainer.style.display = 'flex';
      if (!appContainer.style.animation) {
        appContainer.style.animation = 'appEntrance 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      }
    }
  } else {
    if (authWrapper) { authWrapper.style.display = 'block'; authWrapper.style.opacity = '1'; }
    if (appContainer) appContainer.style.display = 'none';

    if (justLoggedOut) {
      setTimeout(() => {
        if (window.switchAuthView) window.switchAuthView('login-auth');
      }, 100);
    }
  }
};

// ---------------------------------------------------------------------------
// Session Check
// ---------------------------------------------------------------------------

window.checkAuthStatus = async function () {
  const params = new URLSearchParams(window.location.search);
  let justLoggedOut = false;

  if (params.has('logout')) {
    if (window.supabaseClient) await window.supabaseClient.auth.signOut();
    window.history.replaceState({}, document.title, window.location.pathname);
    justLoggedOut = true;
  }

  if (!window.supabaseClient) return;

  const { data: { session } } = await window.supabaseClient.auth.getSession();
  window.userSession = session;
  window.toggleAppVisibility(!!session, justLoggedOut);

  window.supabaseClient.auth.onAuthStateChange((event, session) => {
    window.userSession = session;
    if (event === 'SIGNED_IN') {
      window.toggleAppVisibility(true, false);
      if (typeof initNotes === 'function') initNotes();
      if (typeof initFolders === 'function') initFolders();
    } else if (event === 'SIGNED_OUT') {
      window.toggleAppVisibility(false, false);
    }
  });
};

// ---------------------------------------------------------------------------
// Main Auth Initializer
// ---------------------------------------------------------------------------

window.initAuth = function () {
  // Navigation buttons
  const startBtn = document.getElementById('auth-start-btn');
  const gotoSignupBtn = document.getElementById('goto-signup');
  const gotoLoginBtn = document.getElementById('goto-login');
  const backToLandingBtn = document.getElementById('back-to-landing-btn');
  const backToLoginBtn = document.getElementById('back-to-login-btn');
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  const backFromForgotBtn = document.getElementById('back-from-forgot-btn');
  const confirmSigninBtn = document.getElementById('confirm-signin-btn');

  // Forms
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const forgotForm = document.getElementById('forgot-form');

  // OAuth buttons
  const googleLoginBtn = document.getElementById('google-login-btn');
  const appleLoginBtn = document.getElementById('apple-login-btn');

  // --- Navigation ---
  if (startBtn) startBtn.addEventListener('click', () => switchAuthView('login-auth'));
  if (gotoSignupBtn) gotoSignupBtn.addEventListener('click', (e) => { e.preventDefault(); switchAuthView('signup-auth'); });
  if (gotoLoginBtn) gotoLoginBtn.addEventListener('click', (e) => { e.preventDefault(); switchAuthView('login-auth'); });
  if (backToLandingBtn) backToLandingBtn.addEventListener('click', () => switchAuthView('landing-auth'));
  if (backToLoginBtn) backToLoginBtn.addEventListener('click', () => switchAuthView('login-auth'));
  if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); clearAuthError('forgot-error'); switchAuthView('forgot-auth'); });
  if (backFromForgotBtn) backFromForgotBtn.addEventListener('click', () => switchAuthView('login-auth'));
  if (confirmSigninBtn) confirmSigninBtn.addEventListener('click', () => switchAuthView('login-auth'));

  // Signup email confirmation "Sign in" button
  const confirmSignupSigninBtn = document.getElementById('confirm-signup-signin-btn');
  if (confirmSignupSigninBtn) confirmSignupSigninBtn.addEventListener('click', () => switchAuthView('login-auth'));


  // --- Login Form ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAuthError('login-error');

      const email = document.getElementById('login-email')?.value?.trim();
      const pass = document.getElementById('login-password')?.value;
      if (!email || !pass) return;

      const btn = loginForm.querySelector('button[type="submit"]');
      setButtonLoading(btn, true, 'Signing in...');

      if (!window.supabaseClient) {
        showAuthError('login-error', 'Authentication service not available. Please refresh the page.');
        setButtonLoading(btn, false);
        return;
      }

      const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password: pass });

      setButtonLoading(btn, false);
      if (error) showAuthError('login-error', error.message);
    });
  }

  // --- Signup Form ---
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAuthError('signup-error');

      const email = document.getElementById('signup-email')?.value?.trim();
      const pass1 = document.getElementById('signup-password')?.value;
      const pass2 = document.getElementById('signup-password-confirm')?.value;
      const firstName = document.getElementById('signup-firstname')?.value?.trim();
      const lastName = document.getElementById('signup-lastname')?.value?.trim();

      if (pass1 !== pass2) {
        showAuthError('signup-error', 'Passwords do not match.');
        return;
      }

      if (!isValidEmail(email)) {
        showAuthError('signup-error', 'Please provide a valid email address.');
        return;
      }

      const btn = signupForm.querySelector('button[type="submit"]');
      setButtonLoading(btn, true, 'Creating account...');

      if (!window.supabaseClient) {
        showAuthError('signup-error', 'Authentication service not available. Please refresh the page.');
        setButtonLoading(btn, false);
        return;
      }

      const { error } = await window.supabaseClient.auth.signUp({
        email,
        password: pass1,
        options: {
          data: { first_name: firstName, last_name: lastName },
          emailRedirectTo: window.location.origin,
        },
      });

      setButtonLoading(btn, false);
      if (error) {
        showAuthError('signup-error', error.message);
      } else {
        switchAuthView('confirmation-auth');
      }
    });
  }

  // --- Forgot Password Form ---
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAuthError('forgot-error');

      const email = document.getElementById('forgot-email')?.value?.trim();
      if (!email) { showAuthError('forgot-error', 'Please enter your email address.'); return; }

      const btn = forgotForm.querySelector('button[type="submit"]');
      setButtonLoading(btn, true, 'Sending...');

      if (!window.supabaseClient) {
        showAuthError('forgot-error', 'Authentication service not available. Please refresh the page.');
        setButtonLoading(btn, false);
        return;
      }

      const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      });

      setButtonLoading(btn, false);
      if (error) {
        showAuthError('forgot-error', error.message);
      } else {
        switchAuthView('reset-sent-auth');
      }
    });
  }

  // --- Google OAuth ---
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      clearAuthError('login-error');
      const originalHTML = googleLoginBtn.innerHTML;
      googleLoginBtn.innerHTML = '<span style="font-size:12px;opacity:0.7;">Connecting...</span>';
      googleLoginBtn.disabled = true;

      if (!window.supabaseClient) {
        showAuthError('login-error', 'Authentication service not available. Please refresh the page.');
        googleLoginBtn.innerHTML = originalHTML;
        googleLoginBtn.disabled = false;
        return;
      }

      const { error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });

      if (error) {
        showAuthError('login-error', error.message);
        googleLoginBtn.innerHTML = originalHTML;
        googleLoginBtn.disabled = false;
        window.safeCreateIcons();
      }
      // On success, browser redirects — no need to restore button
    });
  }

  // --- Apple OAuth ---
  if (appleLoginBtn) {
    appleLoginBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      clearAuthError('login-error');
      const originalHTML = appleLoginBtn.innerHTML;
      appleLoginBtn.innerHTML = '<span style="font-size:12px;opacity:0.7;">Connecting...</span>';
      appleLoginBtn.disabled = true;

      if (!window.supabaseClient) {
        showAuthError('login-error', 'Authentication service not available. Please refresh the page.');
        appleLoginBtn.innerHTML = originalHTML;
        appleLoginBtn.disabled = false;
        return;
      }

      const { error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: window.location.origin },
      });

      if (error) {
        showAuthError('login-error', error.message);
        appleLoginBtn.innerHTML = originalHTML;
        appleLoginBtn.disabled = false;
        window.safeCreateIcons();
      }
    });
  }

  // --- Password Toggle Visibility (event delegation) ---
  const authWrapper = document.getElementById('auth-wrapper');
  if (authWrapper) {
    authWrapper.addEventListener('click', (e) => {
      const toggle = e.target.closest('.pwd-toggle');
      if (!toggle) return;

      const wrapper = toggle.closest('.password-wrapper');
      if (!wrapper) return;

      const input = wrapper.querySelector('input');
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const newIcon = document.createElement('i');
      newIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
      newIcon.className = 'pwd-toggle';
      toggle.replaceWith(newIcon);
      window.safeCreateIcons();
    });
  }

  startTypewriter();
};

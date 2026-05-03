window.AUTH_FRAGMENT = `
<!-- Auth Wrapper -->
<div id="auth-wrapper" class="auth-wrapper">

  <!-- 1. Landing View -->
  <div id="landing-auth" class="auth-view active-auth center-layout">
    <div class="landing-container flex-center direction-col" style="height: 100%;">
      <img src="/assets/favicon.png" class="landing-doc-icon mb-6" style="width: 72px; height: auto; transform: rotate(12deg);" alt="NTSY Logo">
      <h1 class="welcome-title" style="font-size: 42px; margin-bottom: 24px;">
        <span style="font-weight: 400;">Start</span> <span style="font-weight: 700;" id="typewriter-text">Studying</span><span class="typewriter-cursor">|</span>
      </h1>
      <button id="auth-start-btn" class="classic-btn pill-btn mt-4">Let's Go</button>
    </div>
  </div>

  <!-- 2. Log In View -->
  <div id="login-auth" class="auth-view swipe-right">
    <div class="split-layout">
      <!-- Dark Side (Left) -->
      <div class="split-half split-dark logo-center">
        <img class="auth-logo" src="src/assets/favicon.png" style="width: 140px; height: auto;" alt="Logo">
      </div>
      <!-- White Side (Right) -->
      <div class="split-half split-white flex-center direction-col">
        <button class="icon-btn auth-back-btn" id="back-to-landing-btn" title="Go Back">
          <i data-lucide="arrow-left" size="20"></i>
        </button>
        <div class="auth-form-container">
          <form id="login-form" class="auth-form" novalidate>
            <!-- Inline error -->
            <p id="login-error" class="auth-error-msg" style="display:none;"></p>

            <div class="form-group">
              <label for="login-email">Email</label>
              <input type="email" id="login-email" autocomplete="email" required>
            </div>
            <div class="form-group">
              <label for="login-password">Password</label>
              <div class="password-wrapper">
                <input type="password" id="login-password" autocomplete="current-password" required>
                <i data-lucide="eye" class="pwd-toggle"></i>
              </div>
            </div>
            <div class="form-group row-group">
              <label class="checkbox-label">
                <input type="checkbox" id="login-remember"> Remember me
              </label>
            </div>
            <button type="submit" class="classic-btn dark-btn w-full">Sign in</button>

            <div class="auth-links text-center mt-4">
              <a href="#" id="forgot-password-link" class="forgot-link">Forgot Password?</a>
            </div>

            <div class="social-login text-center mt-6">
              <p>Or Sign in with</p>
              <div class="social-icons">
                <div id="google-login-btn" class="social-icon" title="Sign in with Google" role="button" tabindex="0">
                  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
                  </svg>
                </div>
                <div id="apple-login-btn" class="social-icon" title="Sign in with Apple" role="button" tabindex="0">
                  <i data-lucide="apple"></i>
                </div>
              </div>
            </div>

            <div class="auth-switch text-center mt-8">
              <p>Don't have an account? <a href="#" id="goto-signup">Sign up</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- 3. Sign Up View -->
  <div id="signup-auth" class="auth-view center-layout swipe-right">
    <button class="icon-btn auth-back-btn" id="back-to-login-btn" title="Go Back" style="position: absolute; top: 24px; left: 24px;">
      <i data-lucide="arrow-left" size="24"></i>
    </button>
    <div class="signup-container">
      <div class="text-center logo-top" style="margin-bottom: 12px;">
        <h2 style="color: var(--text-primary);">Sign Up</h2>
        <p class="subtitle" style="color: var(--text-secondary); margin-top: 4px;">Create your account</p>
      </div>

      <form id="signup-form" class="auth-form grid-form" novalidate>
        <!-- Inline error -->
        <p id="signup-error" class="auth-error-msg full-width" style="display:none;"></p>

        <div class="form-group">
          <label for="signup-firstname">First name</label>
          <input type="text" id="signup-firstname" autocomplete="given-name" required>
        </div>
        <div class="form-group">
          <label for="signup-lastname">Last name</label>
          <input type="text" id="signup-lastname" autocomplete="family-name" required>
        </div>

        <div class="form-group full-width">
          <label for="signup-email">Email</label>
          <input type="email" id="signup-email" autocomplete="email" required>
        </div>

        <div class="form-group">
          <label for="signup-password">Password</label>
          <div class="password-wrapper">
            <input type="password" id="signup-password" autocomplete="new-password" required minlength="8">
            <i data-lucide="eye" class="pwd-toggle"></i>
          </div>
        </div>
        <div class="form-group">
          <label for="signup-password-confirm">Confirm password</label>
          <div class="password-wrapper">
            <input type="password" id="signup-password-confirm" autocomplete="new-password" required>
            <i data-lucide="eye" class="pwd-toggle"></i>
          </div>
        </div>

        <div class="form-group full-width text-center">
          <label class="checkbox-label justify-center">
            <input type="checkbox" required> I agree to all the <a href="#">Terms and Privacy policy</a>
          </label>
        </div>

        <div class="form-group full-width flex-center mt-4">
          <button type="submit" class="classic-btn dark-btn">Create Account</button>
        </div>

        <div class="auth-switch text-center w-full mt-4">
          <p>Already have an account? <a href="#" id="goto-login">Log in</a></p>
        </div>
      </form>
    </div>
  </div>

  <!-- 4. Forgot Password View -->
  <div id="forgot-auth" class="auth-view center-layout swipe-right">
    <button class="icon-btn auth-back-btn" id="back-from-forgot-btn" title="Go Back" style="position: absolute; top: 24px; left: 24px;">
      <i data-lucide="arrow-left" size="24"></i>
    </button>
    <div class="signup-container" style="max-width: 400px;">
      <div class="text-center logo-top" style="margin-bottom: 20px;">
        <i data-lucide="key-round" style="width: 48px; height: 48px; color: var(--accent-yellow); margin-bottom: 16px;"></i>
        <h2 style="color: var(--text-primary);">Reset Password</h2>
        <p class="subtitle" style="color: var(--text-secondary); margin-top: 8px;">Enter your email and we'll send you a reset link.</p>
      </div>
      <form id="forgot-form" class="auth-form" novalidate>
        <p id="forgot-error" class="auth-error-msg" style="display:none;"></p>
        <div class="form-group">
          <label for="forgot-email">Email</label>
          <input type="email" id="forgot-email" autocomplete="email" required placeholder="you@example.com">
        </div>
        <button type="submit" class="classic-btn dark-btn w-full mt-4">Send Reset Link</button>
      </form>
    </div>
  </div>

  <!-- 5. Reset Link Sent View -->
  <div id="reset-sent-auth" class="auth-view center-layout swipe-right">
    <div class="confirmation-container text-center">
      <div style="margin-bottom: 24px;">
        <i data-lucide="mail-check" style="width: 64px; height: 64px; color: var(--accent-yellow);"></i>
      </div>
      <h2 class="mb-2" style="color: var(--text-primary);">Check your email</h2>
      <p class="subtitle mb-8" style="color: var(--text-secondary);">We've sent a password reset link to your email.<br>Click the link to set a new password.</p>
      <button id="confirm-signin-btn" class="classic-btn dark-btn w-full max-w-xs mx-auto">Back to Sign In</button>
    </div>
  </div>

  <!-- 6. Email Confirmation View -->
  <div id="confirmation-auth" class="auth-view center-layout swipe-right">
    <div class="confirmation-container text-center">
      <img class="auth-logo mb-6" src="src/assets/favicon.png" style="width: 60px; height: auto;" alt="Logo">
      <h2 class="mb-2" style="color: var(--text-primary);">Almost there!</h2>
      <p class="subtitle mb-8" style="color: var(--text-secondary);">We've sent a verification link to your email.<br>Please confirm your email to activate your account,<br>then click below to sign in.</p>
      <div class="smiley-icon mb-8">
        <i data-lucide="smile" style="width: 64px; height: 64px; color: var(--text-primary);"></i>
      </div>
      <button id="confirm-signup-signin-btn" class="classic-btn dark-btn w-full max-w-xs mx-auto">Sign in</button>
    </div>
  </div>

</div>
`;

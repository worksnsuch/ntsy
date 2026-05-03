window.PROFILE_FRAGMENT = `
<!-- Profile View -->
<section id="profile-view" class="view">
  <div class="profile-container">
    <button class="back-btn profile-back-btn" style="margin-bottom: 16px;">
      <i data-lucide="chevron-left" size="18"></i> Back to Notes
    </button>

    <header style="margin-bottom: 40px;">
        <h1 style="font-size: 36px; font-weight: 800; letter-spacing: -1.5px; margin-bottom: 8px;">Profile</h1>
        <p style="color: var(--text-secondary); font-size: 15px;">Your account overview and usage analytics.</p>
    </header>

    <!-- Section 1: Usage Statistics (Now on Top) -->
    <div class="profile-stats-section" style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700;">Usage Statistics</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon"><i data-lucide="file-text" size="24"></i></div>
                <div class="stat-info">
                    <h3>Total Notes</h3>
                    <div class="stat-value" id="profile-total-notes">0</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon"><i data-lucide="clock" size="24"></i></div>
                <div class="stat-info">
                    <h3>Time Spent</h3>
                    <div class="stat-value" id="profile-total-time">0m</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon"><i data-lucide="zap" size="24"></i></div>
                <div class="stat-info">
                    <h3>Active Mode</h3>
                    <div class="stat-value" style="font-size: 14px; color: var(--accent-yellow); text-transform: uppercase; letter-spacing: 1px;">Productive</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Section 2: Account Information & Actions -->
    <div class="profile-card">
        <div class="profile-header-area">
            <div class="profile-avatar-wrapper" id="profile-avatar">
                M
            </div>
            <div class="profile-info-details">
                <h2 id="profile-display-name">Mark</h2>
                <p id="profile-display-email">mark@example.com</p>
            </div>
        </div>
        
        <div style="border-top: 1px solid var(--border-color); padding-top: 24px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button id="edit-profile-btn" class="modal-btn submit" style="flex: none; width: 180px; height: 38px; font-size: 14px; border-radius: 20px;">
                <i data-lucide="user-cog" size="14" style="margin-right: 8px;"></i> Edit Profile
            </button>
            <button id="delete-account-btn" class="modal-btn cancel" style="flex: none; width: 180px; height: 38px; font-size: 14px; border-radius: 20px; background: rgba(255, 71, 87, 0.1); color: var(--accent-red); border-color: rgba(255, 71, 87, 0.2);">
                <i data-lucide="user-minus" size="14" style="margin-right: 8px;"></i> Delete Account
            </button>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 20px; display: flex; justify-content: center;">
            <button id="sign-out-btn" class="modal-btn secondary" style="flex: none; width: 140px; height: 36px; font-size: 13px; border-radius: 18px; color: var(--text-secondary); background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color);">
                <i data-lucide="log-out" size="14" style="margin-right: 8px;"></i> Sign Out
            </button>
        </div>
    </div>

  </div>
</section>
`;

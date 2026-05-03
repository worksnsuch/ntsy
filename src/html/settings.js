window.SETTINGS_FRAGMENT = `
<!-- Settings View -->
<section id="settings-view" class="view">
  <div class="settings-container">
    <button class="back-btn settings-back-btn" style="margin-bottom: 16px;">
      <i data-lucide="chevron-left" size="18"></i> Back to Notes
    </button>
    
    <header style="margin-bottom: 40px;">
        <h1 style="font-size: 36px; font-weight: 800; letter-spacing: -1.5px; margin-bottom: 8px;">Settings</h1>
        <p style="color: var(--text-secondary); font-size: 15px;">Customize your workspace and manage your assets.</p>
    </header>

    <div class="settings-tabs">
        <button class="settings-tab active" data-tab="tab-general">General Content</button>
        <button class="settings-tab" data-tab="tab-appearance">Appearance</button>
        <button class="settings-tab" data-tab="tab-fonts">Custom Fonts</button>
    </div>

    <!-- General Tab -->
    <div id="tab-general" class="settings-section active">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700;">Visible Features</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin: 0 0 24px 0;">Toggle visibility and drag to reorder sidebar widgets.</p>
        
        <div class="feature-list" id="sidebar-order-list">
            <!-- All features (draggable and fixed) are now rendered here dynamically -->
        </div>

        <p id="min-features-warning" style="color: var(--accent-red); font-size: 12px; margin-top: 16px; display: none;">
            <i data-lucide="alert-circle" size="14" style="vertical-align: middle;"></i> Minimum of 3 sidebar features must be enabled.
        </p>

        <div style="margin-top: 48px; border-top: 1px solid var(--border-color); padding-top: 24px; display: flex; justify-content: center;">
            <button id="save-sidebar-settings-btn" class="modal-btn submit" style="width: 100%; max-width: 400px; height: 48px; font-size: 15px;">Save & Apply Changes</button>
        </div>
    </div>
 
    <!-- Appearance Tab -->
    <div id="tab-appearance" class="settings-section">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700;">Theme Selection</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin: 0 0 24px 0;">Choose between a Light or Dark workspace aesthetic.</p>
        
        <div class="theme-selector-grid">
            <div class="theme-card active" id="theme-dark-card">
                <div class="theme-preview-box">
                    <i data-lucide="moon" size="24" style="color: #FFFFFF;"></i>
                </div>
                <h4>Dark Mode</h4>
                <p>Classic NTSY</p>
            </div>
            
            <div class="theme-card" id="theme-light-card">
                <div class="theme-preview-box">
                    <i data-lucide="sun" size="24" style="color: #1C1C1E;"></i>
                </div>
                <h4>Light Mode</h4>
                <p>Premium Minimalist</p>
            </div>
        </div>
    </div>

    <!-- Fonts Tab -->
    <div id="tab-fonts" class="settings-section">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700;">Uploaded Custom Fonts</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin: 0 0 24px 0;">Manage and remove your custom uploaded typefaces.</p>
        <div id="fonts-list" class="font-management-list">
            <!-- Dynamically populated -->
        </div>
    </div>
  </div>
</section>
`;

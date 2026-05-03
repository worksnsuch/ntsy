window.HOMEPAGE_FRAGMENT = `
<!-- Homepage View -->
<section id="homepage-view" class="view active-view">
  <div class="homepage-sticky-header">
    <header class="main-header">
      <button id="mobile-sidebar-toggle" class="icon-btn mobile-sidebar-toggle">
        <i data-lucide="menu" size="20"></i>
      </button>
      <div class="header-left">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
          <h1 id="logo-home-btn" style="margin-bottom: 0; cursor: pointer;">Notes</h1>
          <div class="dropdown-container">
            <button class="icon-btn" id="view-toggle-btn" title="Change View">
              <i data-lucide="layout-grid" id="view-toggle-icon" size="20"></i>
            </button>
            <div class="dropdown-menu align-menu"
              style="display: none; padding: 4px; left: 0; transform: none; z-index: 100;">
              <button onclick="setViewMode(true)"><i data-lucide="layout-list" size="14"></i> List View</button>
              <button onclick="setViewMode(false)"><i data-lucide="layout-grid" size="14"></i> Tile View</button>
            </div>
          </div>
        </div>
        <p id="notes-count">12 notes</p>
      </div>
      <div class="header-right" style="display: flex; align-items: center; gap: 16px;">
        <button id="top-add-note-btn" class="btn btn-primary top-add-btn"><i data-lucide="plus"
            size="16"></i><span>New Note</span></button>
        <div class="search-container">
          <i data-lucide="search" size="18"></i>
          <input type="text" id="search-input" autocomplete="off" readonly onfocus="this.removeAttribute('readonly');" placeholder="Search notes...">
        </div>
      </div>
    </header>
  </div>


  <!-- Top Folders Section -->
  <div class="top-folders-wrapper">
    <div class="folders-label" style="padding-bottom: 8px;">Folders</div>
    <div class="top-folders-section" id="top-folders-section">
      <button class="folder-item icon-btn" id="new-folder-modal-btn" title="New Folder"
        style="padding: 8px 12px; justify-content: center; flex-shrink: 0;">
        <i data-lucide="plus" size="14"></i>
      </button>
      <ul class="top-folders-list" id="folders-list">
        <!-- Folders populated via JS -->
      </ul>
    </div>
  </div>

  <div class="notes-grid" id="notes-grid">
    <!-- Notes will be injected here via JS -->
  </div>
</section>
`;

window.MUSIC_PLAYER_FRAGMENT = `
<!-- Floating Media Player -->
<div id="floating-music-player" class="floating-music-player minimized">
  <div class="music-player-header" id="music-player-header">
    <div class="music-expanded-content" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <i data-lucide="headphones" size="14" style="color: var(--text-primary); opacity: 0.8;"></i>
        <span style="font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">Media Bar</span>
      </div>
      <button class="icon-btn" id="music-minimize-btn" title="Toggle Player"><i data-lucide="chevrons-down" size="16"></i></button>
    </div>
    <div class="music-minimized-media" style="display: none; align-items: center; justify-content: center; width: 100%; height: 100%;">
      <i data-lucide="headphones" size="20" style="color: #8E8E93;"></i>
    </div>
  </div>
  <div class="music-player-body" style="height: 460px;">
    <div class="music-search-container" style="display: flex; gap: 8px; width: 100%; align-items: center;">
      <input type="text" id="music-search-input" class="music-search-input" placeholder="Search songs..."
        autocomplete="off" readonly onfocus="this.removeAttribute('readonly');"
        style="flex: 1; min-width: 0; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 8px 14px; height: 36px;">
      <button id="music-search-btn" class="icon-btn"
        style="background: var(--accent-yellow); color: #000; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.2s;"
        title="Search"><i data-lucide="search" size="14"></i></button>
      <button id="music-view-queue-btn" class="icon-btn"
        style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: var(--text-primary); width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.2s;"
        title="View Queue"><i data-lucide="list-music" size="14"></i></button>
      <button id="music-now-playing-btn" class="icon-btn"
        style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: var(--accent-yellow); width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; display: none; flex-shrink: 0; transition: transform 0.2s;"
        title="Now Playing"><i data-lucide="disc" size="14"></i></button>
    </div>

    <div id="music-idle-state" style="text-align: center; padding: 24px 0; color: var(--text-secondary);">
      <i data-lucide="headphones" size="32" style="opacity: 0.2; margin-bottom: 12px;"></i>
      <p style="font-size: 12px;">Search for a song to start listening</p>
    </div>

    <div id="music-search-results" class="music-search-results" style="display: none;"></div>

    <div id="music-queue-view" style="display: none; flex-direction: column; flex: 1; height: 100%;">
      <div
        style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 0 4px;">
        <h4 style="margin: 0; font-size: 13px; font-weight: 600; color: var(--text-primary);">Up Next Queue</h4>
        <button id="music-queue-close-btn" class="icon-btn" style="font-size: 11px; padding: 4px 8px; width: auto;"><i
            data-lucide="x" size="12" style="margin-right: 4px;"></i>Close</button>
      </div>
      <div id="music-queue-list" class="music-search-results">
        <!-- Queue items dynamically injected -->
      </div>
    </div>

    <div id="music-player-view" style="display: none; flex-direction: column; flex: 1; height: 100%;">
      <div style="display: flex; justify-content: flex-start; align-items: center; margin-bottom: 12px;">
        <button id="music-back-btn" class="icon-btn"
          style="font-size: 12px; padding: 6px 12px; color: var(--text-secondary); width: auto; background: rgba(255,255,255,0.05); border-radius: 16px;"><i
            data-lucide="chevron-down" size="14" style="margin-right: 4px;"></i>Back to Search</button>
      </div>
      <div class="music-iframe-container"
        style="position: relative; height: 196px !important; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
        <div id="music-error-overlay"
          style="display: none; position: absolute; top:0; left:0; width:100%; height:100%; background: var(--bg-dark); color: var(--accent-red); align-items: center; justify-content: center; font-size: 12px; z-index: 10; text-align: center; padding: 16px;">
        </div>
        <!-- YT Player dynamically injected here -->
        <div id="yt-player-container"></div>
      </div>

      <div style="text-align: center; margin-top: 16px; padding: 0 8px;">
        <div id="music-now-playing-title"
          style="font-size: 16px; color: var(--text-primary); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.3px;">
        </div>
      </div>

      <!-- Scrubber / Progress Bar -->
      <div
        style="display: flex; align-items: center; gap: 12px; margin-top: 12px; margin-bottom: 8px; padding: 0 8px; font-size: 10px; font-weight: 500; color: rgba(235, 235, 245, 0.5); font-variant-numeric: tabular-nums;">
        <span id="music-time-current" style="width: 32px; text-align: right;">0:00</span>
        <input type="range" id="music-progress-bar" value="0" min="0" max="100"
          style="flex: 1; height: 6px; border-radius: 3px; appearance: none; background: rgba(255,255,255,0.1); outline: none; cursor: pointer; accent-color: #fff;">
        <span id="music-time-duration" style="width: 32px; text-align: left;">0:00</span>
      </div>
      <!-- Custom Media Controls -->
      <div
        style="display: flex; justify-content: center; align-items: center; gap: 24px; margin-top: 4px; padding: 4px 0 8px 0; transform: translateX(-16px);">
        <button id="music-ctrl-loop" class="icon-btn" style="color: var(--text-secondary);" title="Toggle Loop"><i
            data-lucide="repeat" size="18"></i></button>
        <button id="music-ctrl-prev" class="icon-btn" title="Restart / Previous" style="color: #fff;"><i
            data-lucide="skip-back" size="24" fill="currentColor"></i></button>
        <button id="music-ctrl-play" class="icon-btn"
          style="background: var(--accent-yellow); color: #000; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(224, 255, 60, 0.2); transition: transform 0.2s;"
          title="Play / Pause"><i data-lucide="play" size="24" fill="currentColor"
            id="music-ctrl-play-icon" style="padding-right: 4px;"></i></button>
        <button id="music-ctrl-next" class="icon-btn" title="Next in Queue" style="color: #fff;"><i
            data-lucide="skip-forward" size="24" fill="currentColor"></i></button>
      </div>
    </div>
  </div>
</div>
`;

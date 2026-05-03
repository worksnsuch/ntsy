window.MODALS_FRAGMENT = `
<!-- New Folder Modal -->
<div class="modal-overlay" id="new-folder-modal">
  <div class="modal-box">
    <h3>New Folder</h3>
    <input type="text" id="modal-folder-name" autocomplete="off" placeholder="Folder Name"
      style="width: 100%; padding: 10px; margin: 15px 0; background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-primary); border-radius: 6px; outline: none; box-sizing: border-box;">
    <div style="margin-bottom: 20px;">
      <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">Folder
        Color</label>
      <div id="modal-color-picker" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
    </div>
    <div class="modal-buttons">
      <button id="cancel-folder-btn" class="modal-btn secondary">Cancel</button>
      <button id="confirm-folder-btn" class="modal-btn submit">Create</button>
    </div>
  </div>
</div>

<!-- Image Crop Modal -->
<div class="modal-overlay" id="crop-modal">
  <div class="modal-box"
    style="width: 600px; max-width: 95vw; display: flex; flex-direction: column; align-items: center;">
    <h3 id="crop-modal-title">Crop Image</h3>
    <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">Drag corners to resize. Drag box
      to move.</p>
    <div id="crop-container"
      style="position: relative; width: 100%; max-height: 70vh; min-height: 300px; overflow: auto; background: #111; border: 1px solid var(--border-color); margin-bottom: 20px; display: flex; justify-content: center; align-items: center;">
      <div style="position: relative; display: inline-block; cursor: crosshair;">
        <img id="crop-source-image" src=""
          style="max-width: 100%; max-height: 70vh; width: auto; height: auto; display: block; user-select: none;">

        <!-- Crop Masking -->
        <div id="crop-mask-top" class="crop-mask"
          style="position: absolute; top: 0; left: 0; right: 0; background: rgba(0,0,0,0.6);"></div>
        <div id="crop-mask-bottom" class="crop-mask"
          style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6);"></div>
        <div id="crop-mask-left" class="crop-mask"
          style="position: absolute; top: 0; bottom: 0; left: 0; background: rgba(0,0,0,0.6);"></div>
        <div id="crop-mask-right" class="crop-mask"
          style="position: absolute; top: 0; bottom: 0; right: 0; background: rgba(0,0,0,0.6);"></div>

        <div id="crop-selection-box"
          style="position: absolute; border: 2px solid #fff; cursor: move; display: none;">
          <!-- 8 Handles -->
          <div class="crop-handle tl" data-handle="tl"></div>
          <div class="crop-handle tr" data-handle="tr"></div>
          <div class="crop-handle bl" data-handle="bl"></div>
          <div class="crop-handle br" data-handle="br"></div>
          <div class="crop-handle t" data-handle="t"></div>
          <div class="crop-handle b" data-handle="b"></div>
          <div class="crop-handle l" data-handle="l"></div>
          <div class="crop-handle r" data-handle="r"></div>
        </div>
      </div>
    </div>
    <div class="modal-buttons" style="width: 100%;">
      <button id="crop-modal-cancel" class="modal-btn secondary">Cancel</button>
      <button id="crop-modal-ok" class="modal-btn submit">Apply Crop</button>
    </div>
  </div>
</div>

<!-- About Modal -->
<div class="modal-overlay" id="about-modal">
  <div class="modal-box">
    <h3 style="margin-bottom: 16px; font-weight: 700;">About NTSY v3.7</h3>
    <p style="font-size: 14px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 24px;">
      NTSY is a premium productivity suite designed for high-performance workflows.
      It features advanced note-taking, precise alarm management, and a dedicated Pomodoro system—all wrapped in a
      sleek, neutral dark interface.
    </p>
    <div class="modal-buttons">
      <button id="close-about-btn" class="modal-btn submit" style="width: 100%;">Close</button>
    </div>
  </div>
</div>

<!-- Shortcuts Help Modal -->
<div class="modal-overlay" id="shortcuts-modal">
  <div class="modal-box" style="width: 640px; max-width: 95%;">
    <h3 style="margin-bottom: 24px; font-weight: 700;">Keyboard Shortcuts</h3>
    <div
      style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; text-align: left; max-height: 50vh; overflow-y: auto; padding-right: 8px;">
      <div>
        <h4
          style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; color: var(--accent-yellow); font-weight: 600;">
          Common</h4>
        <ul style="list-style: none; font-size: 13px; line-height: 2;">
          <li style="display: flex; justify-content: space-between;"><span
              style="color: var(--text-secondary);">Bold</span> <kbd>Ctrl+B</kbd></li>
          <li style="display: flex; justify-content: space-between;"><span
              style="color: var(--text-secondary);">Italic</span> <kbd>Ctrl+I</kbd></li>
          <li style="display: flex; justify-content: space-between;"><span
              style="color: var(--text-secondary);">Underline</span> <kbd>Ctrl+U</kbd></li>
          <li style="display: flex; justify-content: space-between;"><span
              style="color: var(--text-secondary);">Strikethrough</span> <kbd>Alt+Sh+5</kbd></li>
          <li style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Clear
              Format</span> <kbd>Ctrl+\\ </kbd></li>
          <li style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Word
              Count</span> <kbd>Ct+Sh+C</kbd></li>
          <li style="display: flex; justify-content: space-between;"><span
              style="color: var(--text-secondary);">Link</span> <kbd>Ctrl+K</kbd></li>
        </ul>
      </div>
      <div>
        <h4
          style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; color: var(--accent-yellow); font-weight: 600;">
          Text & Layout</h4>
        <ul style="list-style: none; font-size: 13px; line-height: 2;">
          <li style="display: flex; justify-content: space-between;"><span
              style="color: var(--text-secondary);">Headings</span> <kbd>Ct+Al+[1-6]</kbd></li>
          <li style="display: flex; justify-content: space-between;"><span
              style="color: var(--text-secondary);">Lists</span> <kbd>Ct+Sh+7/8</kbd></li>
          <li style="display: flex; justify-content: space-between;"><span
              style="color: var(--text-secondary);">Align</span> <kbd>Ct+Sh+L/E/R</kbd></li>
          <li style="display: flex; justify-content: space-between;"><span
              style="color: var(--text-secondary);">Indent</span> <kbd>Ctrl+[ or ]</kbd></li>
          <li style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Font
              Size</span> <kbd>Ct+Sh+./,</kbd></li>
          <li style="display: flex; justify-content: space-between;"><span
              style="color: var(--text-secondary);">Super/Sub</span> <kbd>Ctrl+./,</kbd></li>
        </ul>
      </div>
    </div>
    <div class="modal-buttons" style="margin-top: 32px;">
      <button id="close-shortcuts-btn" class="modal-btn submit" style="width: 100%;"
        onclick="document.getElementById('shortcuts-modal').classList.remove('visible')">Done</button>
    </div>
  </div>
</div>

<!-- New Alarm Modal -->
<div class="modal-overlay" id="alarm-modal">
  <div class="modal-box" style="width: 440px;">
    <h3 style="margin-bottom: 28px; font-weight: 700;">New Alarm</h3>

    <div class="alarm-time-picker">
      <div class="time-input-group">
        <button class="stepper-btn" id="hour-up"><i data-lucide="plus" size="14"></i></button>
        <input type="text" id="alarm-hour" inputmode="numeric" maxlength="2" placeholder="12"
          class="alarm-time-input">
        <button class="stepper-btn" id="hour-down"><i data-lucide="minus" size="14"></i></button>
      </div>
      <span class="time-separator">:</span>
      <div class="time-input-group">
        <button class="stepper-btn" id="minute-up"><i data-lucide="plus" size="14"></i></button>
        <input type="text" id="alarm-minute" inputmode="numeric" maxlength="2" placeholder="00"
          class="alarm-time-input">
        <button class="stepper-btn" id="minute-down"><i data-lucide="minus" size="14"></i></button>
      </div>
      <div class="ampm-toggle">
        <button class="ampm-btn active" id="ampm-am">AM</button>
        <button class="ampm-btn" id="ampm-pm">PM</button>
      </div>
    </div>

    <div style="margin-bottom: 28px;">
      <label
        style="display: block; font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Repeat
        Days</label>
      <div class="day-picker" style="display: flex; gap: 8px; justify-content: space-between;">
        <button class="day-btn" data-day="0">S</button>
        <button class="day-btn" data-day="1">M</button>
        <button class="day-btn" data-day="2">T</button>
        <button class="day-btn" data-day="3">W</button>
        <button class="day-btn" data-day="4">T</button>
        <button class="day-btn" data-day="5">F</button>
        <button class="day-btn" data-day="6">S</button>
      </div>
    </div>

    <div style="margin-bottom: 32px;">
      <label
        style="display: block; font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Label</label>
      <input type="text" id="alarm-label" placeholder="Alarm Name" class="alarm-label-input">
    </div>

    <div id="alarm-preview" class="alarm-preview-box">
      No time selected
    </div>

    <div class="modal-buttons" style="gap: 12px;">
      <button class="modal-btn secondary" id="cancel-alarm-btn" style="flex: 1;">Cancel</button>
      <button class="modal-btn submit" id="save-alarm-btn" style="flex: 2;">Save Alarm</button>
    </div>
  </div>
</div>

<!-- Manage Alarms Modal -->
<div class="modal-overlay" id="manage-alarms-modal">
  <div class="modal-box" style="width: 440px;">
    <h3 style="margin-bottom: 24px; font-weight: 700;">Alarms</h3>
    <div id="alarms-list" style="margin-bottom: 32px; max-height: 300px; overflow-y: auto; padding-right: 8px;">
      <!-- Alarm items injected here -->
    </div>
    <div class="modal-buttons">
      <button id="close-manage-btn" class="modal-btn submit" style="width: 100%;">Done</button>
    </div>
  </div>
</div>

<!-- Pomodoro Settings Modal -->
<div class="modal-overlay" id="pomodoro-settings-modal">
  <div class="modal-box" style="width: 440px;">
    <h3 style="margin-bottom: 28px; font-weight: 700;">Pomodoro Settings</h3>

    <div class="pomodoro-settings-grid"
      style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px;">
      <div class="setting-item">
        <label class="setting-label">Focus</label>
        <div class="stepper-input">
          <button class="step-btn" id="step-focus-down"><i data-lucide="minus" size="14"></i></button>
          <input type="text" id="setting-focus" value="25" readonly>
          <button class="step-btn" id="step-focus-up"><i data-lucide="plus" size="14"></i></button>
        </div>
      </div>
      <div class="setting-item">
        <label class="setting-label">Short Break</label>
        <div class="stepper-input">
          <button class="step-btn" id="step-short-down"><i data-lucide="minus" size="14"></i></button>
          <input type="text" id="setting-short" value="5" readonly>
          <button class="step-btn" id="step-short-up"><i data-lucide="plus" size="14"></i></button>
        </div>
      </div>
      <div class="setting-item">
        <label class="setting-label">Long Break</label>
        <div class="stepper-input">
          <button class="step-btn" id="step-long-down"><i data-lucide="minus" size="14"></i></button>
          <input type="text" id="setting-long" value="15" readonly>
          <button class="step-btn" id="step-long-up"><i data-lucide="plus" size="14"></i></button>
        </div>
      </div>
      <div class="setting-item">
        <label class="setting-label">Sessions</label>
        <div class="stepper-input">
          <button class="step-btn" id="step-sessions-down"><i data-lucide="minus" size="14"></i></button>
          <input type="text" id="setting-sessions" value="4" readonly>
          <button class="step-btn" id="step-sessions-up"><i data-lucide="plus" size="14"></i></button>
        </div>
      </div>
    </div>

    <div class="modal-buttons" style="gap: 12px;">
      <button class="modal-btn secondary" id="cancel-pomodoro-settings" style="flex: 1;">Cancel</button>
      <button class="modal-btn submit" id="save-pomodoro-settings" style="flex: 2;">Apply Settings</button>
    </div>
  </div>
</div>

<!-- Pomodoro Finished Modal -->
<div class="modal-overlay ringing-modal" id="pomodoro-finished-modal">
  <div class="modal-box" style="width: 360px;">
    <div class="ringing-label" id="pomodoro-done-title">Session Complete</div>
    <div class="ringing-time" style="font-size: 24px; margin: 20px 0;" id="pomodoro-done-message">Time for a break!
    </div>

    <div class="modal-buttons" style="flex-direction: column; gap: 12px;">
      <button class="modal-btn submit" id="pomodoro-done-next-btn"
        style="width: 100%; height: 50px; font-size: 16px;">Start Next Session</button>
      <button class="modal-btn secondary"
        onclick="document.getElementById('pomodoro-finished-modal').classList.remove('visible'); stopPomodoroAlarm();"
        style="width: 100%;">Close</button>
    </div>
  </div>
</div>

<!-- Regular Alarm Ringing Modal -->
<div class="modal-overlay ringing-modal" id="alarm-ringing-modal">
  <div class="modal-box" style="width: 360px;">
    <div class="ringing-label" id="ringing-alarm-label">ALARM</div>
    <div class="ringing-time" id="ringing-alarm-time">00:00 AM</div>

    <div class="modal-buttons" style="flex-direction: column; gap: 12px;">
      <button class="modal-btn submit" onclick="dismissAlarm()"
        style="width: 100%; height: 50px; font-size: 16px;">Stop</button>
      <button class="modal-btn secondary" onclick="snoozeAlarm()" style="width: 100%;">Snooze (5m)</button>
    </div>
  </div>
</div>

<!-- Calendar Picker Modal -->
<div class="modal-overlay" id="calendar-picker-modal">
  <div class="modal-box" style="width: 340px;">
    <h3 style="margin-bottom: 20px; font-weight: 700;">Jump to Date</h3>

    <div style="display: flex; gap: 12px; margin-bottom: 24px;">
      <div style="flex: 2;">
        <label
          style="display: block; font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;">Month</label>
        <div class="custom-select-container" id="picker-month-container">
          <div class="custom-select-display" id="picker-month-display">
            <span id="picker-month-text">January</span>
            <i data-lucide="chevron-down" size="14"></i>
          </div>
          <div class="custom-select-dropdown" id="picker-month-dropdown"></div>
        </div>
      </div>
      <div style="flex: 1;">
        <label
          style="display: block; font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;">Year</label>
        <div class="custom-select-container" id="picker-year-container">
          <div class="custom-select-display" id="picker-year-display">
            <span id="picker-year-text">2026</span>
            <i data-lucide="chevron-down" size="14"></i>
          </div>
          <div class="custom-select-dropdown" id="picker-year-dropdown"></div>
        </div>
      </div>
    </div>

    <div class="modal-buttons">
      <button id="cancel-picker-btn" class="modal-btn secondary">Cancel</button>
      <button id="go-picker-btn" class="modal-btn submit">Go</button>
    </div>
  </div>
</div>

<!-- PDF Import Mode Modal -->
<div class="modal-overlay" id="pdf-mode-modal">
  <div class="modal-box" style="width: 400px; text-align: center;">
    <div
      style="background: var(--accent-yellow); width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto;">
      <i data-lucide="file-text" size="24" style="color: var(--bg-dark);"></i>
    </div>
    <h3 style="margin-bottom: 8px;">Import PDF</h3>
    <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 24px;" id="pdf-filename-label">
      filename.pdf</p>

    <div style="display: grid; gap: 12px; margin-bottom: 24px;">
      <button id="mode-attach-btn" class="modal-btn secondary"
        style="display: flex; flex-direction: column; align-items: center; padding: 20px; height: auto; gap: 8px; border-color: var(--border-color);">
        <i data-lucide="paperclip" size="20"></i>
        <strong>Attach PDF</strong>
        <span style="font-size: 11px; opacity: 0.7;">Keep original file as attachment</span>
      </button>
      <button id="mode-convert-btn" class="modal-btn secondary"
        style="display: flex; flex-direction: column; align-items: center; padding: 20px; height: auto; gap: 8px; border-color: var(--border-color);">
        <i data-lucide="type" size="20"></i>
        <strong>Convert to Text</strong>
        <span style="font-size: 11px; opacity: 0.7;">Extract text content into the note</span>
      </button>
    </div>

    <div class="modal-buttons">
      <button id="cancel-pdf-btn" class="modal-btn"
        style="width: 100%; border: none; background: transparent; color: var(--text-secondary);">Cancel</button>
    </div>
  </div>
</div>

<!-- Loading Overlay -->
<div class="modal-overlay" id="loading-overlay" style="background: rgba(0,0,0,0.8); backdrop-filter: blur(4px);">
  <div style="text-align: center; color: white;">
    <div class="loading-spinner"
      style="width: 40px; height: 40px; border: 3px solid rgba(255,214,10,0.1); border-top-color: var(--accent-yellow); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px auto;">
    </div>
    <p id="loading-text" style="font-weight: 500; letter-spacing: 0.5px;">Processing PDF...</p>
  </div>
</div>

<!-- Add/Edit Event Modal -->
<div class="modal-overlay" id="add-event-modal">
  <div class="modal-box" style="width: 440px;">
    <h3 id="event-modal-title" style="margin-bottom: 20px; font-weight: 700;">Add Event</h3>
    <input type="hidden" id="event-id">
    <input type="hidden" id="event-date-input">

    <label
      style="display: block; font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;">Title
      *</label>
    <input type="text" id="event-title" autocomplete="off" placeholder="Event Title" required
      style="width: 100%; padding: 10px; margin-bottom: 15px; background: var(--bg-card, #1c1c1e); border: 1px solid var(--border-light, rgba(255,255,255,0.1)); color: var(--text-primary); border-radius: 6px; outline: none; box-sizing: border-box;">

    <label
      style="display: block; font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;">Time</label>
    <input type="time" id="event-time"
      style="width: 100%; padding: 10px; margin-bottom: 15px; background: var(--bg-card, #1c1c1e); border: 1px solid var(--border-light, rgba(255,255,255,0.1)); color: var(--text-primary); border-radius: 6px; outline: none; box-sizing: border-box; color-scheme: dark;">

    <label
      style="display: block; font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;">Description</label>
    <textarea id="event-desc" placeholder="Details (optional)"
      style="width: 100%; padding: 10px; margin-bottom: 15px; background: var(--bg-card, #1c1c1e); border: 1px solid var(--border-light, rgba(255,255,255,0.1)); color: var(--text-primary); border-radius: 6px; outline: none; resize: vertical; min-height: 60px; box-sizing: border-box;"></textarea>

    <p id="event-error" style="color: var(--accent-red); font-size: 12px; margin-bottom: 10px; display: none;">Title
      is required.</p>

    <div class="modal-buttons">
      <button id="cancel-event-btn" class="modal-btn secondary">Cancel</button>
      <button id="save-event-btn" class="modal-btn submit">Save</button>
    </div>
  </div>
</div>

<!-- Add/Edit Task Modal -->
<div class="modal-overlay" id="add-task-modal">
  <div class="modal-box" style="width: 440px;">
    <h3 id="task-modal-title" style="margin-bottom: 20px; font-weight: 700;">Add Task</h3>
    <input type="hidden" id="task-id">

    <label
      style="display: block; font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;">Task
      Title *</label>
    <input type="text" id="task-title" autocomplete="off" placeholder="Title" required
      style="width: 100%; padding: 10px; margin-bottom: 15px; background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-primary); border-radius: 6px; outline: none; box-sizing: border-box;">

    <label
      style="display: block; font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;">Description</label>
    <textarea id="task-desc" placeholder="Description (optional)"
      style="width: 100%; padding: 10px; margin-bottom: 15px; background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-primary); border-radius: 6px; outline: none; resize: vertical; min-height: 60px; box-sizing: border-box;"></textarea>

    <label
      style="display: block; font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;">Priority</label>
    <select id="task-priority"
      style="width: 100%; padding: 10px; margin-bottom: 15px; background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-primary); border-radius: 6px; outline: none; box-sizing: border-box;">
      <option value="1">High</option>
      <option value="2">Medium</option>
      <option value="3" selected>Low</option>
    </select>

    <label
      style="display: block; font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;">Due
      Date</label>
    <input type="date" id="task-due-date"
      style="width: 100%; padding: 10px; margin-bottom: 20px; background: var(--bg-card); border: 1px solid var(--border-light); color: var(--text-primary); border-radius: 6px; outline: none; box-sizing: border-box; color-scheme: dark;">

    <p id="task-error" style="color: var(--accent-red); font-size: 12px; margin-bottom: 10px; display: none;">Title is
      required.</p>

    <div class="modal-buttons">
      <button id="cancel-task-btn" class="modal-btn secondary">Cancel</button>
      <button id="save-task-btn" class="modal-btn submit">Save</button>
    </div>
  </div>
</div>

<!-- View All Tasks Modal -->
<div class="modal-overlay" id="view-tasks-modal">
  <div class="modal-box" style="width: 500px; max-width: 95vw;">
    <div class="widget-header"
      style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 6px; min-height: 18px;">
      <h3 style="margin: 0; font-weight: 700;">All Tasks</h3>
      <button class="icon-btn" id="add-task-from-modal-btn" title="Add Task"><i data-lucide="plus"
          size="16"></i></button>
    </div>
    <div id="all-tasks-list"
      style="max-height: 60vh; overflow-y: auto; padding-right: 8px; display: flex; flex-direction: column; gap: 4px;">
      <!-- Tasks rendered here -->
    </div>

    <div class="modal-buttons" style="margin-top: 24px;">
      <button id="close-tasks-modal-btn" class="modal-btn submit" style="width: 100%;">Done</button>
    </div>
  </div>
</div>

<!-- Global Confirm Modal -->
<div class="modal-overlay" id="confirm-modal" style="z-index: 4000;">
  <div class="modal-box" style="width: 320px; text-align: center; padding: 32px 24px;">
    <div id="confirm-icon-container" style="margin-bottom: 18px; color: var(--accent-red);">
      <i data-lucide="alert-circle" size="48"></i>
    </div>
    <h3 id="confirm-title" style="margin-bottom: 8px; font-weight: 700;">Delete Task?</h3>
    <p id="confirm-message"
      style="font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 24px;">This action cannot
      be undone.</p>
    <div class="modal-buttons" style="display: flex; gap: 10px;">
      <button id="confirm-cancel-btn" class="modal-btn secondary" style="flex: 1;">Cancel</button>
      <button id="confirm-ok-btn" class="modal-btn primary"
        style="flex: 1; background: var(--accent-red); color: #fff;">Delete</button>
    </div>
  </div>
</div>

<!-- Global Passcode Modal -->
<div class="modal-overlay" id="passcode-modal" style="z-index: 4000;">
  <div class="modal-box" style="width: 320px; text-align: center; padding: 32px 24px;">
    <h3 id="passcode-modal-title" style="margin-bottom: 8px; font-weight: 700;">Enter PIN</h3>
    <p id="passcode-modal-message" style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">Please
      enter your 4-digit PIN.</p>
    <input type="password" id="passcode-input" class="passcode-input" maxlength="4" placeholder="••••"
      autocomplete="off"
      style="width: 100%; text-align: center; font-size: 24px; letter-spacing: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 8px; color: var(--text-primary); outline: none;">
    <p id="passcode-error" style="color: var(--accent-red); font-size: 12px; margin-bottom: 20px; min-height: 18px;">
    </p>
    <div class="modal-buttons" style="display: flex; gap: 10px;">
      <button id="passcode-cancel-btn" class="modal-btn secondary" style="flex: 1;">Cancel</button>
      <button id="passcode-ok-btn" class="modal-btn primary"
        style="flex: 1; background: var(--text-primary); color: var(--bg-dark);">Submit</button>
    </div>
  </div>
</div>

<!-- Edit Profile Modal -->
<div class="modal-overlay" id="edit-profile-modal">
  <div class="modal-box" style="width: 400px;">
    <h3 style="margin-bottom: 20px; font-weight: 700;">Edit Profile</h3>
    
    <div style="margin-bottom: 20px;">
        <label style="display: block; font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">Full Name</label>
        <input type="text" id="edit-profile-name" autocomplete="off" placeholder="Your Name" 
            style="width: 100%; padding: 12px; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 8px; outline: none; box-sizing: border-box;">
    </div>

    <div style="margin-bottom: 28px;">
        <label style="display: block; font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">Email Address</label>
        <input type="email" id="edit-profile-email" autocomplete="off" placeholder="email@example.com" 
            style="width: 100%; padding: 12px; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 8px; outline: none; box-sizing: border-box;">
    </div>

    <div class="modal-buttons" style="gap: 12px;">
      <button id="cancel-edit-profile-btn" class="modal-btn secondary" style="flex: 1;">Cancel</button>
      <button id="save-edit-profile-btn" class="modal-btn submit" style="flex: 2;">Save Changes</button>
    </div>
  </div>
</div>
`;

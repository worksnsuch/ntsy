window.SIDEBAR_FRAGMENT = `
<!-- Sidebar -->
<aside class="sidebar">


  <div class="sidebar-main-content">
    <!-- Clock Widget -->
    <div class="widget clock-widget">
      <div id="clock-day" class="clock-day">Friday</div>
      <h2 id="real-time-clock">10:01 PM</h2>
      <div id="clock-date" class="clock-date">March 20, 2026</div>
    </div>

    <!-- Calendar Widget -->
    <div class="widget calendar-widget">
      <div class="widget-header" style="padding-bottom: 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <button class="icon-btn" id="calendar-prev-btn" style="padding: 4px;"><i data-lucide="chevron-left"
              size="16"></i></button>
          <h4 class="widget-subtitle" id="calendar-month-year"
            style="margin-bottom: 0; font-size: 13px; cursor: pointer; transition: opacity 0.2s;"
            onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">Month Year</h4>
          <button class="icon-btn" id="calendar-next-btn" style="padding: 4px;"><i data-lucide="chevron-right"
              size="16"></i></button>
        </div>
      </div>
      <div class="calendar-grid">
        <div class="day-label">S</div>
        <div class="day-label">M</div>
        <div class="day-label">T</div>
        <div class="day-label">W</div>
        <div class="day-label">T</div>
        <div class="day-label">F</div>
        <div class="day-label">S</div>
        <div id="calendar-days" class="calendar-days">
          <!-- Rendered via JS -->
        </div>
      </div>
      <div class="calendar-events-section" id="calendar-events-section"
        style="display: flex; flex-direction: column; gap: 8px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span id="selected-date-label"
            style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Events</span>
          <button class="icon-btn" id="add-event-btn" title="Add Event" style="padding: 2px;"><i data-lucide="plus"
              size="14"></i></button>
        </div>
        <div id="calendar-events-list"
          style="display: flex; flex-direction: column; gap: 6px; max-height: 140px; overflow-y: auto; padding-right: 4px;">
          <!-- Events rendered here -->
        </div>
      </div>
    </div>

    <!-- Upcoming Alarm Widget -->
    <div class="widget alarm-widget">
      <div class="widget-header">
        <h4 class="widget-subtitle">Upcoming Alarm</h4>
        <div style="display: flex; gap: 4px;">
          <button class="icon-btn" id="manage-alarms-btn" title="Manage Alarms">
            <i data-lucide="list" size="12"></i>
          </button>
          <button class="icon-btn" id="add-alarm-btn" title="Add Alarm">
            <i data-lucide="plus" size="12"></i>
          </button>
        </div>
      </div>
      <div id="active-alarm-container" style="text-align: center; width: 100%;">
        <h3 id="upcoming-alarm-time" style="font-size: 16px;">No alarm set</h3>
        <div class="alarm-controls">
          <button class="btn btn-secondary" id="alarm-skip-btn">Skip</button>
          <button class="btn btn-danger" id="alarm-end-btn">End</button>
        </div>
      </div>
    </div>

    <!-- Priority Tracker Widget -->
    <div class="widget priority-widget">
      <div class="widget-header">
        <h4 class="widget-subtitle">Priority Tracker</h4>
        <button class="icon-btn" id="add-task-dashboard-btn" title="Add Task">
          <i data-lucide="plus" size="12"></i>
        </button>
      </div>
      <ul class="priority-list" id="priority-list">
        <!-- Render via JS -->
      </ul>
      <div class="widget-footer">
        <a href="#" class="view-all" id="view-all-tasks-btn">View All</a>
      </div>
    </div>

    <!-- Pomodoro Timer Widget -->
    <div class="widget pomodoro-timer" id="pomodoro-widget" data-session="focus">
      <div class="widget-header">
        <div class="session-info">
          <h4 class="widget-subtitle">
            <span id="pomodoro-session-label">Focus</span>
            <span id="pomodoro-session-count" class="session-count-badge">1/4</span>
          </h4>
        </div>
        <div class="session-actions">
          <button class="icon-btn" id="pomodoro-cycle-btn" title="Next Session Mode">
            <i data-lucide="chevron-right" size="14"></i>
          </button>
          <button class="icon-btn" id="pomodoro-settings-btn" title="Timer Settings">
            <i data-lucide="settings" size="14"></i>
          </button>
        </div>
      </div>
      <div class="timer-display-container">
        <h2 id="pomodoro-time">25:00</h2>
        <div class="pomodoro-progress-container">
          <div id="pomodoro-progress-bar" class="pomodoro-progress-bar"></div>
        </div>
        <div id="pomodoro-session-tracker" class="pomodoro-session-tracker"></div>
      </div>
      <div class="pomodoro-controls alarm-controls">
        <button id="pomodoro-pause" class="btn btn-secondary">Start</button>
        <button id="pomodoro-end" class="btn btn-danger">Reset</button>
      </div>
      <audio id="pomodoro-alarm" src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
        preload="auto" loop></audio>
    </div>
  </div>

  <!-- Sidebar Footer -->
  <div class="sidebar-footer">
    <button class="icon-text-btn" id="profile-btn"><i data-lucide="user" size="16"></i> Profile</button>
    <button class="icon-text-btn" id="settings-btn"><i data-lucide="settings" size="16"></i> Settings</button>
    <button class="icon-text-btn" id="about-btn"><i data-lucide="info" size="16"></i> About</button>
  </div>

</aside>
`;

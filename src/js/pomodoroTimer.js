/**
 * Pomodoro Clock / Alarm Feature
 */

const POMODORO_STORAGE_KEY = 'ntsy_pomodoro_state';

// Default durations in minutes
let DURATIONS = JSON.parse(localStorage.getItem('ntsy_pomodoro_durations')) || {
  focus: 25,
  shortBreak: 5,
  longBreak: 15
};

let SESSIONS_UNTIL_LONG_BREAK = parseInt(localStorage.getItem('ntsy_pomodoro_sessions')) || 4;

let state = {
  remainingTime: DURATIONS.focus * 60,
  currentSession: 'focus',
  completedSessions: 0,
  status: 'idle',
  lastTickTimestamp: null
};

// DOM Elements (populated in init)
let pomodoroWidget, timeDisplay, sessionLabel, progressBar, sessionTracker, startPauseBtn, resetBtn, alarmAudio;
let settingsModal, settingsBtn, cycleBtn, saveSettingsBtn, cancelSettingsBtn;
let focusInput, shortInput, longInput, sessionsInput;
let focusUp, focusDown, shortUp, shortDown, longUp, longDown, sessionsUp, sessionsDown;

let timerInterval = null;

function renderSessionTracker() {
  if (!sessionTracker) return;
  sessionTracker.innerHTML = '';
  for (let i = 0; i < SESSIONS_UNTIL_LONG_BREAK; i++) {
    const segment = document.createElement('div');
    segment.className = 'session-segment';
    sessionTracker.appendChild(segment);
  }
  updateUI();
}

function updateUI() {
  if (!timeDisplay || !sessionLabel || !startPauseBtn || !pomodoroWidget) return;
  
  const mins = Math.floor(state.remainingTime / 60);
  const secs = state.remainingTime % 60;
  if (document.activeElement !== timeDisplay) {
    timeDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const labels = { focus: 'Focus', shortBreak: 'Short Break', longBreak: 'Long Break' };
  sessionLabel.textContent = labels[state.currentSession];

  const countEl = document.getElementById('pomodoro-session-count');
  if (countEl) {
    if (state.currentSession === 'focus') {
      const current = (state.completedSessions % SESSIONS_UNTIL_LONG_BREAK) + 1;
      countEl.textContent = `${current}/${SESSIONS_UNTIL_LONG_BREAK}`;
      countEl.style.display = 'inline-block';
    } else {
      countEl.style.display = 'none';
    }
  }

  const mode = state.currentSession === 'focus' ? 'focus' : 'break';
  pomodoroWidget.setAttribute('data-session', mode);

  if (state.status === 'running') {
    startPauseBtn.textContent = 'Pause';
  } else {
    startPauseBtn.textContent = state.status === 'paused' ? 'Resume' : 'Start';
  }
  
  if (!startPauseBtn.classList.contains('btn-secondary')) {
    startPauseBtn.classList.add('btn-secondary');
    startPauseBtn.classList.remove('btn-primary');
  }

  if (progressBar) {
    const total = DURATIONS[state.currentSession] * 60;
    const progress = Math.min(100, Math.max(0, ((total - state.remainingTime) / total) * 100));
    progressBar.style.width = `${progress}%`;
  }

  if (sessionTracker) {
    const segments = sessionTracker.querySelectorAll('.session-segment');
    const currentIdx = state.completedSessions % SESSIONS_UNTIL_LONG_BREAK;
    segments.forEach((seg, idx) => {
      seg.classList.remove('filled', 'active');
      if (idx < currentIdx) seg.classList.add('filled');
      else if (idx === currentIdx && state.currentSession === 'focus') seg.classList.add('active');
    });
  }
}

function saveState() {
  state.lastTickTimestamp = Date.now();
  localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(state));
  if (typeof window.syncSettingsToDB === 'function') window.syncSettingsToDB();
}

function tick() {
  if (state.status !== 'running') return;
  const now = Date.now();
  const elapsed = Math.floor((now - state.lastTickTimestamp) / 1000);
  if (elapsed >= 1) {
    state.remainingTime -= elapsed;
    state.lastTickTimestamp = now;
    if (state.remainingTime <= 0) {
      state.remainingTime = 0;
      handleSessionEnd();
    }
    updateUI();
    saveState();
  }
}

function handleSessionEnd() {
  stopTimer();
  playAlarm();
  let isSetComplete = false;
  if (state.currentSession === 'focus') {
    state.completedSessions++;
    if (state.completedSessions % SESSIONS_UNTIL_LONG_BREAK === 0) {
      state.currentSession = 'longBreak';
      state.remainingTime = DURATIONS.longBreak * 60;
      isSetComplete = true;
    } else {
      state.currentSession = 'shortBreak';
      state.remainingTime = DURATIONS.shortBreak * 60;
    }
  } else {
    state.currentSession = 'focus';
    state.remainingTime = DURATIONS.focus * 60;
  }
  showCompletionModal(isSetComplete);
  state.status = 'idle';
  updateUI();
  saveState();
}

function showCompletionModal(isSetComplete = false) {
  const modal = document.getElementById('pomodoro-finished-modal');
  const title = document.getElementById('pomodoro-done-title');
  const msg = document.getElementById('pomodoro-done-message');
  const nextBtn = document.getElementById('pomodoro-done-next-btn');
  if (!modal) return;
  const labels = { focus: 'Focus Session Complete', shortBreak: 'Short Break Over', longBreak: 'Long Break Over' };
  const nextLabels = { focus: 'Start Break', shortBreak: 'Back to Focus', longBreak: 'Back to Focus' };
  title.textContent = isSetComplete ? 'SET COMPLETE!' : labels[state.currentSession];
  msg.textContent = isSetComplete ? `You've finished ${SESSIONS_UNTIL_LONG_BREAK} sessions. Enjoy your long break!` : (state.currentSession === 'focus' ? 'Time for a well-deserved break.' : 'Ready to get back to work?');
  nextBtn.textContent = isSetComplete ? 'Start Long Break' : nextLabels[state.currentSession];
  modal.classList.add('visible');
  if (window.lucide) window.lucide.createIcons();
  const handleNext = () => {
    modal.classList.remove('visible');
    stopPomodoroAlarm();
    startTimer();
    nextBtn.removeEventListener('click', handleNext);
  };
  nextBtn.addEventListener('click', handleNext);
}

function startTimer(isAutoStart = false) {
  state.status = 'running';
  state.lastTickTimestamp = Date.now();
  if (!timerInterval) timerInterval = setInterval(tick, 1000);
  if (!isAutoStart) stopPomodoroAlarm();
  updateUI();
  saveState();
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function pauseTimer() {
  stopTimer();
  state.status = 'paused';
  updateUI();
  saveState();
}

function resetTimer() {
  stopTimer();
  stopPomodoroAlarm();
  state = { remainingTime: DURATIONS.focus * 60, currentSession: 'focus', completedSessions: 0, status: 'idle', lastTickTimestamp: null };
  updateUI();
  saveState();
}

function playAlarm() {
  if (alarmAudio) {
    alarmAudio.currentTime = 0;
    alarmAudio.play().catch(e => console.log("Audio play blocked", e));
  }
  window.dispatchEvent(new CustomEvent('ntsy-pause-media'));
}

function stopPomodoroAlarm() {
  if (alarmAudio) { alarmAudio.pause(); alarmAudio.currentTime = 0; }
  window.dispatchEvent(new CustomEvent('ntsy-resume-media'));
}
window.stopPomodoroAlarm = stopPomodoroAlarm;

function cycleSessionMode() {
  if (state.status === 'running') pauseTimer();
  if (state.currentSession === 'focus') {
    state.currentSession = 'shortBreak';
    state.remainingTime = DURATIONS.shortBreak * 60;
  } else if (state.currentSession === 'shortBreak') {
    state.currentSession = 'longBreak';
    state.remainingTime = DURATIONS.longBreak * 60;
  } else {
    state.currentSession = 'focus';
    state.remainingTime = DURATIONS.focus * 60;
  }
  updateUI();
  saveState();
}

window.initPomodoro = function() {
  // Populate elements
  pomodoroWidget = document.getElementById('pomodoro-widget');
  timeDisplay = document.getElementById('pomodoro-time');
  sessionLabel = document.getElementById('pomodoro-session-label');
  progressBar = document.getElementById('pomodoro-progress-bar');
  sessionTracker = document.getElementById('pomodoro-session-tracker');
  startPauseBtn = document.getElementById('pomodoro-pause');
  resetBtn = document.getElementById('pomodoro-end');
  alarmAudio = document.getElementById('pomodoro-alarm');
  settingsModal = document.getElementById('pomodoro-settings-modal');
  settingsBtn = document.getElementById('pomodoro-settings-btn');
  cycleBtn = document.getElementById('pomodoro-cycle-btn');
  saveSettingsBtn = document.getElementById('save-pomodoro-settings');
  cancelSettingsBtn = document.getElementById('cancel-pomodoro-settings');
  focusInput = document.getElementById('setting-focus');
  shortInput = document.getElementById('setting-short');
  longInput = document.getElementById('setting-long');
  sessionsInput = document.getElementById('setting-sessions');
  focusUp = document.getElementById('step-focus-up');
  focusDown = document.getElementById('step-focus-down');
  shortUp = document.getElementById('step-short-up');
  shortDown = document.getElementById('step-short-down');
  longUp = document.getElementById('step-long-up');
  longDown = document.getElementById('step-long-down');
  sessionsUp = document.getElementById('step-sessions-up');
  sessionsDown = document.getElementById('step-sessions-down');

  // Load state
  const savedState = localStorage.getItem(POMODORO_STORAGE_KEY);
  if (savedState) {
    state = JSON.parse(savedState);
    if (state.status === 'running' && state.lastTickTimestamp) {
      const elapsed = Math.floor((Date.now() - state.lastTickTimestamp) / 1000);
      state.remainingTime = Math.max(0, state.remainingTime - elapsed);
      if (state.remainingTime === 0) handleSessionEnd();
    }
  }

  // Initial UI
  renderSessionTracker();
  if (state.status === 'running' && state.remainingTime > 0) startTimer(true);

  // Attach listeners
  if (startPauseBtn) startPauseBtn.addEventListener('click', () => {
    if (state.status === 'running') pauseTimer();
    else startTimer();
  });
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);
  
  const handleStep = (input, operation, min, max) => {
    let val = parseInt(input.value) || min;
    if (operation === 'up') val++; else val--;
    if (val < min) val = min; if (val > max) val = max;
    input.value = val;
  };
  
  if (focusUp) focusUp.addEventListener('click', () => handleStep(focusInput, 'up', 1, 60));
  if (focusDown) focusDown.addEventListener('click', () => handleStep(focusInput, 'down', 1, 60));
  if (shortUp) shortUp.addEventListener('click', () => handleStep(shortInput, 'up', 1, 30));
  if (shortDown) shortDown.addEventListener('click', () => handleStep(shortInput, 'down', 1, 30));
  if (longUp) longUp.addEventListener('click', () => handleStep(longInput, 'up', 5, 60));
  if (longDown) longDown.addEventListener('click', () => handleStep(longInput, 'down', 5, 60));
  if (sessionsUp) sessionsUp.addEventListener('click', () => handleStep(sessionsInput, 'up', 1, 10));
  if (sessionsDown) sessionsDown.addEventListener('click', () => handleStep(sessionsInput, 'down', 1, 10));

  if (settingsBtn) settingsBtn.addEventListener('click', () => {
    if (state.status === 'running') pauseTimer();
    focusInput.value = DURATIONS.focus;
    shortInput.value = DURATIONS.shortBreak;
    longInput.value = DURATIONS.longBreak;
    sessionsInput.value = SESSIONS_UNTIL_LONG_BREAK;
    settingsModal.classList.add('visible');
  });
  if (cancelSettingsBtn) cancelSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('visible'));
  if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => {
    const f = parseInt(focusInput.value);
    const s = parseInt(shortInput.value);
    const l = parseInt(longInput.value);
    const sessions = parseInt(sessionsInput.value);
    if (isNaN(f) || isNaN(s) || isNaN(l) || isNaN(sessions)) return;
    DURATIONS = { focus: f, shortBreak: s, longBreak: l };
    SESSIONS_UNTIL_LONG_BREAK = sessions;
    localStorage.setItem('ntsy_pomodoro_durations', JSON.stringify(DURATIONS));
    localStorage.setItem('ntsy_pomodoro_sessions', SESSIONS_UNTIL_LONG_BREAK.toString());
    if (typeof window.syncSettingsToDB === 'function') window.syncSettingsToDB();
    if (state.status !== 'running') state.remainingTime = DURATIONS[state.currentSession] * 60;
    settingsModal.classList.remove('visible');
    renderSessionTracker();
    updateUI();
    saveState();
  });

  if (sessionLabel) {
    sessionLabel.style.cursor = 'pointer';
    sessionLabel.title = 'Click to switch session mode';
    sessionLabel.addEventListener('click', cycleSessionMode);
  }
  if (cycleBtn) cycleBtn.addEventListener('click', (e) => { e.stopPropagation(); cycleSessionMode(); });
};

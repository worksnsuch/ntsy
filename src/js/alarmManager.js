/* Alarms Manager */

window.alarms = [];
let alarms = window.alarms;
let currentSelectedDays = new Set();
let currentAMPM = 'AM';
let currentEditingId = null;
let currentRingingAlarm = null;

// Selectors (will be populated in init)
let alarmModal, alarmHourInput, alarmMinuteInput, alarmAMBtn, alarmPMBtn, alarmLabelInput, alarmPreview, dayBtns;
let hourUpBtn, hourDownBtn, minuteUpBtn, minuteDownBtn;
let manageModal;

async function saveAlarms() {
    renderAlarms();

    if (!window.userSession || !window.supabaseClient) return;
    for (const a of alarms) {
        const { error } = await window.supabaseClient.from('alarms').upsert({
            id: a.id,
            user_id: window.userSession.user.id,
            hour: a.hour,
            minute: a.minute,
            ampm: a.ampm,
            days: a.days,
            label: a.label,
            enabled: a.enabled,
            next_occurrence: a.nextOccurrence
        });
        if (error) console.error('[AlarmManager] upsert error:', error.message);
    }
}

async function deleteAlarmFromDB(id) {
    if (!window.userSession || !window.supabaseClient) return;
    await window.supabaseClient.from('alarms').delete().eq('id', id);
}

function normalizeTo24h(h, m, ampm) {
    let h24 = parseInt(h) || 0;
    if (ampm === 'PM' && h24 < 12) h24 += 12;
    if (ampm === 'AM' && h24 === 12) h24 = 0;
    return { h: h24, m: parseInt(m) || 0 };
}

function calculateNextOccurrence(h12, m, ampm, days) {
    const now = new Date();
    const { h: h24, m: m24 } = normalizeTo24h(h12, m, ampm);
    
    let target = new Date();
    target.setHours(h24, m24, 0, 0);

    if (days.length === 0) {
        if (target <= now) {
            target.setDate(target.getDate() + 1);
        }
    } else {
        let daysDiff = 8;
        const currentDay = now.getDay();
        if (days.includes(currentDay) && target > now) {
            daysDiff = 0;
        } else {
            days.forEach(d => {
                let diff = d - currentDay;
                if (diff <= 0) diff += 7;
                if (diff < daysDiff) daysDiff = diff;
            });
        }
        target.setDate(target.getDate() + daysDiff);
    }
    return target.getTime();
}

function updatePreview(e) {
    if (!alarmHourInput || !alarmMinuteInput || !alarmPreview) return;
    
    let rawH = alarmHourInput.value.replace(/[^0-9]/g, '');
    let rawM = alarmMinuteInput.value.replace(/[^0-9]/g, '');
    
    if (rawH.length > 2) rawH = rawH.slice(0, 2);
    if (rawM.length > 2) rawM = rawM.slice(0, 2);

    let hNum = parseInt(rawH);
    let mNum = parseInt(rawM);

    if (!isNaN(hNum)) {
        if (hNum > 12) rawH = '12';
        else if (hNum === 0 && rawH.length >= 2) rawH = '1';
        else if (hNum < 1 && rawH.length > 0 && e?.type === 'blur') rawH = '1';
    }

    if (!isNaN(mNum)) {
        if (mNum > 59) rawM = '59';
    }

    if (alarmHourInput.value !== rawH) alarmHourInput.value = rawH;
    if (alarmMinuteInput.value !== rawM) alarmMinuteInput.value = rawM;

    if (!rawH) {
        alarmPreview.textContent = 'No time selected';
        return;
    }

    let displayM = rawM === '' ? '00' : rawM;
    if (e?.type === 'blur' || rawM.length === 2) {
        displayM = displayM.padStart(2, '0');
        if (alarmMinuteInput.value !== displayM) alarmMinuteInput.value = displayM;
    } else if (rawM.length === 1 && e?.type !== 'input') {
        displayM = displayM.padStart(2, '0');
    } else if (rawM.length === 0) {
        displayM = '00';
    }

    if (e?.type === 'blur' && rawH) {
        let hIdx = parseInt(rawH);
        if (hIdx < 1) alarmHourInput.value = '1';
        if (hIdx > 12) alarmHourInput.value = '12';
    }

    const nextTime = calculateNextOccurrence(alarmHourInput.value || '12', displayM.padStart(2, '0'), currentAMPM, Array.from(currentSelectedDays));
    const nextDate = new Date(nextTime);
    const diff = nextTime - Date.now();
    
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffMins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[nextDate.getDay()];
    const timeStr = `${alarmHourInput.value || '12'}:${displayM.padStart(2, '0')} ${currentAMPM}`;
    
    alarmPreview.textContent = `Alarm set for ${dayName} at ${timeStr}. Rings in ${diffHours}h ${diffMins}m.`;
}

function renderAlarms() {
    const activeAlarms = alarms.filter(a => a.enabled).sort((a, b) => a.nextOccurrence - b.nextOccurrence);
    const timeEl = document.getElementById('upcoming-alarm-time');
    if (!timeEl) return;
    
    if (activeAlarms.length > 0) {
        const next = activeAlarms[0];
        const date = new Date(next.nextOccurrence);
        let h = date.getHours();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        const m = date.getMinutes();
        timeEl.textContent = `${h}:${m < 10 ? '0'+m : m} ${ampm}`;
        timeEl.style.fontSize = '24px';
    } else {
        timeEl.textContent = 'No alarm set';
        timeEl.style.fontSize = '16px';
    }
}

function renderAlarmList() {
    const list = document.getElementById('alarms-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (alarms.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 20px;">No alarms set</p>';
        return;
    }

    alarms.forEach(alarm => {
        const item = document.createElement('div');
        item.className = 'alarm-list-item';
        const daysLabel = alarm.days.length === 0 ? 'Once' : alarm.days.map(d => ['S','M','T','W','T','F','S'][d]).join(', ');
        
        item.innerHTML = `
            <div class="alarm-item-info" onclick="editAlarm('${alarm.id}')" style="cursor: pointer; flex: 1; position: relative;">
                <div class="alarm-item-time">${alarm.hour}:${alarm.minute < 10 ? '0'+parseInt(alarm.minute) : alarm.minute} ${alarm.ampm}</div>
                <div class="alarm-item-meta">${alarm.label} • ${daysLabel}</div>
                <div class="edit-hint"><i data-lucide="pencil" size="10"></i> Edit</div>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
                <label class="switch">
                    <input type="checkbox" ${alarm.enabled ? 'checked' : ''} onchange="toggleAlarm('${alarm.id}')">
                    <span class="slider"></span>
                </label>
                <button class="icon-btn alarm-delete-btn" onclick="deleteAlarm('${alarm.id}')">
                    <i data-lucide="trash-2" size="18"></i>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
    
    if (window.lucide) window.lucide.createIcons();
}

window.editAlarm = function(id) {
    const alarm = alarms.find(a => a.id === id);
    if (!alarm) return;
    
    currentEditingId = id;
    alarmHourInput.value = alarm.hour;
    alarmMinuteInput.value = alarm.minute;
    currentAMPM = alarm.ampm;
    
    if (currentAMPM === 'AM') {
        alarmAMBtn.classList.add('active');
        alarmPMBtn.classList.remove('active');
    } else {
        alarmPMBtn.classList.add('active');
        alarmAMBtn.classList.remove('active');
    }
    
    currentSelectedDays = new Set(alarm.days);
    dayBtns.forEach(btn => {
        const day = parseInt(btn.dataset.day);
        if (currentSelectedDays.has(day)) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    
    alarmLabelInput.value = alarm.label;
    updatePreview();
    
    if (manageModal) manageModal.classList.remove('visible');
    if (alarmModal) alarmModal.classList.add('visible');
};

window.toggleAlarm = function(id) {
    const alarm = alarms.find(a => a.id === id);
    if (alarm) {
        alarm.enabled = !alarm.enabled;
        if (alarm.enabled) {
            alarm.nextOccurrence = calculateNextOccurrence(alarm.hour, alarm.minute, alarm.ampm, alarm.days);
        }
        saveAlarms();
        renderAlarmList();
    }
};

window.deleteAlarm = function(id) {
    alarms = alarms.filter(a => a.id !== id);
    deleteAlarmFromDB(id);
    saveAlarms();
    renderAlarmList();
};

function triggerAlarm(alarm) {
    currentRingingAlarm = alarm;
    const modal = document.getElementById('alarm-ringing-modal');
    const timeEl = document.getElementById('ringing-alarm-time');
    const labelEl = document.getElementById('ringing-alarm-label');
    const audio = document.getElementById('alarm-audio');

    if (modal && timeEl && labelEl) {
        const date = new Date(alarm.nextOccurrence);
        let h = date.getHours();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        const m = date.getMinutes();
        timeEl.textContent = `${h}:${m < 10 ? '0'+m : m} ${ampm}`;
        labelEl.textContent = alarm.label || 'Alarm';
        modal.classList.add('visible');
    }

    window.dispatchEvent(new CustomEvent('ntsy-pause-media'));

    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Audio play blocked"));
    }

    if (alarm.days.length > 0) {
        alarm.nextOccurrence = calculateNextOccurrence(alarm.hour, alarm.minute, alarm.ampm, alarm.days);
    } else {
        alarm.enabled = false;
    }
    
    document.querySelector('.alarm-widget')?.classList.add('ringing');
}

window.dismissAlarm = function() {
    const modal = document.getElementById('alarm-ringing-modal');
    const audio = document.getElementById('alarm-audio');
    modal?.classList.remove('visible');
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
    document.querySelector('.alarm-widget')?.classList.remove('ringing');
    window.dispatchEvent(new CustomEvent('ntsy-resume-media'));
    currentRingingAlarm = null;
    saveAlarms();
    renderAlarms();
};

window.snoozeAlarm = function() {
    if (!currentRingingAlarm) return;
    currentRingingAlarm.nextOccurrence = Date.now() + (5 * 60 * 1000);
    currentRingingAlarm.enabled = true;
    window.dismissAlarm();
};

window.initAlarms = async function() {
    if (window.userSession && window.supabaseClient) {
        const { data } = await window.supabaseClient.from('alarms').select('*').eq('user_id', window.userSession.user.id);
        if (data) {
            window.alarms = data.map(a => ({
                id: a.id,
                hour: a.hour,
                minute: a.minute,
                ampm: a.ampm,
                days: a.days || [],
                label: a.label,
                enabled: a.enabled,
                nextOccurrence: a.next_occurrence
            }));
            alarms = window.alarms;
        }
    }
    // Populate selectors
    alarmModal = document.getElementById('alarm-modal');
    alarmHourInput = document.getElementById('alarm-hour');
    alarmMinuteInput = document.getElementById('alarm-minute');
    alarmAMBtn = document.getElementById('ampm-am');
    alarmPMBtn = document.getElementById('ampm-pm');
    alarmLabelInput = document.getElementById('alarm-label');
    alarmPreview = document.getElementById('alarm-preview');
    dayBtns = document.querySelectorAll('.day-btn');
    hourUpBtn = document.getElementById('hour-up');
    hourDownBtn = document.getElementById('hour-down');
    minuteUpBtn = document.getElementById('minute-up');
    minuteDownBtn = document.getElementById('minute-down');
    manageModal = document.getElementById('manage-alarms-modal');

    // Attach Listeners
    document.getElementById('add-alarm-btn')?.addEventListener('click', () => {
        currentEditingId = null;
        currentSelectedDays.clear();
        dayBtns.forEach(btn => btn.classList.remove('active'));
        alarmHourInput.value = '';
        alarmMinuteInput.value = '';
        currentAMPM = 'AM';
        alarmAMBtn.classList.add('active');
        alarmPMBtn.classList.remove('active');
        alarmLabelInput.value = 'Alarm';
        updatePreview();
        alarmModal.classList.add('visible');
    });

    document.getElementById('cancel-alarm-btn')?.addEventListener('click', () => {
        alarmModal.classList.remove('visible');
        if (currentEditingId) manageModal.classList.add('visible');
    });

    alarmAMBtn?.addEventListener('click', () => {
        currentAMPM = 'AM';
        alarmAMBtn.classList.add('active');
        alarmPMBtn.classList.remove('active');
        updatePreview();
    });

    alarmPMBtn?.addEventListener('click', () => {
        currentAMPM = 'PM';
        alarmPMBtn.classList.add('active');
        alarmAMBtn.classList.remove('active');
        updatePreview();
    });

    dayBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const day = parseInt(btn.dataset.day);
            if (currentSelectedDays.has(day)) {
                currentSelectedDays.delete(day);
                btn.classList.remove('active');
            } else {
                currentSelectedDays.add(day);
                btn.classList.add('active');
            }
            updatePreview();
        });
    });

    [alarmHourInput, alarmMinuteInput].forEach(input => {
        input?.addEventListener('input', (e) => updatePreview(e));
        input?.addEventListener('blur', (e) => updatePreview(e));
        input?.addEventListener('keydown', (e) => {
            if (e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
            }
        });
    });

    hourUpBtn?.addEventListener('click', () => {
        let val = parseInt(alarmHourInput.value) || 12;
        val++; if (val > 12) val = 1;
        alarmHourInput.value = val.toString();
        updatePreview();
    });

    hourDownBtn?.addEventListener('click', () => {
        let val = parseInt(alarmHourInput.value) || 12;
        val--; if (val < 1) val = 12;
        alarmHourInput.value = val.toString();
        updatePreview();
    });

    minuteUpBtn?.addEventListener('click', () => {
        let val = parseInt(alarmMinuteInput.value) || 0;
        val++; if (val > 59) val = 0;
        alarmMinuteInput.value = val.toString().padStart(2, '0');
        updatePreview();
    });

    minuteDownBtn?.addEventListener('click', () => {
        let val = parseInt(alarmMinuteInput.value) || 0;
        val--; if (val < 0) val = 59;
        alarmMinuteInput.value = val.toString().padStart(2, '0');
        updatePreview();
    });

    document.getElementById('save-alarm-btn')?.addEventListener('click', () => {
        const h = alarmHourInput.value;
        const m = alarmMinuteInput.value;
        if (!h) {
            // Show error in preview box instead of alert()
            if (alarmPreview) alarmPreview.textContent = '⚠ Please enter a time.';
            return;
        }

        const nextOccurrence = calculateNextOccurrence(h, m, currentAMPM, Array.from(currentSelectedDays));
        const alarmData = { hour: h, minute: m, ampm: currentAMPM, days: Array.from(currentSelectedDays), label: alarmLabelInput.value || 'Alarm', enabled: true, nextOccurrence };

        if (currentEditingId) {
            const index = alarms.findIndex(a => a.id === currentEditingId);
            if (index !== -1) alarms[index] = { ...alarms[index], ...alarmData };
        } else {
            alarms.push({ id: Date.now().toString(), ...alarmData });
        }
        saveAlarms();
        alarmModal.classList.remove('visible');
        if (currentEditingId) { manageModal.classList.add('visible'); currentEditingId = null; }
        renderAlarmList(); 
    });

    document.getElementById('manage-alarms-btn')?.addEventListener('click', () => {
        renderAlarmList();
        manageModal.classList.add('visible');
    });

    document.getElementById('close-manage-btn')?.addEventListener('click', () => {
        manageModal.classList.remove('visible');
    });

    document.getElementById('alarm-skip-btn')?.addEventListener('click', () => {
        const activeAlarms = alarms.filter(a => a.enabled).sort((a, b) => a.nextOccurrence - b.nextOccurrence);
        if (activeAlarms.length > 0) {
            const next = activeAlarms[0];
            next.nextOccurrence = calculateNextOccurrence(next.hour, next.minute, next.ampm, next.days);
            saveAlarms();
        }
    });

    document.getElementById('alarm-end-btn')?.addEventListener('click', () => {
        window.dismissAlarm();
    });

    renderAlarms();
};

// Periodic check
setInterval(() => {
    const now = Date.now();
    let changed = false;
    alarms.forEach(alarm => {
        if (alarm.enabled && now >= alarm.nextOccurrence) {
            triggerAlarm(alarm);
            changed = true;
        }
    });
    if (changed) saveAlarms();
}, 2000);

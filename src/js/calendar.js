// calendar.js

const CALENDAR_EVENTS_KEY = 'notesApp_calendar_events';
window.calendarEvents = [];
let calendarEvents = window.calendarEvents;

let currentViewDate = new Date();
let selectedDate = new Date();

// DOM Elements (populated in init)
let monthYearDisplay, prevBtn, nextBtn, calendarDays;
let eventsSection, selectedDateLabel, addEventBtn, eventsList;
let addEventModal, eventModalTitle, eventIdInput, eventDateInput, eventTitleInput, eventTimeInput, eventDescInput, eventError;
let cancelEventBtn, saveEventBtn;
let calendarPickerModal, pickerMonthDisplay, pickerMonthText, pickerMonthDropdown, pickerYearDisplay, pickerYearText, pickerYearDropdown;
let cancelPickerBtn, goPickerBtn;

let selectedPickerMonth = 0;
let selectedPickerYear = 2026;

const monthNamesArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

async function saveAndRenderCalendarEvents() {
  renderCalendar();
  renderEventsList();
}

async function saveCalendarEventToDB(evt) {
    if (!window.userSession || !window.supabaseClient) return;
    const { error } = await window.supabaseClient.from('calendar_events').upsert({
        id: evt.id,
        user_id: window.userSession.user.id,
        title: evt.title,
        date: evt.date,
        time: evt.time,
        description: evt.description
    });
    if (error) console.error('[Calendar] upsert error:', error.message);
}

async function deleteCalendarEventFromDB(evtId) {
    if (!window.userSession || !window.supabaseClient) return;
    await window.supabaseClient.from('calendar_events').delete().eq('id', evtId);
}

function renderCalendar() {
  if (!calendarDays) return;
  calendarDays.innerHTML = '';
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  
  if(monthYearDisplay) monthYearDisplay.textContent = `${monthNamesArray[month]} ${year}`;
  const datesWithEvents = new Set();
  calendarEvents.forEach(e => datesWithEvents.add(e.date));
  
  for (let i = 0; i < startingDay; i++) {
    const cell = document.createElement('div');
    cell.classList.add('date-cell', 'muted');
    cell.textContent = prevMonthLastDay - startingDay + i + 1;
    const dDate = new Date(year, month - 1, cell.textContent);
    cell.addEventListener('click', () => {
      currentViewDate = new Date(year, month - 1, 1);
      selectedDate = dDate;
      renderCalendar();
      renderEventsList();
    });
    calendarDays.appendChild(cell);
  }
  
  const today = new Date();
  for (let i = 1; i <= totalDays; i++) {
    const cell = document.createElement('div');
    cell.classList.add('date-cell');
    cell.textContent = i;
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) cell.classList.add('today');
    if (i === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) cell.classList.add('selected');
    if (datesWithEvents.has(dStr)) cell.classList.add('has-event');
    cell.addEventListener('click', () => {
      selectedDate = new Date(year, month, i);
      renderCalendar();
      renderEventsList();
    });
    calendarDays.appendChild(cell);
  }
  
  const totalCells = startingDay + totalDays;
  const remainingCells = 42 - totalCells;
  if(remainingCells > 0 && remainingCells <= 14) {
      for (let i = 1; i <= remainingCells; i++) {
        const cell = document.createElement('div');
        cell.classList.add('date-cell', 'muted');
        cell.textContent = i;
        const dDate = new Date(year, month + 1, i);
        cell.addEventListener('click', () => {
          currentViewDate = new Date(year, month + 1, 1);
          selectedDate = dDate;
          renderCalendar();
          renderEventsList();
        });
        calendarDays.appendChild(cell);
      }
  }
}

function renderEventsList() {
  if (!eventsSection || !eventsList || !selectedDateLabel) return;
  eventsList.innerHTML = '';
  const y = selectedDate.getFullYear();
  const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const d = String(selectedDate.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;
  const dFormat = selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  selectedDateLabel.textContent = dFormat;
  
  let targetEvents = calendarEvents.filter(e => e.date === dateStr);
  if (targetEvents.length === 0) {
    eventsSection.style.display = 'flex';
    eventsList.innerHTML = '<div style="font-size: 11px; color: var(--text-secondary); text-align: center; padding: 12px 0;">No events for this date</div>';
  } else {
    eventsSection.style.display = 'flex';
    targetEvents.sort((a, b) => (a.time && b.time) ? a.time.localeCompare(b.time) : 0);
    targetEvents.forEach(evt => {
      const el = document.createElement('div');
      el.classList.add('calendar-event-item');
      el.innerHTML = `
        <div class="calendar-event-info">
          <span class="calendar-event-title">${evt.title}</span>
          ${evt.time ? `<span class="calendar-event-time">${evt.time}</span>` : ''}
        </div>
        <div class="calendar-event-actions">
           <button class="icon-btn edit-event-btn" title="Edit" data-id="${evt.id}"><i data-lucide="edit-2" size="12"></i></button>
           <button class="icon-btn delete-event-btn" title="Delete" data-id="${evt.id}" style="color: var(--accent-red);"><i data-lucide="trash-2" size="12"></i></button>
        </div>
      `;
      el.querySelector('.delete-event-btn').addEventListener('click', async () => {
        const confirmed = await window.customConfirm('Are you sure you want to delete this event?', 'Delete Event?');
        if (confirmed) {
            calendarEvents = calendarEvents.filter(e => e.id !== evt.id);
            window.calendarEvents = calendarEvents;
            deleteCalendarEventFromDB(evt.id);
            saveAndRenderCalendarEvents();
        }
      });
      el.querySelector('.edit-event-btn').addEventListener('click', () => openEventModal(evt));
      eventsList.appendChild(el);
    });
    window.safeCreateIcons();
  }
}

function openEventModal(evt = null) {
  if (eventError) eventError.style.display = 'none';
  const y = selectedDate.getFullYear();
  const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const d = String(selectedDate.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;
  if (eventDateInput) eventDateInput.value = dateStr;
  if (evt) {
    if (eventModalTitle) eventModalTitle.textContent = 'Edit Event';
    if (eventIdInput) eventIdInput.value = evt.id;
    if (eventTitleInput) eventTitleInput.value = evt.title;
    if (eventTimeInput) eventTimeInput.value = evt.time || '';
    if (eventDescInput) eventDescInput.value = evt.description || '';
  } else {
    if (eventModalTitle) eventModalTitle.textContent = 'Add Event';
    if (eventIdInput) eventIdInput.value = '';
    if (eventTitleInput) eventTitleInput.value = '';
    if (eventTimeInput) eventTimeInput.value = '';
    if (eventDescInput) eventDescInput.value = '';
  }
  if (addEventModal) addEventModal.classList.add('visible');
}

window.initCalendar = async function() {
  if (window.userSession && window.supabaseClient) {
      const { data } = await window.supabaseClient.from('calendar_events').select('*').eq('user_id', window.userSession.user.id);
      if (data) {
          window.calendarEvents = data.map(e => ({
              id: e.id,
              date: e.date,
              time: e.time,
              title: e.title,
              description: e.description,
              createdAt: new Date(e.created_at).getTime()
          }));
          calendarEvents = window.calendarEvents;
      }
  }

  // Populate elements
  monthYearDisplay = document.getElementById('calendar-month-year');
  prevBtn = document.getElementById('calendar-prev-btn');
  nextBtn = document.getElementById('calendar-next-btn');
  calendarDays = document.getElementById('calendar-days');
  eventsSection = document.getElementById('calendar-events-section');
  selectedDateLabel = document.getElementById('selected-date-label');
  addEventBtn = document.getElementById('add-event-btn');
  eventsList = document.getElementById('calendar-events-list');
  addEventModal = document.getElementById('add-event-modal');
  eventModalTitle = document.getElementById('event-modal-title');
  eventIdInput = document.getElementById('event-id');
  eventDateInput = document.getElementById('event-date-input');
  eventTitleInput = document.getElementById('event-title');
  eventTimeInput = document.getElementById('event-time');
  eventDescInput = document.getElementById('event-desc');
  eventError = document.getElementById('event-error');
  cancelEventBtn = document.getElementById('cancel-event-btn');
  saveEventBtn = document.getElementById('save-event-btn');
  calendarPickerModal = document.getElementById('calendar-picker-modal');
  pickerMonthDisplay = document.getElementById('picker-month-display');
  pickerMonthText = document.getElementById('picker-month-text');
  pickerMonthDropdown = document.getElementById('picker-month-dropdown');
  pickerYearDisplay = document.getElementById('picker-year-display');
  pickerYearText = document.getElementById('picker-year-text');
  pickerYearDropdown = document.getElementById('picker-year-dropdown');
  cancelPickerBtn = document.getElementById('cancel-picker-btn');
  goPickerBtn = document.getElementById('go-picker-btn');

  // Populate Dropdowns
  if (pickerMonthDropdown) {
    pickerMonthDropdown.innerHTML = '';
    monthNamesArray.forEach((m, idx) => {
       const opt = document.createElement('div');
       opt.classList.add('custom-select-option');
       opt.textContent = m;
       opt.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedPickerMonth = idx;
          if (pickerMonthText) pickerMonthText.textContent = m;
          pickerMonthDropdown.classList.remove('open');
       });
       pickerMonthDropdown.appendChild(opt);
    });
  }
  if (pickerYearDropdown) {
    pickerYearDropdown.innerHTML = '';
    for (let i = 1900; i <= 2100; i++) {
       const opt = document.createElement('div');
       opt.classList.add('custom-select-option');
       opt.textContent = i;
       opt.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedPickerYear = i;
          if (pickerYearText) pickerYearText.textContent = String(i);
          pickerYearDropdown.classList.remove('open');
       });
       pickerYearDropdown.appendChild(opt);
    }
  }

  // Attach listeners
  if(prevBtn) prevBtn.addEventListener('click', () => { currentViewDate.setMonth(currentViewDate.getMonth() - 1); renderCalendar(); });
  if(nextBtn) nextBtn.addEventListener('click', () => { currentViewDate.setMonth(currentViewDate.getMonth() + 1); renderCalendar(); });
  if(addEventBtn) addEventBtn.addEventListener('click', () => openEventModal(null));
  if(cancelEventBtn) cancelEventBtn.addEventListener('click', () => addEventModal?.classList.remove('visible'));
  if(saveEventBtn) saveEventBtn.addEventListener('click', () => {
    const title = eventTitleInput.value.trim();
    if(!title) { if (eventError) eventError.style.display = 'block'; return; }
    const id = eventIdInput.value;
    const dateStr = eventDateInput.value;
    let targetEvt;
    if (id) {
      targetEvt = calendarEvents.find(e => e.id === id);
      if(targetEvt) { targetEvt.title = title; targetEvt.time = eventTimeInput.value; targetEvt.description = eventDescInput.value.trim(); }
    } else {
      targetEvt = { id: Date.now().toString(), date: dateStr, title, time: eventTimeInput.value, description: eventDescInput.value.trim(), createdAt: Date.now() };
      calendarEvents.push(targetEvt);
    }
    saveCalendarEventToDB(targetEvt);
    addEventModal?.classList.remove('visible');
    saveAndRenderCalendarEvents();
  });

  if(pickerMonthDisplay) pickerMonthDisplay.addEventListener('click', (e) => {
    e.stopPropagation();
    pickerYearDropdown?.classList.remove('open');
    pickerMonthDropdown?.classList.toggle('open');
  });
  if(pickerYearDisplay) pickerYearDisplay.addEventListener('click', (e) => {
    e.stopPropagation();
    pickerMonthDropdown?.classList.remove('open');
    pickerYearDropdown?.classList.toggle('open');
  });
  document.addEventListener('click', () => {
    pickerMonthDropdown?.classList.remove('open');
    pickerYearDropdown?.classList.remove('open');
  });

  if(monthYearDisplay) monthYearDisplay.addEventListener('click', () => {
     selectedPickerMonth = currentViewDate.getMonth();
     selectedPickerYear = currentViewDate.getFullYear();
     if (pickerMonthText) pickerMonthText.textContent = monthNamesArray[selectedPickerMonth];
     if (pickerYearText) pickerYearText.textContent = String(selectedPickerYear);
     calendarPickerModal?.classList.add('visible');
  });
  if(cancelPickerBtn) cancelPickerBtn.addEventListener('click', () => calendarPickerModal?.classList.remove('visible'));
  if(goPickerBtn) goPickerBtn.addEventListener('click', () => {
     currentViewDate = new Date(selectedPickerYear, selectedPickerMonth, 1);
     renderCalendar();
     calendarPickerModal?.classList.remove('visible');
  });

  renderCalendar();
  renderEventsList();
};


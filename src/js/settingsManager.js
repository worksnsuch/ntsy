/**
 * Settings Manager - Handles application preferences, AI, Feature toggling, and Reordering
 */

window.syncSettingsToDB = async function() {
    if (!window.userSession || !window.supabaseClient) return;
    const settingsObj = {};
    const keys = [
        'ntsy_show_study_buddy', 'ntsy_show_media_bar', 'ntsy_sidebar_features', 
        'ntsy_sidebar_order', 'ntsy_theme', 'notesApp_customFonts', 'ntsy_gemini_api_key', 
        'ntsy_groq_api_key', 'ntsy_ai_provider', 'notesApp_music_queue', 
        'ntsy_pomodoro_durations', 'ntsy_pomodoro_sessions', 'ntsy_pomodoro_state'
    ];
    keys.forEach(k => {
        const val = localStorage.getItem(k);
        if (val !== null) settingsObj[k] = val;
    });
    await window.supabaseClient.from('profiles').update({ settings: settingsObj }).eq('id', window.userSession.user.id);
};

window.initSettings = async function() {
    if (window.userSession && window.supabaseClient) {
        const { data } = await window.supabaseClient.from('profiles').select('settings').eq('id', window.userSession.user.id).single();
        if (data && data.settings) {
            Object.keys(data.settings).forEach(k => {
                localStorage.setItem(k, data.settings[k]);
            });
        }
    }
    window._internalInitSettings();
};

window._internalInitSettings = function() {
    // Tab Logic
    const tabs = document.querySelectorAll('.settings-tab');
    const sections = document.querySelectorAll('.settings-section');

    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById(tab.dataset.tab);
            if (target) target.classList.add('active');
            
            if (tab.dataset.tab === 'tab-fonts') {
                renderSettingsFonts();
            }
        };
    });

    // 1. Study Buddy & Media Bar Toggles
    const studyBuddyToggle = document.getElementById('feature-study-buddy');
    const mediaBarToggle = document.getElementById('feature-media-bar');

    const savedStudyBuddy = localStorage.getItem('ntsy_show_study_buddy') !== 'false';
    const savedMediaBar = localStorage.getItem('ntsy_show_media_bar') !== 'false';

    if (studyBuddyToggle) {
        studyBuddyToggle.checked = savedStudyBuddy;
        studyBuddyToggle.onchange = (e) => {
            localStorage.setItem('ntsy_show_study_buddy', e.target.checked);
            applyFeatureVisibility('study-buddy', e.target.checked);
            window.syncSettingsToDB();
        };
    }

    if (mediaBarToggle) {
        mediaBarToggle.checked = savedMediaBar;
        mediaBarToggle.onchange = (e) => {
            localStorage.setItem('ntsy_show_media_bar', e.target.checked);
            applyFeatureVisibility('media-bar', e.target.checked);
            window.syncSettingsToDB();
        };
    }

    // 2. Sidebar Widgets Reordering & Toggling
    renderSidebarOrderList();

    // Initial Apply
    const sidebarState = JSON.parse(localStorage.getItem('ntsy_sidebar_features') || '{}');
    applyFeatureVisibility('study-buddy', savedStudyBuddy);
    applyFeatureVisibility('media-bar', savedMediaBar);
    
    const features = ['clock', 'calendar', 'alarm', 'priority', 'pomodoro'];
    features.forEach(f => {
        const isVisible = sidebarState[f] !== false;
        applyFeatureVisibility(f, isVisible);
    });
    
    applySidebarOrder();

    // 4. Save & Apply Button
    const saveBtn = document.getElementById('save-sidebar-settings-btn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            // Re-apply everything to be sure
            applySidebarOrder();
            
            const currentSidebarFeatures = JSON.parse(localStorage.getItem('ntsy_sidebar_features') || '{}');
            features.forEach(f => {
                applyFeatureVisibility(f, currentSidebarFeatures[f] !== false);
            });
            
            applyFeatureVisibility('study-buddy', localStorage.getItem('ntsy_show_study_buddy') !== 'false');
            applyFeatureVisibility('media-bar', localStorage.getItem('ntsy_show_media_bar') !== 'false');

            // Feedback
            const originalText = saveBtn.innerText;
            saveBtn.innerText = "Settings Saved & Applied!";
            saveBtn.style.background = "#4CD964"; // Success Green
            saveBtn.style.color = "#000";
            
            setTimeout(() => {
                saveBtn.innerText = originalText;
                saveBtn.style.background = "";
                saveBtn.style.color = "";
            }, 2000);
        };
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // 5. Theme Selection Logic
    initThemeSettings();
};

function initThemeSettings() {
    const darkCard = document.getElementById('theme-dark-card');
    const lightCard = document.getElementById('theme-light-card');
    if (!darkCard || !lightCard) return;

    const savedTheme = localStorage.getItem('ntsy_theme') || 'dark';
    applyTheme(savedTheme);

    darkCard.onclick = () => {
        applyTheme('dark');
        localStorage.setItem('ntsy_theme', 'dark');
        window.syncSettingsToDB();
    };

    lightCard.onclick = () => {
        applyTheme('light');
        localStorage.setItem('ntsy_theme', 'light');
        window.syncSettingsToDB();
    };
}

function applyTheme(theme) {
    const darkCard = document.getElementById('theme-dark-card');
    const lightCard = document.getElementById('theme-light-card');
    
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        if (lightCard) lightCard.style.borderColor = 'var(--accent-yellow)';
        if (darkCard) darkCard.style.borderColor = 'transparent';
    } else {
        document.body.classList.remove('light-theme');
        if (darkCard) darkCard.style.borderColor = 'var(--accent-yellow)';
        if (lightCard) lightCard.style.borderColor = 'transparent';
    }
}

function renderSidebarOrderList() {
    const list = document.getElementById('sidebar-order-list');
    if (!list) return;

    const widgetMeta = {
        clock: { name: 'Clock Widget', desc: 'Show time and date', icon: 'clock' },
        calendar: { name: 'Calendar', desc: 'Show interactive calendar', icon: 'calendar' },
        alarm: { name: 'Alarms', desc: 'Show upcoming alarms', icon: 'alarm-clock' },
        priority: { name: 'Priority Tracker', desc: 'Show task checklist', icon: 'list-checks' },
        pomodoro: { name: 'Pomodoro Timer', desc: 'Show focus timer', icon: 'timer' }
    };

    let order = JSON.parse(localStorage.getItem('ntsy_sidebar_order') || '["clock", "calendar", "alarm", "priority", "pomodoro"]');
    const visibility = JSON.parse(localStorage.getItem('ntsy_sidebar_features') || '{}');

    const htmlItems = order.map(id => {
        const meta = widgetMeta[id];
        const isChecked = visibility[id] !== false;
        return `
            <div class="feature-item draggable-item" draggable="true" data-id="${id}">
                <div class="feature-info">
                    <div class="drag-handle"><i data-lucide="grip-vertical" size="16"></i></div>
                    <div class="feature-icon"><i data-lucide="${meta.icon}" size="20"></i></div>
                    <div class="feature-details">
                        <h4>${meta.name}</h4>
                        <p>${meta.desc}</p>
                    </div>
                </div>
                <label class="switch">
                    <input type="checkbox" class="sidebar-toggle" data-feature="${id}" ${isChecked ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
        `;
    });

    // Append Fixed Features (AI & Media) to the same grid for aesthetic uniformity
    const showBuddy = localStorage.getItem('ntsy_show_study_buddy') !== 'false';
    const showMedia = localStorage.getItem('ntsy_show_media_bar') !== 'false';

    htmlItems.push(`
        <div class="feature-item" data-id="study-buddy">
            <div class="feature-info">
                <div class="feature-icon"><i data-lucide="sparkles" size="20"></i></div>
                <div class="feature-details">
                    <h4>Study Buddy (AI)</h4>
                    <p>Show or hide the floating AI assistant</p>
                </div>
            </div>
            <label class="switch">
                <input type="checkbox" id="feature-study-buddy" ${showBuddy ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
    `);

    htmlItems.push(`
        <div class="feature-item" data-id="media-bar">
            <div class="feature-info">
                <div class="feature-icon"><i data-lucide="music" size="20"></i></div>
                <div class="feature-details">
                    <h4>Media Bar</h4>
                    <p>Show or hide the floating player bar</p>
                </div>
            </div>
            <label class="switch">
                <input type="checkbox" id="feature-media-bar" ${showMedia ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
    `);

    list.innerHTML = htmlItems.join('');

    // Re-bind fixed toggles since they were just re-rendered
    const buddyToggle = document.getElementById('feature-study-buddy');
    if (buddyToggle) {
        buddyToggle.onchange = (e) => {
            localStorage.setItem('ntsy_show_study_buddy', e.target.checked);
            applyFeatureVisibility('study-buddy', e.target.checked);
            window.syncSettingsToDB();
        };
    }
    const mediToggle = document.getElementById('feature-media-bar');
    if (mediToggle) {
        mediToggle.onchange = (e) => {
            localStorage.setItem('ntsy_show_media_bar', e.target.checked);
            applyFeatureVisibility('media-bar', e.target.checked);
            window.syncSettingsToDB();
        };
    }

    // Re-attach toggle listeners
    const toggles = list.querySelectorAll('.sidebar-toggle');
    toggles.forEach(toggle => {
        toggle.onchange = (e) => {
            const activeCount = Array.from(toggles).filter(t => t.checked).length;
            if (!e.target.checked && activeCount < 3) {
                e.target.checked = true;
                const warning = document.getElementById('min-features-warning');
                if (warning) {
                    warning.style.display = 'block';
                    setTimeout(() => warning.style.display = 'none', 3000);
                }
                return;
            }
            visibility[toggle.dataset.feature] = e.target.checked;
            localStorage.setItem('ntsy_sidebar_features', JSON.stringify(visibility));
            applyFeatureVisibility(toggle.dataset.feature, e.target.checked);
            window.syncSettingsToDB();
        };
    });

    // Drag & Drop Logic
    let draggedItem = null;

    list.addEventListener('dragstart', (e) => {
        draggedItem = e.target.closest('.draggable-item');
        if (draggedItem) {
            draggedItem.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    list.addEventListener('dragend', (e) => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
        const newOrder = Array.from(list.querySelectorAll('.draggable-item')).map(item => item.dataset.id);
        localStorage.setItem('ntsy_sidebar_order', JSON.stringify(newOrder));
        applySidebarOrder();
        window.syncSettingsToDB();
    });

    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(list, e.clientY);
        if (afterElement == null) {
            list.appendChild(draggedItem);
        } else {
            list.insertBefore(draggedItem, afterElement);
        }
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.draggable-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function applySidebarOrder() {
    const container = document.querySelector('.sidebar-main-content');
    if (!container) return;

    const order = JSON.parse(localStorage.getItem('ntsy_sidebar_order') || '["clock", "calendar", "alarm", "priority", "pomodoro"]');
    const mapping = {
        'clock': document.querySelector('.clock-widget'),
        'calendar': document.querySelector('.calendar-widget'),
        'alarm': document.querySelector('.alarm-widget'),
        'priority': document.querySelector('.priority-widget'),
        'pomodoro': document.getElementById('pomodoro-widget')
    };

    order.forEach(id => {
        const el = mapping[id];
        if (el) container.appendChild(el); // appendChild moves existing element to end
    });
}

function applyFeatureVisibility(featureId, isVisible) {
    const mapping = {
        'study-buddy': document.getElementById('chat-buddy-container'),
        'media-bar': document.getElementById('floating-music-player'),
        'clock': document.querySelector('.clock-widget'),
        'calendar': document.querySelector('.calendar-widget'),
        'alarm': document.querySelector('.alarm-widget'),
        'priority': document.querySelector('.priority-widget'),
        'pomodoro': document.getElementById('pomodoro-widget')
    };

    const el = mapping[featureId];
    if (el) {
        el.style.display = isVisible ? '' : 'none';
    }
}

function renderSettingsFonts() {
    const list = document.getElementById('fonts-list');
    if (!list) return;

    let savedFonts = {};
    try {
        savedFonts = JSON.parse(localStorage.getItem('notesApp_customFonts') || '{}');
    } catch (e) { console.error(e); }

    const fontNames = Object.keys(savedFonts);
    if (fontNames.length === 0) {
        list.innerHTML = '<div class="empty-state">No custom fonts uploaded. You can import fonts in the Note Editor.</div>';
        return;
    }

    list.innerHTML = fontNames.map(name => `
        <div class="font-item">
            <span class="font-name" style="font-family: '${name}'">${name}</span>
            <div class="font-actions">
                <button class="icon-btn delete-font-btn" title="Delete Font" onclick="deleteFontFromSettings('${name}')">
                    <i data-lucide="trash-2" size="18"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.deleteFontFromSettings = function(name) {
    if (!confirm(`Are you sure you want to delete the font "${name}"?`)) return;
    try {
        const savedFonts = JSON.parse(localStorage.getItem('notesApp_customFonts') || '{}');
        delete savedFonts[name];
        localStorage.setItem('notesApp_customFonts', JSON.stringify(savedFonts));
        window.syncSettingsToDB();
        renderSettingsFonts();
        if (typeof window.refreshEditorFontList === 'function') window.refreshEditorFontList();
    } catch (e) { console.error(e); }
};

/**
 * Returns the user-configured Gemini API key, or null if not set.
 * Users can set this in Settings > AI.
 */
window.getGeminiApiKey = function() {
    return localStorage.getItem('ntsy_gemini_api_key') || null;
};

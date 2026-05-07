// Import Supabase client first (uses Vite env variables)
import '../../supabaseClient.js';

// Import all HTML components
import '../html/sidebar.js';
import '../html/homepage.js';
import '../html/editor.js';
import '../html/profile.js';
import '../html/settings.js';
import '../html/musicPlayer.js';
import '../html/modals.js';
import '../html/chatBuddy.js';
import '../html/auth.js';

// Import all JS managers
import './componentLoader.js';
import './modal.js';
import './clock.js';
import './alarmManager.js';
import './foldersManager.js';
import './priorityTracker.js';
import './notesManager.js';
import './calendar.js';
import './pomodoroTimer.js';
import './musicPlayer.js';
import './imageManager.js';
import './pdfManager.js';
import './chatBuddy.js';
import './responsive.js';
import './settingsManager.js';
import './profileManager.js';
import './printManager.js';
import './authManager.js';

// Wait for Supabase to be initialized
async function waitForSupabase(maxAttempts = 50) {
    for (let i = 0; i < maxAttempts; i++) {
        if (window.supabaseClient) {
            console.log('[Main] Supabase client ready');
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.warn('[Main] Supabase client not initialized after waiting');
    return false;
}

document.addEventListener("DOMContentLoaded", async () => {
    // Apply theme immediately before components load to prevent flash
    const savedTheme = localStorage.getItem('ntsy_theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }

    // Wait for Supabase to initialize
    await waitForSupabase();

    // 1. Load HTML Components first
    if (window.ComponentLoader) {
        try {
            await window.ComponentLoader.load();
        } catch (e) {
            console.error("[Main] Critical error loading components:", e);
        }
    }

    const safeInit = (name, globalName) => {
        try {
            const initFunc = window[globalName];
            if (typeof initFunc === 'function') {
                console.log(`[Main] Initializing ${name}...`);
                initFunc();
            } else {
                console.warn(`[Main] ${name} (window.${globalName}) not found or not a function.`);
            }
        } catch (error) {
            console.error(`[Main] Error during ${name} initialization:`, error);
        }
    };

    // 1. Core / Layout
    safeInit("Auth Manager", "initAuth");
    if (window.checkAuthStatus) {
        window.checkAuthStatus();
    }
    safeInit("Modals", "initModal"); // CRITICAL: Initialize modals first
    safeInit("Responsive", "initResponsive");
    
    // 2. Dashboard Widgets
    safeInit("Clock", "initClock");
    safeInit("Alarms", "initAlarms");
    safeInit("Calendar", "initCalendar");
    safeInit("Pomodoro", "initPomodoro");
    safeInit("Music Player", "initMusicPlayer");
    
    // 3. Data & Management
    safeInit("Folders", "initFolders");
    safeInit("Priority Tracker", "initPriorityTracker");
    safeInit("Notes", "initNotes");
    safeInit("Split View", "initSplitView");
    safeInit("Image Manager", "initImageManager");
    safeInit("Pdf Manager", "initPdfManager");
    safeInit("Chat Buddy", "initChatBuddy");

    // 4. Settings, Profile & UI Icons
    safeInit("Profile", "initProfile");
    safeInit("Settings", "initSettings");

    if (window.lucide) {
        lucide.createIcons();
    }


    // About Modal Logic
    const aboutBtn = document.getElementById('about-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeAboutBtn = document.getElementById('close-about-btn');

    if (aboutBtn && aboutModal && closeAboutBtn) {
        aboutBtn.addEventListener('click', () => {
            aboutModal.classList.add('visible');
        });
        closeAboutBtn.addEventListener('click', () => {
            aboutModal.classList.remove('visible');
        });
        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) aboutModal.classList.remove('visible');
        });
    }

    // Navigation Logic
    const profileBtn = document.getElementById('profile-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const logoHomeBtn = document.getElementById('logo-home-btn');

    if (profileBtn) profileBtn.addEventListener('click', () => window.showView('profile-view'));
    if (settingsBtn) settingsBtn.addEventListener('click', () => window.showView('settings-view'));
    if (logoHomeBtn) logoHomeBtn.addEventListener('click', () => window.showView('homepage-view'));

    // Back Buttons
    const profileBackBtn = document.querySelector('.profile-back-btn');
    const settingsBackBtn = document.querySelector('.settings-back-btn');

    if (profileBackBtn) profileBackBtn.addEventListener('click', () => window.showView('homepage-view'));
    if (settingsBackBtn) settingsBackBtn.addEventListener('click', () => window.showView('homepage-view'));
});


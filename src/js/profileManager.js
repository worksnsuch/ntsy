/**
 * Profile Manager - Handles usage statistics, time tracking, and account metadata.
 */

(function() {
    // 1. Time Tracking Variables
    let totalSeconds = 0;
    let sessionStart = Date.now();
    let isTracking = true;

    // 2. Initialization
    window.initProfile = async function() {
        console.log("[Profile] Initializing Manager...");

        if (window.userSession) {
            const user = window.userSession.user;
            const { data, error } = await window.supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                totalSeconds = data.total_time_spent || 0;
                applyProfileData(data.display_name || user.email.split('@')[0], data.email || user.email);
            } else {
                // Fallback: Use email as name and show the actual email
                const fallbackName = user.user_metadata?.first_name || user.email.split('@')[0];
                applyProfileData(fallbackName, user.email);

                // Create the profile if it doesn't exist
                await window.supabaseClient.from('profiles').upsert({
                    id: user.id,
                    email: user.email,
                    display_name: fallbackName,
                    total_time_spent: 0
                });
            }
        }

        // FIX 1: updateProfileUI moved here — after profile data has loaded —
        // so totalSeconds and display name are populated before the UI renders.
        await updateProfileUI();

        // 3. Button Listeners
        const editBtn = document.getElementById('edit-profile-btn');
        const deleteBtn = document.getElementById('delete-account-btn');
        const signOutBtn = document.getElementById('sign-out-btn');

        if (editBtn) editBtn.onclick = openEditProfileModal;
        if (deleteBtn) deleteBtn.onclick = handleDeleteAccount;
        if (signOutBtn) {
            signOutBtn.onclick = () => {
                window.location.href = '?logout';
            };
        }

        // Modal Button Listeners
        const saveEditBtn = document.getElementById('save-edit-profile-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-profile-btn');
        if (saveEditBtn) saveEditBtn.onclick = saveProfileChanges;
        if (cancelEditBtn) cancelEditBtn.onclick = () => document.getElementById('edit-profile-modal').classList.remove('visible');

        // Visibility API for precise time tracking
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                sessionStart = Date.now();
                isTracking = true;
            } else {
                saveAccumulatedTime();
                isTracking = false;
            }
        });

        // FIX 3: beforeunload cannot await async calls; use sendBeacon as a
        // best-effort synchronous flush so the final delta isn't lost on close.
        window.addEventListener('beforeunload', () => {
            const now = Date.now();
            const deltaSeconds = Math.floor((now - sessionStart) / 1000);
            if (deltaSeconds > 0 && window.userSession && window.supabaseClient) {
                const newTotal = totalSeconds + deltaSeconds;
                // sendBeacon keeps the request alive after the page unloads.
                // Falls back gracefully if the Supabase REST URL isn't available.
                try {
                    const url = `${window.supabaseClient.supabaseUrl}/rest/v1/profiles?id=eq.${window.userSession.user.id}`;
                    const payload = JSON.stringify({ total_time_spent: newTotal });
                    const blob = new Blob([payload], { type: 'application/json' });
                    navigator.sendBeacon(url, blob);
                } catch (e) {
                    // Silent fail — the periodic save already covered most of the session.
                }
            }
        });

        // FIX 2: Periodic save now also refreshes the displayed time so the
        // "Time Spent" stat card actually updates while the user is on the page.
        setInterval(async () => {
            if (isTracking && document.visibilityState === 'visible') {
                await saveAccumulatedTime();
                updateTimeDisplay(); // Lightweight UI-only refresh; no extra DB call.
            }
        }, 10000);
    };

    async function saveAccumulatedTime() {
        const now = Date.now();
        const deltaSeconds = Math.floor((now - sessionStart) / 1000);
        if (deltaSeconds > 0) {
            totalSeconds += deltaSeconds;
            sessionStart = now; // Reset to avoid double-counting.

            if (window.userSession && window.supabaseClient) {
                await window.supabaseClient
                    .from('profiles')
                    .update({ total_time_spent: totalSeconds })
                    .eq('id', window.userSession.user.id);
            }
        }
    }

    // FIX 2 (continued): Separated so we can update just the clock without
    // re-querying the notes count on every 10-second tick.
    function updateTimeDisplay() {
        const timeValue = document.getElementById('profile-total-time');
        if (timeValue) {
            timeValue.innerText = formatDuration(totalSeconds);
        }
    }

    async function openEditProfileModal() {
        const modal = document.getElementById('edit-profile-modal');
        const nameInput = document.getElementById('edit-profile-name');
        const emailInput = document.getElementById('edit-profile-email');

        if (modal && nameInput && emailInput && window.userSession) {
            const { data } = await window.supabaseClient
                .from('profiles')
                .select('display_name, email')
                .eq('id', window.userSession.user.id)
                .single();
            nameInput.value = data?.display_name || window.userSession.user.user_metadata?.first_name || '';
            emailInput.value = data?.email || window.userSession.user.email || '';
            modal.classList.add('visible');
        }
    }

    async function saveProfileChanges() {
        const nameInput = document.getElementById('edit-profile-name');
        const emailInput = document.getElementById('edit-profile-email');

        if (nameInput && emailInput && window.userSession) {
            const newName = nameInput.value.trim();
            const newEmail = emailInput.value.trim() || window.userSession.user.email;

            const btn = document.getElementById('save-edit-profile-btn');
            const orig = btn.textContent;
            btn.textContent = 'Saving...';
            btn.disabled = true;

            const { error } = await window.supabaseClient
                .from('profiles')
                .update({ display_name: newName, email: newEmail })
                .eq('id', window.userSession.user.id);

            btn.textContent = orig;
            btn.disabled = false;

            if (!error) {
                applyProfileData(newName, newEmail);
                document.getElementById('edit-profile-modal').classList.remove('visible');
            }
        }
    }

    function applyProfileData(name, email) {
        const nameDisplay = document.getElementById('profile-display-name');
        const emailDisplay = document.getElementById('profile-display-email');
        const avatar = document.getElementById('profile-avatar');

        if (nameDisplay) nameDisplay.innerText = name;
        if (emailDisplay) emailDisplay.innerText = email;
        if (avatar && name) {
            avatar.innerText = name.charAt(0).toUpperCase();
        }
    }

    async function handleDeleteAccount() {
        const confirmed = await window.customConfirm(
            "This will permanently delete all your notes, folders, and settings. This action cannot be undone.",
            "Delete All Data?"
        );

        if (confirmed && window.userSession) {
            await window.supabaseClient.from('profiles').delete().eq('id', window.userSession.user.id);
            await window.supabaseClient.auth.signOut();
            window.location.reload();
        }
    }

    async function updateProfileUI() {
        const notesValue = document.getElementById('profile-total-notes');
        const timeValue = document.getElementById('profile-total-time');

        // FIX 4: select('id') instead of select('*') — lighter query for a count.
        if (notesValue && window.userSession) {
            const { count } = await window.supabaseClient
                .from('notes')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', window.userSession.user.id);
            notesValue.innerText = count || 0;
        }

        if (timeValue) {
            timeValue.innerText = formatDuration(totalSeconds);
        }

        // FIX 5: Only re-create icons when the profile view is actually visible,
        // to avoid running lucide over the whole DOM on every stats refresh.
        if (window.lucide && isViewVisible('profile-view')) {
            lucide.createIcons();
        }
    }

    function formatDuration(seconds) {
        if (seconds < 60) return `${seconds}s`;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }

    function isViewVisible(viewId) {
        const view = document.getElementById(viewId);
        return view && view.classList.contains('active-view');
    }

    // Helper for debugging/manual triggers
    window.refreshProfileStats = updateProfileUI;

})();
/**
 * Profile Manager - Handles usage statistics, time tracking, and account metadata.
 */

(function() {
    // 1. Time Tracking Variables
    let totalSeconds = 0;
    let sessionStart = Date.now();
    let isTracking = true;
    let listenersAttached = false; // Guard: prevent duplicate event listeners on re-init

    // ------------------------------------------------------------------
    // 2. waitForSession helper
    //    Polls until window.userSession AND window.supabaseClient are both
    //    ready, then resolves. Prevents the blank-profile bug caused by
    //    initProfile() running before auth finishes.
    // ------------------------------------------------------------------
    function waitForSession(timeoutMs = 10000) {
        return new Promise((resolve, reject) => {
            if (window.userSession && window.supabaseClient) {
                return resolve();
            }
            const interval = setInterval(() => {
                if (window.userSession && window.supabaseClient) {
                    clearInterval(interval);
                    clearTimeout(timer);
                    resolve();
                }
            }, 100);
            const timer = setTimeout(() => {
                clearInterval(interval);
                reject(new Error("[Profile] Timed out waiting for userSession / supabaseClient."));
            }, timeoutMs);
        });
    }

    // ------------------------------------------------------------------
    // 3. Main init — safe to call whenever the profile view is shown.
    //    Internally waits for auth readiness before touching Supabase.
    // ------------------------------------------------------------------
    window.initProfile = async function() {
        console.log("[Profile] Initializing Manager...");

        try {
            await waitForSession();
        } catch (e) {
            console.warn(e.message);
            return; // Nothing we can do without a session.
        }

        const user = window.userSession.user;

        // --- Load profile row ---
        const { data } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data) {
            totalSeconds = data.total_time_spent || 0;
            applyProfileData(
                data.display_name || user.email.split('@')[0],
                data.email       || user.email
            );
        } else {
            // Row doesn't exist yet — create it.
            const fallbackName = user.user_metadata?.first_name || user.email.split('@')[0];
            applyProfileData(fallbackName, user.email);
            await window.supabaseClient.from('profiles').upsert({
                id: user.id,
                email: user.email,
                display_name: fallbackName,
                total_time_spent: 0
            });
        }

        // Render stats now that totalSeconds is populated.
        await updateProfileUI();

        // --- Button listeners (attach only once) ---
        if (!listenersAttached) {
            listenersAttached = true;

            const editBtn    = document.getElementById('edit-profile-btn');
            const deleteBtn  = document.getElementById('delete-account-btn');
            const signOutBtn = document.getElementById('sign-out-btn');

            if (editBtn)    editBtn.onclick    = openEditProfileModal;
            if (deleteBtn)  deleteBtn.onclick  = handleDeleteAccount;
            if (signOutBtn) signOutBtn.onclick = () => { window.location.href = '?logout'; };

            const saveEditBtn   = document.getElementById('save-edit-profile-btn');
            const cancelEditBtn = document.getElementById('cancel-edit-profile-btn');
            if (saveEditBtn)   saveEditBtn.onclick   = saveProfileChanges;
            if (cancelEditBtn) cancelEditBtn.onclick = () =>
                document.getElementById('edit-profile-modal').classList.remove('visible');

            // Visibility API — pause/resume tracking when tab is hidden.
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    sessionStart = Date.now();
                    isTracking = true;
                } else {
                    saveAccumulatedTime();
                    isTracking = false;
                }
            });

            // Best-effort final flush on page close via sendBeacon (async-safe).
            window.addEventListener('beforeunload', () => {
                const delta = Math.floor((Date.now() - sessionStart) / 1000);
                if (delta > 0 && window.userSession && window.supabaseClient) {
                    const newTotal = totalSeconds + delta;
                    try {
                        const url = `${window.supabaseClient.supabaseUrl}/rest/v1/profiles?id=eq.${window.userSession.user.id}`;
                        navigator.sendBeacon(url, new Blob(
                            [JSON.stringify({ total_time_spent: newTotal })],
                            { type: 'application/json' }
                        ));
                    } catch (_) { /* silent — periodic saves already covered most of the session */ }
                }
            });

            // Periodic save + clock refresh every 10 s.
            setInterval(async () => {
                if (isTracking && document.visibilityState === 'visible') {
                    await saveAccumulatedTime();
                    updateTimeDisplay();
                }
            }, 10000);
        }
    };

    // ------------------------------------------------------------------
    // 4. Time helpers
    // ------------------------------------------------------------------
    async function saveAccumulatedTime() {
        const delta = Math.floor((Date.now() - sessionStart) / 1000);
        if (delta > 0) {
            totalSeconds += delta;
            sessionStart = Date.now();
            if (window.userSession && window.supabaseClient) {
                await window.supabaseClient
                    .from('profiles')
                    .update({ total_time_spent: totalSeconds })
                    .eq('id', window.userSession.user.id);
            }
        }
    }

    function updateTimeDisplay() {
        const el = document.getElementById('profile-total-time');
        if (el) el.innerText = formatDuration(totalSeconds);
    }

    function formatDuration(seconds) {
        if (seconds < 60) return `${seconds}s`;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    // ------------------------------------------------------------------
    // 5. UI helpers
    // ------------------------------------------------------------------
    function applyProfileData(name, email) {
        const nameEl   = document.getElementById('profile-display-name');
        const emailEl  = document.getElementById('profile-display-email');
        const avatarEl = document.getElementById('profile-avatar');
        if (nameEl)   nameEl.innerText  = name;
        if (emailEl)  emailEl.innerText = email;
        if (avatarEl && name) avatarEl.innerText = name.charAt(0).toUpperCase();
    }

    async function updateProfileUI() {
        const notesEl = document.getElementById('profile-total-notes');
        const timeEl  = document.getElementById('profile-total-time');

        if (notesEl && window.userSession) {
            const { count } = await window.supabaseClient
                .from('notes')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', window.userSession.user.id);
            notesEl.innerText = count ?? 0;
        }

        if (timeEl) timeEl.innerText = formatDuration(totalSeconds);

        if (window.lucide && isViewVisible('profile-view')) lucide.createIcons();
    }

    function isViewVisible(viewId) {
        const view = document.getElementById(viewId);
        return view && view.classList.contains('active-view');
    }

    // ------------------------------------------------------------------
    // 6. Modal: edit profile
    // ------------------------------------------------------------------
    async function openEditProfileModal() {
        const modal      = document.getElementById('edit-profile-modal');
        const nameInput  = document.getElementById('edit-profile-name');
        const emailInput = document.getElementById('edit-profile-email');
        if (!modal || !nameInput || !emailInput || !window.userSession) return;

        const { data } = await window.supabaseClient
            .from('profiles')
            .select('display_name, email')
            .eq('id', window.userSession.user.id)
            .single();

        nameInput.value  = data?.display_name || window.userSession.user.user_metadata?.first_name || '';
        emailInput.value = data?.email        || window.userSession.user.email || '';
        modal.classList.add('visible');
    }

    async function saveProfileChanges() {
        const nameInput  = document.getElementById('edit-profile-name');
        const emailInput = document.getElementById('edit-profile-email');
        if (!nameInput || !emailInput || !window.userSession) return;

        const newName  = nameInput.value.trim();
        const newEmail = emailInput.value.trim() || window.userSession.user.email;

        const btn  = document.getElementById('save-edit-profile-btn');
        const orig = btn.textContent;
        btn.textContent = 'Saving...';
        btn.disabled    = true;

        const { error } = await window.supabaseClient
            .from('profiles')
            .update({ display_name: newName, email: newEmail })
            .eq('id', window.userSession.user.id);

        btn.textContent = orig;
        btn.disabled    = false;

        if (!error) {
            applyProfileData(newName, newEmail);
            document.getElementById('edit-profile-modal').classList.remove('visible');
        }
    }

    // ------------------------------------------------------------------
    // 7. Delete account
    // ------------------------------------------------------------------
    async function handleDeleteAccount() {
        const confirmed = await window.customConfirm(
            "This will permanently delete all your notes, folders, and settings. This action cannot be undone.",
            "Delete All Data?"
        );
        if (!confirmed || !window.userSession) return;
        await window.supabaseClient.from('profiles').delete().eq('id', window.userSession.user.id);
        await window.supabaseClient.auth.signOut();
        window.location.reload();
    }

    // Public helper for manual refresh / debugging.
    window.refreshProfileStats = updateProfileUI;

})();
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
                
                // Optional: Create the profile if it doesn't exist
                await window.supabaseClient.from('profiles').upsert({
                    id: user.id,
                    email: user.email,
                    display_name: fallbackName,
                    total_time_spent: 0
                });
            }
        }

        
        updateProfileUI();

        // 3. Button Listeners
        const editBtn = document.getElementById('edit-profile-btn');
        const deleteBtn = document.getElementById('delete-account-btn');
        const signOutBtn = document.getElementById('sign-out-btn');

        if (editBtn) {
            editBtn.onclick = openEditProfileModal;
        }

        if (deleteBtn) {
            deleteBtn.onclick = handleDeleteAccount;
        }

        if (signOutBtn) {
            signOutBtn.onclick = () => {
                // Simulate sign out by reloading with logout parameter to trigger auth status reset
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

        // Save time before window closes
        window.addEventListener('beforeunload', saveAccumulatedTime);

        // Global interval to accumulate time every 10 seconds
        setInterval(() => {
            if (isTracking && document.visibilityState === 'visible') {
                saveAccumulatedTime();
            }
        }, 10000);
    };

    async function saveAccumulatedTime() {
        const now = Date.now();
        const deltaSeconds = Math.floor((now - sessionStart) / 1000);
        if (deltaSeconds > 0) {
            totalSeconds += deltaSeconds;
            sessionStart = now; // Reset session start to avoid double counting
            
            if (window.userSession && window.supabaseClient) {
                await window.supabaseClient.from('profiles').update({ total_time_spent: totalSeconds }).eq('id', window.userSession.user.id);
            }
        }
    }

    async function openEditProfileModal() {
        const modal = document.getElementById('edit-profile-modal');
        const nameInput = document.getElementById('edit-profile-name');
        const emailInput = document.getElementById('edit-profile-email');

        if (modal && nameInput && emailInput && window.userSession) {
            const { data } = await window.supabaseClient.from('profiles').select('display_name, email').eq('id', window.userSession.user.id).single();
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

            const { error } = await window.supabaseClient.from('profiles').update({
                display_name: newName,
                email: newEmail
            }).eq('id', window.userSession.user.id);

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
            // Note: Normally we'd use a serverless function to delete an auth user, but for frontend-only Supabase, we delete their profile data. The cascade handles the rest.
            // Then we sign out.
            await window.supabaseClient.from('profiles').delete().eq('id', window.userSession.user.id);
            await window.supabaseClient.auth.signOut();
            window.location.reload();
        }
    }

    async function updateProfileUI() {
        const notesValue = document.getElementById('profile-total-notes');
        const timeValue = document.getElementById('profile-total-time');

        if (notesValue && window.userSession) {
            const { count } = await window.supabaseClient.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', window.userSession.user.id);
            notesValue.innerText = count || 0;
        }

        if (timeValue) {
            timeValue.innerText = formatDuration(totalSeconds);
        }
        
        // Re-apply icons if needed
        if (window.lucide) lucide.createIcons();
    }

    function formatDuration(seconds) {
        if (seconds < 60) return `${seconds}s`;
        
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        
        if (h > 0) {
            return `${h}h ${m}m`;
        }
        return `${m}m`;
    }

    function isViewVisible(viewId) {
        const view = document.getElementById(viewId);
        return view && view.classList.contains('active-view');
    }

    // Helper for debugging/manual triggers
    window.refreshProfileStats = updateProfileUI;

})();

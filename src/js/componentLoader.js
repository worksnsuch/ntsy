/**
 * NTSY Component Loader
 * Dynamically loads HTML fragments from global JS variables.
 */
window.ComponentLoader = {
    components: [
        { id: 'sidebar-placeholder', fragment: 'SIDEBAR_FRAGMENT' },
        { id: 'homepage-placeholder', fragment: 'HOMEPAGE_FRAGMENT' },
        { id: 'editor-placeholder', fragment: 'EDITOR_FRAGMENT' },
        { id: 'profile-placeholder', fragment: 'PROFILE_FRAGMENT' },
        { id: 'settings-placeholder', fragment: 'SETTINGS_FRAGMENT' },
        { id: 'music-player-placeholder', fragment: 'MUSIC_PLAYER_FRAGMENT' },
        { id: 'modals-placeholder', fragment: 'MODALS_FRAGMENT' },
        { id: 'chat-buddy-placeholder', fragment: 'CHAT_BUDDY_FRAGMENT' },
        { id: 'auth-placeholder', fragment: 'AUTH_FRAGMENT' }
    ],

    async load() {
        console.log("[ComponentLoader] Injecting components...");
        this.components.forEach(comp => {
            const html = window[comp.fragment];
            if (!html) {
                console.warn(`[ComponentLoader] Fragment window.${comp.fragment} not found.`);
                return;
            }
            const placeholder = document.getElementById(comp.id);
            if (placeholder) {
                placeholder.outerHTML = html;
            } else {
                console.warn(`[ComponentLoader] Placeholder #${comp.id} not found.`);
            }
        });
        console.log("[ComponentLoader] All components injected.");
    }
};

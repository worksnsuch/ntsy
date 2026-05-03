/* Responsive Layout Manager */

window.initResponsive = function() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtns = [
        document.getElementById('mobile-sidebar-toggle'),
        document.getElementById('mobile-sidebar-toggle-editor')
    ];

    function toggleSidebar() {
        if (!sidebar || !overlay) return;
        sidebar.classList.toggle('open');
        overlay.classList.toggle('visible');
    }

    function closeSidebar() {
        if (!sidebar || !overlay) return;
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
    }

    toggleBtns.forEach(btn => {
        if (btn) {
          // Remove existing listener if any (though init is usually called once)
          btn.onclick = (e) => {
              e.stopPropagation();
              toggleSidebar();
          };
        }
    });

    if (overlay) {
      overlay.onclick = closeSidebar;
    }

    // Close sidebar on navigation (mobile)
    if (sidebar) {
      const sidebarLinks = sidebar.querySelectorAll('button, a');
      sidebarLinks.forEach(link => {
          link.addEventListener('click', () => {
              if (window.innerWidth <= 768) {
                  closeSidebar();
              }
          });
      });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
};

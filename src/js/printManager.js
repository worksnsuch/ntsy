/**
 * Print Manager - Advanced Pagination and Page Numbering for Notes
 * Mimics Google Docs behavior by converting content into simulated A4 pages.
 */

window.PrintManager = {
    // A4 dimensions at 96 DPI
    A4_HEIGHT_PX: 1122,
    A4_WIDTH_PX: 794,
    SAFE_MARGIN: 40, // Extra buffer to prevent cutoff

    init() {
        // Listen for internal print requests
        document.addEventListener('request_print', () => this.triggerPrint());
        
        // Expose to global scope for button clicks
        window.printDocument = () => this.triggerPrint();
    },

    async triggerPrint() {
        console.log('Preparing clean print layout...');
        
        // 1. Sync latest changes before printing
        if (typeof window.syncCurrentNote === 'function') {
            window.syncCurrentNote();
        }

        const title = document.getElementById('note-title-input').value || 'Untitled Note';
        const bodyHtml = document.getElementById('note-body-input').innerHTML;

        // 2. Create the Print Container
        const printContainer = document.createElement('div');
        printContainer.id = 'print-document-container';
        document.body.appendChild(printContainer);

        // 3. Process Pagination
        this.paginateContent(printContainer, title, bodyHtml);

        // 4. Trigger Native Print
        setTimeout(() => {
            window.print();
            
            // 5. Cleanup
            setTimeout(() => {
                const container = document.getElementById('print-document-container');
                if (container) container.remove();
            }, 500);
        }, 100);
    },

    paginateContent(container, title, html) {
        // Create hidden measuring div
        const measureDiv = document.createElement('div');
        measureDiv.style.width = '21cm'; // Standard A4 width
        measureDiv.style.padding = '2cm';
        measureDiv.style.visibility = 'hidden';
        measureDiv.style.position = 'absolute';
        measureDiv.style.left = '-9999px';
        measureDiv.className = 'editor-body-input'; // Use same font/spacing
        document.body.appendChild(measureDiv);

        // Temp holder for content items
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const items = Array.from(temp.childNodes);

        let currentPage = this.createPage(container, 1);
        let currentContentArea = currentPage.querySelector('.print-content');
        
        // Estimation for max height (A4 height minus paddings/footers)
        const MAX_PAGE_HEIGHT = this.A4_HEIGHT_PX - (192); // ~2cm padding top/bottom + footer space

        items.forEach(item => {
            const clone = item.cloneNode(true);
            measureDiv.appendChild(clone);
            
            // If the item itself is bigger than a page (e.g. huge image), it just gets clipped or scaled by CSS
            if (measureDiv.offsetHeight > MAX_PAGE_HEIGHT && currentContentArea.childNodes.length > 0) {
                // Time for a new page
                const totalPages = container.querySelectorAll('.print-page').length;
                currentPage = this.createPage(container, totalPages + 1);
                currentContentArea = currentPage.querySelector('.print-content');
                
                // Clear measure div and add the current item to it for next round
                measureDiv.innerHTML = '';
                measureDiv.appendChild(clone);
            }
            
            currentContentArea.appendChild(clone);
        });

        measureDiv.remove();
    },

    createPage(container, number) {
        const page = document.createElement('div');
        page.className = 'print-page';
        
        page.innerHTML = `
            <div class="print-content"></div>
        `;
        
        container.appendChild(page);
        return page;
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => PrintManager.init());

window.notes = [];
window.currentNoteId = null;
/** @type {string} */
let currentNoteId = null;
let searchTerm = '';

// DOM Elements (populated in init)
let notesGrid, notesCount, homepageView, editorView, backBtn, deleteNoteBtn, lockNoteBtn, titleInput, bodyInput;
let currentLockPasscode = null;

// Convenience accessor — always reads the live array from the global store
Object.defineProperty(window, '_notes', { get() { return window.notes; } });

/**
 * Escapes HTML special characters to prevent XSS when inserting user
 * content into innerHTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function saveNoteToDB(currentNote) {
    clearTimeout(window.saveNotesTimeout);
    window.saveNotesTimeout = setTimeout(async () => {
        if (window.userSession && window.supabaseClient) {
            const notePayload = {
                id: currentNote.id,
                user_id: window.userSession.user.id,
                folder_id: currentNote.folderId,
                title: currentNote.title,
                body: currentNote.body,
                is_locked: currentNote.isLocked,
                passcode: currentNote.passcode,
                line_height: currentNote.lineHeight,
                word_spacing: currentNote.wordSpacing,
                letter_spacing: currentNote.letterSpacing,
                page_margin: currentNote.pageMargin,
                attachments: currentNote.attachments || [],
                updated_at: new Date(currentNote.updatedAt).toISOString()
            };
            
            await window.supabaseClient.from('notes').upsert(notePayload);
            if (typeof window.updateFoldersList === 'function') window.updateFoldersList();
        }
    }, 1000);
}

async function deleteNoteFromDB(noteId) {
    if (!window.userSession || !window.supabaseClient) return;
    await window.supabaseClient.from('notes').delete().eq('id', noteId);
}

// saveNotes is fully defined below (line ~739); this block removed to avoid duplicate.

window.showView = function(viewId) {
  const views = document.querySelectorAll('.view');
  views.forEach(v => v.classList.remove('active-view'));
  
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active-view');
  }
  
  // Toggle Study Buddy visibility: Only visible in Editor view
  if (typeof window.toggleStudyBuddyVisibility === 'function') {
    window.toggleStudyBuddyVisibility(viewId === 'editor-view');
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
};

function adjustFontSize(delta) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;
  
  // Get current font size (heuristic)
  let currentSize = 16;
  const sizeDisplay = document.getElementById('current-font-size');
  if (sizeDisplay) currentSize = parseInt(sizeDisplay.textContent) || 16;
  
  const newSize = Math.max(8, Math.min(100, currentSize + delta));
  window.format('fontSize', newSize);
}

function showWordCount() {
  const text = bodyInput.innerText || "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  
  const selection = window.getSelection().toString();
  const selWords = selection.trim() ? selection.trim().split(/\s+/).length : 0;
  const selChars = selection.length;
  
  let msg = `Words: ${words}\nCharacters: ${chars}`;
  if (selection) {
    msg += `\n\nSelection:\nWords: ${selWords}\nCharacters: ${selChars}`;
  }
  
  showConfirmModal(msg, () => {}); // Using existing modal for simple info
}

function handleGlobalKeyboard(e) {
  const modKey = e.ctrlKey || e.metaKey;
  const shift = e.shiftKey;
  const alt = e.altKey;
  
  // Prevent default formatting shortcuts browser might handle differently
  if (modKey && !alt && !shift) {
    if (e.key.toLowerCase() === 'b') { e.preventDefault(); window.format('bold'); }
    if (e.key.toLowerCase() === 'i') { e.preventDefault(); window.format('italic'); }
    if (e.key.toLowerCase() === 'u') { e.preventDefault(); window.format('underline'); }
    if (e.key.toLowerCase() === 'k') { e.preventDefault(); window.format('createLink', prompt('URL:')); }
    if (e.key.toLowerCase() === 'p') { e.preventDefault(); if (typeof window.printDocument === 'function') window.printDocument(); else window.print(); }
    if (e.key === 'backslash' || e.key === '\\') { e.preventDefault(); window.format('removeFormat'); }
    if (e.key === 'Enter') { e.preventDefault(); window.format('insertHorizontalRule'); }
  }

  // Redo: Ctrl+Shift+Z or Ctrl+Y
  if (modKey && (shift && e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y')) {
    e.preventDefault();
    document.execCommand('redo');
  }

  // Open Link: Alt+Enter
  if (alt && e.key === 'Enter') {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      let node = selection.anchorNode;
      while (node && node !== bodyInput) {
        if (node.tagName === 'A') {
          window.open(node.href, '_blank');
          e.preventDefault();
          break;
        }
        node = node.parentNode;
      }
    }
  }

  // Strikethrough: Alt+Shift+5
  if (alt && shift && e.key === '5') { e.preventDefault(); window.format('strikeThrough'); }

  // Superscript/Subscript
  if (modKey && e.key === '.') { e.preventDefault(); window.format('superscript'); }
  if (modKey && e.key === ',') { e.preventDefault(); window.format('subscript'); }

  // Font Size: Ctrl+Shift+. / ,
  if (modKey && shift && e.key === '>') { e.preventDefault(); adjustFontSize(2); }
  if (modKey && shift && e.key === '<') { e.preventDefault(); adjustFontSize(-2); }
  // Keyboard keys for > and < are . and , with shift
  if (modKey && shift && e.key === '.') { e.preventDefault(); adjustFontSize(2); }
  if (modKey && shift && e.key === ',') { e.preventDefault(); adjustFontSize(-2); }

  // Alignment: Ctrl+Shift+L,E,R,J
  if (modKey && shift) {
    if (e.key.toLowerCase() === 'l') { e.preventDefault(); window.format('justifyLeft'); }
    if (e.key.toLowerCase() === 'e') { e.preventDefault(); window.format('justifyCenter'); }
    if (e.key.toLowerCase() === 'r') { e.preventDefault(); window.format('justifyRight'); }
    if (e.key.toLowerCase() === 'j') { e.preventDefault(); window.format('justifyFull'); }
  }

  // Lists: Ctrl+Shift+7/8
  if (modKey && shift && e.key === '7') { e.preventDefault(); window.format('insertOrderedList'); }
  if (modKey && shift && e.key === '8') { e.preventDefault(); window.format('insertUnorderedList'); }

  // Indent: Ctrl+[ / ]
  if (modKey && e.key === '[') { e.preventDefault(); window.format('outdent'); }
  if (modKey && e.key === ']') { e.preventDefault(); window.format('indent'); }

  // Styles: Ctrl+Alt+0-6
  if (modKey && alt) {
    if (e.key >= '1' && e.key <= '6') { e.preventDefault(); window.format('formatBlock', 'H' + e.key); }
    if (e.key === '0') { e.preventDefault(); window.format('formatBlock', 'P'); }
  }

  // Word Count: Ctrl+Shift+C
  if (modKey && shift && e.key.toLowerCase() === 'c') { e.preventDefault(); showWordCount(); }

  // Copy/Paste Formatting: Ctrl+Alt+C/V
  if (modKey && alt) {
    if (e.key.toLowerCase() === 'c') { e.preventDefault(); copyFormatting(); }
    if (e.key.toLowerCase() === 'v') { e.preventDefault(); applyFormatting(); }
  }

  // Shortcuts: Ctrl+/
  if (modKey && (e.key === '/' || e.key === '?')) { e.preventDefault(); showShortcutsHelp(); }
}

function showShortcutsHelp() {
  const modal = document.getElementById('confirm-modal');
  const titleEl = document.getElementById('confirm-title');
  const msgEl = document.getElementById('confirm-message');
  
  if (modal && titleEl && msgEl) {
    titleEl.textContent = 'Keyboard Shortcuts';
    msgEl.innerHTML = `
      <div style="text-align: left; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
        <div><kbd>Ctrl+B</kbd> Bold</div>
        <div><kbd>Ctrl+I</kbd> Italic</div>
        <div><kbd>Ctrl+U</kbd> Underline</div>
        <div><kbd>Ctrl+K</kbd> Link</div>
        <div><kbd>Ctrl+Alt+C/V</kbd> Copy/Paste Format</div>
        <div><kbd>Ctrl+Alt+1-6</kbd> Headings</div>
        <div><kbd>Ctrl+Shift+7/8</kbd> Lists</div>
        <div><kbd>Ctrl+/</kbd> Help</div>
        <div><kbd>Ctrl+Shift+C</kbd> Word Count</div>
      </div>
    `;
    modal.classList.add('visible');
    // We don't need a callback here as it's just info
    confirmCallback = () => {};
  }
}

let copiedFormatting = null;

function copyFormatting() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const node = selection.anchorNode.parentElement;
    const style = window.getComputedStyle(node);
    copiedFormatting = {
      color: style.color,
      backgroundColor: style.backgroundColor,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      textDecoration: style.textDecoration
    };
    console.log('Formatting copied:', copiedFormatting);
  }
}

function applyFormatting() {
  if (!copiedFormatting) return;
  
  document.execCommand('styleWithCSS', false, true);
  if (copiedFormatting.color) document.execCommand('foreColor', false, copiedFormatting.color);
  if (copiedFormatting.backgroundColor) document.execCommand('backColor', false, copiedFormatting.backgroundColor);
  if (copiedFormatting.fontSize) {
    // execCommand fontSize is 1-7, but we use computed style px. 
    // This is hard to map perfectly with execCommand. 
    // We'll skip exact size or wrap in a span.
  }
  if (copiedFormatting.fontWeight === 'bold' || parseInt(copiedFormatting.fontWeight) >= 700) document.execCommand('bold');
  if (copiedFormatting.fontStyle === 'italic') document.execCommand('italic');
  if (copiedFormatting.textDecoration.includes('underline')) document.execCommand('underline');
  
  if (bodyInput) bodyInput.focus();
}

// Keyboard listeners moved to initNotes

// Paste listener moved to initNotes

window.format = function (command, value = null) {
  document.execCommand('styleWithCSS', false, true);
  if (command === 'fontSize' && parseInt(value) > 7) {
    const selection = window.getSelection();
    if (!selection.isCollapsed) {
      // Use native command to do the heavy lifting of DOM splitting
      document.execCommand('fontSize', false, '7');
      
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let container = range.commonAncestorContainer;
        if (container.nodeType !== Node.ELEMENT_NODE) {
          container = container.parentNode;
        }
        
        const elements = container.querySelectorAll ? Array.from(container.querySelectorAll('*')) : [];
        if (container.nodeType === Node.ELEMENT_NODE) elements.push(container);
        
        elements.forEach(el => {
          // Verify element is partially or fully selected
          if (selection.containsNode(el, true) || el === container) {
            if (el.tagName === 'FONT' && el.getAttribute('size') === '7') {
              el.removeAttribute('size');
              el.style.fontSize = `${value}px`;
            } else if (el.style && (el.style.fontSize === 'xxx-large' || el.style.fontSize === '-webkit-xxx-large' || el.style.fontSize === '48px' || el.style.fontSize === '7px')) {
              el.style.fontSize = `${value}px`;
            }
          }
        });
      }
    }
  } else {
    document.execCommand(command, false, value);
  }
  
  if (command === 'fontSize') {
    const sizeDisplay = document.getElementById('current-font-size');
    if (sizeDisplay) {
      const sizeMap = { '1': '10', '2': '13', '3': '16', '4': '18', '5': '24', '6': '32', '7': '48' };
      sizeDisplay.textContent = sizeMap[value] || value;
    }
  }

  if (bodyInput) bodyInput.focus();
  if (typeof updateToolbarStates === 'function') updateToolbarStates();
};

function stripHtml(html) {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

window.renderNotes = function() {
  // Clear existing note cards (keep add button)
  const existingCards = notesGrid.querySelectorAll('.note-card:not(.add-note-card)');
  existingCards.forEach(card => card.remove());

  let filteredNotes = [];
  if (searchTerm) {
    filteredNotes = window.notes.filter(n =>
      (n.title && n.title.toLowerCase().includes(searchTerm)) ||
      (n.body && n.body.toLowerCase().includes(searchTerm))
    );
  } else {
    filteredNotes = (typeof currentFilterFolderId !== 'undefined' && currentFilterFolderId !== null)
      ? window.notes.filter(n => n.folderId === currentFilterFolderId)
      : window.notes.filter(n => n.folderId === null);
  }

  notesCount.textContent = `${filteredNotes.length} note${filteredNotes.length !== 1 ? 's' : ''}`;

  const headerTitle = document.querySelector('.main-header h1');
  if (searchTerm && headerTitle) {
      headerTitle.textContent = 'Search Results';
  } else if (headerTitle && typeof currentFilterFolderId !== 'undefined' && currentFilterFolderId) {
     const f = folders.find(f => f.id === currentFilterFolderId);
      if (f) {
        const editHtml = `<button id="header-folder-edit-btn" class="icon-btn header-action-btn" title="Rename Folder">
          <i data-lucide="edit-2" style="width:20px; height:20px; color: var(--text-secondary);"></i>
        </button>`;
        const colorHtml = `<button id="header-folder-color-btn" class="icon-btn header-action-btn" title="Change Color">
          <i data-lucide="palette" style="width:20px; height:20px; color: ${f.color};"></i>
        </button>`;
        const starHtml = `<button id="header-folder-star-btn" class="icon-btn header-action-btn">
          <i data-lucide="star" style="width:20px; height:20px; color: #FFFFFF; ${f.isPriority ? 'fill: #FFFFFF;' : ''}"></i>
        </button>`;
        const lockHtml = `<button id="header-folder-lock-btn" class="icon-btn header-action-btn">
          <i data-lucide="${f.isLocked ? 'lock' : 'unlock'}" style="width:20px; height:20px; color: ${f.isLocked ? '#FFFFFF' : 'var(--text-secondary)'};"></i>
        </button>`;
        const trashHtml = `<button id="header-folder-delete-btn" class="icon-btn header-action-btn">
          <i data-lucide="trash-2" style="width:20px; height:20px; color: var(--text-secondary);"></i>
        </button>`;
        headerTitle.innerHTML = `<span id="header-folder-name" style="cursor: pointer;" title="Double click to rename">${escapeHtml(f.name)}</span> ${editHtml} ${colorHtml} ${starHtml} ${lockHtml} ${trashHtml}`;
        setTimeout(() => {
          const headerEditBtn = document.getElementById('header-folder-edit-btn');
          const headerNameSpan = document.getElementById('header-folder-name');
          const startEditing = () => {
            if (document.getElementById('header-folder-rename-input')) return;
            const currentName = f.name;
            headerNameSpan.innerHTML = `<input type="text" id="header-folder-rename-input" autocomplete="off" value="${currentName}" style="font-size: 32px; font-weight: 700; background: transparent; border: 1px dashed var(--accent-yellow); color: var(--text-primary); border-radius: 4px; outline: none; width: auto; max-width: 400px; font-family: inherit;">`;
            const input = document.getElementById('header-folder-rename-input');
            input.focus();
            input.select();
            
            const finishEditing = () => {
              if (!input) return;
              const newName = input.value.trim();
              if (newName && newName !== currentName) {
                f.name = newName;
                if (typeof saveFolders === 'function') saveFolders();
                if (typeof renderFolders === 'function') renderFolders();
              }
              renderNotes();
            };
            
            input.addEventListener('blur', finishEditing);
            input.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') finishEditing();
              if (e.key === 'Escape') renderNotes();
            });
            input.addEventListener('click', e => e.stopPropagation());
          };
          if (headerEditBtn) headerEditBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startEditing();
          });
          if (headerNameSpan) {
            headerNameSpan.addEventListener('click', (e) => e.stopPropagation());
            headerNameSpan.addEventListener('dblclick', (e) => {
              e.stopPropagation();
              startEditing();
            });
          }

          const headerColorBtn = document.getElementById('header-folder-color-btn');
          if (headerColorBtn) {
            headerColorBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              if (typeof showColorPicker === 'function') {
                showColorPicker(f.id, headerColorBtn);
              }
            });
          }

          const headerStarBtn = document.getElementById('header-folder-star-btn');
          if (headerStarBtn) {
            headerStarBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              f.isPriority = !f.isPriority;
              if (typeof saveFolders === 'function') saveFolders();
              if (typeof renderFolders === 'function') renderFolders();
              renderNotes();
            });
          }
          const headerLockBtn = document.getElementById('header-folder-lock-btn');
          if (headerLockBtn) {
            headerLockBtn.addEventListener('click', (e) => {
              e.stopPropagation();
             if (f.isLocked) {
               showPasscodeModal('Unlock Folder', 'Enter passcode to remove lock permanently.', (pin) => {
                 if (pin === f.passcode) {
                   f.isLocked = false;
                   f.passcode = null;
                   if (typeof saveFolders === 'function') saveFolders();
                   if (typeof renderFolders === 'function') renderFolders();
                   renderNotes();
                 } else { alert('Incorrect Passcode.'); }
               });
             } else {
               showPasscodeModal('Lock Folder', 'Enter a 4-digit PIN to lock this folder.', (pin) => {
                 f.isLocked = true;
                 f.passcode = pin;
                 // Session clearing logic removed to enforce prompt every time 
                 if (typeof saveFolders === 'function') saveFolders();
                 if (typeof renderFolders === 'function') renderFolders();
                 renderNotes();
               });
             }
           });
         }

          const headerDeleteBtn = document.getElementById('header-folder-delete-btn');
          if (headerDeleteBtn) {
            headerDeleteBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              if (typeof showConfirmModal === 'function') {
                showConfirmModal(`Delete the "${f.name}" folder? Notes inside will become uncategorized.`, () => {
                  if (typeof folders !== 'undefined') {
                    folders = folders.filter(fol => fol.id !== f.id);
                    currentFilterFolderId = null;
                    if (typeof saveFolders === 'function') saveFolders();
                    if (typeof renderFolders === 'function') renderFolders();
                    
                    // Uncategorize notes
                    notes.forEach(n => {
                      if (n.folderId === f.id) {
                          n.folderId = null;
                          saveNoteToDB(n);
                      }
                    });
                    renderNotes();
                  }
                });
              }
            });
          }
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 0);
      }
  } else if (headerTitle) {
     headerTitle.textContent = 'Notes';
  }

  filteredNotes.forEach((note, index) => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.dataset.id = note.id;
    card.draggable = true;
    card.style.animationDelay = `${index * 30}ms`;

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', note.id);
      e.dataTransfer.effectAllowed = 'move';
      card.style.opacity = '0.5';
    });
    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
    });
    
    // Format date string
    const d = new Date(note.updatedAt);
    const dateStr = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear().toString().slice(-2)}`;

    const plainBody = stripHtml(note.body);
    let previewText = plainBody ? plainBody.substring(0, 50) + (plainBody.length > 50 ? '...' : '') : 'Empty note';
    if (note.isLocked) {
      previewText = '<span style="display:flex; align-items:center; gap:6px;">Locked Note <i data-lucide="lock" style="width:14px; height:14px; color:var(--text-secondary);"></i></span>';
    }

    let folderBadgeHtml = '';
    if (note.folderId && typeof folders !== 'undefined') {
      const folder = folders.find(f => f.id === note.folderId);
      if (folder) folderBadgeHtml = `<div class="folder-badge" style="background-color: ${folder.color}15; color: ${folder.color}; border: 1px solid ${folder.color}30">${folder.name}</div>`;
    }

    const highlightText = (text, term) => {
        if (!term) return text;
        // Escape special regex characters in the user-provided search term
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Escape the text itself to prevent XSS, then re-apply highlight spans
        const safeText = escapeHtml(text);
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        return safeText.replace(regex, '<span class="search-highlight">$1</span>');
    };

    let displayTitle = note.title || 'Untitled Note';
    let displayPreview = plainBody || 'No additional text';

    if (searchTerm) {
        displayTitle = highlightText(displayTitle, searchTerm);
        displayPreview = highlightText(displayPreview, searchTerm);
    }

    let pdfBadgeHtml = '';
    if (note.attachments && note.attachments.some(a => a.type === 'pdf')) {
      pdfBadgeHtml = `<div class="pdf-badge"><i data-lucide="file-text" size="10"></i> PDF</div>`;
    }

    if (note.isLocked) {
        displayPreview = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; opacity:0.4; gap:8px; padding-bottom: 30px;">
                <i data-lucide="lock" style="width:24px; height:24px;"></i>
                <span style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Protected</span>
            </div>
        `;
    }

    card.innerHTML = `
      <div class="note-header">
        <h3>${displayTitle}</h3>
        <span class="note-date">${dateStr}</span>
      </div>
      <button class="delete-note-grid-btn"><i data-lucide="trash" size="14" style="pointer-events: none;"></i></button>
      ${pdfBadgeHtml}
      <div class="note-preview">${displayPreview}</div>
    `;

    card.addEventListener('click', (e) => {
      // prevent opening editor if clicking delete btn
      if (e.target.closest('.delete-note-grid-btn')) {
        showConfirmModal('Are you sure you want to delete this note?', () => {
          window.notes = window.notes.filter(n => n.id !== note.id);
          deleteNoteFromDB(note.id);
          renderNotes();
        });
        return;
      }
      openEditor(note.id);
    });
    notesGrid.appendChild(card);
  });
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function updateLockIconState() {
  if (currentLockPasscode) {
    lockNoteBtn.innerHTML = '<i data-lucide="lock" size="20"></i>';
    lockNoteBtn.classList.add('active');
  } else {
    lockNoteBtn.innerHTML = '<i data-lucide="unlock" size="20"></i>';
    lockNoteBtn.classList.remove('active');
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function openEditor(id = null) {
  if (id) {
    const note = window.notes.find(n => n.id === id);
    if (note && note.isLocked) {
      showPasscodeModal('Locked Note', 'Enter passcode to open this note.', (pin) => {
        if (pin === note.passcode) {
          _openEditorInternal(id);
        } else {
          alert('Incorrect Passcode.');
        }
      });
      return;
    }
  }
  _openEditorInternal(id);
}

function _openEditorInternal(id = null) {
  if (typeof hideImageOverlay === 'function') hideImageOverlay();
  currentNoteId = id;
  window.currentNoteId = id;
  currentLockPasscode = null;
  const selectElement = document.getElementById('note-folder-select');

  if (id) {
    window.history.replaceState(null, '', '#' + id);
    const note = window.notes.find(n => n.id === id);
    if (note) {
      titleInput.value = note.title || '';
      bodyInput.innerHTML = note.body || '';
      
      // Load formatting
      bodyInput.style.lineHeight = note.lineHeight || '1.6';
      bodyInput.style.wordSpacing = note.wordSpacing || 'normal';
      bodyInput.style.letterSpacing = note.letterSpacing || 'normal';
      
      if (typeof window.changePageMargin === 'function') window.changePageMargin(note.pageMargin || 'normal');
      currentLockPasscode = note.isLocked ? note.passcode : null;
      if (typeof populateFolderDropdown === 'function') populateFolderDropdown(selectElement, note.folderId);

      // Render PDF Attachments
      renderPdfAttachments(note.attachments);
    }
  } else {
    window.history.replaceState(null, '', '#new');
    // New Note
    titleInput.value = '';
    bodyInput.innerHTML = '';
    
    // Default formatting
    bodyInput.style.lineHeight = '1.6';
    bodyInput.style.wordSpacing = 'normal';
    bodyInput.style.letterSpacing = 'normal';
    if (typeof window.changePageMargin === 'function') window.changePageMargin('normal');
    if (typeof populateFolderDropdown === 'function') populateFolderDropdown(selectElement, currentFilterFolderId);
    renderPdfAttachments([]);
  }
  
  updateLockIconState();
  
  // Reset Chat Buddy on note change
  if (typeof window.resetChatBuddy === 'function') window.resetChatBuddy();
  
  window.showView('editor-view');
}

function syncCurrentNote() {
    const homepageView = document.getElementById('homepage-view');
    if (homepageView && homepageView.classList.contains('active-view')) return; // Don't sync if not in editor
    
    const currentTitle = titleInput.value.trim();
    const currentBody = bodyInput.innerHTML;
    const folderSelect = document.getElementById('note-folder-select');
    const selectedFolderId = (folderSelect && folderSelect.value) ? folderSelect.value : null;
    
    // Formatting
    const currentLineHeight = bodyInput.style.lineHeight || '1.6';
    const currentWordSpacing = bodyInput.style.wordSpacing || 'normal';
    const currentLetterSpacing = bodyInput.style.letterSpacing || 'normal';
    let currentPageMargin = 'narrow';
    if (bodyInput.style.padding.includes('10%')) currentPageMargin = 'normal';
    if (bodyInput.style.padding.includes('20%')) currentPageMargin = 'wide';

    if (currentNoteId && currentNoteId !== 'new') {
        const note = window.notes.find(n => n.id === currentNoteId);
        if (note) {
            // only update if changed
            if (note.title !== currentTitle || note.body !== currentBody || 
                note.folderId !== selectedFolderId || (note.isLocked !== !!currentLockPasscode) ||
                note.lineHeight !== currentLineHeight || note.wordSpacing !== currentWordSpacing || 
                note.letterSpacing !== currentLetterSpacing || note.pageMargin !== currentPageMargin) {
                
                note.title = currentTitle;
                note.body = currentBody;
                note.folderId = selectedFolderId;
                note.isLocked = !!currentLockPasscode;
                note.passcode = currentLockPasscode;
                note.lineHeight = currentLineHeight;
                note.wordSpacing = currentWordSpacing;
                note.letterSpacing = currentLetterSpacing;
                note.pageMargin = currentPageMargin;
                note.updatedAt = Date.now();
                // Ensure attachments are preserved
                if (!note.attachments) note.attachments = [];
                saveNoteToDB(note);
                if (typeof renderNotes === 'function') renderNotes();
            }
        }
    } else if (currentTitle || currentBody) {
        // Create new note immediately if it has content
        const newId = Date.now().toString();
        const newNote = {
            id: newId,
            title: currentTitle,
            body: currentBody,
            folderId: selectedFolderId,
            isLocked: !!currentLockPasscode,
            passcode: currentLockPasscode,
            lineHeight: currentLineHeight,
            wordSpacing: currentWordSpacing,
            letterSpacing: currentLetterSpacing,
            pageMargin: currentPageMargin,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        window.notes.push(newNote);
        currentNoteId = newId; // Now we are editing this new note
        saveNoteToDB(newNote);
        if (typeof renderNotes === 'function') renderNotes();
        
        // Update URL to reflect the new ID
        window.history.replaceState(null, '', '#' + newId);
    }
}

let autoSaveTimeout = null;
function debouncedSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        syncCurrentNote();
    }, 500);
}

function closeEditor(shouldSave = true) {
  if (shouldSave) {
    syncCurrentNote();
  } else {
    // Even if not saving changes, ensure the grid is up to date with any deletions/moves
    if (typeof renderNotes === 'function') renderNotes();
  }
  
  window.showView('homepage-view');
  currentNoteId = null;
  window.currentNoteId = null;
  currentLockPasscode = null;
  titleInput.value = '';
  bodyInput.innerHTML = '';
  window.history.replaceState(null, '', window.location.pathname);
}

function deleteCurrentNote() {
  if (currentNoteId && currentNoteId !== 'new') {
    showConfirmModal('Are you sure you want to delete this note?', () => {
      window.notes = window.notes.filter(n => n.id !== currentNoteId);
      deleteNoteFromDB(currentNoteId);
      if (typeof renderNotes === 'function') renderNotes();
      closeEditor(false);
    });
  } else {
    closeEditor(false);
  }
}

window.saveNotes = function() {
    // Allows pdfManager.js to trigger a DB save for the current note
    if (currentNoteId && currentNoteId !== 'new') {
        const note = window.notes.find(n => n.id === currentNoteId);
        if (note) saveNoteToDB(note);
    } else {
        // Fallback: save all notes (handles edge cases if called globally)
        window.notes.forEach(note => saveNoteToDB(note));
    }
};

window.downloadNote = function(format) {
  const title = (titleInput.value || 'Untitled-Note').trim().replace(/[/\\?%*:|"<>]/g, '-');
  const body = bodyInput.innerHTML;
  const plainText = stripHtml(body).trim() || 'No content';
  const timestamp = new Date().toLocaleDateString().replace(/\//g, '-');
  const filename = `${title}_${timestamp}.${format === 'docx' ? 'doc' : format}`;

  if (format === 'txt') {
    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, filename);
  } else if (format === 'html') {
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
          h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
          .content { margin-top: 20px; }
          img { max-width: 100%; height: auto; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>${titleInput.value || 'Untitled Note'}</h1>
        <div class="content">${body}</div>
      </body>
      </html>
    `;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    triggerDownload(blob, filename);
  } else if (format === 'docx') {
    // Basic .doc header trick for Word compatibility
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${title}</title></head><body>`;
    const footer = "</body></html>";
    const fullContent = header + `<h1>${titleInput.value || 'Untitled Note'}</h1>` + body + footer;
    const blob = new Blob([fullContent], { type: 'application/msword' });
    triggerDownload(blob, filename);
  } else if (format === 'pdf') {
    // The most reliable way for PDF export in browser is Print -> Save as PDF
    if (typeof window.printDocument === 'function') window.printDocument();
    else window.print();
  }
};

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}

// Listeners moved to initNotes

// notesManager.js loaded
window.initNotes = async function() {
    if (window.userSession && window.supabaseClient) {
        const { data: notesData } = await window.supabaseClient.from('notes').select('*').eq('user_id', window.userSession.user.id);
        const { data: chatData } = await window.supabaseClient.from('chat_history').select('*').eq('user_id', window.userSession.user.id).order('created_at', { ascending: true });

        if (notesData) {
            window.notes = notesData.map(n => ({
                id: n.id,
                folderId: n.folder_id,
                title: n.title,
                body: n.body,
                isLocked: n.is_locked,
                passcode: n.passcode,
                lineHeight: n.line_height,
                wordSpacing: n.word_spacing,
                letterSpacing: n.letter_spacing,
                pageMargin: n.page_margin,
                updatedAt: new Date(n.updated_at).getTime(),
                createdAt: new Date(n.created_at).getTime(),
                attachments: n.attachments || [],
                chatHistory: chatData ? chatData.filter(c => c.note_id === n.id).map(c => ({
                    id: c.id,
                    sender: c.sender,
                    text: c.message,
                    timestamp: new Date(c.created_at).getTime()
                })) : []
            }));
            renderNotes();
        }
    }

    // Populate elements
    notesGrid = document.getElementById('notes-grid');
    notesCount = document.getElementById('notes-count');
    homepageView = document.getElementById('homepage-view');
    editorView = document.getElementById('editor-view');
    backBtn = document.getElementById('back-btn');
    deleteNoteBtn = document.getElementById('delete-note-btn');
    lockNoteBtn = document.getElementById('lock-note-btn');
    titleInput = document.getElementById('note-title-input');
    bodyInput = document.getElementById('note-body-input');

    // Attach listeners
    document.addEventListener('keydown', handleGlobalKeyboard);

    const printBtn = document.getElementById('print-note-btn');
    if (printBtn) {
        printBtn.onclick = () => {
            if (typeof window.printDocument === 'function') window.printDocument();
            else window.print();
        };
    }
    
    if (bodyInput) {
      bodyInput.addEventListener('paste', (e) => {
        const modKey = (e.ctrlKey || e.metaKey);
        
        // 1. Handle Plain Text Paste (Ctrl+Shift+V)
        if (e.shiftKey && modKey) {
          e.preventDefault();
          const text = (e.originalEvent || e).clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
          return;
        }

        const clipboardData = e.clipboardData || e.originalEvent.clipboardData;
        
        // 2. Handle Image Paste (Files/Blobs)
        const items = clipboardData.items;
        let imageFound = false;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            const blob = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = (evt) => {
              const dataUrl = evt.target.result;
              const imgHtml = `<img src="${dataUrl}" data-original-src="${dataUrl}" style="max-width: 100%; cursor: pointer;">`;
              bodyInput.focus();
              window.format('insertHTML', imgHtml);
              debouncedSave();
            };
            reader.readAsDataURL(blob);
            imageFound = true;
            break; 
          }
        }

        // 3. Handle HTML Paste (Images from browsers)
        if (!imageFound) {
          const html = clipboardData.getData('text/html');
          if (html && html.includes('<img')) {
            // We let the browser handle the initial paste, but we'll sanitize/enhance it after a tick
            setTimeout(() => {
              const imgs = bodyInput.querySelectorAll('img:not([data-original-src])');
              imgs.forEach(img => {
                img.setAttribute('data-original-src', img.src);
                img.style.maxWidth = '100%';
                img.style.cursor = 'pointer';
              });
              debouncedSave();
            }, 0);
          }
        }
      });

      // 4. Handle Drag & Drop Images
      bodyInput.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        bodyInput.classList.add('drag-over');
      });

      bodyInput.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        bodyInput.classList.remove('drag-over');
      });

      bodyInput.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        bodyInput.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            if (files[i].type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = (evt) => {
                const dataUrl = evt.target.result;
                const imgHtml = `<img src="${dataUrl}" data-original-src="${dataUrl}" style="max-width: 100%; cursor: pointer;">`;
                bodyInput.focus();
                // Insert at cursor position if possible, else append
                window.format('insertHTML', imgHtml);
                debouncedSave();
              };
              reader.readAsDataURL(files[i]);
            }
          }
        }
      });
      bodyInput.addEventListener('input', debouncedSave);
    }

    // Image Upload Logic (Moved inside init to ensure elements exist)
    const imageBtn = document.getElementById('format-image-btn');
    const imageInput = document.getElementById('image-upload-input');
    let savedSelection = null;

    if (imageBtn && imageInput) {
      imageBtn.addEventListener('mousedown', () => {
        savedSelection = saveSelection();
      });
      imageBtn.addEventListener('click', () => {
        imageInput.click();
      });
      imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (bodyInput) bodyInput.focus();
          restoreSelection(savedSelection);
          const dataUrl = evt.target.result;
          const imgHtml = `<img src="${dataUrl}" data-original-src="${dataUrl}" style="max-width: 100%; cursor: pointer;">`;
          window.format('insertHTML', imgHtml);
        };
        reader.readAsDataURL(file);
        imageInput.value = ''; // Reset
      });
    }
    
    if (titleInput) {
      titleInput.addEventListener('input', debouncedSave);
    }

    if (lockNoteBtn) {
      lockNoteBtn.addEventListener('click', () => {
        if (currentLockPasscode) {
          showPasscodeModal('Unlock Note', 'Enter passcode to remove lock.', (pin) => {
            if (pin === currentLockPasscode) {
              currentLockPasscode = null;
              updateLockIconState();
            } else {
              if (typeof showPasscodeModal === 'function') showPasscodeModal('Incorrect PIN', 'That PIN is incorrect. Try again.', () => {});
            }
          });
        } else {
          showPasscodeModal('Set Passcode', 'Enter a 4-digit PIN to lock this note.', (pin) => {
            currentLockPasscode = pin;
            updateLockIconState();
          });
        }
      });
    }

    document.getElementById('top-add-note-btn')?.addEventListener('click', () => openEditor());
    if (backBtn) backBtn.addEventListener('click', closeEditor);
    if (deleteNoteBtn) deleteNoteBtn.addEventListener('click', deleteCurrentNote);

    // View Toggle Logic
    const viewToggleBtn = document.getElementById('view-toggle-btn');
    const viewToggleIcon = document.getElementById('view-toggle-icon');
    
    if (viewToggleBtn) {
        viewToggleBtn.onclick = (e) => {
            e.stopPropagation();
            const menus = document.querySelectorAll('.dropdown-menu');
            menus.forEach(m => m.style.display = 'none');
            const menu = viewToggleBtn.nextElementSibling;
            if (menu) menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
        };
    }

    renderNotes();
    updateViewLayout();

    const initialHash = window.location.hash.substring(1);
    if (initialHash === 'new') {
      openEditor();
    } else if (initialHash) {
      const existingNote = notes.find(n => n.id === initialHash);
      if (existingNote) {
        openEditor(initialHash);
      } else {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
};

let isListView = localStorage.getItem('notesApp_isListView') === 'true';

function updateViewLayout() {
  const notesGridEl = document.getElementById('notes-grid');
  const viewToggleIcon = document.getElementById('view-toggle-icon');
  if (!notesGridEl) return;
  if (isListView) {
    notesGridEl.classList.add('list-view');
    if (viewToggleIcon) viewToggleIcon.setAttribute('data-lucide', 'layout-grid');
  } else {
    notesGridEl.classList.remove('list-view');
    if (viewToggleIcon) viewToggleIcon.setAttribute('data-lucide', 'layout-list');
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.setViewMode = function(isList) {
  isListView = isList;
  localStorage.setItem('notesApp_isListView', isListView);
  updateViewLayout();
  // Close dropdowns
  document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
};

window.lastSelectedHighlightColor = 'rgb(255, 255, 0)';

window.changeHighlightColor = function(color) {
  window.lastSelectedHighlightColor = color;
  const dot = document.getElementById('current-color-dot');
  if (dot) {
    if (color === 'transparent') {
      dot.style.backgroundColor = 'transparent';
      dot.style.border = '1px dashed var(--text-secondary)';
    } else {
      dot.style.backgroundColor = color;
      dot.style.border = 'none';
    }
  }

  document.execCommand('styleWithCSS', false, true);
  if (color === 'transparent') {
    document.execCommand('backColor', false, 'rgba(0,0,0,0)');
    document.execCommand('foreColor', false, '#FFFFFF');
  } else {
    document.execCommand('backColor', false, color);
    // Explicitly set a placeholder color to help the CSS attribute selector if needed, 
    // although the CSS now targets the background-color directly.
    document.execCommand('foreColor', false, '#000001'); // Near black, will be overridden by CSS important
  }
  
  if (bodyInput) bodyInput.focus();
  if (typeof updateToolbarStates === 'function') updateToolbarStates();
};

window.changeTextColor = function(color) {
  const bar = document.getElementById('current-text-color-bar');
  if (bar) {
    if (color === 'default' || !color) {
      bar.style.backgroundColor = 'var(--text-primary)';
    } else {
      bar.style.backgroundColor = color;
    }
  }

  document.execCommand('styleWithCSS', false, true);
  if (color === 'default' || !color) {
    // Note: 'removeFormat' clears everything (bold/italic). 
    // Best cross-browser way to clear just the color in execCommand without stripping other format is to set it to initial.
    document.execCommand('foreColor', false, '#ffffff'); 
  } else {
    document.execCommand('foreColor', false, color);
  }
  
  if (bodyInput) bodyInput.focus();
  if (typeof updateToolbarStates === 'function') updateToolbarStates();
};

document.getElementById('format-bold-btn')?.addEventListener('click', () => window.format('bold'));
document.getElementById('format-italic-btn')?.addEventListener('click', () => window.format('italic'));
document.getElementById('format-underline-btn')?.addEventListener('click', () => window.format('underline'));

document.getElementById('format-ul-btn')?.addEventListener('click', () => window.format('insertUnorderedList'));
document.getElementById('format-ol-btn')?.addEventListener('click', () => window.format('insertOrderedList'));


document.getElementById('format-checklist-btn')?.addEventListener('click', () => {
  window.format('insertHTML', '<input type="checkbox" style="margin-right: 8px; vertical-align: middle;">&nbsp;');
});

function saveSelection() {
  if (window.getSelection) {
    const sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      return sel.getRangeAt(0);
    }
  }
  return null;
}
function restoreSelection(range) {
  if (range && window.getSelection) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

window.changeFontFamily = function(fontName) {
  document.execCommand('styleWithCSS', false, true);
  document.execCommand('fontName', false, fontName);
  
  const display = document.getElementById('current-font-family');
  if (display) {
    display.textContent = fontName.replace(/['"]/g, '');
  }
  
  if (bodyInput) bodyInput.focus();
  if (typeof updateToolbarStates === 'function') updateToolbarStates();
};

// Font Import Logic
const fontFileInput = document.getElementById('font-file-input');
const importFontBtn = document.getElementById('import-font-btn');

function loadCustomFont(fontName, dataUrl) {
  // Inject style only if not already present
  if (!document.getElementById(`font-style-${fontName}`)) {
    const style = document.createElement('style');
    style.id = `font-style-${fontName}`;
    style.textContent = `
      @font-face {
        font-family: '${fontName}';
        src: url('${dataUrl}');
      }
    `;
    document.head.appendChild(style);
  }

  // Add to dropdown if not already there
  const menu = document.getElementById('font-family-dropdown');
  if (!menu) return;
  
  const existingBtns = Array.from(menu.querySelectorAll('button'));
  if (!existingBtns.some(b => b.textContent && b.textContent.includes(fontName))) {
    const importFontBtn = document.getElementById('import-font-btn');
    const divider = menu.querySelector('.dropdown-divider');
    const newBtn = document.createElement('button');
    newBtn.onclick = () => window.changeFontFamily(fontName);
    newBtn.style.fontFamily = `"${fontName}"`;
    newBtn.textContent = fontName;
    
    if (divider) {
        menu.insertBefore(newBtn, divider);
    } else if (importFontBtn) {
        menu.insertBefore(newBtn, importFontBtn);
    } else {
        menu.appendChild(newBtn);
    }
  }
}

window.refreshEditorFontList = function() {
    const menu = document.getElementById('font-family-dropdown');
    if (!menu) return;

    // Remove custom font buttons (those with font-family style)
    const buttons = menu.querySelectorAll('button');
    buttons.forEach(btn => {
        const standard = ['Roboto', 'Times New Roman', 'Arial', 'Comic Sans MS'];
        const name = btn.textContent.trim().replace(' Default', '');
        if (btn.id !== 'import-font-btn' && !standard.includes(name)) {
            btn.remove();
        }
    });

    // Re-load from storage
    try {
        const savedFonts = JSON.parse(localStorage.getItem('notesApp_customFonts') || '{}');
        for (const [fontName, dataUrl] of Object.entries(savedFonts)) {
            loadCustomFont(fontName, dataUrl);
        }
    } catch (e) {
        console.error('Failed to refresh font list', e);
    }
};

// Initial load
setTimeout(window.refreshEditorFontList, 500);

if (importFontBtn && fontFileInput) {
  importFontBtn.addEventListener('click', (e) => {
    e.preventDefault();
    fontFileInput.click();
  });

  fontFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      const dataUrl = evt.target.result;
      const customFontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9 ]/g, '');
      
      loadCustomFont(customFontName, dataUrl);
      
      // Save to localStorage
      try {
        let savedFonts = JSON.parse(localStorage.getItem('notesApp_customFonts') || '{}');
        savedFonts[customFontName] = dataUrl;
        localStorage.setItem('notesApp_customFonts', JSON.stringify(savedFonts));
        if (typeof window.syncSettingsToDB === 'function') window.syncSettingsToDB();
      } catch (err) {
        console.error('Local Storage full', err);
        alert('Storage size exceeded. This font may only be available for this session and might not persist after refreshing.');
      }
      
      // Apply the font immediately
      window.changeFontFamily(customFontName);
    };
    reader.readAsDataURL(file);
    fontFileInput.value = ''; // Reset input
  });
}

// Dropdown Toggles
document.querySelectorAll('.dropdown-container').forEach(container => {
  const btn = container.querySelector('.icon-btn');
  const menu = container.querySelector('.dropdown-menu');
  
  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    // Close other dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(m => {
      if (m !== menu) m.style.display = 'none';
    });
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
  });
});

// Close dropdowns on outside click
document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
});

// Toggle Edit Mode Logic removed - Editor is now always editable

// Check formatting states and update buttons
function updateToolbarStates() {
  const boldBtn = document.getElementById('format-bold-btn');
  const italicBtn = document.getElementById('format-italic-btn');
  const underlineBtn = document.getElementById('format-underline-btn');
  const colorBtn = document.getElementById('format-color-btn');

  if (document.queryCommandState('bold')) boldBtn?.classList.add('active');
  else boldBtn?.classList.remove('active');

  if (document.queryCommandState('italic')) italicBtn?.classList.add('active');
  else italicBtn?.classList.remove('active');

  if (document.queryCommandState('underline')) underlineBtn?.classList.add('active');
  else underlineBtn?.classList.remove('active');

  const bgColor = document.queryCommandValue('backColor');
  // Check if current background color is not transparent/rgba(0,0,0,0)
  if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent' && bgColor !== 'rgb(255, 255, 255)') {
    colorBtn?.classList.add('active');
  } else {
    colorBtn?.classList.remove('active');
  }

  // Update font size and family display based on selection
  const sizeDisplay = document.getElementById('current-font-size');
  const fontDisplay = document.getElementById('current-font-family');
  
  if (sizeDisplay || fontDisplay) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const node = selection.anchorNode;
      const parent = node.nodeType === 3 ? node.parentElement : node;
      if (parent && parent.nodeType === 1) { // Ensure it's an element
        const computedStyle = window.getComputedStyle(parent);
        
        if (sizeDisplay) {
          const size = computedStyle.fontSize;
          sizeDisplay.textContent = Math.round(parseFloat(size));
        }
        
        if (fontDisplay) {
          let font = computedStyle.fontFamily;
          font = font.split(',')[0].replace(/['"]/g, '');
          
          // Map system fonts to user-friendly 'Roboto' (your primary default)
          const systemFonts = ['SF Pro Display', 'SF Pro', 'Inter', 'system-ui', '-apple-system'];
          if (systemFonts.some(f => font.toLowerCase().includes(f.toLowerCase()))) {
            fontDisplay.textContent = 'Roboto';
          } else {
            fontDisplay.textContent = font;
          }
        }
      }
    }
  }
}

bodyInput?.addEventListener('keyup', updateToolbarStates);
bodyInput?.addEventListener('mouseup', updateToolbarStates);



// Spacing and Margin Handlers
window.changeLineHeight = function(val) {
  if (bodyInput) {
    bodyInput.style.lineHeight = val;
    debouncedSave();
  }
};
window.changeWordSpacing = function(val) {
  if (bodyInput) {
    bodyInput.style.wordSpacing = val;
    debouncedSave();
  }
};
window.changeLetterSpacing = function(val) {
  if (bodyInput) {
    bodyInput.style.letterSpacing = val;
    debouncedSave();
  }
};
window.changePageMargin = function(val) {
  if (!bodyInput) return;
  let printMargin = '1in';
  if (val === 'narrow') {
    bodyInput.style.padding = '40px 10%';
    printMargin = '0.5in';
  } else if (val === 'normal') {
    bodyInput.style.padding = '40px 15%';
    printMargin = '1in';
  } else if (val === 'wide') {
    bodyInput.style.padding = '40px 25%';
    printMargin = '2in';
  }
  document.documentElement.style.setProperty('--print-margin', printMargin);
  debouncedSave();
};

// Initial Listeners for Auto-save
titleInput?.addEventListener('input', debouncedSave);
bodyInput?.addEventListener('input', debouncedSave);
document.getElementById('note-folder-select')?.addEventListener('change', debouncedSave);

function renderPdfAttachments(attachments) {
    const headerArea = document.getElementById('header-attachments-area');
    if (!headerArea) return;

    // Clear previous attachments to avoid clutter
    headerArea.innerHTML = '';

    if (!attachments || attachments.length === 0) {
        window.closeStudyMode();
        return;
    }

    // Find the first PDF to study
    const attachment = attachments.find(a => a.type === 'pdf');
    if (!attachment) {
        window.closeStudyMode();
        return;
    }

    const pill = document.createElement('div');
    pill.className = 'header-attachment-pill';
    pill.innerHTML = `
        <div class="pill-icon"><i data-lucide="file-text" size="16"></i></div>
        <div class="pill-name" title="${attachment.fileName}">${attachment.fileName}</div>
        <div class="pill-actions">
            <button id="header-view-pdf-btn">View</button>
            <button id="header-download-pdf-btn">Download</button>
            <button id="header-remove-pdf-btn" class="pill-remove-btn" title="Remove Attachment"><i data-lucide="x" size="14"></i></button>
        </div>
    `;

    headerArea.appendChild(pill);

    document.getElementById('header-view-pdf-btn').onclick = () => {
        window.openStudyMode(attachment.dataUrl, attachment.fileName);
    };

    document.getElementById('header-download-pdf-btn').onclick = () => {
        const a = document.createElement('a');
        a.href = attachment.dataUrl;
        a.download = attachment.fileName;
        a.click();
    };

    document.getElementById('header-remove-pdf-btn').onclick = (e) => {
        e.stopPropagation();
        
        const removeLogic = () => {
            const index = notes.findIndex(n => n.id === currentNoteId);
            if (index !== -1) {
                // Filter out the attachment and save to global state
                notes[index].attachments = (notes[index].attachments || []).filter(a => a.fileName !== attachment.fileName);
                saveNotes();
                
                // Force UI Update
                renderPdfAttachments(notes[index].attachments);
                window.closeStudyMode();
                if (typeof showToast === 'function') showToast('Attachment removed');
            }
        };

        // Use native NTSY modal if available, fallback to browser if not
        if (window.showConfirmModal) {
            window.showConfirmModal(`Are you sure you want to remove "${attachment.fileName}"?`, removeLogic);
        } else if (confirm(`Remove "${attachment.fileName}"?`)) {
            removeLogic();
        }
    };

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.activePdfText = ""; // Global buffer for AI assistance

/**
 * High-Fidelity Apple Split View Logic
 */
window.openStudyMode = function(url, name) {
    const notesPane = document.getElementById('notes-pane');
    const docPane = document.getElementById('document-pane');
    const iframe = document.getElementById('pdf-viewer-iframe');
    const nameLabel = document.getElementById('pdf-viewer-name');
    
    if (docPane && iframe && nameLabel) {
        nameLabel.textContent = name;
        
        // Append PDF open parameters to hide nav panes and fit to header width
        const focusUrl = url.includes('#') ? url.split('#')[0] : url;
        iframe.src = focusUrl + '#navpanes=0&view=FitH';
        
        docPane.style.display = 'flex';
        docPane.classList.add('visible');
        
        const resizer = document.getElementById('pane-resizer');
        if (resizer) resizer.style.display = 'flex';
        
        // Default to a clean 50/50 split on open
        docPane.style.width = '50%';
        
        // Focus tracking logic
        notesPane.classList.add('dimmed', 'split-active');
        notesPane.classList.remove('focused');
        docPane.classList.add('focused');
        docPane.classList.remove('dimmed');

        // [AI Enhancement] Extract text in background for Study Buddy
        console.log(`[AI] Scanning PDF "${name}" for Study Buddy...`);
        (async () => {
            try {
                // Fetch the PDF as arrayBuffer to scan it
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                window.activePdfText = await extractTextFromPdf_Basic(arrayBuffer);
                console.log(`[AI] PDF Scan complete! Extracted ${window.activePdfText.length} characters.`);
            } catch (err) {
                console.error("[AI] Background scan failed:", err);
                window.activePdfText = "";
            }
        })();
    }
}

window.closeStudyMode = function() {
    const notesPane = document.getElementById('notes-pane');
    const docPane = document.getElementById('document-pane');
    const iframe = document.getElementById('pdf-viewer-iframe');
    
    // Clear AI buffer
    window.activePdfText = "";

    if (docPane) {
        docPane.classList.remove('visible');
        
        const resizer = document.getElementById('pane-resizer');
        if (resizer) resizer.style.display = 'none';

        setTimeout(() => {
            docPane.style.display = 'none';
            if (iframe) iframe.src = '';
            
            // Return notes to full focus
            if (notesPane) {
                notesPane.classList.add('focused');
                notesPane.classList.remove('dimmed', 'split-active');
            }
        }, 400); // Match CSS transition
    }
}

// Side-view Resizer & Focus Logic
window.initSplitView = function() {
    console.log("[Notes] Initializing Split View (Study Mode)...");
    const resizer = document.getElementById('pane-resizer');
    const docPane = document.getElementById('document-pane');
    const notesPane = document.getElementById('notes-pane');
    const closeBtn = document.getElementById('close-study-mode');

    if (closeBtn) {
        closeBtn.onclick = () => {
            console.log("[Notes] Closing Study Mode...");
            window.closeStudyMode();
        };
    }

    // Handle Focus Swapping (Apple Style)
    [notesPane, docPane].forEach(pane => {
        if (!pane) return;
        pane.addEventListener('mousedown', () => {
            if (!docPane.classList.contains('visible')) return;
            
            [notesPane, docPane].forEach(p => {
                p.classList.remove('focused');
                p.classList.add('dimmed');
            });
            pane.classList.add('focused');
            pane.classList.remove('dimmed');
        });
    });

    // Resize Logic
    if (resizer && docPane) {
        let isResizing = false;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            // Add a temporary overlay to prevent iframe from stealing mouse events
            const overlay = document.createElement('div');
            overlay.id = 'resize-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;cursor:col-resize;';
            document.body.appendChild(overlay);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const containerWidth = window.innerWidth;
            const containerOffset = document.querySelector('.main-content').offsetLeft;
            const newDocWidth = containerWidth - e.clientX;
            
            // Constraints (20% to 80%)
            const minW = containerWidth * 0.20;
            const maxW = containerWidth * 0.80;

            if (newDocWidth > minW && newDocWidth < maxW) {
                docPane.style.transition = 'none';
                docPane.style.width = `${newDocWidth}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (!isResizing) return;
            isResizing = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
            docPane.style.transition = 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, filter 0.3s ease';
            const overlay = document.getElementById('resize-overlay');
            if (overlay) overlay.remove();
        });
    }
};

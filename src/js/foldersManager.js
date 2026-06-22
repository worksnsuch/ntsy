const FOLDERS_KEY = 'notesApp_folders';
window.folders = [];
let folders = window.folders;

window.currentFilterFolderId = null; 
// sessionUnlockedFolders removed to enforce password prompt every time
let isFoldersExpanded = false;

const premiumColors = [
  '#FF4A4A', '#FFD600', '#B4C6E4', '#4ADE80', '#A78BFA', '#F472B6',
  '#60A5FA', '#34D399', '#FB923C', '#94A3B8', '#F87171'
];

// DOM Elements (populated in init)
let foldersList, newFolderInput, newFolderModalBtn, newFolderModal, modalFolderName, modalColorPicker, cancelFolderBtn, confirmFolderBtn;

async function saveFolders() {
  if (!window.userSession || !window.supabaseClient) return;
  // Fire and forget upserts
  for (const f of folders) {
      await window.supabaseClient.from('folders').upsert({
          id: f.id,
          user_id: window.userSession.user.id,
          name: f.name,
          color: f.color,
          is_priority: f.isPriority,
          is_locked: f.isLocked,
          passcode: f.passcode
      });
  }
}

async function deleteFolderFromDB(folderId) {
    if (!window.userSession || !window.supabaseClient) return;
    await window.supabaseClient.from('folders').delete().eq('id', folderId);
}

function renderFolders() {
  if (!foldersList) return;
  foldersList.innerHTML = '';

  const allOption = document.createElement('li');
  allOption.className = `folder-item ${window.currentFilterFolderId === null ? 'active' : ''}`;
  allOption.innerHTML = `
    <div class="color-dot" style="background-color: var(--text-secondary);"></div>
    <span>Uncategorized</span>
  `;
  allOption.style.animation = 'folderPop 0.3s ease-out backwards';
  allOption.addEventListener('click', () => {
    window.currentFilterFolderId = null;
    renderFolders();
    if (typeof showView === 'function') showView('homepage-view');
    if (typeof renderNotes === 'function') renderNotes();
  });
  allOption.addEventListener('dragover', e => { e.preventDefault(); allOption.classList.add('drag-over'); });
  allOption.addEventListener('dragleave', () => { allOption.classList.remove('drag-over'); });
  allOption.addEventListener('drop', e => {
    e.preventDefault();
    allOption.classList.remove('drag-over');
    const noteId = e.dataTransfer.getData('text/plain');
    if (typeof notes !== 'undefined') {
      const note = notes.find(n => n.id === noteId);
      if (note && note.folderId !== null) {
        note.folderId = null;
        if (typeof saveNotes === 'function') saveNotes();
        if (typeof renderNotes === 'function') renderNotes();
      }
    }
  });
  foldersList.appendChild(allOption);

  folders.sort((a, b) => {
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;
    return 0;
  });

  let visibleFolders = folders;
  if (!isFoldersExpanded && folders.length > 3) {
    visibleFolders = folders.slice(0, 3);
    if (window.currentFilterFolderId) {
      if (!visibleFolders.find(f => f.id === window.currentFilterFolderId)) {
        const activeF = folders.find(f => f.id === window.currentFilterFolderId);
        if (activeF) visibleFolders.push(activeF);
      }
    }
  }

  visibleFolders.forEach((folder, index) => {
    const li = document.createElement('li');
    li.className = `folder-item flex-item ${window.currentFilterFolderId === folder.id ? 'active' : ''} ${folder.isLocked ? 'is-locked' : ''} ${folder.isPriority ? 'is-priority' : ''}`;
    li.style.animation = 'folderPop 0.3s ease-out backwards';
    li.style.animationDelay = `${(index + 1) * 40}ms`;
    
    const dot = document.createElement('div');
    dot.className = 'color-dot clickable-dot';
    dot.style.backgroundColor = folder.color;
    dot.title = 'Change color';
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      showColorPicker(folder.id, dot);
    });
    
    const label = document.createElement('span');
    label.textContent = folder.name;
    label.style.flex = "1"; label.style.overflow = "hidden"; label.style.textOverflow = "ellipsis"; label.title = "Double-click to rename";
    label.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const currentName = folder.name;
      const input = document.createElement('input');
      input.type = 'text'; input.value = currentName;
      input.style.width = '100%'; input.style.background = 'var(--bg-card)'; input.style.border = '1px solid var(--accent-yellow)'; input.style.color = 'var(--text-primary)'; input.style.borderRadius = '4px'; input.style.outline = 'none'; input.style.padding = '0 4px';
      li.replaceChild(input, label);
      input.focus(); input.select();
      const finishEditing = () => {
         const newName = input.value.trim();
         if (newName && newName !== currentName) { folder.name = newName; saveFolders(); }
         renderFolders();
         if (window.currentFilterFolderId === folder.id && typeof renderNotes === 'function') renderNotes();
      };
      input.addEventListener('blur', finishEditing);
      input.addEventListener('keydown', (evt) => {
         if (evt.key === 'Enter') finishEditing();
         if (evt.key === 'Escape') renderFolders();
         evt.stopPropagation();
      });
      input.addEventListener('click', (evt) => evt.stopPropagation());
    });
    
    const priorityBtn = document.createElement('button');
    priorityBtn.className = 'icon-btn priority-folder-btn';
    priorityBtn.innerHTML = folder.isPriority 
        ? '<i data-lucide="star" style="width:12px; height:12px; color: #FFFFFF; fill: #FFFFFF"></i>'
        : '<i data-lucide="star" style="width:12px; height:12px; color: var(--text-secondary);"></i>';

    const lockBtn = document.createElement('button');
    lockBtn.className = 'icon-btn lock-folder-btn';
    lockBtn.innerHTML = folder.isLocked 
        ? '<i data-lucide="lock" style="width:12px; height:12px; color: #FFFFFF"></i>'
        : '<i data-lucide="unlock" style="width:12px; height:12px; color: var(--text-secondary)"></i>';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn delete-folder-btn';
    deleteBtn.innerHTML = '<i data-lucide="x" style="width:12px; height:12px;"></i>';
    
    li.appendChild(dot); li.appendChild(label); li.appendChild(priorityBtn); li.appendChild(lockBtn); li.appendChild(deleteBtn);

    li.addEventListener('click', (e) => {
      if (e.target.closest('.delete-folder-btn') || e.target.closest('.lock-folder-btn') || e.target.closest('.priority-folder-btn')) return;
      if (folder.isLocked) {
        if (typeof showPasscodeModal !== 'function') return;
        showPasscodeModal('Folder Locked', 'Enter passcode to view contents.', (pin) => {
          if (pin === folder.passcode) {
            window.currentFilterFolderId = folder.id;
            renderFolders();
            if (typeof renderNotes === 'function') renderNotes();
          } else { alert('Incorrect Passcode.'); }
        });
        return;
      }
      window.currentFilterFolderId = folder.id;
      renderFolders();
      if (typeof showView === 'function') showView('homepage-view');
      if (typeof renderNotes === 'function') renderNotes();
    });

    priorityBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      folder.isPriority = !folder.isPriority;
      saveFolders();
      renderFolders();
    });

    lockBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof showPasscodeModal !== 'function') return;
      if (folder.isLocked) {
        showPasscodeModal('Unlock Folder', 'Enter passcode to remove lock permanently.', (pin) => {
          if (pin === folder.passcode) { folder.isLocked = false; folder.passcode = null; saveFolders(); renderFolders(); }
          else { alert('Incorrect Passcode.'); }
        });
      } else {
        showPasscodeModal('Lock Folder', 'Enter a 4-digit PIN to lock this folder.', (pin) => {
          folder.isLocked = true; folder.passcode = pin; 
          if (window.currentFilterFolderId === folder.id) window.currentFilterFolderId = null;
          saveFolders(); renderFolders(); if (typeof renderNotes === 'function') renderNotes();
        });
      }
    });

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof showConfirmModal === 'function') {
        showConfirmModal(`Delete the "${folder.name}" folder? Notes inside will become uncategorized.`, () => {
          folders = folders.filter(f => f.id !== folder.id);
          deleteFolderFromDB(folder.id);
          if (window.currentFilterFolderId === folder.id) window.currentFilterFolderId = null;
          saveFolders(); renderFolders();
          if (typeof notes !== 'undefined') {
            notes.forEach(n => { if (n.folderId === folder.id) n.folderId = null; });
            if (typeof saveNotes === 'function') saveNotes();
            if (typeof renderNotes === 'function') renderNotes();
          }
        });
      }
    });

    li.addEventListener('dragover', e => { e.preventDefault(); li.classList.add('drag-over'); });
    li.addEventListener('dragleave', () => { li.classList.remove('drag-over'); });
    li.addEventListener('drop', e => {
      e.preventDefault(); li.classList.remove('drag-over');
      const noteId = e.dataTransfer.getData('text/plain');
      if (typeof notes !== 'undefined') {
        const note = notes.find(n => n.id === noteId);
        if (note && note.folderId !== folder.id) {
          note.folderId = folder.id; if (typeof saveNotes === 'function') saveNotes(); if (typeof renderNotes === 'function') renderNotes();
        }
      }
    });
    foldersList.appendChild(li);
  });
  
  if (folders.length > 3) {
    const toggleLi = document.createElement('li');
    toggleLi.className = 'folder-item flex-item view-all-pill';
    toggleLi.innerHTML = isFoldersExpanded 
       ? `<span>View Less <i data-lucide="chevron-left" style="width:12px; height:12px; vertical-align:middle; margin-left:4px; margin-top:-2px;"></i></span>`
       : `<span>View All (${folders.length}) <i data-lucide="chevron-right" style="width:12px; height:12px; vertical-align:middle; margin-left:4px; margin-top:-2px;"></i></span>`;
    toggleLi.addEventListener('click', () => { isFoldersExpanded = !isFoldersExpanded; renderFolders(); });
    foldersList.appendChild(toggleLi);
  }
  window.safeCreateIcons();
}

function showColorPicker(folderId, anchorElement) {
  const existingPicker = document.querySelector('.color-picker-popover');
  if (existingPicker) existingPicker.remove();
  const picker = document.createElement('div');
  picker.className = 'color-picker-popover';
  premiumColors.forEach(color => {
    const option = document.createElement('div');
    option.className = 'color-option'; option.style.backgroundColor = color;
    const folder = folders.find(f => f.id === folderId);
    if (folder && folder.color === color) option.classList.add('selected');
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      if (folder) { folder.color = color; saveFolders(); renderFolders(); if (typeof renderNotes === 'function') renderNotes(); }
      picker.remove();
    });
    picker.appendChild(option);
  });
  document.body.appendChild(picker);
  const rect = anchorElement.getBoundingClientRect();
  picker.style.top = `${rect.bottom + window.scrollY + 8}px`; picker.style.left = `${rect.left + window.scrollX}px`;
  const closePicker = (e) => { if (!picker.contains(e.target) && e.target !== anchorElement) { picker.remove(); document.removeEventListener('click', closePicker); } };
  setTimeout(() => document.addEventListener('click', closePicker), 0);
}

let selectedNewFolderColor = premiumColors[0];

const submitNewFolder = () => {
  if (!modalFolderName) return;
  const name = modalFolderName.value.trim();
  if (name) {
    folders.push({ id: Date.now().toString(), name: name, color: selectedNewFolderColor, isLocked: false, passcode: null, isPriority: false });
    saveFolders(); renderFolders(); if (newFolderModal) newFolderModal.classList.remove('visible');
  }
};

window.populateFolderDropdown = function(selectElement, selectedFolderId) {
  if (!selectElement) return;
  selectElement.innerHTML = '<option value="">Uncategorized</option>';
  folders.forEach(f => {
    const option = document.createElement('option');
    option.value = f.id; option.textContent = f.name;
    if (f.id === selectedFolderId) option.selected = true;
    selectElement.appendChild(option);
  });
}

window.initFolders = async function() {
  if (window.userSession && window.supabaseClient) {
      const { data } = await window.supabaseClient.from('folders').select('*').eq('user_id', window.userSession.user.id);
      if (data) {
          window.folders = data.map(f => ({
              id: f.id,
              name: f.name,
              color: f.color,
              isPriority: f.is_priority,
              isLocked: f.is_locked,
              passcode: f.passcode
          }));
          folders = window.folders;
      }
  }

  foldersList = document.getElementById('folders-list');
  newFolderInput = document.getElementById('new-folder-input');
  newFolderModalBtn = document.getElementById('new-folder-modal-btn');
  newFolderModal = document.getElementById('new-folder-modal');
  modalFolderName = document.getElementById('modal-folder-name');
  modalColorPicker = document.getElementById('modal-color-picker');
  cancelFolderBtn = document.getElementById('cancel-folder-btn');
  confirmFolderBtn = document.getElementById('confirm-folder-btn');

  if (newFolderModalBtn) {
    newFolderModalBtn.addEventListener('click', () => {
      if (modalColorPicker && modalColorPicker.innerHTML === '') {
        premiumColors.forEach(color => {
           const dot = document.createElement('div');
           dot.className = 'color-option'; dot.style.backgroundColor = color; dot.style.width = '24px'; dot.style.height = '24px'; dot.style.borderRadius = '50%';
           dot.style.cursor = 'pointer'; dot.style.border = '2px solid transparent'; dot.style.boxSizing = 'border-box';
           if (color === selectedNewFolderColor) { dot.style.border = '2px solid white'; dot.style.transform = 'scale(1.1)'; }
           dot.addEventListener('click', () => {
               selectedNewFolderColor = color;
               Array.from(modalColorPicker.children).forEach(c => { c.style.border = '2px solid transparent'; c.style.transform = 'none'; });
               dot.style.border = '2px solid white'; dot.style.transform = 'scale(1.1)';
           });
           modalColorPicker.appendChild(dot);
        });
      }
      if (modalFolderName) modalFolderName.value = '';
      if (newFolderModal) newFolderModal.classList.add('visible');
      if (modalFolderName) setTimeout(() => modalFolderName.focus(), 100);
    });
  }
  if (cancelFolderBtn) cancelFolderBtn.addEventListener('click', () => newFolderModal?.classList.remove('visible'));
  if (confirmFolderBtn) confirmFolderBtn.addEventListener('click', submitNewFolder);
  if (modalFolderName) {
    modalFolderName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitNewFolder();
      if (e.key === 'Escape') newFolderModal?.classList.remove('visible');
    });
  }
  renderFolders();
};

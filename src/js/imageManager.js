(function() {
  let activeImage = null;
  let isResizing = false;
  let currentHandle = null;
  let startX, startY, startWidth, startHeight, startLeft, startTop;
  let isBoxDragging = false;
  let isHandleResizing = false;
  let currentCropHandle = null;
  let cropBoxRect = { x: 0, y: 0, w: 0, h: 0 };
  let mouseStart = { x: 0, y: 0 };
  let initialBoxRect = { x: 0, y: 0, w: 0, h: 0 };

  window.initImageManager = function() {
      const overlay = document.getElementById('image-overlay');
      const toolbar = document.getElementById('image-toolbar');
      const editorBody = document.getElementById('note-body-input');
      const cropModal = document.getElementById('crop-modal');
      const cropImg = document.getElementById('crop-source-image');
      const cropBox = document.getElementById('crop-selection-box');
      const cropCancelBtn = document.getElementById('crop-modal-cancel');
      const cropOkBtn = document.getElementById('crop-modal-ok');
      const cropMasks = {
        top: document.getElementById('crop-mask-top'),
        bottom: document.getElementById('crop-mask-bottom'),
        left: document.getElementById('crop-mask-left'),
        right: document.getElementById('crop-mask-right')
      };

      if (!editorBody || !overlay || !toolbar) return;

      function updateOverlayPosition() {
        if (!activeImage) return;
        const rect = activeImage.getBoundingClientRect();
        const parent = document.querySelector('.editor-content');
        if (!parent) return;
        const parentRect = parent.getBoundingClientRect();
        const w = activeImage.clientWidth || rect.width;
        const h = activeImage.clientHeight || rect.height;
        const top = rect.top - parentRect.top + parent.scrollTop;
        const left = rect.left - parentRect.left + parent.scrollLeft;

        overlay.style.top = `${top}px`;
        overlay.style.left = `${left}px`;
        overlay.style.width = `${w}px`;
        overlay.style.height = `${h}px`;

        let toolbarTop = top - 48;
        if (toolbarTop < parent.scrollTop) toolbarTop = top + h + 8;
        toolbar.style.top = `${toolbarTop}px`;
        toolbar.style.left = `${left}px`;
        window.safeCreateIcons();
      }

      editorBody.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
          activeImage = e.target;
          overlay.classList.add('active');
          toolbar.classList.add('active');
          updateOverlayPosition();
          updateAlignButtons();
        } else if (!e.target.closest('.image-toolbar') && !e.target.closest('.image-overlay')) {
          hideOverlay();
        }
      });

      function hideOverlay() {
        activeImage = null;
        if (overlay) overlay.classList.remove('active');
        if (toolbar) toolbar.classList.remove('active');
      }

      window.addEventListener('resize', updateOverlayPosition);
      editorBody.addEventListener('input', updateOverlayPosition);

      document.querySelectorAll('.resize-handle').forEach(handle => {
        handle.onmousedown = (e) => {
          e.preventDefault(); e.stopPropagation();
          isResizing = true;
          currentHandle = handle.dataset.resize;
          startX = e.clientX; startY = e.clientY;
          const rect = activeImage.getBoundingClientRect();
          startWidth = rect.width; startHeight = rect.height;
          document.onmousemove = onMouseMove;
          document.onmouseup = onMouseUp;
        };
      });

      function onMouseMove(e) {
        if (!isResizing || !activeImage) return;
        const dx = e.clientX - startX;
        const ratio = startWidth / startHeight;
        let newWidth = startWidth + (currentHandle.includes('r') ? dx : -dx);
        if (newWidth > 50) {
          activeImage.style.width = `${newWidth}px`;
          activeImage.style.height = 'auto';
          updateOverlayPosition();
        }
      }

      function onMouseUp() {
        isResizing = false; document.onmousemove = null; document.onmouseup = null;
        if (typeof saveNotes === 'function') saveNotes();
      }

      const alignBtns = document.querySelectorAll('.image-align-btn');
      alignBtns.forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault(); if (!activeImage) return;
          const align = btn.dataset.align;
          activeImage.style.display = ''; activeImage.style.float = ''; activeImage.style.margin = '';
          if (align === 'left') { activeImage.style.float = 'left'; activeImage.style.margin = '0 1em 1em 0'; }
          else if (align === 'center') { activeImage.style.display = 'block'; activeImage.style.margin = '1em auto'; }
          else if (align === 'right') { activeImage.style.float = 'right'; activeImage.style.margin = '0 0 1em 1em'; }
          updateAlignButtons(); updateOverlayPosition();
          if (typeof saveNotes === 'function') saveNotes();
        };
      });

      function updateAlignButtons() {
        if (!activeImage) return;
        alignBtns.forEach(btn => btn.classList.remove('active'));
        const fl = activeImage.style.float;
        const disp = activeImage.style.display;
        if (fl === 'left') document.querySelector('.image-align-btn[data-align="left"]')?.classList.add('active');
        else if (fl === 'right') document.querySelector('.image-align-btn[data-align="right"]')?.classList.add('active');
        else if (disp === 'block') document.querySelector('.image-align-btn[data-align="center"]')?.classList.add('active');
        else document.querySelector('.image-align-btn[data-align="inline"]')?.classList.add('active');
      }

      document.getElementById('delete-image-btn').onclick = (e) => {
        e.preventDefault(); if (activeImage) { activeImage.remove(); hideOverlay(); if (typeof saveNotes === 'function') saveNotes(); }
      };

      document.getElementById('crop-image-btn').onclick = (e) => {
        e.preventDefault(); if (!activeImage) return;
        cropImg.src = activeImage.dataset.originalSrc || activeImage.src;
        cropModal.classList.add('visible');
        cropImg.onload = () => {
          const rect = cropImg.getBoundingClientRect();
          cropBoxRect = { x: rect.width * 0.1, y: rect.height * 0.1, w: rect.width * 0.8, h: rect.height * 0.8 };
          updateCropUI(); cropBox.style.display = 'block';
        };
      };

      function updateCropUI() {
        if (!cropBox || !cropImg) return;
        const imgRect = cropImg.getBoundingClientRect();
        cropBox.style.left = `${cropBoxRect.x}px`; cropBox.style.top = `${cropBoxRect.y}px`;
        cropBox.style.width = `${cropBoxRect.w}px`; cropBox.style.height = `${cropBoxRect.h}px`;
        cropMasks.top.style.height = `${cropBoxRect.y}px`;
        cropMasks.bottom.style.top = `${cropBoxRect.y + cropBoxRect.h}px`;
        cropMasks.bottom.style.height = `${imgRect.height - (cropBoxRect.y + cropBoxRect.h)}px`;
        cropMasks.left.style.top = `${cropBoxRect.y}px`; cropMasks.left.style.height = `${cropBoxRect.h}px`; cropMasks.left.style.width = `${cropBoxRect.x}px`;
        cropMasks.right.style.top = `${cropBoxRect.y}px`; cropMasks.right.style.height = `${cropBoxRect.h}px`; cropMasks.right.style.left = `${cropBoxRect.x + cropBoxRect.w}px`; cropMasks.right.style.width = `${imgRect.width - (cropBoxRect.x + cropBoxRect.w)}px`;
      }

      cropBox.onmousedown = (e) => {
        if (e.target.classList.contains('crop-handle')) { isHandleResizing = true; currentCropHandle = e.target.dataset.handle; }
        else { isBoxDragging = true; }
        mouseStart = { x: e.clientX, y: e.clientY }; initialBoxRect = { ...cropBoxRect };
        document.onmousemove = onCropMouseMove; document.onmouseup = onCropMouseUp;
        e.preventDefault();
      };

      function onCropMouseMove(e) {
        const dx = e.clientX - mouseStart.x; const dy = e.clientY - mouseStart.y;
        const imgRect = cropImg.getBoundingClientRect();
        if (isBoxDragging) {
          cropBoxRect.x = Math.max(0, Math.min(initialBoxRect.x + dx, imgRect.width - cropBoxRect.w));
          cropBoxRect.y = Math.max(0, Math.min(initialBoxRect.y + dy, imgRect.height - cropBoxRect.h));
        } else if (isHandleResizing) {
          if (currentCropHandle.includes('t')) { cropBoxRect.y = Math.max(0, initialBoxRect.y + dy); cropBoxRect.h = initialBoxRect.h - (cropBoxRect.y - initialBoxRect.y); }
          if (currentCropHandle.includes('b')) { cropBoxRect.h = Math.max(20, initialBoxRect.h + dy); }
          if (currentCropHandle.includes('l')) { cropBoxRect.x = Math.max(0, initialBoxRect.x + dx); cropBoxRect.w = initialBoxRect.w - (cropBoxRect.x - initialBoxRect.x); }
          if (currentCropHandle.includes('r')) { cropBoxRect.w = Math.max(20, initialBoxRect.w + dx); }
        }
        updateCropUI();
      }

      function onCropMouseUp() { 
        isBoxDragging = false; 
        isHandleResizing = false; 
        document.onmousemove = null; 
        document.onmouseup = null; 
      }
      
      if (cropCancelBtn) cropCancelBtn.onclick = () => cropModal.classList.remove('visible');
      
      if (cropOkBtn) cropOkBtn.onclick = () => {
        if (!activeImage || !cropImg) return;
        const rect = cropImg.getBoundingClientRect();
        const sx = cropBoxRect.x * (cropImg.naturalWidth / rect.width);
        const sy = cropBoxRect.y * (cropImg.naturalHeight / rect.height);
        const sw = cropBoxRect.w * (cropImg.naturalWidth / rect.width);
        const sh = cropBoxRect.h * (cropImg.naturalHeight / rect.height);
        
        try {
          const canvas = document.createElement('canvas'); 
          canvas.width = sw; 
          canvas.height = sh;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(cropImg, sx, sy, sw, sh, 0, 0, sw, sh);
          
          activeImage.dataset.originalSrc = activeImage.dataset.originalSrc || activeImage.src;
          activeImage.src = canvas.toDataURL('image/png');
          cropModal.classList.remove('visible');
          hideOverlay();
          if (typeof saveNotes === 'function') saveNotes();
        } catch (err) {
          console.error("Crop failed:", err);
          alert("Could not crop image. It might be from an external source that prevents direct manipulation.");
        }
      };

      window.hideImageOverlay = hideOverlay;
  };
})();

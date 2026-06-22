/**
 * PDF Manager - Advanced Logic for importing and parsing PDF files
 * Preserves formatting (headings, paragraphs) and extracts images.
 */

const PDF_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const LOCAL_STORAGE_ATTACHMENT_CAP = 3 * 1024 * 1024; // 3MB (Safer for DataURL ballooning in localStorage)

/**
 * Main entrance to extract HTML content (text + images) from PDF
 */
async function extractContentFromPdf(data) {
    console.log('Starting advanced PDF extraction...');
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    let htmlContent = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        showLoading(true, `Processing Page ${i} of ${pdf.numPages}...`);
        console.log(`Processing page ${i}...`);
        const page = await pdf.getPage(i);
        
        // 1. Extract Text with Formatting
        const textContent = await page.getTextContent();
        const pageHtml = reconstructLayout(textContent.items);
        
        // 2. Extract Images
        const imageHtml = await extractImagesFromPage(page);
        
        if (pageHtml || imageHtml) {
            htmlContent += `<div class="pdf-page-content" data-page="${i}">`;
            htmlContent += pageHtml || '';
            htmlContent += imageHtml || '';
            htmlContent += `</div><hr style="border: 0; border-top: 1px dashed var(--border-color); margin: 40px 0;">`;
        }
    }

    if (!htmlContent.trim()) {
        console.warn('Advanced extraction produced empty content, falling back to basic...');
        const basic = await extractTextFromPdf_Basic(data);
        return basic ? `<p>${basic.replace(/\n/g, '<br>')}</p>` : '';
    }

    return htmlContent;
}

/**
 * Groups text items into lines and paragraphs, detects headings
 */
function reconstructLayout(items) {
    if (items.length === 0) return '';

    // Sort items by Y descending (top to bottom) then X ascending (left to right)
    items.sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);

    let html = '';
    let currentLineY = items[0].transform[5];
    let currentLineItems = [];
    const lines = [];

    // Group items into lines
    items.forEach(item => {
        const y = item.transform[5];
        if (Math.abs(y - currentLineY) < 3) {
            currentLineItems.push(item);
        } else {
            lines.push([...currentLineItems]);
            currentLineItems = [item];
            currentLineY = y;
        }
    });
    lines.push(currentLineItems);

    // Process lines into blocks
    let inParagraph = false;
    let lastMaxFontSize = 0;
    
    lines.forEach(lineItems => {
        // Sort items in line by X
        lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
        
        const lineText = lineItems.map(item => item.str).join(' ').trim();
        if (!lineText) return;

        // Detect spacing (new paragraph if Y jump is big)
        const maxFontSize = Math.max(...lineItems.map(item => item.transform[0]));
        
        if (maxFontSize > 15 || (lastMaxFontSize > 0 && Math.abs(maxFontSize - lastMaxFontSize) > 2)) {
            if (inParagraph) { html += '</p>'; inParagraph = false; }
            if (maxFontSize > 15) {
                const tag = maxFontSize > 20 ? 'h2' : 'h3';
                html += `<${tag} style="margin-top:20px; color:var(--text-primary);">${lineText}</${tag}>`;
            } else {
                html += `<p>${lineText}`;
                inParagraph = true;
            }
        } else {
            if (!inParagraph) { html += '<p>'; inParagraph = true; }
            else { html += ' '; }
            html += lineText;
        }
        lastMaxFontSize = maxFontSize;
    });

    if (inParagraph) html += '</p>';
    return html;
}

/**
 * Extracts images from a PDF page using the internal operator list
 */
async function extractImagesFromPage(page) {
    let imagesHtml = '';
    try {
        const ops = await page.getOperatorList();
        const imageOps = ops.fnArray.map((fn, i) => ({ fn, index: i }))
                                   .filter(op => op.fn === pdfjsLib.OPS.paintImageXObject || op.fn === pdfjsLib.OPS.paintInlineImageXObject);

        for (const op of imageOps) {
            const objId = ops.argsArray[op.index][0];
            const img = await new Promise((resolve) => {
                page.objs.get(objId, (image) => resolve(image));
            });

            if (img && img.data) {
                const base64 = await imageBufferToBase64(img);
                if (base64) {
                    imagesHtml += `<div style="text-align: center; margin: 20px 0;"><img src="${base64}" style="max-width: 100%; border-radius: 8px; box-shadow: var(--shadow-sm);"></div>`;
                }
            }
        }
    } catch (err) {
        console.error('Error extracting images:', err);
    }
    return imagesHtml;
}

/**
 * Converts PDF.js image buffer to a base64 Data URL with optimization
 */
async function imageBufferToBase64(img) {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // PDF.js image data follows different formats (RGB, RGBA, etc)
        const imageData = ctx.createImageData(img.width, img.height);
        let srcData = img.data;

        // Simple conversion for basic image types
        if (srcData.length === img.width * img.height * 3) {
            // RGB to RGBA
            for (let i = 0, j = 0; i < srcData.length; i += 3, j += 4) {
                imageData.data[j] = srcData[i];
                imageData.data[j+1] = srcData[i+1];
                imageData.data[j+2] = srcData[i+2];
                imageData.data[j+3] = 255;
            }
        } else {
            imageData.data.set(srcData);
        }
        
        ctx.putImageData(imageData, 0, 0);

        // Optimization: Resize if image is very large to save localStorage space
        const MAX_DIM = 1200;
        if (canvas.width > MAX_DIM || canvas.height > MAX_DIM) {
            const ratio = Math.min(MAX_DIM / canvas.width, MAX_DIM / canvas.height);
            const offscreen = document.createElement('canvas');
            offscreen.width = canvas.width * ratio;
            offscreen.height = canvas.height * ratio;
            offscreen.getContext('2d').drawImage(canvas, 0, 0, offscreen.width, offscreen.height);
            return offscreen.toDataURL('image/jpeg', 0.8);
        }

        return canvas.toDataURL('image/jpeg', 0.82);
    } catch (e) {
        console.warn('Failed to convert image buffer:', e);
        return null;
    }
}

/**
 * Handle File Import Logic
 */
async function handlePdfImport(file) {
    if (!file || file.type !== 'application/pdf') {
        alert('Invalid file type. Please select a PDF.');
        return;
    }

    if (file.size > PDF_MAX_SIZE) {
        alert('File is too large. Max size for advanced import is 10MB.');
        return;
    }

    const reader = new FileReader();
    
    return new Promise((resolve) => {
        reader.onload = async (e) => {
            const arrayBuffer = e.target.result;
            const filename = file.name.replace('.pdf', '');
            
            // Show mode selection modal
            const modal = document.getElementById('pdf-mode-modal');
            const filenameLabel = document.getElementById('pdf-filename-label');
            filenameLabel.textContent = file.name;
            modal.classList.add('visible');

            const cleanup = () => {
                modal.classList.remove('visible');
            };
            
            window.safeCreateIcons();

            document.getElementById('mode-attach-btn').onclick = () => {
                if (file.size > LOCAL_STORAGE_ATTACHMENT_CAP) {
                    alert('PDF is too large to attach (Max 3MB for storage stability). Please use "Convert to Text" instead.');
                    // Don't close modal or resolve yet, let user choose another option
                    return;
                }
                cleanup();
                showLoading(true, 'Preparing attachment...');
                
                const attachmentReader = new FileReader();
                attachmentReader.onload = () => {
                    resolve({
                        mode: 'attach',
                        title: filename,
                        dataUrl: attachmentReader.result,
                        metadata: {
                            name: file.name,
                            size: formatFileSize(file.size),
                            date: new Date().toLocaleDateString()
                        }
                    });
                };
                attachmentReader.onerror = () => {
                    alert('Failed to read file.');
                    resolve(null);
                };
                attachmentReader.readAsDataURL(file);
            };

            document.getElementById('mode-convert-btn').onclick = async () => {
                cleanup();
                showLoading(true, 'Extracting content & photos...');
                try {
                    console.log('Mode: Convert to Text selected');
                    const html = await extractContentFromPdf(arrayBuffer);
                    if (!html) throw new Error('Empty content generated');
                    resolve({
                        mode: 'convert',
                        title: filename,
                        content: html
                    });
                } catch (err) {
                    console.error('Advanced PDF extraction failed:', err);
                    alert('Advanced extraction failed. Falling back to basic attachment mode.');
                    // Fallback to attachment automatically to ensure "it works"
                    const attachmentReader = new FileReader();
                    attachmentReader.onload = () => {
                        resolve({
                            mode: 'attach',
                            title: filename,
                            dataUrl: attachmentReader.result,
                            metadata: { name: file.name, size: formatFileSize(file.size), date: new Date().toLocaleDateString() }
                        });
                    };
                    attachmentReader.readAsDataURL(file);
                }
            };

            document.getElementById('cancel-pdf-btn').onclick = () => {
                cleanup();
                resolve(null);
            };
        };
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Basic text extraction as fallback
 */
async function extractTextFromPdf_Basic(data) {
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ') + '\n\n';
    }
    return fullText.trim();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showLoading(show, text = 'Processing PDF...') {
    const overlay = document.getElementById('loading-overlay');
    const label = document.getElementById('loading-text');
    if (show) {
        label.textContent = text;
        overlay.classList.add('visible');
    } else {
        overlay.classList.remove('visible');
    }
}

// Global scope initialization
window.initPdfManager = function() {
    const importBtn = document.getElementById('import-pdf-btn');
    const fileInput = document.getElementById('pdf-import-input');

    if (importBtn && fileInput) {
        importBtn.onclick = () => fileInput.click();
        
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const result = await handlePdfImport(file);
                showLoading(false);
                
                if (result) {
                    processPdfImportResult(result);
                    window.safeCreateIcons();
                }
            }
            fileInput.value = '';
        };
    }
};

async function processPdfImportResult(result) {
    const activeNoteId = window.currentNoteId;
    
    if (activeNoteId && activeNoteId !== 'new') {
        const note = notes.find(n => n.id === activeNoteId);
        if (note) {
            if (result.mode === 'convert') {
                const separator = `<hr style="border:0; border-top:2px solid var(--accent-yellow); margin:40px 0; opacity:0.3;">`;
                note.body += `${separator}<h2>Imported from ${result.title}</h2>${result.content}`;
                
                const bodyInput = document.getElementById('note-body-input');
                if (bodyInput) bodyInput.innerHTML = note.body;
            } else if (result.mode === 'attach') {
                if (!note.attachments) note.attachments = [];
                
                // Check for existing PDF
                const existingPdf = note.attachments.find(a => a.type === 'pdf');
                if (existingPdf) {
                    const confirmed = await window.customConfirm(`This note already has a PDF attached ("${existingPdf.fileName}"). Do you want to replace it with "${result.metadata.name}"?`, 'Replace Existing PDF');
                    if (!confirmed) return;
                    
                    // Remove old PDF
                    note.attachments = note.attachments.filter(a => a.type !== 'pdf');
                }

                const newAttachment = {
                    type: 'pdf',
                    fileName: result.metadata.name,
                    fileSize: result.metadata.size,
                    dataUrl: result.dataUrl,
                    uploadedAt: Date.now()
                };
                note.attachments.push(newAttachment);
                
                if (typeof renderPdfAttachments === 'function') {
                    renderPdfAttachments(note.attachments);
                }

                if (typeof window.openStudyMode === 'function') {
                    window.openStudyMode(result.dataUrl, result.metadata.name);
                }
            }
            
            note.updatedAt = Date.now();
            saveNotes();
            renderNotes();
            showSuccessToast('PDF merged into current note');
            return;
        }
    }
    
    // Fallback: Create new note
    const body = result.mode === 'convert' ? result.content : '';
    const attachmentValue = result.mode === 'attach' ? result : null;
    createNewPdfNote_Internal(result.title, body, attachmentValue);
}

function createNewPdfNote_Internal(title, body, attachmentResult = null) {
    const newId = Date.now().toString();
    const newNote = {
        id: newId,
        title: title,
        body: body,
        folderId: window.currentFilterFolderId || null,
        isLocked: false,
        passcode: null,
        lineHeight: '1.6',
        wordSpacing: 'normal',
        letterSpacing: 'normal',
        pageMargin: 'normal',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        attachments: attachmentResult && attachmentResult.mode === 'attach' ? [{
            type: 'pdf',
            fileName: attachmentResult.metadata.name,
            fileSize: attachmentResult.metadata.size,
            dataUrl: attachmentResult.dataUrl,
            uploadedAt: Date.now()
        }] : []
    };

    notes.push(newNote);
    
    // Check total size to warn user
    const totalSize = JSON.stringify(notes).length;
    if (totalSize > 4.5 * 1024 * 1024) {
        alert('Warning: Your storage is almost full (approx 5MB limit). Consider deleting old notes or large images.');
    }

    saveNotes();
    renderNotes();
    if (typeof openEditor === 'function') openEditor(newId);
    
    // Auto-open study mode if it's an attachment
    if (attachmentResult && attachmentResult.mode === 'attach' && typeof window.openStudyMode === 'function') {
        setTimeout(() => {
            window.openStudyMode(attachmentResult.dataUrl, attachmentResult.metadata.name);
        }, 100);
    }
    
    showSuccessToast('PDF imported successfully');
}

function showSuccessToast(msg) { console.log(msg); }

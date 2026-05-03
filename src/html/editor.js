window.EDITOR_FRAGMENT = `
<!-- Note Editor View -->
<section id="editor-view" class="view hidden-view">
  <header class="editor-header">
    <div class="editor-top-bar">
      <div class="top-bar-left">
        <button id="mobile-sidebar-toggle-editor" class="icon-btn mobile-sidebar-toggle"
          style="margin-right: 12px; display: none;">
          <i data-lucide="menu" size="20"></i>
        </button>
        <button class="back-btn" id="back-btn"><i data-lucide="chevron-left" size="20"></i> Back</button>
      </div>
      <div class="editor-actions">
        <button class="icon-btn" id="lock-note-btn"><i data-lucide="unlock" size="20"></i></button>
        <button class="icon-btn" id="import-pdf-btn" title="Import PDF"><i data-lucide="file-up"
            size="20"></i></button>
        <input type="file" id="pdf-import-input" accept=".pdf" style="display: none;">
        <button class="icon-btn" id="print-note-btn" title="Print (Ctrl+P)"><i data-lucide="printer"
            size="20"></i></button>
        <div class="dropdown-container">
          <button class="icon-btn" id="download-note-btn" title="Download Note"><i data-lucide="download"
              size="20"></i></button>
          <div class="dropdown-menu align-menu" id="download-format-menu"
            style="left: auto; right: 0; transform: none; min-width: 140px;">
            <button onclick="downloadNote('docx')"><i data-lucide="file-text" size="14"></i> Word (.docx)</button>
            <button onclick="downloadNote('pdf')"><i data-lucide="file-type-2" size="14"></i> PDF (.pdf)</button>
            <button onclick="downloadNote('html')"><i data-lucide="code" size="14"></i> HTML (.html)</button>
            <button onclick="downloadNote('txt')"><i data-lucide="type" size="14"></i> Text (.txt)</button>
          </div>
        </div>
        <button class="icon-btn" id="delete-note-btn"><i data-lucide="trash-2" size="20"></i></button>
      </div>
    </div>

    <div class="editor-title-container">
      <div class="title-pill-group">
        <input type="text" id="note-title-input" class="note-title-input" autocomplete="off" readonly onfocus="this.removeAttribute('readonly');" placeholder="Notes Title">
      </div>
      <div class="right-controls-group">
        <!-- Compact Header Attachment Pill -->
        <div id="header-attachments-area" class="header-attachments-area"></div>
        <select id="note-folder-select" class="note-folder-select">
        </select>
      </div>
    </div>
  </header>

  <!-- Apple-Style Dual-Pane Split View Container -->
  <div class="split-view-container" id="split-view-container">

    <!-- Left Pane: The Active Notes Area -->
    <div class="split-pane notes-pane focused" id="notes-pane">
      <div class="pane-content-wrapper">
        <div class="formatting-toolbar">
          <!-- Text Color Dropdown -->
          <div class="dropdown-container">
            <button class="icon-btn" id="format-text-color-btn" title="Text Color"
              style="display:flex; align-items:center; gap:4px;">
              <div
                style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; margin-top: 2px;">
                <span style="font-weight: bold; font-family: serif; font-size: 14px; line-height: 1;">A</span>
                <div id="current-text-color-bar"
                  style="width: 12px; height: 3px; background-color: var(--text-primary); border-radius: 2px;">
                </div>
              </div>
              <i data-lucide="chevron-down" size="12"></i>
            </button>
            <div class="dropdown-menu color-menu"
              style="flex-direction: row; flex-wrap: wrap; width: 144px; padding: 12px; gap: 8px; justify-content: flex-start;">
              <button class="color-option" style="background-color: var(--text-primary);"
                onclick="changeTextColor('default')" title="Default Context Color"></button>
              <button class="color-option"
                style="background-color: rgb(255, 255, 255); box-shadow: inset 0 0 0 1px var(--border-color);"
                onclick="changeTextColor('rgb(255, 255, 255)')" title="White"></button>
              <button class="color-option"
                style="background-color: rgb(0, 0, 0); box-shadow: inset 0 0 0 1px var(--border-color);"
                onclick="changeTextColor('rgb(0, 0, 0)')" title="Black"></button>
              <button class="color-option" style="background-color: rgb(150, 150, 150);"
                onclick="changeTextColor('rgb(150, 150, 150)')" title="Gray"></button>
              <button class="color-option" style="background-color: rgb(255, 0, 0);"
                onclick="changeTextColor('rgb(255, 0, 0)')" title="Red"></button>
              <button class="color-option" style="background-color: rgb(255, 128, 0);"
                onclick="changeTextColor('rgb(255, 128, 0)')" title="Orange"></button>
              <button class="color-option" style="background-color: rgb(255, 214, 10);"
                onclick="changeTextColor('rgb(255, 214, 10)')" title="Yellow"></button>
              <button class="color-option" style="background-color: rgb(0, 255, 0);"
                onclick="changeTextColor('rgb(0, 255, 0)')" title="Green"></button>
              <button class="color-option" style="background-color: rgb(0, 255, 255);"
                onclick="changeTextColor('rgb(0, 255, 255)')" title="Cyan"></button>
              <button class="color-option" style="background-color: rgb(0, 128, 255);"
                onclick="changeTextColor('rgb(0, 128, 255)')" title="Blue"></button>
              <button class="color-option" style="background-color: rgb(128, 0, 128);"
                onclick="changeTextColor('rgb(128, 0, 128)')" title="Purple"></button>
              <button class="color-option" style="background-color: rgb(255, 0, 255);"
                onclick="changeTextColor('rgb(255, 0, 255)')" title="Magenta"></button>
            </div>
          </div>

          <!-- Highlight Color Dropdown -->
          <div class="dropdown-container">
            <button class="icon-btn color-yellow-btn" id="format-color-btn" title="Highlight Color">
              <div class="color-dot" id="current-color-dot" style="background-color: rgb(255, 255, 0);"></div>
              <i data-lucide="chevron-down" size="12" style="margin-left: 4px;"></i>
            </button>
            <div class="dropdown-menu color-menu"
              style="flex-direction: row; flex-wrap: wrap; width: 144px; padding: 12px; gap: 8px; justify-content: flex-start;">
              <button class="color-option" style="background-color: rgb(255, 255, 0);"
                onclick="changeHighlightColor('rgb(255, 255, 0)')" title="Yellow"></button>
              <button class="color-option" style="background-color: rgb(0, 255, 0);"
                onclick="changeHighlightColor('rgb(0, 255, 0)')" title="Green"></button>
              <button class="color-option" style="background-color: rgb(0, 255, 255);"
                onclick="changeHighlightColor('rgb(0, 255, 255)')" title="Cyan"></button>
              <button class="color-option" style="background-color: rgb(255, 0, 255);"
                onclick="changeHighlightColor('rgb(255, 0, 255)')" title="Magenta"></button>
              <button class="color-option" style="background-color: rgb(255, 128, 0);"
                onclick="changeHighlightColor('rgb(255, 128, 0)')" title="Orange"></button>
              <button class="color-option" style="background-color: rgb(255, 0, 0);"
                onclick="changeHighlightColor('rgb(255, 0, 0)')" title="Red"></button>
              <button class="color-option" style="background-color: rgb(128, 0, 128);"
                onclick="changeHighlightColor('rgb(128, 0, 128)')" title="Purple"></button>
              <button class="color-option" style="background-color: rgb(0, 128, 255);"
                onclick="changeHighlightColor('rgb(0, 128, 255)')" title="Blue"></button>
              <button class="color-option"
                style="background-color: transparent; border: 1px dashed var(--text-secondary);"
                onclick="changeHighlightColor('transparent')" title="None/Clear"></button>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Font Family Dropdown -->
          <div class="dropdown-container">
            <button class="icon-btn font-family-btn" id="format-font-btn" title="Font Family">
              <i data-lucide="type" size="16"></i>
              <span id="current-font-family">Roboto</span>
              <i data-lucide="chevron-down" size="12" class="dropdown-chevron"></i>
            </button>
            <div class="dropdown-menu font-family-menu" id="font-family-dropdown">
              <button onclick="changeFontFamily('Roboto')" style="font-family: Roboto;">Roboto <span
                  class="font-default-label">Default</span></button>
              <button onclick="changeFontFamily('Times New Roman')"
                style="font-family: 'Times New Roman', Times, serif;">Times New Roman</button>
              <button onclick="changeFontFamily('Arial')" style="font-family: Arial, sans-serif;">Arial</button>
              <button onclick="changeFontFamily('Comic Sans MS')"
                style="font-family: 'Comic Sans MS', 'Comic Sans', cursive;">Comic Sans</button>
              <div class="dropdown-divider"></div>
              <button id="import-font-btn"><i data-lucide="upload" size="14"></i> Import Font...</button>
            </div>
          </div>
          <input type="file" id="font-file-input" accept=".ttf,.otf,.woff,.woff2" style="display: none;">

          <div class="divider"></div>

          <!-- Font Size Dropdown -->
          <div class="dropdown-container">
            <button class="icon-btn font-size-btn" id="format-size-btn" title="Font Size">
              <i data-lucide="case-upper" size="16"></i>
              <span id="current-font-size">16</span>
              <i data-lucide="chevron-down" size="12" class="dropdown-chevron"></i>
            </button>
            <div class="dropdown-menu font-size-menu">
              <button onclick="format('fontSize', '1')">10</button>
              <button onclick="format('fontSize', '2')">13</button>
              <button onclick="format('fontSize', '14')">14</button>
              <button onclick="format('fontSize', '3')">16</button>
              <button onclick="format('fontSize', '4')">18</button>
              <button onclick="format('fontSize', '20')">20</button>
              <button onclick="format('fontSize', '5')">24</button>
              <button onclick="format('fontSize', '30')">30</button>
              <button onclick="format('fontSize', '6')">32</button>
              <button onclick="format('fontSize', '7')">48</button>
              <button onclick="format('fontSize', '64')">64</button>
              <button onclick="format('fontSize', '72')">72</button>
              <button onclick="format('fontSize', '96')">96</button>
              <button onclick="format('fontSize', '100')">100</button>
            </div>
          </div>

          <div class="divider"></div>
          <button class="icon-btn" id="format-bold-btn" title="Bold (Ctrl+B)"><b>B</b></button>
          <button class="icon-btn" id="format-italic-btn" title="Italic (Ctrl+I)"><i>I</i></button>
          <button class="icon-btn" id="format-underline-btn" title="Underline (Ctrl+U)"><u>U</u></button>
          <button class="icon-btn format-btn" id="format-image-btn" title="Insert Image"><i data-lucide="image"
              size="16"></i></button>
          <input type="file" id="image-upload-input" accept="image/*" style="display: none;">
          <div class="divider"></div>
          <button class="icon-btn format-btn" id="format-checklist-btn" title="Checklist"><i
              data-lucide="list-todo" size="16"></i></button>
          <button class="icon-btn format-btn" id="format-ul-btn" title="Bulleted List"><i data-lucide="list"
              size="16"></i></button>
          <button class="icon-btn format-btn" id="format-ol-btn" title="Numbered List"><i
              data-lucide="list-ordered" size="16"></i></button>
          <div class="divider"></div>

          <!-- Alignment Dropdown -->
          <div class="dropdown-container">
            <button class="icon-btn format-btn" id="format-align-btn"><i data-lucide="align-left" size="16"></i>
              <i data-lucide="chevron-down" size="12" class="dropdown-chevron"></i></button>
            <div class="dropdown-menu align-menu">
              <button onclick="format('justifyLeft')"><i data-lucide="align-left" size="14"></i> Left</button>
              <button onclick="format('justifyCenter')"><i data-lucide="align-center" size="14"></i>
                Center</button>
              <button onclick="format('justifyRight')"><i data-lucide="align-right" size="14"></i> Right</button>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Spacing Dropdown -->
          <div class="dropdown-container">
            <button class="icon-btn format-btn" id="format-spacing-btn" title="Spacing Settings"><i
                data-lucide="move-vertical" size="16"></i> <i data-lucide="chevron-down" size="12"
                class="dropdown-chevron"></i></button>
            <div class="dropdown-menu align-menu" style="min-width: 160px; padding: 8px 0;">
              <div
                style="padding: 4px 12px; font-size: 10px; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">
                Line Height</div>
              <button onclick="changeLineHeight('1.2')">1.2 (Compact)</button>
              <button onclick="changeLineHeight('1.6')">1.6 (Default)</button>
              <button onclick="changeLineHeight('2.0')">2.0 (Loose)</button>
              <div class="dropdown-divider"></div>
              <div
                style="padding: 4px 12px; font-size: 10px; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">
                Word Spacing</div>
              <button onclick="changeWordSpacing('normal')">Normal</button>
              <button onclick="changeWordSpacing('2px')">Wide</button>
              <button onclick="changeWordSpacing('4px')">Wider</button>
              <div class="dropdown-divider"></div>
              <div
                style="padding: 4px 12px; font-size: 10px; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">
                Letter Spacing</div>
              <button onclick="changeLetterSpacing('normal')">Normal</button>
              <button onclick="changeLetterSpacing('0.5px')">Wide</button>
              <button onclick="changeLetterSpacing('1px')">Wider</button>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Page Margin Dropdown -->
          <div class="dropdown-container">
            <button class="icon-btn format-btn" id="format-margin-btn" title="Page Margins"><i
                data-lucide="maximize" size="16"></i> <i data-lucide="chevron-down" size="12"></i></button>
            <div class="dropdown-menu align-menu" style="min-width: 140px;">
              <button onclick="changePageMargin('narrow')"><i data-lucide="minimize-2" size="14"></i> 0.5</button>
              <button onclick="changePageMargin('normal')"><i data-lucide="layout-template" size="14"></i>
                1.0</button>
              <button onclick="changePageMargin('wide')"><i data-lucide="maximize-2" size="14"></i> 2.0</button>
            </div>
          </div>
        </div>

        <!-- Main Rich Text Editor -->
        <div class="editor-content">
          <div class="editor-body-input" id="note-body-input" contenteditable="true"
            placeholder="Start typing your notes here..."></div>

          <!-- Image Selection & Tools -->
          <div class="image-overlay" id="image-overlay">
            <div class="resize-handle top-left" data-resize="tl"></div>
            <div class="resize-handle top-right" data-resize="tr"></div>
            <div class="resize-handle bottom-left" data-resize="bl"></div>
            <div class="resize-handle bottom-right" data-resize="br"></div>
          </div>

          <div class="image-toolbar" id="image-toolbar">
            <button class="icon-btn image-align-btn" data-align="left" title="Align Left"><i data-lucide="align-left" size="16"></i></button>
            <button class="icon-btn image-align-btn" data-align="center" title="Align Center"><i data-lucide="align-center" size="16"></i></button>
            <button class="icon-btn image-align-btn" data-align="right" title="Align Right"><i data-lucide="align-right" size="16"></i></button>
            <div class="divider"></div>
            <button class="icon-btn" id="crop-image-btn" title="Crop Image"><i data-lucide="crop" size="16"></i></button>
            <button class="icon-btn" id="delete-image-btn" title="Delete Image" style="color: var(--accent-red);"><i data-lucide="trash-2" size="16"></i></button>
          </div>
        </div>
      </div>
    </div>

    <!-- Vertical Divider / Resizer -->
    <div class="pane-resizer" id="pane-resizer">
      <div class="resizer-handle"></div>
    </div>

    <!-- Right Pane: The PDF Study Area -->
    <div class="split-pane document-pane dimmed" id="document-pane" style="display: none;">
      <div class="pane-content-wrapper">
        <div class="document-header">
          <span id="pdf-viewer-name" class="document-name truncate">Document Viewer</span>
          <div class="document-actions">
            <button class="icon-btn" id="close-study-mode" title="Exit Split View"><i data-lucide="x"
                size="20"></i></button>
          </div>
        </div>
        <div class="document-body">
          <iframe id="pdf-viewer-iframe" src="" frameborder="0"></iframe>
        </div>
      </div>
    </div>
  </div>
</section>
`;

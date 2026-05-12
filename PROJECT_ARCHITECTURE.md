# NTSYMARK Project Architecture

Complete documentation of the folder structure, module purposes, and how components interact.

---

## Overview

NTSYMARK is a full-featured productivity suite built with vanilla JavaScript and CSS. It's organized into three main folders:

- **`src/js/`** — Logic and state management (21 modules)
- **`src/html/`** — UI components and HTML templates (9 modules)
- **`src/css/`** — Styles organized by feature (16 stylesheets)

---

## Folder Structure: `src/js/`

### Core Module Management

| File | Purpose |
|------|---------|
| `main.js` | **Entry point.** Imports all modules and initializes components on `DOMContentLoaded` |
| `componentLoader.js` | Dynamically loads HTML fragments into DOM placeholders |
| `modal.js` | Generic modal dialog system (show, hide, close logic) |
| `supabaseClient.js` | Initializes Supabase client with environment variables |

### Authentication & User Management

| File | Purpose |
|------|---------|
| `authManager.js` | Handles user login, signup, password reset, session checks |
| `profileManager.js` | User profile page logic, personal settings, avatar/bio management |

### Note & Folder Management

| File | Purpose |
|------|---------|
| `notesManager.js` | Create, read, update, delete notes; manage note lifecycle |
| `foldersManager.js` | Organize notes into folders; folder CRUD operations |
| `priorityTracker.js` | Mark notes as priority/pinned; priority sorting |
| `pdfManager.js` | Upload, parse, extract text from PDF files |
| `imageManager.js` | Handle image uploads, preview, display in notes |
| `printManager.js` | Generate printable output for notes (PDF or HTML) |

### Study Features

| File | Purpose |
|------|---------|
| `chatBuddy.js` | AI Study Buddy: API calls to Groq/Gemini, chat history management |
| `calendar.js` | Calendar view for notes, date-based filtering |
| `pomodoroTimer.js` | Pomodoro timer with audio alarms, session tracking |
| `musicPlayer.js` | Background music player; play/pause/volume controls |
| `alarmManager.js` | Schedule and trigger alarms for study sessions |

### UI & System Features

| File | Purpose |
|------|---------|
| `clock.js` | Display current time, update periodically |
| `responsive.js` | Handle window resizing, mobile layout adjustments |
| `settingsManager.js` | Manage app settings: theme (dark/light), AI provider, API keys |

---

## Folder Structure: `src/html/`

HTML templates are stored as JavaScript fragments. Each exports a `window.XXX_FRAGMENT` string.

| File | Purpose |
|------|---------|
| `auth.js` | All auth views: login, signup, forgot password, email confirmation |
| `homepage.js` | Landing/dashboard page; recent notes, quick actions |
| `sidebar.js` | Left navigation: folders, recent, shortcuts, user menu |
| `editor.js` | Main note editor with rich text, PDF view, Study Buddy panel |
| `modals.js` | Reusable modal templates: confirm, alert, input dialogs |
| `profile.js` | User profile page: bio, avatar, account settings |
| `settings.js` | Settings page: theme, AI provider, API key inputs |
| `musicPlayer.js` | Music player UI: play controls, volume slider, current track |
| `chatBuddy.js` | Chat interface for Study Buddy: messages, input, history drawer |

---

## Folder Structure: `src/css/`

Stylesheets organized by feature/page. Use CSS variables for theming.

| File | Purpose |
|------|---------|
| `variables.css` | **Global theme variables** (colors, spacing, fonts) — modify for branding |
| `base.css` | **Base styles** (typography, reset, buttons, inputs) |
| `landing.css` | Landing/homepage layout and styling |
| `auth.css` | Auth forms and sign-in/signup page styles |
| `sidebar.css` | Sidebar navigation and folder tree |
| `mainContent.css` | Main content area grid and layout |
| `editor.css` | Note editor, rich text styling, toolbar |
| `modals.css` | Modal dialogs and overlays |
| `calendar.css` | Calendar widget and date picker |
| `pomodoro.css` | Pomodoro timer display and controls |
| `musicPlayer.css` | Music player UI |
| `chatBuddy.css` | Chat interface and Study Buddy panel |
| `profile.css` | Profile page layout |
| `settings.css` | Settings page forms |
| `mobile.css` | Mobile-responsive overrides |
| `print.css` | Print-friendly styles |

---

## Data Flow & Module Dependencies

### Initialization order (`main.js`)

```
1. Auth (login check)
2. Modals (critical for all dialogs)
3. Responsive (set viewport)
4. UI Widgets (Clock, Calendar, Pomodoro, Music Player)
5. Data managers (Folders, Notes, Priority)
6. Feature managers (PDF, Image, Chat, Profile, Settings)
```

### Key interactions

**User Login** → `authManager.js` → Supabase session → Load user data

**Create Note** → `notesManager.js` → Supabase insert → Refresh sidebar (via `foldersManager.js`)

**Edit Note** → `editor.js` → `notesManager.js` → Update Supabase

**Upload PDF** → `pdfManager.js` → Extract text → Display in editor → Make available to Chat Buddy

**Chat with Buddy** → `chatBuddy.js` → Call Groq/Gemini API → Display response → Save to note history

**Change Theme** → `settingsManager.js` → Update CSS variables in `variables.css` → Full app recolors

---

## Global `window` variables

Modules export functions and state to the global `window` object for easy access:

```js
window.initAuth()              // Start auth flow
window.initModal()             // Initialize modal system
window.initNotes()             // Load notes data
window.openNote(id)            // Open specific note in editor
window.showView(viewName)      // Switch between views (homepage, editor, profile, etc.)
window.currentNoteId           // Currently open note ID
window.notes                   // Array of all notes
window.userSession             // Logged-in user data
window.supabaseClient          // Supabase JS client
window.activePdfText           // Text extracted from open PDF
window.toggleChatBuddyWindow() // Show/hide Study Buddy
window.toggleStudyBuddyVisibility(isVisible) // Show only on editor
```

---

## Environment Variables

Required for deployment (set in `.env.local` and Vercel):

```
VITE_GROQ_API_KEY              # Groq API for Study Buddy (optional, has global fallback)
VITE_SUPABASE_URL              # Your Supabase project URL
VITE_SUPABASE_ANON_KEY         # Supabase anonymous/public key
```

---

## Build & Deployment

### Local development

```bash
npm run dev      # Start Vite dev server on http://localhost:5173
```

### Build for production

```bash
npm run build    # Bundle to dist/ folder
npm run preview  # Preview production build locally
```

### Vercel deployment

1. Push to GitHub
2. Connect repo to Vercel
3. Add env vars in Vercel project settings
4. Vercel auto-builds and deploys on push

---

## Module-by-module breakdown

### `authManager.js`
- Handles Supabase authentication
- Manages login, signup, password reset flows
- Stores session in localStorage
- Redirects to dashboard on successful login

### `notesManager.js`
- CRUD operations for notes
- Auto-save to Supabase on edit
- Track edit timestamps
- Handle note deletion

### `chatBuddy.js`
- Initialize Study Buddy AI chat panel
- Manage chat history per note
- Call Groq API (primary) or Gemini API (fallback)
- Local AI fallback if no API key
- Extract key concepts from note content

### `pdfManager.js`
- Upload and preview PDF files
- Extract text using pdf.js library
- Store extracted text in `window.activePdfText`
- Pass content to Chat Buddy for context

### `settingsManager.js`
- Manage user preferences (theme, AI provider)
- Store settings in localStorage
- Sync API key inputs
- Apply theme changes in real-time

### `pomodoroTimer.js`
- Run Pomodoro cycles (25 min work, 5 min break)
- Trigger audio alarm via `alarmManager.js`
- Track completed sessions
- Display timer in UI

### `calendar.js`
- Display calendar with note indicators
- Allow date-based note filtering
- Navigate between months

---

## How to extend

### Add a new note type

1. Create `src/html/newFeature.js` with the HTML template
2. Create `src/js/newFeatureManager.js` with CRUD logic
3. Import both in `src/js/main.ts` (after TypeScript migration)
4. Call `initNewFeature()` in main.ts
5. Add CSS to `src/css/newFeature.css`
6. Add to `.env` if it needs API keys

### Add a new API integration

1. Create `src/js/yourApiManager.js`
2. Add environment variable to `.env` and `.env.local`
3. Use `import.meta.env.VITE_YOUR_API_KEY` to access it
4. Call the API and store results on `window` if needed
5. Import in `main.ts` and initialize

### Add a new page/view

1. Create HTML fragment in `src/html/yourPage.js`
2. Create logic in `src/js/yourPageManager.js`
3. Add placeholder in `index.html`: `<div id="yourpage-placeholder"></div>`
4. Import both in `main.ts`
5. Call `window.showView('yourpage-view')` to navigate
6. Style with `src/css/yourPage.css`

---

## Performance notes

- Lazy-load PDFs; don't extract all text upfront
- Debounce auto-save in notes editor
- Cache API responses in localStorage where safe
- Use pagination for large note lists
- Compress images before upload

---

## Security notes

- Never commit `.env.local` with real API keys
- Supabase RLS policies should restrict user data access
- Sanitize user input before inserting into DOM
- Use HTTPS only for production
- Rotate API keys periodically

---

## Testing checklist

- [ ] Auth flow: signup, login, logout, password reset
- [ ] Note CRUD: create, read, update, delete
- [ ] Folder management: create, move, delete
- [ ] PDF upload and text extraction
- [ ] Chat Buddy responses (with real API)
- [ ] Theme switching
- [ ] Pomodoro timer
- [ ] Responsive design on mobile
- [ ] Print functionality
- [ ] Supabase sync (check database)

---

## Next steps for TypeScript migration

See `TS_MIGRATION_PLAN.md` for full conversion steps. Order:

1. `src/js/main.js` → `main.ts`
2. `src/js/supabaseClient.js` → `supabaseClient.ts`
3. `src/html/auth.js` → `auth.ts`
4. Continue incrementally until all `.js` → `.ts`

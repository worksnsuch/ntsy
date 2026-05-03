window.CHAT_BUDDY_FRAGMENT = `
  <!-- AI Study Buddy Chatbot - Global Implementation -->
  <div class="chat-buddy-container" id="chat-buddy-container">
    <div class="chat-window" id="chat-window">
      <div class="chat-header" id="chat-window-header">
        <div class="chat-header-info">
          <i data-lucide="sparkles" size="18"></i>
          <span>Study Buddy <span class="beta-tag">BETA</span></span>
        </div>
        <div class="chat-header-actions" style="display: flex; gap: 8px;">
          <button class="chat-close-btn" id="chat-history-toggle" title="Past Conversations" onclick="if(window.toggleChatHistory) window.toggleChatHistory()">
            <i data-lucide="clock" size="16"></i>
          </button>
          <button class="chat-close-btn" id="chat-clear-btn" title="Clear History" onclick="if(window.clearChatHistory) window.clearChatHistory()">
            <i data-lucide="trash-2" size="16"></i>
          </button>
          <button class="chat-close-btn" id="chat-close-btn" title="Minimize" onclick="if(window.toggleChatBuddyWindow) window.toggleChatBuddyWindow(event)">
            <i data-lucide="chevrons-down" size="18"></i>
          </button>
        </div>
      </div>
      
      <!-- Master History Drawer Overlay -->
      <div class="chat-history-drawer" id="chat-history-drawer">
         <div class="drawer-header">
            <span>Conversations</span>
            <button onclick="window.toggleChatHistory()" class="icon-btn"><i data-lucide="x" size="14"></i></button>
         </div>
         <div class="drawer-search">
            <input type="text" id="chat-history-search" autocomplete="off" readonly onfocus="this.removeAttribute('readonly');" placeholder="Search chats..." oninput="if(window.filterChatHistory) window.filterChatHistory(this.value)">
         </div>
         <div class="drawer-list" id="chat-history-list">
            <!-- Sessions rendered here -->
         </div>
      </div>

      <div class="chat-messages" id="chat-messages">
        <!-- Messages appear here -->
      </div>
      <div class="chat-input-area">
        <input type="text" id="chat-input" class="chat-input" autocomplete="off" readonly onfocus="this.removeAttribute('readonly');" placeholder="Ask me about your notes...">
        <button class="chat-send-btn" id="chat-send-btn">
          <i data-lucide="send" size="18"></i>
        </button>
      </div>
    </div>
    <button class="chat-fab" id="chat-fab" title="Chat with AI Study Buddy" onclick="if(window.toggleChatBuddyWindow) window.toggleChatBuddyWindow(event)">
      <i data-lucide="message-circle" size="24"></i>
    </button>
  </div>
`;

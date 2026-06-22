window.initChatBuddy = function () {
    const container = document.getElementById('chat-buddy-container');
    const fab = document.getElementById('chat-fab');
    const chatWindow = document.getElementById('chat-window');
    const closeBtn = document.getElementById('chat-close-btn');
    const sendBtn = document.getElementById('chat-send-btn');
    const input = document.getElementById('chat-input');
    const messageList = document.getElementById('chat-messages');

    if (!container || !fab || !chatWindow) return;

    // Defined globally for direct onclick handling (bulletproof)
    window.toggleChatBuddyWindow = (e) => {
        if (e) e.stopPropagation();

        const isExpanding = !chatWindow.classList.contains('expanded');

        if (isExpanding) {
            chatWindow.classList.add('expanded');
            fab.classList.add('hidden');
            window.safeCreateIcons();
            setTimeout(() => input.focus(), 400);
            if (messageList.children.length === 0) {
                sendAIInitialGreeting();
            }
        } else {
            chatWindow.classList.remove('expanded');
            fab.classList.remove('hidden');
        }
    };

    /**
     * Toggles the overall visibility of the Study Buddy container 
     * (e.g., show only on Note Editor view as requested)
     */
    window.toggleStudyBuddyVisibility = function (isVisible) {
        const container = document.getElementById('chat-buddy-container');
        if (!container) {
            if (isVisible) window.initChatBuddy();
            return;
        }

        if (isVisible) {
            container.classList.add('visible');
            window.safeCreateIcons();
        } else {
            container.classList.remove('visible');
            // Force close window if it was open when hiding
            if (chatWindow.classList.contains('expanded')) {
                window.toggleChatBuddyWindow();
            }
        }
    };

    // Send Message Logic
    const sendMessage = () => {
        const text = input.value.trim();
        if (!text) return;

        appendMessage('user', text);
        input.value = '';

        // Process AI Response
        handleAIResponse(text);
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function appendMessage(sender, text, skipSave = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text;
        messageList.appendChild(msgDiv);

        // Save to Note History (if skipping isn't requested)
        if (!skipSave && window.currentNoteId && window.notes && window.userSession && window.supabaseClient) {
            const note = window.notes.find(n => n.id === window.currentNoteId);
            if (note) {
                if (!note.chatHistory) note.chatHistory = [];
                note.chatHistory.push({ sender, text, timestamp: Date.now() });

                // Limit history to last 50 messages to save space
                if (note.chatHistory.length > 50) note.chatHistory.shift();
                
                // Fire and forget to Supabase
                window.supabaseClient.from('chat_history').insert({
                    user_id: window.userSession.user.id,
                    note_id: window.currentNoteId,
                    sender: sender,
                    message: text,
                    created_at: new Date().toISOString()
                });
            }
        }

        // Scroll to bottom
        messageList.scrollTop = messageList.scrollHeight;
    }

    function showTyping(show) {
        let indicator = document.getElementById('chat-typing');
        if (show) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'chat-typing';
                indicator.className = 'typing-indicator ai';
                indicator.innerHTML = '<span></span><span></span><span></span>';
                messageList.appendChild(indicator);
            }
            messageList.scrollTop = messageList.scrollHeight;
        } else if (indicator) {
            indicator.remove();
        }
    }

    function sendAIInitialGreeting() {
        const greeting = "Hi! I'm your study buddy. Please upload your PDF file so I can summarize the notes for you, or let me know if you have any questions about the content.";
        appendMessage('ai', greeting);
    }

    // Export history management for notesManager.js
    window.resetChatBuddy = function () {
        const messageList = document.getElementById('chat-messages');
        if (!messageList) return;

        messageList.innerHTML = '';
        window.lastStudyBuddyIntent = null;

        if (window.currentNoteId && window.notes) {
            const note = window.notes.find(n => n.id === window.currentNoteId);
            if (note && note.chatHistory && note.chatHistory.length > 0) {
                note.chatHistory.forEach(msg => {
                    appendMessage(msg.sender, msg.text, true); // true = skip save logic
                });
            } else {
                // No history, send greeting if expanding (handled in toggle logic)
            }
        }
    };

    window.clearChatHistory = async function () {
        if (!window.currentNoteId || !window.notes) return;
        const note = window.notes.find(n => n.id === window.currentNoteId);
        if (note) {
            note.chatHistory = [];
            if (window.userSession && window.supabaseClient) {
                await window.supabaseClient.from('chat_history').delete().eq('note_id', window.currentNoteId);
            }
            window.resetChatBuddy();
            sendAIInitialGreeting();
        }
    };

    // --- MASTER HISTORY DRAWER LOGIC ---
    window.toggleChatHistory = function () {
        const drawer = document.getElementById('chat-history-drawer');
        if (!drawer) return;

        drawer.classList.toggle('active');
        if (drawer.classList.contains('active')) {
            window.renderHistoryList();
            window.safeCreateIcons();
        }
    };

    window.renderHistoryList = function (filter = "") {
        const listContainer = document.getElementById('chat-history-list');
        if (!listContainer || !window.notes) return;

        listContainer.innerHTML = '';
        const lowerFilter = filter.toLowerCase();

        // Find notes with history
        const sessions = window.notes.filter(n => n.chatHistory && n.chatHistory.length > 0);

        const filtered = sessions.filter(s =>
            s.title.toLowerCase().includes(lowerFilter) ||
            s.chatHistory.some(m => m.text.toLowerCase().includes(lowerFilter))
        );

        if (filtered.length === 0) {
            listContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 13px;">No conversations found.</div>`;
            return;
        }

        filtered.forEach(session => {
            const lastMsg = session.chatHistory[session.chatHistory.length - 1];
            const item = document.createElement('div');
            item.className = `history-item ${String(session.id) === String(window.currentNoteId) ? 'active' : ''}`;
            item.onclick = () => window.jumpToConversation(session.id);

            item.innerHTML = `
                <div class="history-item-title">${session.title || 'Untitled Note'}</div>
                <div class="history-item-excerpt">${lastMsg.sender === 'ai' ? 'Buddy: ' : 'You: '}${lastMsg.text}</div>
                <button class="history-item-delete-btn" title="Delete History" onclick="event.stopPropagation(); window.deleteChatSession('${session.id}')">
                    <i data-lucide="trash-2" size="14"></i>
                </button>
            `;
            listContainer.appendChild(item);
        });
    };

    window.filterChatHistory = function (val) {
        window.renderHistoryList(val);
    };

    window.jumpToConversation = function (id) {
        if (typeof window.openNote === 'function') {
            window.openNote(id);
            if (window.showView) window.showView('editor-view'); // Ensure we switch to editor
            window.toggleChatHistory(); // Close drawer
        }
    };

    window.deleteChatSession = async function (id) {
        const confirmed = window.customConfirm 
            ? await window.customConfirm("Delete this conversation history?", "Delete Chat")
            : confirm("Delete this conversation history?");

        if (!confirmed) return;

        if (window.notes) {
            const note = window.notes.find(n => String(n.id) === String(id));
            if (note) {
                note.chatHistory = [];
                if (window.userSession && window.supabaseClient) {
                    await window.supabaseClient.from('chat_history').delete().eq('note_id', id);
                }

                // If currently viewing this note, clear UI
                if (String(id) === String(window.currentNoteId)) {
                    const messageList = document.getElementById('chat-messages');
                    if (messageList) messageList.innerHTML = '';
                    sendAIInitialGreeting();
                }

                window.renderHistoryList();
                window.safeCreateIcons();
            }
        }
    };

    async function getDiscoveryModel(apiKey, apiVersion) {
        // Check session storage first
        const cacheKey = `detected_gemini_model_${apiVersion}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) return cached;

        console.log(`[AI] Starting discovery on ${apiVersion} endpoint...`);
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`);
            if (response.ok) {
                const data = await response.json();
                const validModels = (data.models || [])
                    .filter(m => (m.supportedMethods || []).includes('generateContent'))
                    .map(m => m.name.replace('models/', ''));

                if (validModels.length > 0) {
                    const bestModel = validModels.find(m => m.toLowerCase().includes('flash'))
                        || validModels.find(m => m.toLowerCase().includes('pro'))
                        || validModels[0];

                    console.log(`[AI] Discovery on ${apiVersion} successful: ${bestModel}`);
                    sessionStorage.setItem(cacheKey, bestModel);
                    return bestModel;
                }
            }
        } catch (e) {
            console.error(`[AI] Discovery failed for ${apiVersion}:`, e);
        }
        return null;
    }

    async function callGeminiAPI(userQuery, noteTitle, noteBody) {
        const apiKey = window.getGeminiApiKey();
        if (!apiKey) {
            return "AI Mode Disabled. Please enter your Gemini API key in the Settings page.";
        }

        const cleanContent = (noteBody || "").replace(/<[^>]*>?/gm, ' ').substring(0, 15000);
        const systemPrompt = `You are a helpful Study Buddy assistant. Note Content: "${cleanContent}"`;

        // Versions and models to try in order of likelihood (Stable first)
        const apiVersions = ['v1', 'v1beta'];
        const baseModels = ['gemini-3-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

        let lastError = null;
        let attemptedCount = 0;

        for (const version of apiVersions) {
            // Check for a previously discovered model for this specific version
            const discoveredModel = await getDiscoveryModel(apiKey, version);
            let modelsToTry = [...baseModels];
            if (discoveredModel) {
                modelsToTry = [discoveredModel, ...modelsToTry.filter(m => m !== discoveredModel)];
            }

            for (const model of modelsToTry) {
                attemptedCount++;
                console.log(`[AI] Attempting ${version}/${model}...`);
                const endpoint = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;

                const payload = {
                    contents: [{
                        parts: [{ text: `${systemPrompt}\n\nUser Question: ${userQuery}` }]
                    }]
                };

                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (aiText) {
                            console.log(`[AI] Success! Connected via ${version}/${model}`);
                            sessionStorage.setItem(`detected_gemini_model_${version}`, model);
                            return aiText;
                        }
                    } else {
                        const errData = await response.json();
                        lastError = `${version}/${model}: ${errData.error?.message || response.statusText}`;
                        console.warn(`[AI] ${version}/${model} failed:`, lastError);
                    }
                } catch (error) {
                    lastError = error.message;
                    console.error(`[AI] Network error for ${version}/${model}:`, error);
                }
            }
        }

        return `AI Error: Connection failed after ${attemptedCount} attempts across v1/v1beta. Please check if your API key is correctly entered and has billing enabled for non-free models. Last error: ${lastError}`;
    }

    // THE PROJECT-WIDE SHARED KEY (Provides "Pro" AI for all users by default)
    const NTSY_GLOBAL_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

    async function handleAIResponse(userText) {
        showTyping(true);

        // Use Global Key logic: Check localStorage first, then fallback to Shared Key
        const provider = localStorage.getItem('ntsy_ai_provider') || 'groq'; // Default to Groq now
        let apiKey = provider === 'groq'
            ? (localStorage.getItem('ntsy_groq_api_key') || NTSY_GLOBAL_GROQ_KEY)
            : window.getGeminiApiKey();

        // Merge Context: Note + PDF
        const noteTitle = document.getElementById('note-title-input')?.value || "";
        const noteBody = document.getElementById('note-body-input')?.innerHTML || "";
        const pdfText = window.activePdfText || "";

        // Smarter Context: Extract Key Concepts via Local TF-IDF (even for APIs)
        const concepts = extractLocalConcepts(noteBody + " " + pdfText);
        const fullContext = `Note Title: ${noteTitle}\nKey Concepts: ${concepts.join(', ')}\nNote Content: ${noteBody}\nPDF Content: ${pdfText}`;

        // Path A: Groq Engine (The "Pro" Intelligence)
        if (provider === 'groq' && apiKey) {
            console.log(`[AI] Using ${apiKey === NTSY_GLOBAL_GROQ_KEY ? 'Global Shared' : 'Custom'} Groq engine...`);
            try {
                const response = await callGroqAPI(userText, fullContext, apiKey);
                showTyping(false);
                appendMessage('ai', response);
                return;
            } catch (err) {
                console.warn("[AI] Groq failed, falling back to Local.");
            }
        }

        // Path B: Gemini Engine
        if (provider === 'gemini' && apiKey) {
            console.log(`[AI] Using Gemini engine...`);
            try {
                const response = await callGeminiAPI(userText, fullContext);
                if (!response.startsWith('AI Error:')) {
                    showTyping(false);
                    appendMessage('ai', response);
                    return;
                }
                throw new Error("Gemini Failure");
            } catch (err) {
                // Fallback
            }
        }

        // Path C: Smart Local Engine (Always-On)
        console.log("[AI] Using Smart Local Engine...");
        setTimeout(() => {
            showTyping(false);
            const response = generateAIResponse(userText, noteTitle, noteBody, pdfText, concepts);
            appendMessage('ai', response);
        }, 800);
    }

    async function callGroqAPI(query, context, apiKey) {
        if (!apiKey) throw new Error("Missing Groq Key");

        const endpoint = "https://api.groq.com/openai/v1/chat/completions";
        const payload = {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "You are a 'Pro' Study Buddy. Use the following context to help the user. Focus on deep insights and conceptual links. Context:\n" + context },
                { role: "user", content: query }
            ],
            temperature: 0.7
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Groq API error");
        const data = await response.json();
        return data.choices[0].message.content;
    }

    function extractLocalConcepts(text) {
        const clean = text.replace(/<[^>]*>?/gm, ' ').toLowerCase();
        const words = clean.match(/\b[a-z]{5,}\b/g) || [];

        // Simple Frequency Mapping (Pseudo TF-IDF)
        const freq = {};
        const stopWords = new Set(['about', 'before', 'should', 'would', 'could', 'their', 'there', 'these', 'those', 'where', 'which']);

        words.forEach(w => {
            if (stopWords.has(w)) return;
            freq[w] = (freq[w] || 0) + 1;
        });

        // Sort by frequency and return top 8 unique concepts
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(e => e[0].charAt(0).toUpperCase() + e[0].slice(1));
    }

    function generateAIResponse(query, title, body, pdfText, concepts) {
        const q = query.toLowerCase();
        const combinedText = `${body} ${pdfText}`.replace(/<[^>]*>?/gm, ' ');

        // Handle Follow-ups
        if (window.lastStudyBuddyIntent && (q === 'yes' || q.includes('yes please') || q.includes('sure') || q.includes('ok'))) {
            const last = window.lastStudyBuddyIntent;
            window.lastStudyBuddyIntent = null; // Clear to avoid loop
            if (last === 'summarize') return performLocalSummarization(combinedText, title);
            if (last === 'quiz') return generateLocalQuiz(combinedText);
        }

        // 1. Concept Analysis (The "Smart" part)
        if (q.includes('concepts') || q.includes('key ideas') || q.includes('what are the main themes')) {
            if (concepts.length === 0) return "I've scanned the content but couldn't identify distinct repeating concepts yet. Try adding more detailed notes!";
            return `I've analyzed your materials for "${title}". The strongest themes I'm detecting are: ${concepts.join(', ')}. Would you like me to dive deeper into any of these?`;
        }

        // 2. PDF Specific Questions
        if (q.includes('pdf') || q.includes('this document')) {
            if (!pdfText) {
                return "I don't see an active PDF open in Study Mode right now. If you open one, I can scan it instantly for you!";
            }
            if (q.includes('summarize') || q.includes('what is') || q.includes('about')) {
                return `I've scanned the document. It seems focused on subjects like ${concepts.slice(0, 3).join(', ')}. ${performLocalSummarization(pdfText, "the PDF")}`;
            }
            return `I've scanned the open PDF! It seems to focus on ${concepts.slice(0, 3).join(', ')}. Would you like a summary?`;
        }

        // 3. Summarization Intents
        if (q.includes('summarize') || q.includes('summary') || q.includes('what is this about')) {
            return performLocalSummarization(combinedText, title);
        }

        // 3. Quiz Intents
        else if (q.includes('quiz') || q.includes('test me') || q.includes('question')) {
            return generateLocalQuiz(combinedText);
        }

        // 4. Greetings
        else if (q.includes('hello') || q.includes('hi')) {
            const sourceInfo = pdfText ? "both your notes and the open PDF" : "your notes";
            return `Hi there! I've scanned ${sourceInfo}. Would you like me to summarize the key points or shall we try a quick quiz?`;
        }

        // Default: Offer intent
        if (pdfText) {
            window.lastStudyBuddyIntent = 'summarize';
            return `I've analyzed the PDF and your notes for "${title}". Would you like me to provide a summary of the main points?`;
        }

        window.lastStudyBuddyIntent = 'summarize';
        return `That's a great question. While I'm in Local Mode, I can best help by summarizing these notes or quizzing you. Shall I try a summary for you?`;
    }

    function performLocalSummarization(text, title) {
        const cleanText = text.replace(/<[^>]*>?/gm, ' ').trim();
        if (!cleanText || cleanText.length < 30) {
            return `The content for "${title}" seems a bit short. Add a few more details so I can extract the key themes!`;
        }

        let sentences = cleanText.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 25);

        // Smart Filtering & Scoring
        const scoredSentences = sentences
            .map(s => ({ text: s, score: getSmartStudyScore(s) }))
            .filter(s => s.score >= 0) // Remove negative scores (instructions/noise)
            .sort((a, b) => b.score - a.score)
            .slice(0, 4);

        if (scoredSentences.length === 0) {
            return `I've scanned the content, but it looks like it might contain mostly instructions or fragmented notes. Try adding some descriptive paragraphs!`;
        }

        const keyLines = scoredSentences.map(s => "• " + s.text);
        return `Based on my scan of ${title}, here are the core themes:\n\n${keyLines.join('\n\n')}\n\nI've intelligently filtered out instructions to focus on your content!`;
    }

    function getSmartStudyScore(sentence) {
        let score = sentence.length / 50; // Base score on length (but not too much)
        const s = sentence.toUpperCase();

        // 1. Blacklist (Negative Score for instructions/placeholders)
        const blacklist = ['INSERT', 'FIGURE', 'CLICK', 'SCREENSHOT', 'PLACEHOLDER', '[', ']', 'TABLE', 'IMAGE', 'PHOTO'];
        if (blacklist.some(word => s.includes(word))) return -100;

        // 2. High-Value Study Keywords
        const keywords = [
            'SIGNIFICANT', 'ANALYSIS', 'RESULT', 'CONCLUSION', 'STRATEGY', 'FRAMEWORK',
            'THEREFORE', 'HOWEVER', 'STUDY', 'PROVIDES', 'RESEARCH', 'OBJECTIVE',
            'FINDINGS', 'EVIDENCE', 'DEVELOPMENT', 'SYSTEM', 'PROCESS'
        ];

        keywords.forEach(word => {
            if (s.includes(word)) score += 5;
        });

        // 3. Penalty for very short fragments that passed the filter
        if (sentence.split(' ').length < 5) score -= 2;

        return score;
    }

    function generateLocalQuiz(text) {
        const cleanText = text.replace(/<[^>]*>?/gm, ' ').trim();
        const sentences = cleanText.split(/[.!?]/)
            .map(s => s.trim())
            .filter(s => s.length > 40 && getSmartStudyScore(s) > 0);

        if (sentences.length < 1) return "I need a bit more descriptive content to generate a quiz. Try adding some facts or concepts to your notes or PDF!";

        const randomSentence = sentences[Math.floor(Math.random() * sentences.length)].trim();
        window.lastStudyBuddyIntent = 'quiz'; // Setup for "another one"
        return `Based on your material, here's a study challenge: \n\n"Explain the main idea behind: ${randomSentence}"\n\nHow would you answer that? (Type 'yes' for another question!)`;
    }
};


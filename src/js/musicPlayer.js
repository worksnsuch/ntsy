// js/musicPlayer.js
(function() {
    console.log("[Heartbeat] musicPlayer.js parsing started.");
    
    try {
        window.initMusicPlayer = function() {
            console.log("[Music] initMusicPlayer invoked.");
            const musicPlayer = document.getElementById('floating-music-player');
            const musicHeader = document.getElementById('music-player-header');
            const musicSearchInput = document.getElementById('music-search-input');
            const musicSearchBtn = document.getElementById('music-search-btn');
            
            // UI Element bindings
            const musicSearchResults = document.getElementById('music-search-results');
            const musicPlayerView = document.getElementById('music-player-view');
            const musicIdleState = document.getElementById('music-idle-state');
            const musicBackBtn = document.getElementById('music-back-btn');
            const errorOverlay = document.getElementById('music-error-overlay');
            
            // Queue UI
            const musicViewQueueBtn = document.getElementById('music-view-queue-btn');
            const musicQueueView = document.getElementById('music-queue-view');
            const musicQueueList = document.getElementById('music-queue-list');
            const musicQueueCloseBtn = document.getElementById('music-queue-close-btn');
            const musicNowPlayingBtn = document.getElementById('music-now-playing-btn');

            // Custom Controls UI
            const ctrlPlayBtn = document.getElementById('music-ctrl-play');
            const ctrlPrevBtn = document.getElementById('music-ctrl-prev');
            const ctrlNextBtn = document.getElementById('music-ctrl-next');
            const ctrlLoopBtn = document.getElementById('music-ctrl-loop');
            const nowPlayingTitle = document.getElementById('music-now-playing-title');

            const progressBar = document.getElementById('music-progress-bar');
            const timeCurrent = document.getElementById('music-time-current');
            const timeDuration = document.getElementById('music-time-duration');
            let progressInterval = null;

            let musicQueue = JSON.parse(localStorage.getItem('notesApp_music_queue')) || [];
            
            // YouTube IFrame API Init
            let ytPlayer = null;
            let isLooping = false;

            if (!musicPlayer) {
                console.warn("[Music] floating-music-player element not found.");
                return;
            }

            function decodeHTMLEntities(text) {
                if (!text) return "";
                const doc = new DOMParser().parseFromString(text, "text/html");
                return doc.documentElement.textContent;
            }

            function formatTime(seconds) {
                if (!seconds || isNaN(seconds)) return "0:00";
                const m = Math.floor(seconds / 60);
                const s = Math.floor(seconds % 60);
                return m + ":" + (s < 10 ? "0" : "") + s;
            }

            function updateProgressBar() {
                if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.getDuration) {
                    const currentTime = ytPlayer.getCurrentTime();
                    const duration = ytPlayer.getDuration();
                    if (duration > 0) {
                        const percentage = (currentTime / duration) * 100;
                        if (progressBar) {
                            progressBar.value = percentage;
                            progressBar.style.background = `linear-gradient(to right, #ffffff ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)`;
                        }
                        if (timeCurrent) timeCurrent.textContent = formatTime(currentTime);
                        if (timeDuration) timeDuration.textContent = formatTime(duration);
                    }
                }
            }

            if (progressBar) {
                progressBar.addEventListener('input', (e) => {
                    const val = e.target.value;
                    progressBar.style.background = `linear-gradient(to right, #ffffff ${val}%, rgba(255,255,255,0.1) ${val}%)`;
                    if (ytPlayer && ytPlayer.getDuration) {
                        const duration = ytPlayer.getDuration();
                        const seekTo = (val / 100) * duration;
                        ytPlayer.seekTo(seekTo, true);
                    }
                });
            }

            // YT API injection
            if (!window.YT) {
                const tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName('script')[0];
                if (firstScriptTag && firstScriptTag.parentNode) {
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                } else {
                    document.head.appendChild(tag);
                }
            }

            function renderQueue() {
                if (!musicQueueList) return;
                musicQueueList.innerHTML = '';
                if (musicQueue.length === 0) {
                    musicQueueList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 12px;">Your queue is empty.</div>';
                    return;
                }
                musicQueue.forEach((track, index) => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'music-result-item';
                    resultItem.innerHTML = `<img src="${track.thumb}" class="music-result-thumb"><div class="music-result-info"><div class="music-result-title">${track.title}</div></div><button class="music-queue-remove"><i data-lucide="trash-2" size="14"></i></button>`;
                    resultItem.addEventListener('click', (e) => {
                        if (!e.target.closest('.music-queue-remove')) {
                            playVideo(track.videoId, track.title);
                            musicQueue.splice(index, 1);
                            localStorage.setItem('notesApp_music_queue', JSON.stringify(musicQueue));
                            if (typeof window.syncSettingsToDB === 'function') window.syncSettingsToDB();
                            renderQueue();
                        }
                    });
                    const rmBtn = resultItem.querySelector('.music-queue-remove');
                    rmBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        musicQueue.splice(index, 1);
                        localStorage.setItem('notesApp_music_queue', JSON.stringify(musicQueue));
                        if (typeof window.syncSettingsToDB === 'function') window.syncSettingsToDB();
                        renderQueue();
                    });
                    musicQueueList.appendChild(resultItem);
                });
                window.safeCreateIcons();
            }

            function toggleMusicPlayer(e) {
                if (e && e.target && (e.target.id === 'music-search-input' || e.target.closest('.music-search-container button'))) return;
                const now = Date.now();
                if (now - lastToggleTime < 400) return; 
                lastToggleTime = now;
                if (e) { e.preventDefault(); e.stopPropagation(); }
                musicPlayer.classList.toggle('minimized');
                const minimizeBtn = document.getElementById('music-minimize-btn');
                const icon = minimizeBtn ? minimizeBtn.querySelector('i, svg') : null;
                if (icon && window.lucide) {
                    // Always use chevrons-down for a consistent minimize aesthetic
                    icon.setAttribute('data-lucide', 'chevrons-down');
                    window.safeCreateIcons();
                }
            }
            let lastToggleTime = 0;

            async function searchMusic() {
                let query = musicSearchInput.value.trim();
                if (!query) return;
                if (musicSearchBtn) {
                   musicSearchBtn.innerHTML = '<i data-lucide="loader" class="spin" size="14"></i>';
                   window.safeCreateIcons();
                }
                if (musicIdleState) musicIdleState.style.display = 'none';
                if (musicPlayerView) musicPlayerView.style.display = 'none';
                if (musicQueueView) musicQueueView.style.display = 'none';
                if (musicSearchResults) {
                   musicSearchResults.style.display = 'flex';
                   musicSearchResults.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 12px;">Searching YouTube...</div>';
                }
                const apiKey = "AIzaSyAf7h2GggHk_c4tIPRtUc2XSXXhJTztaT8";
                const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&videoEmbeddable=true&key=${apiKey}`;
                try {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error('API error');
                    const data = await res.json();
                    musicSearchResults.innerHTML = '';
                    if (data.items && data.items.length > 0) {
                        data.items.forEach(item => {
                            if (item.id.kind === 'youtube#channel' || !item.id.videoId) return;
                            const videoId = item.id.videoId;
                            const title = item.snippet.title;
                            const thumb = item.snippet.thumbnails.default.url;
                            const resultItem = document.createElement('div');
                            resultItem.className = 'music-result-item';
                            resultItem.innerHTML = `<img src="${thumb}" class="music-result-thumb"><div class="music-result-info"><div class="music-result-title">${title}</div></div><div class="music-queue-action"><i data-lucide="plus" size="14"></i></div>`;
                            resultItem.addEventListener('click', (e) => {
                                if (!e.target.closest('.music-queue-action')) playVideo(videoId, title);
                            });
                            const addBtn = resultItem.querySelector('.music-queue-action');
                            addBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                musicQueue.push({videoId, title, thumb});
                                localStorage.setItem('notesApp_music_queue', JSON.stringify(musicQueue));
                                if (typeof window.syncSettingsToDB === 'function') window.syncSettingsToDB();
                                addBtn.innerHTML = '<i data-lucide="check" size="14" style="color: var(--accent-green);"></i>';
                                window.safeCreateIcons();
                            });
                            musicSearchResults.appendChild(resultItem);
                        });
                    } else {
                        musicSearchResults.innerHTML = 'No videos found.';
                    }
                } catch (e) {
                    musicSearchResults.innerHTML = 'YouTube API Error.';
                }
                if (musicSearchBtn) {
                    musicSearchBtn.innerHTML = '<i data-lucide="search" size="14"></i>';
                    window.safeCreateIcons();
                }
            }

            function playVideo(videoId, title) {
                if (musicSearchResults) musicSearchResults.style.display = 'none';
                if (musicQueueView) musicQueueView.style.display = 'none';
                if (musicPlayerView) musicPlayerView.style.display = 'flex';
                if (musicNowPlayingBtn) musicNowPlayingBtn.style.display = 'flex';
                if (nowPlayingTitle) nowPlayingTitle.textContent = decodeHTMLEntities(title);
                if (!ytPlayer) {
                    ytPlayer = new YT.Player('yt-player-container', {
                        height: '196', width: '100%', videoId: videoId,
                        playerVars: { 'autoplay': 1, 'controls': 0, 'origin': window.location.origin },
                        events: { 'onReady': (e) => e.target.playVideo(), 'onStateChange': onPlayerStateChange }
                    });
                } else {
                    ytPlayer.loadVideoById(videoId);
                }
            }

            function onPlayerStateChange(event) {
                if (event.data === YT.PlayerState.PLAYING) {
                    clearInterval(progressInterval);
                    progressInterval = setInterval(updateProgressBar, 250);
                    if (ctrlPlayBtn) ctrlPlayBtn.innerHTML = '<i data-lucide="pause" size="24" fill="currentColor"></i>';
                    window.safeCreateIcons();
                } else if (event.data === YT.PlayerState.PAUSED) {
                    clearInterval(progressInterval);
                    if (ctrlPlayBtn) ctrlPlayBtn.innerHTML = '<i data-lucide="play" size="24" fill="currentColor" style="padding-right: 4px;"></i>';
                    window.safeCreateIcons();
                } else if (event.data === YT.PlayerState.ENDED) {
                    clearInterval(progressInterval);
                    if (isLooping && ytPlayer) {
                        ytPlayer.playVideo();
                    } else if (musicQueue.length > 0) {
                        // Play Next in Queue automatically
                        if (ctrlNextBtn) ctrlNextBtn.click();
                    } else {
                        // Queue empty, reset to Play icon
                        if (ctrlPlayBtn) ctrlPlayBtn.innerHTML = '<i data-lucide="play" size="24" fill="currentColor" style="padding-right: 4px;"></i>';
                        window.safeCreateIcons();
                    }
                }
            }

            if (musicHeader) {
                musicHeader.addEventListener('click', toggleMusicPlayer);
            }
            if (musicPlayer) {
                musicPlayer.addEventListener('click', (e) => {
                    if (musicPlayer.classList.contains('minimized') && e.target !== musicHeader && (!musicHeader || !musicHeader.contains(e.target))) {
                        toggleMusicPlayer(e);
                    }
                });
            }
            if (musicSearchBtn) musicSearchBtn.addEventListener('click', searchMusic);
            if (musicSearchInput) musicSearchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchMusic(); });
            if (musicBackBtn) musicBackBtn.addEventListener('click', () => {
                if (musicPlayerView) musicPlayerView.style.display = 'none';
                if (musicSearchResults) musicSearchResults.style.display = 'flex';
            });
            if (musicViewQueueBtn) musicViewQueueBtn.addEventListener('click', () => {
                if (musicIdleState) musicIdleState.style.display = 'none';
                if (musicSearchResults) musicSearchResults.style.display = 'none';
                if (musicPlayerView) musicPlayerView.style.display = 'none';
                if (musicQueueView) musicQueueView.style.display = 'flex';
                renderQueue();
            });
            if (musicQueueCloseBtn) musicQueueCloseBtn.addEventListener('click', () => {
                if (musicQueueView) musicQueueView.style.display = 'none';
                if (musicPlayerView && musicNowPlayingBtn && musicNowPlayingBtn.style.display !== 'none') {
                    musicPlayerView.style.display = 'flex';
                } else if (musicSearchResults && musicSearchResults.innerHTML.trim() !== '') {
                    musicSearchResults.style.display = 'flex';
                } else {
                    if (musicIdleState) musicIdleState.style.display = 'block';
                }
            });
            if (musicNowPlayingBtn) musicNowPlayingBtn.addEventListener('click', () => {
                if (musicIdleState) musicIdleState.style.display = 'none';
                if (musicSearchResults) musicSearchResults.style.display = 'none';
                if (musicQueueView) musicQueueView.style.display = 'none';
                if (musicPlayerView) musicPlayerView.style.display = 'flex';
            });
            
            // Custom Control Listeners
            if (ctrlPlayBtn) ctrlPlayBtn.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (!ytPlayer) {
                    // Try to start from queue if nothing is loaded
                    if (musicQueue.length > 0) {
                        if (ctrlNextBtn) ctrlNextBtn.click();
                    }
                    return;
                }
                const state = ytPlayer.getPlayerState();
                if (state === YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
                else ytPlayer.playVideo();
            });

            if (ctrlPrevBtn) ctrlPrevBtn.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (ytPlayer && ytPlayer.seekTo) ytPlayer.seekTo(0, true);
            });

            if (ctrlNextBtn) ctrlNextBtn.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (musicQueue.length > 0) {
                    const nextTrack = musicQueue.shift();
                    localStorage.setItem('notesApp_music_queue', JSON.stringify(musicQueue));
                    if (typeof window.syncSettingsToDB === 'function') window.syncSettingsToDB();
                    playVideo(nextTrack.videoId, nextTrack.title);
                    renderQueue();
                }
            });

            if (ctrlLoopBtn) ctrlLoopBtn.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                isLooping = !isLooping;
                if (isLooping) {
                    ctrlLoopBtn.style.background = 'rgba(0, 122, 255, 0.4)';
                    ctrlLoopBtn.style.borderColor = 'rgba(0, 122, 255, 0.6)';
                } else {
                    ctrlLoopBtn.style.background = 'transparent';
                    ctrlLoopBtn.style.borderColor = 'transparent';
                }
            });

            console.log("[Music] initMusicPlayer complete.");
        };
    } catch (e) {
        console.error("[Header] musicPlayer.js parsing error:", e);
    }
})();

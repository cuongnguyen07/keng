/* ==========================================
   RECORD PAGE — Live Recording Workspace
   ========================================== */

function renderRecordPage() {
  const lang = Storage.getSetting('language', 'vi');
  const isVi = lang === 'vi';

  document.getElementById('record-content').innerHTML = `
    <div class="record-page">

      <!-- PAGE HEADER -->
      <div class="page-header" style="padding-bottom:20px;">
        <div>
          <h1 class="page-title">
            <span class="gradient-text">🎙️ Ghi âm mới</span>
          </h1>
          <p class="page-subtitle">Bắt đầu ghi âm — AI sẽ phân tích ngay sau khi hoàn tất</p>
        </div>
        <div class="flex gap-2 items-center">
          <!-- LANGUAGE SELECTOR -->
          <div class="lang-switch" id="lang-switch">
            <button class="lang-btn ${isVi ? 'active' : ''}" onclick="setRecordLanguage('vi-VN')" id="lang-vi">🇻🇳 VI</button>
            <button class="lang-btn ${!isVi ? 'active' : ''}" onclick="setRecordLanguage('en-US')" id="lang-en">🇺🇸 EN</button>
          </div>

          <!-- MEETING MODE TOGGLE -->
          <div class="meeting-mode-toggle" id="meeting-toggle" onclick="toggleMeetingMode()">
            <div class="meeting-icon">👥</div>
            <span class="meeting-label">Meeting Mode</span>
            <div class="meeting-status-dot" id="meeting-dot"></div>
          </div>
        </div>
      </div>


      <!-- MAIN WORKSPACE (2 columns) -->
      <div class="record-workspace">

        <!-- LEFT: TRANSCRIPT PANEL -->
        <div class="transcript-panel card-glass">

          <!-- Recording Status Bar -->
          <div class="record-status-bar" id="record-status-bar">
            <div class="status-indicator" id="status-indicator">
              <div class="status-dot idle"></div>
              <span class="status-text" id="status-text">Sẵn sàng ghi âm</span>
            </div>
            <div class="record-timer" id="record-timer">00:00</div>
          </div>

          <!-- Audio Visualizer -->
          <div class="audio-visualizer-wrap" id="audio-viz-wrap">
            <div class="audio-visualizer" id="audio-visualizer">
              ${Array.from({length:12}, (_,i) => `<div class="audio-bar bar-${i+1}" style="height:6px"></div>`).join('')}
            </div>
          </div>

          <!-- Transcript Display -->
          <div class="transcript-display" id="transcript-display">
            <div class="transcript-placeholder" id="transcript-placeholder">
              <div class="placeholder-icon">🎤</div>
              <p>Bấm <strong>Bắt đầu ghi âm</strong> để bắt đầu</p>
              <p class="text-xs text-muted" style="margin-top:4px;">Văn bản sẽ hiển thị theo thời gian thực</p>
            </div>
            <div id="transcript-segments" class="transcript-segments"></div>
            <div class="interim-text" id="interim-text"></div>
          </div>

          <!-- Bookmark Actions -->
          <div class="bookmark-bar" id="bookmark-bar" style="display:none;">
            <button class="bookmark-btn" onclick="addBookmark()" id="bookmark-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Đánh dấu
            </button>
            <div class="bookmark-count" id="bookmark-count">0 đánh dấu</div>
          </div>

          <!-- Recording Controls -->
          <div class="recording-controls">
            <!-- Main Record Button -->
            <div class="record-btn-wrap" id="record-btn-wrap">
              <div class="record-pulse-ring"></div>
              <div class="record-pulse-ring-2"></div>
              <button class="record-btn" id="main-record-btn" onclick="handleRecordToggle()">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                  <path d="M12 1C9.24 1 7 3.24 7 6v6c0 2.76 2.24 5 5 5s5-2.24 5-5V6c0-2.76-2.24-5-5-5zm0 12c-1.66 0-3-1.34-3-3V6c0-1.66 1.34-3 3-3s3 1.34 3 3v4c0 1.66-1.34 3-3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
            </div>

            <!-- Secondary Controls -->
            <div class="secondary-controls">
              <button class="ctrl-btn" id="pause-btn" onclick="handlePauseToggle()" disabled title="Tạm dừng">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
                <span>Tạm dừng</span>
              </button>
              <button class="ctrl-btn stop" id="stop-btn" onclick="handleStopRecording()" disabled title="Dừng & Lưu">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                </svg>
                <span>Dừng & Lưu</span>
              </button>
            </div>
          </div>

        </div><!-- END TRANSCRIPT PANEL -->

        <!-- RIGHT: CHATBOT PANEL -->
        <div class="chatbot-panel card-glass">
          <div class="chatbot-header">
            <div class="chatbot-title">
              <div class="ai-avatar">🤖</div>
              <div>
                <div class="font-semibold" style="font-size:0.9rem;">Hỏi Trợ Lý AI</div>
                <div class="text-xs text-muted">Đặt câu hỏi về nội dung bài giảng</div>
              </div>
            </div>
            <div class="ai-status-badge" id="ai-status-badge">
              <div class="ai-status-dot"></div>
              <span>${typeof AIEngine !== 'undefined' && AIEngine.isUsingOpenAI() ? 'GPT-4o' : 'Mock AI'}</span>
            </div>
          </div>

          <!-- Chat Messages -->
          <div class="chat-messages" id="chat-messages">
            <div class="chat-message">
              <div class="chat-avatar ai">AI</div>
              <div class="chat-bubble ai">
                Xin chào! Tôi sẵn sàng giải đáp mọi câu hỏi về nội dung bài giảng. Hãy bắt đầu ghi âm và đặt câu hỏi bất cứ lúc nào! 🎓
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions" id="quick-actions">
            <p class="text-xs text-muted" style="margin-bottom:6px;">Câu hỏi nhanh:</p>
            <div class="quick-btns">
              <button class="quick-btn" onclick="sendQuickQuestion('Tóm tắt nội dung vừa giảng?')">📋 Tóm tắt nhanh</button>
              <button class="quick-btn" onclick="sendQuickQuestion('Ý chính quan trọng nhất là gì?')">💡 Ý chính</button>
              <button class="quick-btn" onclick="sendQuickQuestion('Tôi cần ghi nhớ điều gì quan trọng nhất?')">⭐ Điểm mấu chốt</button>
            </div>
          </div>

          <!-- Chat Input -->
          <div class="chat-input-wrap">
            <textarea
              class="chat-input input"
              id="chat-input"
              placeholder="Hỏi về nội dung bài giảng..."
              rows="1"
              onkeydown="handleChatKeydown(event)"
              oninput="autoResizeTextarea(this)"
            ></textarea>
            <button class="chat-send-btn btn-primary btn" id="chat-send-btn" onclick="sendChatMessage()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>

        </div><!-- END CHATBOT PANEL -->

      </div><!-- END WORKSPACE -->

      <!-- NOTE SAVE BAR (shown after stop) -->
      <div class="note-save-bar card" id="note-meta-bar" style="display:none; margin:0 32px 24px;">
        <div class="note-save-header">
          <div class="note-save-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          </div>
          <div>
            <div class="font-semibold" style="font-size:0.9rem; color:var(--text-primary);">✅ Đã lưu tự động</div>
            <div class="text-xs text-muted" style="margin-top:2px;" id="auto-save-info">Đang lưu...</div>
          </div>
          <button class="btn btn-primary" onclick="saveCurrentNote()" id="save-btn" style="margin-left:auto;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
            Cập nhật tên
          </button>
        </div>
        <div class="note-save-body">
          <div style="flex:1; min-width:200px;">
            <label class="text-xs text-muted" style="display:block;margin-bottom:4px;">✏️ Đặt tên cho cuộc hội thoại</label>
            <input class="input" id="note-title-input" type="text" placeholder="Nhập tên cuộc hội thoại..."
              oninput="autoUpdateNoteTitle(this.value)" />
          </div>
        </div>
      </div>

      <!-- AI PROCESSING SECTION (shown after stop) -->
      <div id="ai-processing-section" style="display:none; padding:0 32px 32px;">
        <div class="divider"></div>
        <div class="section-title" style="margin-bottom:16px;">🤖 Phân tích AI</div>
        <div class="ai-panels-grid">

          <!-- Summary Card -->
          <div class="ai-card card" id="summary-card">
            <div class="ai-card-header">
              <div class="ai-card-icon">📋</div>
              <span class="ai-card-title">Tóm tắt</span>
              <div class="spinner ai-loading" id="summary-loading"></div>
            </div>
            <div class="ai-card-body" id="summary-body">
              <div class="ai-skeleton"></div>
              <div class="ai-skeleton" style="width:80%"></div>
              <div class="ai-skeleton" style="width:90%"></div>
            </div>
          </div>

          <!-- Key Points Card -->
          <div class="ai-card card" id="keypoints-card">
            <div class="ai-card-header">
              <div class="ai-card-icon">💡</div>
              <span class="ai-card-title">Ý chính</span>
              <div class="spinner ai-loading" id="keypoints-loading"></div>
            </div>
            <div class="ai-card-body" id="keypoints-body">
              <div class="ai-skeleton"></div>
              <div class="ai-skeleton" style="width:70%"></div>
              <div class="ai-skeleton" style="width:85%"></div>
            </div>
          </div>

          <!-- Flashcards Card -->
          <div class="ai-card card flashcards-card" id="flashcards-card">
            <div class="ai-card-header">
              <div class="ai-card-icon">🃏</div>
              <span class="ai-card-title">Flashcards ôn tập</span>
              <div class="spinner ai-loading" id="flashcards-loading"></div>
            </div>
            <div class="ai-card-body" id="flashcards-body">
              <div class="ai-skeleton"></div>
              <div class="ai-skeleton" style="width:60%"></div>
            </div>
          </div>

        </div>
      </div>

    </div><!-- END RECORD PAGE -->
  `;

  injectRecordStyles();
  initRecordPage();
}


/* ---- Record Page Styles ---- */
function injectRecordStyles() {
  if (document.getElementById('record-page-styles')) return;
  const style = document.createElement('style');
  style.id = 'record-page-styles';
  style.textContent = `

    .record-page { min-height: 100vh; }
    .record-workspace {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 20px;
      padding: 16px 32px 24px;
      min-height: 0;
    }
    @media (max-width: 1100px) {
      .record-workspace { grid-template-columns: 1fr; grid-template-rows: auto auto; }
    }
    @media (max-width: 768px) {
      .record-workspace { padding: 12px 16px; }
      .page-header { padding: 20px 16px 0; flex-direction: column; align-items: flex-start; gap: 12px; }
    }

    /* Lang Switch */
    .lang-switch {
      display: flex;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 3px;
      gap: 2px;
    }
    .lang-btn {
      padding: 6px 14px;
      border-radius: calc(var(--radius-md) - 2px);
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--duration-fast);
    }
    .lang-btn.active { background: var(--grad-primary); color: white; }
    .lang-btn:hover:not(.active) { background: var(--bg-elevated); color: var(--text-primary); }

    /* Meeting Mode Toggle */
    .meeting-mode-toggle {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--duration-fast);
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .meeting-mode-toggle:hover { border-color: var(--border-soft); background: var(--bg-card-hover); }
    .meeting-mode-toggle.active { border-color: rgba(6,182,212,0.4); background: rgba(6,182,212,0.08); color: var(--accent-cyan); }
    .meeting-icon { font-size: 0.95rem; }
    .meeting-label { font-weight: 500; }
    .meeting-status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-muted); transition: all var(--duration-fast); }
    .meeting-mode-toggle.active .meeting-status-dot { background: var(--accent-cyan); box-shadow: 0 0 6px var(--accent-cyan); }

    /* Transcript Panel */
    .transcript-panel {
      display: flex; flex-direction: column; gap: 0;
      overflow: hidden; border-radius: var(--radius-xl);
      min-height: 500px;
    }

    .record-status-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .status-indicator { display: flex; align-items: center; gap: 8px; }
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--text-muted); transition: all var(--duration-normal);
    }
    .status-dot.recording { background: var(--accent-red); box-shadow: 0 0 8px rgba(239,68,68,0.5); animation: glowPulse 1.5s infinite; }
    .status-dot.paused { background: var(--accent-amber); }
    .status-dot.idle { background: var(--accent-green); }
    .status-text { font-size: 0.82rem; font-weight: 500; color: var(--text-secondary); }
    .record-timer {
      font-family: var(--font-display);
      font-size: 1.1rem; font-weight: 700;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.05em;
    }
    .record-timer.recording { color: var(--accent-red); }

    /* Audio Visualizer Wrap */
    .audio-visualizer-wrap {
      padding: 10px 18px;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(0,0,0,0.1);
      display: flex; align-items: center; justify-content: center;
    }

    /* Transcript Display */
    .transcript-display {
      flex: 1; overflow-y: auto;
      padding: 14px 18px;
      min-height: 220px; max-height: 320px;
    }
    .transcript-placeholder {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 180px; gap: 10px;
      text-align: center; color: var(--text-muted); font-size: 0.85rem;
    }
    .placeholder-icon { font-size: 2.5rem; opacity: 0.4; }
    .transcript-segments { display: flex; flex-direction: column; gap: 2px; }
    .interim-text {
      color: var(--text-muted); font-style: italic;
      font-size: 0.88rem; padding: 4px 10px; min-height: 24px;
    }
    .interim-text::after {
      content: '▌'; color: var(--accent-violet);
      animation: blink 1s step-end infinite; margin-left: 1px;
    }

    /* Bookmark Bar */
    .bookmark-bar {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 18px;
      border-top: 1px solid var(--border-subtle);
      background: rgba(0,0,0,0.1);
    }
    .bookmark-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.78rem; font-weight: 600;
      cursor: pointer; transition: all var(--duration-fast);
      border: 1px solid;
      background: rgba(245,158,11,0.1); color: var(--accent-amber); border-color: rgba(245,158,11,0.3);
    }
    .bookmark-btn:hover { background: rgba(245,158,11,0.2); }
    .bookmark-count { font-size: 0.72rem; color: var(--text-muted); margin-left: auto; }

    /* Recording Controls */
    .recording-controls {
      display: flex; align-items: center; justify-content: center;
      gap: 20px; padding: 18px;
      border-top: 1px solid var(--border-subtle);
      background: rgba(0,0,0,0.15);
    }
    .secondary-controls { display: flex; flex-direction: column; gap: 8px; }
    .ctrl-btn {
      display: flex; align-items: center; gap: 7px;
      padding: 8px 16px;
      border-radius: var(--radius-md);
      font-size: 0.8rem; font-weight: 600;
      background: var(--bg-card); color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
      cursor: pointer; transition: all var(--duration-fast);
    }
    .ctrl-btn:not(:disabled):hover { background: var(--bg-card-hover); color: var(--text-primary); border-color: var(--border-soft); }
    .ctrl-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .ctrl-btn.stop { color: var(--accent-red); border-color: rgba(239,68,68,0.25); background: rgba(239,68,68,0.06); }
    .ctrl-btn.stop:not(:disabled):hover { background: rgba(239,68,68,0.14); }

    /* Chatbot Panel */
    .chatbot-panel {
      display: flex; flex-direction: column;
      border-radius: var(--radius-xl);
      overflow: hidden; min-height: 500px;
    }
    .chatbot-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .chatbot-title { display: flex; align-items: center; gap: 10px; }
    .ai-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--grad-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
    }
    .ai-status-badge {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 10px;
      background: rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.25);
      border-radius: var(--radius-full);
      font-size: 0.7rem; font-weight: 600; color: var(--accent-green);
    }
    .ai-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-green); animation: glowPulse 2s infinite; }

    .chat-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 4px; min-height: 200px; max-height: 300px; }

    .quick-actions { padding: 10px 14px; border-top: 1px solid var(--border-subtle); }
    .quick-btns { display: flex; flex-wrap: wrap; gap: 6px; }
    .quick-btn {
      padding: 5px 10px; font-size: 0.73rem; font-weight: 500;
      background: var(--bg-elevated); color: var(--text-secondary);
      border: 1px solid var(--border-subtle); border-radius: var(--radius-full);
      cursor: pointer; transition: all var(--duration-fast);
    }
    .quick-btn:hover { background: rgba(124,58,237,0.15); color: var(--accent-violet); border-color: rgba(124,58,237,0.3); }

    .chat-input-wrap {
      display: flex; align-items: flex-end; gap: 8px;
      padding: 12px 14px;
      border-top: 1px solid var(--border-subtle);
    }
    .chat-input {
      flex: 1; resize: none; max-height: 100px; overflow-y: auto;
      background: var(--bg-input); border-color: var(--border-subtle);
      padding: 9px 12px; border-radius: var(--radius-md);
      font-size: 0.84rem; line-height: 1.5;
    }
    .chat-send-btn { padding: 9px 14px; border-radius: var(--radius-md); flex-shrink: 0; }

    /* Note Save Bar */
    .note-save-bar {
      padding: 16px 20px;
      border: 1px solid rgba(16,185,129,0.3);
      background: rgba(16,185,129,0.04);
    }
    .note-save-header {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 14px;
    }
    .note-save-icon {
      width: 36px; height: 36px; border-radius: var(--radius-md);
      background: rgba(16,185,129,0.15); color: var(--accent-green);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .note-save-body {
      display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;
    }

    /* AI Processing Section */
    .ai-panels-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }
    .flashcards-card { grid-column: 1/-1; }
    @media (max-width: 768px) { .ai-panels-grid { grid-template-columns: 1fr; } .flashcards-card { grid-column: auto; } }

    .ai-card { padding: 16px; }
    .ai-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .ai-card-icon { font-size: 1.1rem; }
    .ai-card-title { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); flex: 1; }
    .ai-loading { flex-shrink: 0; }
    .ai-loading.hidden { display: none; }

    .ai-skeleton {
      height: 12px; width: 100%;
      border-radius: var(--radius-full); margin-bottom: 8px;
      background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-card-hover) 50%, var(--bg-elevated) 75%);
      background-size: 200% 100%;
      animation: gradientShift 1.5s ease infinite;
    }
    .ai-card-body { font-size: 0.85rem; line-height: 1.65; color: var(--text-secondary); }
    .ai-summary-text { color: var(--text-primary); }

    /* Flashcards in AI panel */
    .fc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin-top: 4px; }

    /* Speaker Tag (Meeting Mode) */
    .speaker-tag {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      margin-bottom: 3px;
      cursor: pointer;
      transition: all var(--duration-fast);
      position: relative;
    }
    .speaker-tag::after {
      content: '✎';
      font-size: 0.6rem;
      margin-left: 4px;
      opacity: 0;
      transition: opacity var(--duration-fast);
    }
    .speaker-tag:hover::after { opacity: 1; }
    .speaker-tag:hover {
      filter: brightness(1.3);
      transform: scale(1.03);
    }
    .speaker-1 { background: rgba(124,58,237,0.18); color: var(--accent-violet); border: 1px solid rgba(124,58,237,0.25); }
    .speaker-2 { background: rgba(6,182,212,0.18); color: var(--accent-cyan); border: 1px solid rgba(6,182,212,0.25); }

    /* Speaker Rename Modal */
    .speaker-rename-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
    }
    .speaker-rename-modal {
      width: 360px;
      max-width: 92vw;
      padding: 24px;
      border-radius: var(--radius-xl);
      animation: scaleIn 0.25s ease;
    }
    .speaker-rename-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
    }
    .speaker-rename-icon {
      width: 40px; height: 40px;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.15rem;
    }
    .speaker-rename-icon.speaker-1 { background: rgba(124,58,237,0.15); }
    .speaker-rename-icon.speaker-2 { background: rgba(6,182,212,0.15); }
    .speaker-rename-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .speaker-rename-body { margin-bottom: 18px; }
    .speaker-rename-label {
      display: block;
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-bottom: 10px;
    }
    .speaker-rename-input {
      width: 100%;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      background: var(--bg-input);
      color: var(--text-primary);
      font-size: 0.9rem;
      font-weight: 500;
      outline: none;
      transition: border-color var(--duration-fast);
    }
    .speaker-rename-input:focus {
      border-color: var(--accent-violet);
      box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
    }
    .speaker-rename-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

/* ---- Record Page State ---- */
let recordState = {
  isRecording: false,
  isPaused: false,
  meetingMode: false,
  language: 'vi-VN',
  transcript: [],
  bookmarks: [],
  interimText: '',
  bookmarkCount: 0,
  chatHistory: [],
  currentNoteId: null,
  aiResults: null,
  autoSaved: false,
  micPermission: 'prompt',
  micBlocked: false,
  speakerNames: { 1: 'Người nói 1', 2: 'Người nói 2' },
};

function initRecordPage() {
  recordState = {
    isRecording: false, isPaused: false, meetingMode: false,
    language: Storage.getSetting('language', 'vi') === 'en' ? 'en-US' : 'vi-VN',
    transcript: [], bookmarks: [], interimText: '', bookmarkCount: 0,
    chatHistory: [], currentNoteId: null, aiResults: null, autoSaved: false,
    micPermission: 'prompt', micBlocked: false,
    speakerNames: { 1: 'Người nói 1', 2: 'Người nói 2' },
  };

  // Query microphone permission status
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'microphone' }).then(status => {
      recordState.micPermission = status.state;
      status.onchange = () => {
        recordState.micPermission = status.state;
      };
    }).catch(() => {});
  }

  SpeechEngine.on('result', ({ interim, final, speaker }) => {
    const interimEl = document.getElementById('interim-text');
    if (interimEl) interimEl.textContent = interim;
    recordState.interimText = interim;
    if (final) {
      addTranscriptSegment(final, speaker);
      if (interimEl) interimEl.textContent = '';
      recordState.interimText = '';
    }
  });

  SpeechEngine.on('timer', (seconds) => {
    const el = document.getElementById('record-timer');
    if (el) el.textContent = SpeechEngine.formatTime(seconds);
  });

  SpeechEngine.on('speakerChange', (speaker) => {
    const name = recordState.speakerNames[speaker] || `Người nói ${speaker}`;
    showToast(`🎙️ ${name} đang phát biểu`, 'info');
    recordState.currentSpeaker = speaker;
  });

  SpeechEngine.on('started', () => {
    updateRecordUI('recording');
  });

  SpeechEngine.on('paused',  () => updateRecordUI('paused'));
  SpeechEngine.on('resumed', () => updateRecordUI('recording'));

  SpeechEngine.on('stopped', ({ duration }) => {
    updateRecordUI('stopped');
    recordState.lastDuration = duration;
    
    if (recordState.interimText && recordState.interimText.trim()) {
      addTranscriptSegment(recordState.interimText, recordState.currentSpeaker || 1);
      recordState.interimText = '';
      const interimEl = document.getElementById('interim-text');
      if (interimEl) interimEl.textContent = '';
    }

    autoSaveNote();         // ← Auto save immediately
    showSaveBar();
    if (recordState.transcript.length > 0) {
      startAIProcessing();
    } else {
      showToast('💾 Đã lưu ghi chú (chưa có văn bản)', 'info');
    }
  });

  SpeechEngine.on('error', (err) => {
    showToast('⚠️ ' + err, 'error');
    if (err === 'not-allowed') {
      recordState.micBlocked = true;
    }
  });

  SpeechEngine.on('audioLevel', (level) => {
    updateAudioBars(level);
  });
}

/* ---- Auto-save right after recording stops ---- */
function autoSaveNote() {
  if (recordState.autoSaved && recordState.currentNoteId) return;

  const noteNum = Storage.getNextNoteNumber();
  const now     = new Date();
  const defaultTitle = `Bản ghi mới ${noteNum}`;
  const noteId  = `note-${Date.now()}`;

  let transcriptText = recordState.transcript.map(s => s.text).join('\n');
  if (!transcriptText.trim()) {
    transcriptText = "(Không có nội dung nhận diện)";
  }

  const note = {
    id:        noteId,
    title:     defaultTitle,
    participants: ['Người dùng'],
    duration:  recordState.lastDuration || '00:00',
    transcript: transcriptText,
    summary:   '',
    keyPoints: [],
    flashcards:[],
    bookmarks: recordState.bookmarks,
    tags:      [],
    startTime: new Date(window._recordStartTime || Date.now()).toISOString(),
    createdAt: new Date(window._recordStartTime || Date.now()).toISOString(),
  };

  Storage.saveNote(note);
  recordState.currentNoteId = noteId;
  recordState.autoSaved     = true;

  // Pre-fill title input
  const titleInput = document.getElementById('note-title-input');
  if (titleInput) titleInput.value = defaultTitle;

  const infoEl = document.getElementById('auto-save-info');
  if (infoEl) {
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    infoEl.textContent = `Lưu lúc ${timeStr} — ${defaultTitle}`;
  }

  showToast(`💾 Đã lưu tự động: "${defaultTitle}"`, 'success');
}

/* ---- Live-update title as user types ---- */
function autoUpdateNoteTitle(newTitle) {
  if (!recordState.currentNoteId) return;
  const trimmed = newTitle.trim();
  if (!trimmed) return;
  const note = Storage.getNoteById(recordState.currentNoteId);
  if (note) {
    note.title = trimmed;
    Storage.saveNote(note);
  }
}

function addTranscriptSegment(text, speaker) {
  if (!text.trim()) return;
  const seg = {
    text: text.trim(),
    speaker,
    timestamp: SpeechEngine.formatTime(Math.floor((Date.now() - (window._recordStartTime || Date.now())) / 1000)),
    isBookmark: false
  };
  recordState.transcript.push(seg);

  const container   = document.getElementById('transcript-segments');
  const placeholder = document.getElementById('transcript-placeholder');
  if (placeholder) placeholder.style.display = 'none';

  if (container) {
    const el = document.createElement('div');
    el.className  = 'transcript-segment';
    el.dataset.idx = recordState.transcript.length - 1;
    const speakerName = recordState.speakerNames[speaker] || `Người nói ${speaker}`;
    el.innerHTML  = `
      ${recordState.meetingMode ? `<div class="speaker-tag speaker-${speaker}" data-speaker="${speaker}" onclick="event.stopPropagation(); renameSpeaker(${speaker})" title="Click để đổi tên">${escapeHtml(speakerName)}</div>` : ''}
      <span>${escapeHtml(text)}</span>
    `;
    el.onclick = () => toggleSegmentBookmark(el, recordState.transcript.length - 1);
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }
}

function toggleSegmentBookmark(el, idx) {
  if (!recordState.transcript[idx]) return;
  const seg = recordState.transcript[idx];
  seg.isBookmark = !seg.isBookmark;
  el.classList.toggle('bookmarked', seg.isBookmark);
  if (seg.isBookmark) {
    recordState.bookmarks.push({ idx, text: seg.text, timestamp: seg.timestamp });
    recordState.bookmarkCount++;
  } else {
    recordState.bookmarks      = recordState.bookmarks.filter(b => b.idx !== idx);
    recordState.bookmarkCount  = Math.max(0, recordState.bookmarkCount - 1);
  }
  const countEl = document.getElementById('bookmark-count');
  if (countEl) countEl.textContent = recordState.bookmarkCount + ' đánh dấu';
  showToast(seg.isBookmark ? '⭐ Đã đánh dấu đoạn này' : '✓ Đã bỏ đánh dấu', 'info');
}

function addBookmark() {
  const segs = document.querySelectorAll('.transcript-segment:not(.bookmarked)');
  if (segs.length === 0) { showToast('Chưa có nội dung để đánh dấu', 'info'); return; }
  const lastEl = segs[segs.length - 1];
  const idx    = parseInt(lastEl.dataset.idx);
  toggleSegmentBookmark(lastEl, idx);
}

function updateAudioBars(level) {
  const viz = document.getElementById('audio-visualizer');
  if (!viz) return;
  viz.querySelectorAll('.audio-bar').forEach((bar) => {
    const variation = Math.random() * 0.4;
    const h = Math.max(4, Math.floor((level + variation) * 44));
    bar.style.height = h + 'px';
  });
}

function updateRecordUI(state) {
  const mainBtn   = document.getElementById('main-record-btn');
  const pauseBtn  = document.getElementById('pause-btn');
  const stopBtn   = document.getElementById('stop-btn');
  const wrap      = document.getElementById('record-btn-wrap');
  const statusDot = document.querySelector('.status-dot');
  const statusText= document.getElementById('status-text');
  const timer     = document.getElementById('record-timer');
  const viz       = document.getElementById('audio-visualizer');
  const bookmarkBar = document.getElementById('bookmark-bar');

  if (state === 'recording') {
    wrap?.classList.add('recording');
    mainBtn && (mainBtn.style.background   = 'linear-gradient(135deg,#EF4444,#DC2626)');
    mainBtn && (mainBtn.style.boxShadow    = '0 4px 24px rgba(239,68,68,0.4)');
    mainBtn?.setAttribute('title', 'Đang ghi... (click để dừng)');
    pauseBtn?.removeAttribute('disabled');
    stopBtn?.removeAttribute('disabled');
    statusDot?.classList.remove('idle','paused'); statusDot?.classList.add('recording');
    if (statusText) statusText.textContent = '● Đang ghi âm...';
    timer?.classList.add('recording');
    viz?.classList.add('active');
    if (bookmarkBar) bookmarkBar.style.display = 'flex';
  } else if (state === 'paused') {
    wrap?.classList.remove('recording');
    statusDot?.classList.remove('recording','idle'); statusDot?.classList.add('paused');
    if (statusText) statusText.textContent = '⏸ Tạm dừng';
    viz?.classList.remove('active');
    if (pauseBtn) pauseBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Tiếp tục</span>`;
  } else if (state === 'stopped' || state === 'idle') {
    wrap?.classList.remove('recording');
    mainBtn && (mainBtn.style.background = '');
    mainBtn && (mainBtn.style.boxShadow  = '');
    pauseBtn?.setAttribute('disabled', '');
    stopBtn?.setAttribute('disabled', '');
    statusDot?.classList.remove('recording','paused'); statusDot?.classList.add('idle');
    if (statusText) statusText.textContent = state === 'stopped' ? '✓ Đã hoàn tất' : 'Sẵn sàng ghi âm';
    timer?.classList.remove('recording');
    viz?.classList.remove('active');
    if (pauseBtn) pauseBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg><span>Tạm dừng</span>`;
  }
}

async function handleRecordToggle() {
  if (!SpeechEngine.isSupported()) {
    showToast('⚠️ Vui lòng dùng Google Chrome để sử dụng tính năng ghi âm', 'error');
    return;
  }
  if (!recordState.isRecording) {
    recordState.isRecording = true;
    window._recordStartTime = Date.now();
    await SpeechEngine.startRecording(recordState.language, recordState.meetingMode);
  } else {
    handleStopRecording();
  }
}

function handlePauseToggle() {
  if (!recordState.isRecording) return;
  if (!recordState.isPaused) {
    SpeechEngine.pauseRecording();
    recordState.isPaused = true;
  } else {
    SpeechEngine.resumeRecording();
    recordState.isPaused = false;
  }
}

function handleStopRecording() {
  SpeechEngine.stopRecording();
  recordState.isRecording = false;
  recordState.isPaused    = false;
}

function setRecordLanguage(lang) {
  recordState.language = lang;
  SpeechEngine.setLanguage(lang);
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(lang === 'vi-VN' ? 'lang-vi' : 'lang-en')?.classList.add('active');
  Storage.saveSetting('language', lang === 'vi-VN' ? 'vi' : 'en');
  showToast(`🌐 Ngôn ngữ: ${lang === 'vi-VN' ? 'Tiếng Việt' : 'English'}`, 'info');
}

function toggleMeetingMode() {
  recordState.meetingMode = !recordState.meetingMode;
  document.getElementById('meeting-toggle')?.classList.toggle('active', recordState.meetingMode);
  showToast(`👥 Meeting Mode: ${recordState.meetingMode ? 'BẬT' : 'TẮT'}`, 'info');
}

/* ---- Rename Speaker in Meeting Mode ---- */
function renameSpeaker(speakerNum) {
  const currentName = recordState.speakerNames[speakerNum] || `Người nói ${speakerNum}`;

  // Create a modal overlay for renaming
  const overlay = document.createElement('div');
  overlay.className = 'speaker-rename-overlay';
  overlay.id = 'speaker-rename-overlay';
  overlay.innerHTML = `
    <div class="speaker-rename-modal card-glass">
      <div class="speaker-rename-header">
        <div class="speaker-rename-icon speaker-${speakerNum}">🎙️</div>
        <div class="speaker-rename-title">Đổi tên người nói</div>
      </div>
      <div class="speaker-rename-body">
        <label class="speaker-rename-label">Tên hiện tại: <strong>${escapeHtml(currentName)}</strong></label>
        <input type="text" class="speaker-rename-input" id="speaker-rename-input"
          value="${escapeHtml(currentName)}" placeholder="Nhập tên mới..." maxlength="30"
          autofocus />
      </div>
      <div class="speaker-rename-actions">
        <button class="btn btn-ghost btn-sm" onclick="closeSpeakerRename()">Hủy</button>
        <button class="btn btn-primary btn-sm" onclick="confirmSpeakerRename(${speakerNum})">✓ Xác nhận</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Focus and select input text
  requestAnimationFrame(() => {
    const input = document.getElementById('speaker-rename-input');
    if (input) { input.focus(); input.select(); }
  });

  // Close on overlay background click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSpeakerRename();
  });

  // Enter key to confirm
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); confirmSpeakerRename(speakerNum); }
    if (e.key === 'Escape') { e.preventDefault(); closeSpeakerRename(); }
  });
}

function confirmSpeakerRename(speakerNum) {
  const input = document.getElementById('speaker-rename-input');
  const newName = input?.value.trim();
  if (!newName) {
    showToast('⚠️ Tên không được để trống', 'error');
    return;
  }

  recordState.speakerNames[speakerNum] = newName;

  // Update all existing speaker tags in the transcript for this speaker
  document.querySelectorAll(`.speaker-tag[data-speaker="${speakerNum}"]`).forEach(tag => {
    tag.textContent = newName;
  });

  closeSpeakerRename();
  showToast(`✅ Đã đổi tên thành "${newName}"`, 'success');
}

function closeSpeakerRename() {
  const overlay = document.getElementById('speaker-rename-overlay');
  if (overlay) {
    overlay.style.animation = 'fadeOut 0.2s ease forwards';
    setTimeout(() => overlay.remove(), 200);
  }
}

function showSaveBar() {
  const bar = document.getElementById('note-meta-bar');
  if (bar) {
    bar.style.display = 'block';
    bar.style.animation = 'slideUp 0.3s ease forwards';
  }
}

/* ---- Manual save (update title button) ---- */
async function saveCurrentNote() {
  if (!recordState.currentNoteId) return;
  const titleInput = document.getElementById('note-title-input');
  const newTitle   = titleInput?.value.trim();
  if (!newTitle) { showToast('⚠️ Vui lòng nhập tên cuộc hội thoại', 'info'); return; }

  const note = Storage.getNoteById(recordState.currentNoteId);
  if (note) {
    note.title = newTitle;
    Storage.saveNote(note);
    const infoEl = document.getElementById('auto-save-info');
    if (infoEl) infoEl.textContent = `Đã đổi tên thành: "${newTitle}"`;
    showToast(`✅ Đã cập nhật tên: "${newTitle}"`, 'success');

    const btn = document.getElementById('save-btn');
    if (btn) {
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Đã lưu!';
      setTimeout(() => { btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> Cập nhật tên'; }, 2000);
    }
  }
}

async function startAIProcessing() {
  const section = document.getElementById('ai-processing-section');
  if (section) { section.style.display = 'block'; section.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }

  const fullText = recordState.transcript.map(s => s.text).join(' ');
  const lang     = recordState.language === 'vi-VN' ? 'vi' : 'en';

  recordState.aiResults = await AIEngine.processTranscript(fullText, lang, (type, status) => {
    const loadingId = type === 'keyPoints' ? 'keypoints-loading' : `${type}-loading`;
    const loading   = document.getElementById(loadingId);
    if (loading) loading.classList.toggle('hidden', status === 'done');

    if (status === 'done') {
      renderAIResult(type, recordState.aiResults?.[type]);
      // Update the saved note with AI results
      updateNoteWithAI();
    }
  });

  renderAIResult('summary',   recordState.aiResults.summary);
  renderAIResult('keyPoints', recordState.aiResults.keyPoints);
  renderAIResult('flashcards',recordState.aiResults.flashcards);
  updateNoteWithAI();
}

function updateNoteWithAI() {
  if (!recordState.currentNoteId || !recordState.aiResults) return;
  const note = Storage.getNoteById(recordState.currentNoteId);
  if (!note) return;

  note.summary    = recordState.aiResults.summary   || note.summary   || '';
  note.keyPoints  = recordState.aiResults.keyPoints || note.keyPoints || [];
  note.flashcards = recordState.aiResults.flashcards|| note.flashcards|| [];

  Storage.saveNote(note);

  // Update flashcards store
  if (note.flashcards.length > 0) {
    note.flashcards.forEach(f => Storage.saveFlashcard({ ...f, noteId: note.id, noteTitle: note.title }));
  }
}

function renderAIResult(type, data) {
  if (!data) return;
  if (type === 'summary') {
    const el = document.getElementById('summary-body');
    if (el) el.innerHTML = `<p class="ai-summary-text">${escapeHtml(data)}</p>`;
  } else if (type === 'keyPoints') {
    const el = document.getElementById('keypoints-body');
    if (el) el.innerHTML = (data || []).map((p, i) => `
      <div class="key-point-item">
        <div class="key-point-num">${i+1}</div>
        <div class="key-point-text">${escapeHtml(p)}</div>
      </div>`).join('');
  } else if (type === 'flashcards') {
    const el = document.getElementById('flashcards-body');
    if (el) el.innerHTML = `
      <div class="fc-grid">
        ${(data || []).map(card => `
          <div class="flashcard-scene" onclick="this.querySelector('.flashcard-card').classList.toggle('flipped')">
            <div class="flashcard-card">
              <div class="flashcard-face flashcard-front">
                <div>
                  <div style="font-size:0.65rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;">Câu hỏi</div>
                  <div class="flashcard-question">${escapeHtml(card.question)}</div>
                </div>
                <div class="flashcard-hint">👆 Click để xem đáp án</div>
              </div>
              <div class="flashcard-face flashcard-back">
                <div>
                  <div style="font-size:0.65rem;font-weight:700;color:var(--accent-violet);text-transform:uppercase;margin-bottom:6px;">Đáp án</div>
                  <div class="flashcard-answer">${escapeHtml(card.answer)}</div>
                </div>
              </div>
            </div>
          </div>`).join('')}
      </div>`;
  }
}

/* ---- CHATBOT ---- */
async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const msg   = input?.value.trim();
  if (!msg) return;
  input.value = '';
  autoResizeTextarea(input);
  appendChatMessage('user', msg);
  await handleChatAI(msg);
}

function sendQuickQuestion(q) {
  const input = document.getElementById('chat-input');
  if (input) { input.value = q; sendChatMessage(); }
}

async function handleChatAI(userMsg) {
  const messagesEl = document.getElementById('chat-messages');
  const typingId   = 'typing-' + Date.now();
  if (messagesEl) {
    messagesEl.innerHTML += `
      <div class="chat-message" id="${typingId}">
        <div class="chat-avatar ai">AI</div>
        <div class="chat-bubble ai typing-indicator">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
      </div>`;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  const transcript = recordState.transcript.map(s => s.text).join(' ');
  const lang       = recordState.language === 'vi-VN' ? 'vi' : 'en';

  try {
    const reply = await AIEngine.chat(userMsg, transcript, recordState.chatHistory, lang);
    recordState.chatHistory.push({ role: 'user', content: userMsg }, { role: 'assistant', content: reply });
    document.getElementById(typingId)?.remove();
    appendChatMessage('ai', reply);
  } catch(e) {
    document.getElementById(typingId)?.remove();
    appendChatMessage('ai', '⚠️ Có lỗi xảy ra. Vui lòng thử lại.');
  }
}

function appendChatMessage(role, text) {
  const el = document.getElementById('chat-messages');
  if (!el) return;
  const div = document.createElement('div');
  div.className = `chat-message ${role === 'user' ? 'user' : ''}`;
  div.innerHTML = `
    <div class="chat-avatar ${role}">${role === 'ai' ? 'AI' : '👤'}</div>
    <div class="chat-bubble ${role}">${escapeHtml(text)}</div>
  `;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function handleChatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

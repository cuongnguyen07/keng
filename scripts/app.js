/* ==========================================
   MAIN APP — Router, Modals, Toast, Utils
   ========================================== */

// ---- ROUTER ----
const PAGES = {
  dashboard: { render: renderDashboardPage, navId: 'nav-dashboard' },
  record:    { render: renderRecordPage,    navId: 'nav-record' },
  notes:     { render: renderNotesPage,     navId: 'nav-notes' },
  flashcards:{ render: renderFlashcardsPage,navId: 'nav-flashcards' },
  settings:  { render: renderSettingsPage,  navId: 'nav-settings' },
};

let currentPage = null;

function showPage(pageId) {
  if (!PAGES[pageId]) return;

  // Deactivate current page
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Activate new page
  const pageEl = document.getElementById(`page-${pageId}`);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.getElementById(PAGES[pageId].navId);
  if (navEl) navEl.classList.add('active');

  // Render page content
  try {
    PAGES[pageId].render();
  } catch(e) {
    console.error('Page render error:', e);
  }

  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('open');
  currentPage = pageId;

  // Update URL hash
  window.location.hash = pageId;
}

// ---- NOTE DETAIL MODAL ----
function openNoteDetail(noteId) {
  const note = Storage.getNoteById(noteId);
  if (!note) { showToast('Không tìm thấy ghi chú', 'error'); return; }

  const date         = new Date(note.createdAt).toLocaleDateString('vi-VN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const participants = note.participants || [];
  const startDate    = new Date(note.startTime || note.createdAt);
  const timeStr      = startDate.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });

  document.getElementById('note-modal-body').innerHTML = `
    <div style="padding:24px;">
      <!-- Modal Header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:20px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <h2 id="modal-note-title" style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;color:var(--text-primary);margin-bottom:6px;margin-top:0;">${escapeHtml(note.title)}</h2>
            <button class="btn-icon" onclick="renameNoteFromModal('${note.id}')" title="Đổi tên" style="padding:4px;border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;background:none;border:none;color:var(--text-secondary);margin-bottom:6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>
            </button>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="text-xs text-muted">📅 ${date}</span>
            <span class="text-xs text-muted">🕐 ${timeStr}</span>
            <span class="text-xs text-muted">⏱ ${note.duration || '00:00'}</span>
            ${participants.length > 0 ? `<span class="text-xs text-muted">👥 ${escapeHtml(participants.join(', '))}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;">
          <button class="btn btn-secondary btn-sm" onclick="Storage.exportNote(Storage.getNoteById('${noteId}'),'md');showToast('📥 Xuất .md thành công','success')">📥 .md</button>
          <button class="btn btn-secondary btn-sm" onclick="Storage.exportNote(Storage.getNoteById('${noteId}'),'txt');showToast('📥 Xuất .txt thành công','success')">📥 .txt</button>
          <button class="btn-icon" onclick="closeNoteModal()" title="Đóng">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:0;border-bottom:1px solid var(--border-subtle);margin-bottom:20px;">
        ${['transcript','summary','flashcards'].map((tab,i) => `
          <button class="modal-tab ${i===0?'active':''}" onclick="switchModalTab('${tab}',this)" data-tab="${tab}" style="padding:10px 18px;font-size:0.82rem;font-weight:600;color:${i===0?'var(--accent-violet)':'var(--text-secondary)'};border-bottom:2px solid ${i===0?'var(--accent-violet)':'transparent'};transition:all 0.2s;cursor:pointer;background:none;border-top:none;border-left:none;border-right:none;">
            ${tab === 'transcript' ? '📝 Transcript' : tab === 'summary' ? '💡 AI Insights' : '🃏 Flashcards'}
          </button>`).join('')}
      </div>

      <!-- Tab Content -->
      <div id="modal-tab-transcript" class="modal-tab-content" style="max-height:400px;overflow-y:auto;">
        ${note.bookmarks?.length ? `
          <div style="margin-bottom:16px;padding:12px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:10px;">
            <div class="text-xs text-muted" style="margin-bottom:8px;font-weight:700;">⭐ ${note.bookmarks.length} ĐOẠN ĐÃ ĐÁNH DẤU</div>
            ${note.bookmarks.map(b => `
              <div style="display:flex;gap:8px;padding:4px 0;font-size:0.82rem;">
                <span style="color:var(--accent-amber);font-size:0.72rem;white-space:nowrap;padding-top:2px;">⏱ ${b.timestamp || b.time || '??:??'}</span>
                <span style="color:var(--text-secondary);">${escapeHtml(b.text)}</span>
              </div>`).join('')}
          </div>` : ''}
        <div style="font-size:0.875rem;line-height:1.8;color:var(--text-primary);white-space:pre-wrap;">${escapeHtml(note.transcript || 'Không có nội dung transcript.')}</div>
      </div>

      <div id="modal-tab-summary" class="modal-tab-content" style="display:none;">
        ${note.summary ? `
          <div style="margin-bottom:20px;">
            <div class="section-title">📋 Tóm tắt</div>
            <div style="font-size:0.875rem;line-height:1.7;color:var(--text-primary);padding:14px;background:var(--bg-elevated);border-radius:10px;">${escapeHtml(note.summary)}</div>
          </div>` : ''}
        ${note.keyPoints?.length ? `
          <div>
            <div class="section-title">💡 Ý chính</div>
            ${note.keyPoints.map((p,i) => `
              <div class="key-point-item">
                <div class="key-point-num">${i+1}</div>
                <div class="key-point-text">${escapeHtml(p)}</div>
              </div>`).join('')}
          </div>` : '<div class="empty-state" style="padding:30px 0;"><div class="empty-desc">Chưa có phân tích AI cho ghi chú này</div></div>'}
      </div>

      <div id="modal-tab-flashcards" class="modal-tab-content" style="display:none;">
        ${note.flashcards?.length ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
            ${note.flashcards.map(card => `
              <div class="flashcard-scene" onclick="this.querySelector('.flashcard-card').classList.toggle('flipped')">
                <div class="flashcard-card" style="height:140px;">
                  <div class="flashcard-face flashcard-front">
                    <div class="flashcard-question">${escapeHtml(card.question)}</div>
                    <div class="flashcard-hint">👆 Click</div>
                  </div>
                  <div class="flashcard-face flashcard-back">
                    <div class="flashcard-answer">${escapeHtml(card.answer)}</div>
                  </div>
                </div>
              </div>`).join('')}
          </div>` : '<div class="empty-state" style="padding:30px 0;"><div class="empty-desc">Chưa có flashcard cho ghi chú này</div></div>'}
      </div>
    </div>
  `;

  const modal = document.getElementById('note-modal');
  if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function switchModalTab(tab, btn) {
  document.querySelectorAll('.modal-tab-content').forEach(el => el.style.display = 'none');
  document.getElementById(`modal-tab-${tab}`).style.display = 'block';
  document.querySelectorAll('.modal-tab').forEach(b => {
    b.style.color = 'var(--text-secondary)';
    b.style.borderBottomColor = 'transparent';
  });
  btn.style.color = 'var(--accent-violet)';
  btn.style.borderBottomColor = 'var(--accent-violet)';
}

function closeNoteModal() {
  const modal = document.getElementById('note-modal');
  if (modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
}

function renameNoteFromModal(id) {
  const note = Storage.getNoteById(id);
  if (!note) return;
  const newTitle = prompt('Nhập tên mới cho cuộc hội thoại:', note.title);
  if (newTitle === null) return;
  const trimmed = newTitle.trim();
  if (!trimmed) {
    showToast('⚠️ Tên không được để trống', 'error');
    return;
  }
  note.title = trimmed;
  Storage.saveNote(note);
  
  // Cập nhật tiêu đề trong modal
  const titleEl = document.getElementById('modal-note-title');
  if (titleEl) titleEl.textContent = trimmed;
  
  showToast('✅ Đã đổi tên thành công!', 'success');
  
  // Làm mới trang hiện tại để cập nhật danh sách
  if (currentPage === 'notes' && typeof renderNotesList === 'function') {
    renderNotesList();
  } else if (currentPage === 'dashboard' && typeof renderDashboardPage === 'function') {
    renderDashboardPage();
  }
}

// ---- TOAST NOTIFICATIONS ----
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ---- SIDEBAR TOGGLE (Mobile) ----
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

// Click outside sidebar to close
document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.querySelector('.mobile-menu-btn');
  if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuBtn) {
    sidebar.classList.remove('open');
  }
});

// ---- ESCAPE HTML ----
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---- KEYBOARD SHORTCUTS ----
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'Escape') closeNoteModal();
  if (e.ctrlKey && e.key === 'r') { e.preventDefault(); showPage('record'); }
  if (e.ctrlKey && e.key === 'd') { e.preventDefault(); showPage('dashboard'); }
});

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  // Seed demo data
  Storage.seedDemoData();

  // Route based on hash or default
  const hash = window.location.hash.replace('#', '');
  const initialPage = PAGES[hash] ? hash : 'dashboard';
  showPage(initialPage);

  // Handle hash changes
  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#', '');
    if (PAGES[h] && h !== currentPage) showPage(h);
  });

  // Check browser support
  if (!SpeechEngine.isSupported()) {
    setTimeout(() => {
      showToast('⚠️ Ghi âm hoạt động tốt nhất trên Google Chrome', 'info', 6000);
    }, 1500);
  }

  console.log('%c🎙️ Voice Helper', 'background:linear-gradient(135deg,#7C3AED,#06B6D4);color:white;padding:6px 14px;border-radius:6px;font-size:14px;font-weight:700;');
  console.log('%cSử dụng Chrome để có tính năng ghi âm đầy đủ. Cấu hình OpenAI API key trong Cài đặt để sử dụng AI thực sự.', 'color:#94A3B8;font-size:12px;');
});

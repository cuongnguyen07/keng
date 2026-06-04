/* ==========================================
   NOTES PAGE — History & Management
   Grouped by date, list view inspired by screenshot
   ========================================== */

let activeTimeFilter = 'all';
let searchQuery = '';

function renderNotesPage() {
  document.getElementById('notes-content').innerHTML = `
    <div class="notes-page">
      <div class="page-header" style="padding-bottom:0;">
        <div>
          <h1 class="page-title">📋 Bản ghi <span class="gradient-text">của tôi</span></h1>
          <p class="page-subtitle">Tất cả cuộc hội thoại đã ghi âm</p>
        </div>
        <button class="btn btn-primary" onclick="showPage('record')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ghi âm mới
        </button>
      </div>

      <!-- FILTER BAR -->
      <div class="notes-filter-bar">
        <!-- Search -->
        <div class="search-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input class="input search-input" id="notes-search" type="text" placeholder="Tìm kiếm bản ghi..." oninput="handleNotesSearch(this.value)" />
        </div>

        <!-- Time filter pills -->
        <div class="filter-pills" id="filter-pills">
          <button class="tag active" data-filter="all"   onclick="filterNotesByTime('all', this)">📋 Tất cả</button>
          <button class="tag"        data-filter="today" onclick="filterNotesByTime('today', this)">☀️ Hôm nay</button>
          <button class="tag"        data-filter="week"  onclick="filterNotesByTime('week', this)">📅 Tuần này</button>
          <button class="tag"        data-filter="month" onclick="filterNotesByTime('month', this)">🗓️ Tháng này</button>
        </div>

        <!-- Sort -->
        <select class="select" id="notes-sort" onchange="renderNotesList()" style="width:130px;">
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="name">Tên A-Z</option>
        </select>
      </div>

      <!-- NOTES LIST (grouped by date) -->
      <div class="notes-body">
        <div id="notes-grid"></div>
      </div>
    </div>
  `;

  injectNotesStyles();
  renderNotesList();
}

function renderNotesList() {
  let notes = Storage.getNotesByFilter(activeTimeFilter);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    notes = notes.filter(n =>
      n.title?.toLowerCase().includes(q) ||
      n.transcript?.toLowerCase().includes(q) ||
      n.summary?.toLowerCase().includes(q) ||
      n.participants?.join(' ').toLowerCase().includes(q)
    );
  }

  const sort = document.getElementById('notes-sort')?.value || 'newest';
  if (sort === 'newest') notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (sort === 'oldest') notes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  else if (sort === 'name') notes.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  const grid = document.getElementById('notes-grid');
  if (!grid) return;

  if (notes.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎙️</div>
        <div class="empty-title">${searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có bản ghi nào'}</div>
        <div class="empty-desc">${searchQuery ? `Không có bản ghi nào khớp với "${escapeHtml(searchQuery)}"` : 'Hãy bắt đầu ghi âm cuộc hội thoại đầu tiên!'}</div>
        ${!searchQuery ? `<button class="btn btn-primary" onclick="showPage('record')">Ghi âm ngay</button>` : ''}
      </div>`;
    return;
  }

  // Group notes by date
  const groups  = Storage.groupNotesByDate(notes);
  const totalEl = `<div class="notes-count">${notes.length} bản ghi</div>`;
  let html = totalEl;

  for (const [label, groupNotes] of Object.entries(groups)) {
    html += `<div class="date-group">
      <div class="date-group-label">${escapeHtml(label)}</div>
      <div class="notes-list-group">
        ${groupNotes.map(note => renderNoteListRow(note)).join('')}
      </div>
    </div>`;
  }

  grid.innerHTML = html;
}

function getInitials(name) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  // Vietnamese names: take last two words
  return words[words.length - 2].charAt(0).toUpperCase() + words[words.length - 1].charAt(0).toUpperCase();
}

function renderNoteListRow(note) {
  const participants  = note.participants || [];
  const startDate     = new Date(note.startTime || note.createdAt);
  const timeStr       = startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const durationMin   = note.duration ? Math.ceil(parseInt(note.duration) || parseInt(note.duration?.split(':')[0]) || 0) : 0;
  const durationLabel = note.duration ? `${parseInt(note.duration.split(':')[0]) || 0}m` : '0m';

  // Avatar colors cycling
  const avatarColors = ['#7C3AED','#06B6D4','#10B981','#F59E0B','#EF4444','#8B5CF6'];
  const mainParticipant = participants[0] || '';
  const extraCount = Math.max(0, participants.length - 1);
  const initials   = getInitials(mainParticipant) || 'BG';
  const avatarColor = avatarColors[note.id?.charCodeAt(5) % avatarColors.length || 0];

  const participantsList = participants.length > 0
    ? participants.join(', ')
    : 'Bản ghi cá nhân';

  const hasAI = !!(note.summary || note.keyPoints?.length || note.flashcards?.length);

  return `
    <div class="note-list-row" id="nr-${note.id}" onclick="openNoteDetail('${note.id}')">
      <!-- Checkbox -->
      <div class="nr-check" onclick="event.stopPropagation()">
        <input type="checkbox" class="nr-checkbox" id="chk-${note.id}">
      </div>

      <!-- Duration -->
      <div class="nr-duration">
        <div class="nr-dur-time">${durationLabel}</div>
        <div class="nr-dur-clock text-xs text-muted">${timeStr}</div>
      </div>

      <!-- Avatar -->
      <div class="nr-avatar" style="background:${avatarColor};">
        🎙️
      </div>

      <!-- Content -->
      <div class="nr-content">
        <div class="nr-title">${escapeHtml(note.title)}</div>
      </div>

      <!-- Tags / Badges -->
      <div class="nr-badges">
        ${hasAI ? `<span class="nr-badge ai">🤖 AI</span>` : ''}
        ${note.flashcards?.length ? `<span class="nr-badge fc">🃏 ${note.flashcards.length}</span>` : ''}
        ${note.bookmarks?.length  ? `<span class="nr-badge bm">⭐ ${note.bookmarks.length}</span>` : ''}
      </div>

      <!-- Actions -->
      <div class="nr-actions" onclick="event.stopPropagation()">
        <button class="nr-action-btn" title="Đổi tên" onclick="promptRenameNote('${note.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>
        </button>
        <button class="nr-action-btn" title="Xuất Markdown"
          onclick="Storage.exportNote(Storage.getNoteById('${note.id}'),'md'); showToast('📥 Đã xuất Markdown','success')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button class="nr-action-btn" title="Xuất Text"
          onclick="Storage.exportNote(Storage.getNoteById('${note.id}'),'txt'); showToast('📥 Đã xuất Text','success')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </button>
        <button class="nr-action-btn danger" title="Xóa" onclick="deleteNote('${note.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </div>`;
}

function filterNotesByTime(filter, btn) {
  activeTimeFilter = filter;
  document.querySelectorAll('#filter-pills .tag').forEach(b => b.classList.remove('active'));
  btn?.classList.add('active');
  renderNotesList();
}

function handleNotesSearch(q) {
  searchQuery = q;
  renderNotesList();
}

function deleteNote(id) {
  if (!confirm('Xóa bản ghi này? Hành động này không thể hoàn tác.')) return;
  Storage.deleteNote(id);
  document.getElementById(`nr-${id}`)?.remove();
  showToast('🗑️ Đã xóa bản ghi', 'info');
  renderNotesList();
}

function promptRenameNote(id) {
  const note = Storage.getNoteById(id);
  if (!note) return;
  const newTitle = prompt('Nhập tên mới cho cuộc hội thoại:', note.title);
  if (newTitle === null) return; // Hủy bỏ
  const trimmed = newTitle.trim();
  if (!trimmed) {
    showToast('⚠️ Tên không được để trống', 'error');
    return;
  }
  note.title = trimmed;
  Storage.saveNote(note);
  showToast('✅ Đã đổi tên thành công!', 'success');
  renderNotesList();
}

function injectNotesStyles() {
  if (document.getElementById('notes-styles')) return;
  const s = document.createElement('style');
  s.id = 'notes-styles';
  s.textContent = `
    .notes-page { padding-bottom: 40px; }

    .notes-filter-bar {
      display: flex; align-items: center; flex-wrap: wrap;
      gap: 12px; padding: 16px 32px 8px;
    }
    @media (max-width:768px) { .notes-filter-bar { padding: 12px 16px; } }

    .search-wrap { position: relative; flex: 1; min-width: 200px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
    .search-input { padding-left: 36px; }

    .filter-pills { display: flex; flex-wrap: wrap; gap: 6px; }

    .notes-body { padding: 0 32px 24px; }
    @media (max-width:768px) { .notes-body { padding: 0 16px 24px; } }

    .notes-count { font-size: 0.78rem; color: var(--text-muted); margin-bottom: 16px; margin-top: 8px; }

    /* Date Group */
    .date-group { margin-bottom: 24px; }
    .date-group-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-secondary);
      padding: 8px 0 10px;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 4px;
      letter-spacing: 0.02em;
    }
    .notes-list-group { display: flex; flex-direction: column; }

    /* Note List Row */
    .note-list-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: background var(--duration-fast);
      border-radius: var(--radius-md);
      position: relative;
    }
    .note-list-row:hover {
      background: var(--bg-card);
    }
    .note-list-row:hover .nr-actions { opacity: 1; }

    /* Checkbox */
    .nr-check { flex-shrink: 0; }
    .nr-checkbox {
      width: 16px; height: 16px;
      accent-color: var(--accent-violet);
      cursor: pointer;
    }

    /* Duration column */
    .nr-duration {
      flex-shrink: 0;
      width: 50px;
      text-align: center;
    }
    .nr-dur-time {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
    }
    .nr-dur-clock { margin-top: 1px; }

    /* Avatar */
    .nr-avatar {
      flex-shrink: 0;
      width: 38px; height: 38px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.72rem; font-weight: 700;
      color: white;
      position: relative;
      letter-spacing: 0.02em;
    }
    .nr-avatar-extra {
      position: absolute;
      bottom: -2px; right: -4px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      font-size: 0.6rem;
      color: var(--text-secondary);
      padding: 1px 4px;
    }

    /* Content */
    .nr-content { flex: 1; min-width: 0; }
    .nr-title {
      font-size: 0.88rem; font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .nr-participants {
      margin-top: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 280px;
    }

    /* Badges */
    .nr-badges { display: flex; gap: 5px; flex-shrink: 0; }
    .nr-badge {
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: 0.68rem; font-weight: 600;
    }
    .nr-badge.ai { background: rgba(124,58,237,0.15); color: var(--accent-violet); border: 1px solid rgba(124,58,237,0.25); }
    .nr-badge.fc { background: rgba(6,182,212,0.12); color: var(--accent-cyan); border: 1px solid rgba(6,182,212,0.25); }
    .nr-badge.bm { background: rgba(245,158,11,0.12); color: var(--accent-amber); border: 1px solid rgba(245,158,11,0.25); }

    /* Actions */
    .nr-actions {
      display: flex; gap: 4px;
      flex-shrink: 0;
      opacity: 0;
      transition: opacity var(--duration-fast);
    }
    @media (max-width:640px) { .nr-actions { opacity: 1; } }

    .nr-action-btn {
      width: 30px; height: 30px;
      border-radius: var(--radius-sm);
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      display: flex; align-items: center; justify-content: center;
      color: var(--text-secondary);
      cursor: pointer; transition: all var(--duration-fast);
    }
    .nr-action-btn:hover { background: var(--bg-card-hover); color: var(--text-primary); border-color: var(--border-soft); }
    .nr-action-btn.danger:hover { background: rgba(239,68,68,0.12); color: var(--accent-red); border-color: rgba(239,68,68,0.3); }

    @media (max-width: 640px) {
      .nr-badges { display: none; }
      .nr-duration { display: none; }
    }
  `;
  document.head.appendChild(s);
}

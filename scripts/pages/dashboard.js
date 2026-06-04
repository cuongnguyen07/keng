/* ==========================================
   DASHBOARD PAGE
   ========================================== */

function renderDashboardPage() {
  const notes      = Storage.getNotes();
  const flashcards = Storage.getFlashcards();
  const totalMinutes = notes.reduce((acc, n) => {
    const [m, s] = (n.duration || '0:0').split(':').map(Number);
    return acc + m + (s / 60);
  }, 0);

  document.getElementById('dashboard-content').innerHTML = `
    <div class="dashboard-page">

      <!-- HEADER -->
      <div class="page-header" style="padding-bottom:20px;">
        <div>
          <h1 class="page-title">Dashboard <span class="gradient-text">Học tập</span></h1>
          <p class="page-subtitle">${getGreeting()} — Hôm nay là ${new Date().toLocaleDateString('vi-VN', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</p>
        </div>
        <button class="btn btn-primary" onclick="showPage('record')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
          Ghi âm mới
        </button>
      </div>

      <div class="dashboard-body">

        <!-- STATS ROW -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div>
              <div class="stat-value">${notes.length}</div>
              <div class="stat-label">Bản ghi</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon cyan">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div class="stat-value">${Math.round(totalMinutes)}</div>
              <div class="stat-label">Phút ghi âm</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
            </div>
            <div>
              <div class="stat-value">${flashcards.length}</div>
              <div class="stat-label">Flashcards</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon amber">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <div class="stat-value">${countTodayNotes(notes)}</div>
              <div class="stat-label">Hôm nay</div>
            </div>
          </div>
        </div>

        <!-- MAIN GRID: Calendar + Recent Notes -->
        <div class="dashboard-grid">

          <!-- Calendar -->
          <div class="calendar-col">
            ${renderCalendar(notes)}
          </div>

          <!-- Recent Notes - list style -->
          <div class="recent-notes-col">
            <div class="section-title">🎙️ Bản ghi gần đây</div>
            ${notes.length === 0 ? `
              <div class="empty-state">
                <div class="empty-icon">🎤</div>
                <div class="empty-title">Chưa có bản ghi</div>
                <div class="empty-desc">Bắt đầu ghi âm cuộc hội thoại đầu tiên!</div>
                <button class="btn btn-primary" onclick="showPage('record')">Bắt đầu ngay</button>
              </div>
            ` : `
              <div class="dash-notes-list">
                ${notes.slice(0, 6).map(note => renderDashboardNoteRow(note)).join('')}
              </div>
              ${notes.length > 6 ? `<button class="btn btn-ghost w-full" style="margin-top:10px;" onclick="showPage('notes')">Xem tất cả ${notes.length} bản ghi →</button>` : ''}
            `}
          </div>

        </div>

      </div>
    </div>
  `;

  injectDashboardStyles();
}

function countTodayNotes(notes) {
  const today = new Date().toDateString();
  return notes.filter(n => new Date(n.createdAt).toDateString() === today).length;
}

function renderCalendar(notes) {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekdays    = ['CN','T2','T3','T4','T5','T6','T7'];
  const monthNames  = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

  const daysWithNotes = new Set();
  notes.forEach(n => {
    const d = new Date(n.createdAt);
    if (d.getMonth() === month && d.getFullYear() === year) {
      daysWithNotes.add(d.getDate());
    }
  });

  let cells = '';
  for (let i = 0; i < firstDay; i++) cells += `<div class="cal-day other-month"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday  = d === today;
    const hasNotes = daysWithNotes.has(d);
    cells += `<div class="cal-day ${isToday ? 'today' : ''} ${hasNotes ? 'has-notes' : ''}" title="${hasNotes ? 'Có bản ghi' : ''}">${d}</div>`;
  }

  return `
    <div class="calendar-wrap">
      <div class="calendar-header">
        <span class="calendar-title">${monthNames[month]} ${year}</span>
        <div class="flex items-center gap-1 text-xs text-muted">
          <span style="width:8px;height:8px;background:var(--accent-cyan);border-radius:50%;display:inline-block;"></span> Có ghi âm
        </div>
      </div>
      <div class="calendar-grid">
        <div class="calendar-weekdays">
          ${weekdays.map(d => `<div class="calendar-weekday">${d}</div>`).join('')}
        </div>
        <div class="calendar-days">${cells}</div>
      </div>
    </div>
  `;
}

function renderDashboardNoteRow(note) {
  const participants = note.participants || [];
  const startDate    = new Date(note.startTime || note.createdAt);
  const timeStr      = startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const durationLabel= note.duration ? `${parseInt(note.duration.split(':')[0]) || 0}m` : '0m';
  const mainPart     = participants[0] || '';
  const initials     = getInitialsD(mainPart) || 'BG';
  const avatarColors = ['#7C3AED','#06B6D4','#10B981','#F59E0B','#EF4444'];
  const avatarColor  = avatarColors[note.id?.charCodeAt(5) % avatarColors.length || 0];
  const partStr      = participants.length > 0 ? participants.slice(0,2).join(', ') + (participants.length > 2 ? '...' : '') : 'Cá nhân';

  return `
    <div class="dash-note-row" onclick="openNoteDetail('${note.id}')">
      <div class="dash-note-dur">
        <div style="font-size:0.82rem;font-weight:700;color:var(--text-primary);">${durationLabel}</div>
        <div class="text-xs text-muted">${timeStr}</div>
      </div>
      <div class="dash-note-avatar" style="background:${avatarColor};">🎙️</div>
      <div class="dash-note-info">
        <div class="dash-note-title">${escapeHtml(note.title)}</div>
      </div>
      <div class="dash-note-actions" onclick="event.stopPropagation()">
        <button class="nr-action-btn" title="Xuất" onclick="Storage.exportNote(Storage.getNoteById('${note.id}'),'md'); showToast('📥 Đã xuất .md','success')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
      </div>
    </div>`;
}

function getInitialsD(name) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return words[words.length - 2].charAt(0).toUpperCase() + words[words.length - 1].charAt(0).toUpperCase();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return '☀️ Chào buổi sáng';
  if (h < 17) return '🌤️ Chào buổi chiều';
  return '🌙 Chào buổi tối';
}

function injectDashboardStyles() {
  if (document.getElementById('dashboard-styles')) return;
  const s = document.createElement('style');
  s.id = 'dashboard-styles';
  s.textContent = `
    .dashboard-page { padding-bottom: 32px; }
    .dashboard-body { padding: 20px 32px; display: flex; flex-direction: column; gap: 24px; }
    @media (max-width:768px) { .dashboard-body { padding: 12px 16px; } }

    .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
    @media (max-width:900px) { .stats-grid { grid-template-columns: repeat(2,1fr); } }
    @media (max-width:480px) { .stats-grid { grid-template-columns: 1fr 1fr; } }

    .dashboard-grid { display: grid; grid-template-columns: 320px 1fr; gap: 20px; }
    @media (max-width:960px) { .dashboard-grid { grid-template-columns: 1fr; } }

    .recent-notes-col { display: flex; flex-direction: column; gap: 6px; }
    .dash-notes-list  { display: flex; flex-direction: column; }

    /* Dashboard Note Row */
    .dash-note-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background var(--duration-fast);
      border-bottom: 1px solid var(--border-subtle);
    }
    .dash-note-row:hover { background: var(--bg-card); }
    .dash-note-row:hover .dash-note-actions { opacity: 1; }

    .dash-note-dur {
      flex-shrink: 0; width: 44px; text-align: center;
    }
    .dash-note-avatar {
      flex-shrink: 0;
      width: 34px; height: 34px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.68rem; font-weight: 700; color: white;
    }
    .dash-note-info { flex: 1; min-width: 0; }
    .dash-note-title {
      font-size: 0.85rem; font-weight: 600; color: var(--text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .dash-note-actions { opacity: 0; transition: opacity var(--duration-fast); }
  `;
  document.head.appendChild(s);
}

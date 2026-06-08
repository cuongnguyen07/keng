/* ==========================================
   FLASHCARDS PAGE – Grouped by Recording
   ========================================== */

let currentFlashcardIdx = 0;
let studyMode = false;
let studyCards = [];

function renderFlashcardsPage() {
  const cards = Storage.getFlashcards();
  const noteTitles = [...new Set(cards.map(c => c.noteTitle).filter(Boolean))];

  // Group flashcards by noteId (or noteTitle as fallback key)
  const groups = {};
  cards.forEach(card => {
    const key = card.noteId || card.noteTitle || '__ungrouped__';
    if (!groups[key]) {
      groups[key] = {
        noteId: card.noteId || '',
        noteTitle: card.noteTitle || 'Không có tiêu đề',
        cards: []
      };
    }
    groups[key].cards.push(card);
  });
  const groupList = Object.values(groups);

  document.getElementById('flashcards-content').innerHTML = `
    <div class="flashcards-page">
      <div class="page-header" style="padding-bottom:0;">
        <div>
          <h1 class="page-title">🃏 <span class="gradient-text">Flashcards</span></h1>
          <p class="page-subtitle">${cards.length} thẻ ôn tập từ ${noteTitles.length} bản ghi</p>
        </div>
        ${cards.length > 0 ? `
          <button class="btn btn-primary" onclick="startStudyMode()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Học ngay
          </button>` : ''}
      </div>

      <div class="fc-page-body">
        ${cards.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🃏</div>
            <div class="empty-title">Chưa có Flashcard</div>
            <div class="empty-desc">Ghi âm bài giảng và để AI tự động tạo flashcard ôn tập cho bạn!</div>
            <button class="btn btn-primary" onclick="showPage('record')">Ghi âm ngay</button>
          </div>
        ` : `
          <!-- STUDY MODE PANEL (initially hidden) -->
          <div id="study-panel" style="display:none;">
            <div class="study-panel card-glass">
              <div class="study-header">
                <button class="btn btn-ghost btn-sm" onclick="exitStudyMode()">← Thoát</button>
                <div class="study-progress-wrap">
                  <div class="study-progress-text" id="study-progress-text">1 / ${cards.length}</div>
                  <div class="progress-bar" style="width:200px;">
                    <div class="progress-fill" id="study-progress-fill" style="width:${(1/cards.length*100).toFixed(1)}%"></div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <span class="badge badge-green" id="study-correct">✓ 0</span>
                  <span class="badge badge-red" id="study-wrong">✗ 0</span>
                </div>
              </div>
              <div class="study-card-area">
                <div class="flashcard-scene" style="max-width:480px;margin:0 auto;" onclick="flipStudyCard()">
                  <div class="flashcard-card" id="study-flashcard" style="height:220px;">
                    <div class="flashcard-face flashcard-front">
                      <div>
                        <div style="font-size:0.65rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px;">Câu hỏi</div>
                        <div class="flashcard-question" id="study-question"></div>
                      </div>
                      <div class="flashcard-hint">👆 Click để xem đáp án</div>
                    </div>
                    <div class="flashcard-face flashcard-back">
                      <div>
                        <div style="font-size:0.65rem;font-weight:700;color:var(--accent-violet);text-transform:uppercase;margin-bottom:10px;">Đáp án</div>
                        <div class="flashcard-answer" id="study-answer"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="study-actions" id="study-actions" style="display:none;">
                  <button class="btn btn-danger" onclick="markStudyCard(false)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Chưa nhớ
                  </button>
                  <button class="btn" style="background:rgba(16,185,129,0.2);color:var(--accent-green);border:1px solid rgba(16,185,129,0.3);" onclick="markStudyCard(true)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Đã nhớ
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- RECORDING GROUPS LIST -->
          <div id="fc-grid-view">
            <div class="fc-groups-list">
              ${groupList.map((group, gi) => `
                <div class="fc-group" data-noteid="${escapeHtml(group.noteId)}">
                  <div class="fc-group-header" onclick="toggleFCGroup(this)">
                    <div class="fc-group-header-left">
                      <div class="fc-group-icon">📝</div>
                      <div class="fc-group-info">
                        <div class="fc-group-title">${escapeHtml(group.noteTitle)}</div>
                        <div class="fc-group-count">${group.cards.length} thẻ ôn tập</div>
                      </div>
                    </div>
                    <div class="fc-group-chevron">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>
                  <div class="fc-group-body" style="display:none;">
                    <div class="fc-masonry">
                      ${group.cards.map(card => `
                        <div class="fc-card-wrap" data-noteid="${escapeHtml(card.noteId||'')}">
                          <div class="flashcard-scene" onclick="this.querySelector('.flashcard-card').classList.toggle('flipped')">
                            <div class="flashcard-card" style="height:150px;">
                              <div class="flashcard-face flashcard-front">
                                <div>
                                  <div class="flashcard-question">${escapeHtml(card.question)}</div>
                                </div>
                                <div class="flashcard-hint">👆 Click để lật</div>
                              </div>
                              <div class="flashcard-face flashcard-back">
                                <div>
                                  <div class="flashcard-answer">${escapeHtml(card.answer)}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>`).join('')}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `}
      </div>
    </div>
  `;

  injectFCStyles();
}

/* ---- Toggle expand/collapse a recording group ---- */
function toggleFCGroup(headerEl) {
  const group = headerEl.closest('.fc-group');
  if (!group) return;
  const body = group.querySelector('.fc-group-body');
  const chevron = group.querySelector('.fc-group-chevron');
  if (!body) return;

  const isOpen = body.style.display !== 'none';
  if (isOpen) {
    body.style.display = 'none';
    group.classList.remove('fc-group--open');
  } else {
    body.style.display = 'block';
    group.classList.add('fc-group--open');
  }
}

/* ---- Study mode ---- */
function startStudyMode() {
  studyCards = [...Storage.getFlashcards()].sort(() => Math.random() - 0.5);
  currentFlashcardIdx = 0;
  window._studyCorrect = 0;
  window._studyWrong = 0;

  const panel = document.getElementById('study-panel');
  const grid = document.getElementById('fc-grid-view');
  if (panel) { panel.style.display = 'block'; panel.style.animation = 'scaleIn 0.3s ease forwards'; }
  if (grid) grid.style.display = 'none';

  loadStudyCard(0);
  studyMode = true;
}

function exitStudyMode() {
  studyMode = false;
  const panel = document.getElementById('study-panel');
  const grid = document.getElementById('fc-grid-view');
  if (panel) panel.style.display = 'none';
  if (grid) grid.style.display = 'block';
}

function loadStudyCard(idx) {
  if (idx >= studyCards.length) {
    const correct = window._studyCorrect || 0;
    const total = studyCards.length;
    showToast(`🎉 Hoàn thành! ${correct}/${total} câu đúng (${Math.round(correct/total*100)}%)`, 'success');
    exitStudyMode();
    return;
  }
  const card = studyCards[idx];
  const qEl = document.getElementById('study-question');
  const aEl = document.getElementById('study-answer');
  const fc = document.getElementById('study-flashcard');
  const actions = document.getElementById('study-actions');
  const progress = document.getElementById('study-progress-text');
  const fill = document.getElementById('study-progress-fill');

  if (qEl) qEl.textContent = card.question;
  if (aEl) aEl.textContent = card.answer;
  if (fc) fc.classList.remove('flipped');
  if (actions) actions.style.display = 'none';
  if (progress) progress.textContent = `${idx+1} / ${studyCards.length}`;
  if (fill) fill.style.width = `${((idx+1)/studyCards.length*100).toFixed(1)}%`;
}

function flipStudyCard() {
  const fc = document.getElementById('study-flashcard');
  const actions = document.getElementById('study-actions');
  if (fc) {
    fc.classList.toggle('flipped');
    if (fc.classList.contains('flipped') && actions) {
      actions.style.display = 'flex';
    }
  }
}

function markStudyCard(correct) {
  if (correct) window._studyCorrect = (window._studyCorrect || 0) + 1;
  else window._studyWrong = (window._studyWrong || 0) + 1;

  document.getElementById('study-correct').textContent = `✓ ${window._studyCorrect||0}`;
  document.getElementById('study-wrong').textContent = `✗ ${window._studyWrong||0}`;

  currentFlashcardIdx++;
  loadStudyCard(currentFlashcardIdx);
}

function filterFC(subject, btn) {
  document.querySelectorAll('.fc-filter-bar .tag').forEach(b => b.classList.remove('active'));
  btn?.classList.add('active');
  document.querySelectorAll('.fc-card-wrap').forEach(card => {
    card.style.display = (subject === 'all' || card.dataset.subject === subject) ? '' : 'none';
  });
}

/* ---- Styles ---- */
function injectFCStyles() {
  if (document.getElementById('fc-styles')) return;
  const s = document.createElement('style');
  s.id = 'fc-styles';
  s.textContent = `
    .flashcards-page { padding-bottom: 40px; }
    .fc-page-body { padding: 20px 32px; }
    @media (max-width:768px) { .fc-page-body { padding: 12px 16px; } }
    .fc-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
    .fc-masonry { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; }
    @media (max-width:640px) { .fc-masonry { grid-template-columns: 1fr 1fr; } }
    @media (max-width:420px) { .fc-masonry { grid-template-columns: 1fr; } }
    .study-panel { padding: 20px; border-radius: var(--radius-xl); max-width: 640px; margin: 0 auto; }
    .study-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .study-progress-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .study-progress-text { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
    .study-card-area { display: flex; flex-direction: column; gap: 20px; }
    .study-actions { display: flex; justify-content: center; gap: 16px; }

    /* ---- Recording groups ---- */
    .fc-groups-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .fc-group {
      border-radius: var(--radius-lg, 12px);
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      overflow: hidden;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .fc-group:hover {
      border-color: rgba(255,255,255,0.14);
    }
    .fc-group--open {
      border-color: rgba(139,92,246,0.3);
      box-shadow: 0 0 0 1px rgba(139,92,246,0.1);
    }

    .fc-group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      cursor: pointer;
      user-select: none;
      transition: background 0.15s ease;
    }
    .fc-group-header:hover {
      background: rgba(255,255,255,0.03);
    }
    .fc-group-header-left {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }
    .fc-group-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: rgba(139,92,246,0.12);
    }
    .fc-group-info {
      min-width: 0;
    }
    .fc-group-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary, #f1f1f1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px;
    }
    .fc-group-count {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted, #888);
      margin-top: 2px;
    }
    .fc-group-chevron {
      flex-shrink: 0;
      color: var(--text-muted, #888);
      transition: transform 0.25s ease;
      display: flex;
      align-items: center;
    }
    .fc-group--open .fc-group-chevron {
      transform: rotate(180deg);
    }

    .fc-group-body {
      padding: 4px 20px 20px 20px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
  `;
  document.head.appendChild(s);
}

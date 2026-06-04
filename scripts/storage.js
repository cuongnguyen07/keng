/* ==========================================
   Storage Module — LocalStorage
   ========================================== */
const Storage = (() => {
  const NOTES_KEY      = 'vh_notes';
  const SETTINGS_KEY   = 'vh_settings';
  const FLASHCARDS_KEY = 'vh_flashcards';
  const COUNTER_KEY    = 'vh_note_counter';

  // ---- NOTE COUNTER ----
  function getNextNoteNumber() {
    const n = parseInt(localStorage.getItem(COUNTER_KEY) || '0') + 1;
    localStorage.setItem(COUNTER_KEY, String(n));
    return n;
  }

  // ---- NOTES ----
  function getNotes() {
    try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'); }
    catch { return []; }
  }

  function saveNote(note) {
    const notes = getNotes();
    const idx   = notes.findIndex(n => n.id === note.id);
    if (idx >= 0) {
      notes[idx] = { ...notes[idx], ...note, updatedAt: new Date().toISOString() };
    } else {
      notes.unshift({ ...note, createdAt: note.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    return note;
  }

  function deleteNote(id) {
    const notes = getNotes().filter(n => n.id !== id);
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }

  function getNoteById(id) {
    return getNotes().find(n => n.id === id) || null;
  }

  function getNotesByFilter(filter) {
    const notes = getNotes();
    const now   = new Date();
    if (filter === 'today') {
      return notes.filter(n => {
        const d = new Date(n.createdAt);
        return d.toDateString() === now.toDateString();
      });
    }
    if (filter === 'week') {
      const weekAgo = new Date(now - 7 * 24 * 3600000);
      return notes.filter(n => new Date(n.createdAt) >= weekAgo);
    }
    if (filter === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      return notes.filter(n => new Date(n.createdAt) >= monthAgo);
    }
    return notes; // 'all'
  }

  // ---- FLASHCARDS ----
  function getFlashcards() {
    try { return JSON.parse(localStorage.getItem(FLASHCARDS_KEY) || '[]'); }
    catch { return []; }
  }

  function saveFlashcard(card) {
    const cards = getFlashcards();
    const idx   = cards.findIndex(c => c.id === card.id);
    if (idx >= 0) { cards[idx] = card; }
    else { cards.unshift({ ...card, createdAt: new Date().toISOString() }); }
    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
  }

  function deleteFlashcard(id) {
    const cards = getFlashcards().filter(c => c.id !== id);
    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
  }

  // ---- SETTINGS ----
  function getSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); }
    catch { return {}; }
  }

  function saveSetting(key, value) {
    const s = getSettings(); s[key] = value;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }

  function getSetting(key, defaultValue = null) {
    return getSettings()[key] ?? defaultValue;
  }

  // ---- EXPORT ----
  function exportNote(note, format = 'md') {
    if (!note) return;
    let content = '';
    const date = new Date(note.createdAt).toLocaleDateString('vi-VN');
    if (format === 'md') {
      content  = `# ${note.title}\n\n`;
      content += `**Ngày:** ${date}  \n`;
      content += `**Thời lượng:** ${note.duration || '00:00'}  \n`;
      if (note.participants?.length) content += `**Người tham gia:** ${note.participants.join(', ')}  \n`;
      content += `\n---\n\n`;
      content += `## 📝 Nội dung ghi âm\n\n${note.transcript || ''}\n\n`;
      if (note.summary)  content += `## 📋 Tóm tắt\n\n${note.summary}\n\n`;
      if (note.keyPoints?.length) {
        content += `## 💡 Key Points\n\n`;
        note.keyPoints.forEach((p, i) => { content += `${i+1}. ${p}\n`; });
        content += '\n';
      }
      if (note.flashcards?.length) {
        content += `## 🃏 Flashcards\n\n`;
        note.flashcards.forEach((f, i) => { content += `**Q${i+1}:** ${f.question}\n**A:** ${f.answer}\n\n`; });
      }
    } else {
      content  = `${note.title}\n`;
      content += `Ngày: ${date} | Thời lượng: ${note.duration || '00:00'}\n`;
      content += `${'─'.repeat(50)}\n\n`;
      content += `NỘI DUNG:\n${note.transcript || ''}\n\n`;
      if (note.summary)  content += `TÓM TẮT:\n${note.summary}\n\n`;
      if (note.keyPoints?.length) {
        content += `KEY POINTS:\n`;
        note.keyPoints.forEach((p, i) => { content += `${i+1}. ${p}\n`; });
      }
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${note.title.replace(/[^a-z0-9\u00C0-\u024F\s]/gi, '_')}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---- GROUP NOTES BY DATE ----
  function groupNotesByDate(notes) {
    const groups = {};
    const now    = new Date();
    const today  = now.toDateString();
    const yesterday = new Date(now - 86400000).toDateString();

    notes.forEach(note => {
      const d    = new Date(note.createdAt);
      const dStr = d.toDateString();
      let label;
      if (dStr === today) {
        label = 'Hôm nay';
      } else if (dStr === yesterday) {
        label = 'Hôm qua';
      } else {
        // Check same week
        const diffDays = Math.floor((now - d) / 86400000);
        if (diffDays < 7) {
          label = d.toLocaleDateString('vi-VN', { weekday: 'long', month: 'long', day: 'numeric' });
          // Capitalize
          label = label.charAt(0).toUpperCase() + label.slice(1);
        } else {
          // Older: show week range or just date
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
          if (sameMonth) {
            label = `Tháng ${d.getMonth()+1} ${weekStart.getDate()} – ${weekEnd.getDate()}, ${d.getFullYear()}`;
          } else {
            label = d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
          }
        }
      }
      if (!groups[label]) groups[label] = [];
      groups[label].push(note);
    });

    return groups;
  }

  // ---- SEED DEMO DATA ----
  function seedDemoData() {
    if (localStorage.getItem('vh_data_seeded')) return;
    if (getNotes().length > 0) return;

    const demos = [
      {
        id: 'demo-1',
        title: 'Bản ghi mới 16',
        participants: ['thịnh', 'trung'],
        duration: '15:00',
        transcript: 'Hôm nay chúng ta sẽ học về đạo hàm và các ứng dụng của nó trong thực tế. Đạo hàm là một khái niệm cơ bản trong giải tích, cho phép chúng ta tính tốc độ thay đổi của một hàm số tại một điểm. Nếu hàm f(x) = x², thì đạo hàm f\'(x) = 2x.\n\nQuy tắc dây chuyền: Nếu y = f(g(x)), thì dy/dx = f\'(g(x)) × g\'(x).\n\nỨng dụng: Trong vật lý, vận tốc là đạo hàm của vị trí theo thời gian.',
        summary: 'Bài giảng giới thiệu khái niệm đạo hàm, các quy tắc tính đạo hàm cơ bản và ứng dụng trong vật lý.',
        keyPoints: [
          'Đạo hàm đo tốc độ thay đổi tức thời của hàm số',
          'Quy tắc dây chuyền: d/dx[f(g(x))] = f\'(g(x)) × g\'(x)',
          'Vận tốc là đạo hàm bậc nhất của vị trí',
        ],
        flashcards: [
          { id: 'fc-1', question: 'Đạo hàm của f(x) = x³ là gì?', answer: 'f\'(x) = 3x²' },
          { id: 'fc-2', question: 'Quy tắc dây chuyền phát biểu như thế nào?', answer: 'Nếu y = f(g(x)), thì dy/dx = f\'(g(x)) × g\'(x)' },
        ],
        bookmarks: [{ time: '12:34', text: 'Quy tắc dây chuyền' }],
        tags: ['đạo hàm', 'giải tích'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startTime: (() => { const d = new Date(); d.setHours(20, 53, 0); return d.toISOString(); })(),
      },
      {
        id: 'demo-2',
        title: 'Chi tiết về cuộc họp',
        participants: ['Ly Huynh Phan', 'you'],
        duration: '14:00',
        transcript: 'Cuộc họp thảo luận về tiến độ dự án và các vấn đề cần giải quyết trong tuần tới. Các bên đã thống nhất về lịch trình và phân công nhiệm vụ.',
        summary: 'Cuộc họp thảo luận tiến độ dự án và phân công nhiệm vụ.',
        keyPoints: ['Thống nhất lịch trình tuần tới', 'Phân công nhiệm vụ rõ ràng'],
        flashcards: [],
        bookmarks: [],
        tags: [],
        createdAt: new Date(Date.now() - 7 * 24 * 3600000 + 6 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
        startTime: (() => { const d = new Date(Date.now() - 7 * 24 * 3600000); d.setHours(15, 9, 0); return d.toISOString(); })(),
      },
      {
        id: 'demo-3',
        title: 'Chi tiết về cuộc họp',
        participants: ['Duy Thịnh Phạm', 'Huy Trung Nguyễn', 'Nguyễn Thọ Việt Dũng'],
        duration: '20:00',
        transcript: 'Cuộc họp nhóm thảo luận về kế hoạch học tập và chuẩn bị cho kỳ thi sắp tới. Mọi người chia sẻ tài liệu và kinh nghiệm học tập.',
        summary: 'Cuộc họp nhóm chuẩn bị cho kỳ thi, chia sẻ tài liệu và kinh nghiệm.',
        keyPoints: ['Lập kế hoạch ôn tập chi tiết', 'Chia sẻ tài liệu học tập', 'Phân chia chủ đề cần ôn'],
        flashcards: [
          { id: 'fc-3', question: 'Khi nào kỳ thi diễn ra?', answer: 'Theo lịch đã thống nhất trong cuộc họp' },
        ],
        bookmarks: [],
        tags: [],
        createdAt: new Date(Date.now() - 8 * 24 * 3600000 + 5 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 24 * 3600000).toISOString(),
        startTime: (() => { const d = new Date(Date.now() - 8 * 24 * 3600000); d.setHours(17, 30, 0); return d.toISOString(); })(),
      },
      {
        id: 'demo-4',
        title: 'Chi tiết về cuộc họp',
        participants: ['Duy Thịnh Phạm', 'Huy Trung Nguyễn', 'Nguyễn Thọ Việt Dũng', 'Tiến'],
        duration: '37:00',
        transcript: 'Today we will discuss academic writing skills. A well-structured essay consists of three main parts: introduction, body, and conclusion. The introduction should have a hook, background information, and a clear thesis statement.\n\nThe body paragraphs should each focus on one main idea, supported by evidence and analysis.',
        summary: 'Discussion on academic essay writing covering structure, thesis statements, paragraph organization.',
        keyPoints: [
          'Essay structure: Introduction → Body → Conclusion',
          'Thesis statement: specific, arguable, one sentence',
          'Each body paragraph: Topic sentence → Evidence → Analysis',
        ],
        flashcards: [
          { id: 'fc-4', question: 'What are the three parts of an academic essay?', answer: 'Introduction, Body paragraphs, and Conclusion' },
        ],
        bookmarks: [],
        tags: [],
        createdAt: new Date(Date.now() - 20 * 24 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 20 * 24 * 3600000).toISOString(),
        startTime: (() => { const d = new Date(Date.now() - 20 * 24 * 3600000); d.setHours(16, 5, 0); return d.toISOString(); })(),
      },
    ];
    localStorage.setItem(NOTES_KEY, JSON.stringify(demos));
    // Set counter past demo count
    localStorage.setItem(COUNTER_KEY, '16');

    // Seed flashcards
    const allFc = [];
    demos.forEach(d => {
      if (d.flashcards) allFc.push(...d.flashcards.map(f => ({ ...f, noteId: d.id, noteTitle: d.title, createdAt: d.createdAt })));
    });
    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(allFc));
    localStorage.setItem('vh_data_seeded', 'true');
  }

  return {
    getNotes, saveNote, deleteNote, getNoteById, getNotesByFilter,
    getFlashcards, saveFlashcard, deleteFlashcard,
    getSettings, getSetting, saveSetting,
    exportNote, groupNotesByDate, getNextNoteNumber, seedDemoData
  };
})();

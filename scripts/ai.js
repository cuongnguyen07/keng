/* ==========================================
   AI Processing Module
   Hỗ trợ: Mock mode + OpenAI API (optional)
   ========================================== */
const AIEngine = (() => {
  let apiKey = null;
  let useOpenAI = false;
  let geminiKey = null;
  let useGemini = false;
  let useProxy = false;

  function configure(key) {
    apiKey = key;
    useOpenAI = !!key;
    Storage.saveSetting('openai_key', key);
  }

  const DEFAULT_GEMINI_KEY = 'AQ.Ab8RN6L1s_3LMExd-E_tAFT2HSaUyXNhaUa3KjK1kdpjLEvOTw';

  function configureGemini(key) {
    geminiKey = key || DEFAULT_GEMINI_KEY;
    useGemini = !!geminiKey;
    Storage.saveSetting('gemini_key', key);
    useProxy = !geminiKey && window.location.protocol !== 'file:';
  }

  function loadConfig() {
    apiKey = Storage.getSetting('openai_key');
    useOpenAI = !!apiKey;
    geminiKey = Storage.getSetting('gemini_key') || DEFAULT_GEMINI_KEY;
    useGemini = !!geminiKey;
    useProxy = !geminiKey && window.location.protocol !== 'file:';
  }

  // ---- SUMMARIZE ----
  async function summarize(transcript, language = 'vi') {
    if (useGemini || useProxy) {
      const langStr = language === 'vi' ? 'Tiếng Việt' : 'English';
      const systemInstruction = `Bạn là trợ lý học tập thông minh. Hãy tóm tắt nội dung bài giảng một cách súc tích, dễ hiểu bằng ${langStr}. Giữ nguyên thuật ngữ chuyên môn. Tóm tắt tối đa 150 từ.`;
      const userMessage = `Tóm tắt nội dung sau:\n\n${transcript}`;
      try {
        return await callGemini(systemInstruction, userMessage);
      } catch(e) {
        console.error('Gemini summarize error, falling back to mock:', e);
      }
    }
    if (useOpenAI && apiKey) {
      return await callOpenAI(buildSummarizePrompt(transcript, language));
    }
    return mockSummarize(transcript, language);
  }

  function buildSummarizePrompt(text, lang) {
    const langStr = lang === 'vi' ? 'Tiếng Việt' : 'English';
    return [
      { role: 'system', content: `Bạn là trợ lý học tập thông minh. Hãy tóm tắt nội dung bài giảng một cách súc tích, dễ hiểu bằng ${langStr}. Giữ nguyên thuật ngữ chuyên môn. Tóm tắt tối đa 150 từ.` },
      { role: 'user', content: `Tóm tắt nội dung sau:\n\n${text}` }
    ];
  }

  function mockSummarize(transcript) {
    const sentences = transcript.split(/[.!?]/).filter(s => s.trim().length > 20);
    const picked = sentences.slice(0, 3).join('. ').trim();
    return Promise.resolve(picked ? picked + '.' : 'Bài giảng này đề cập đến nhiều khái niệm quan trọng. Nội dung cần được xem lại để tóm tắt chính xác hơn.');
  }

  // ---- KEY POINTS ----
  async function extractKeyPoints(transcript, language = 'vi') {
    if (useGemini || useProxy) {
      const langStr = language === 'vi' ? 'Tiếng Việt' : 'English';
      const systemInstruction = `Bạn là chuyên gia phân tích nội dung học thuật. Hãy trích xuất 3-5 ý chính quan trọng nhất từ bài giảng bằng ${langStr}. Trả về theo định dạng:\n1. [Ý chính 1]\n2. [Ý chính 2]\n...`;
      try {
        const raw = await callGemini(systemInstruction, transcript);
        return parseKeyPoints(raw);
      } catch(e) {
        console.error('Gemini extractKeyPoints error, falling back to mock:', e);
      }
    }
    if (useOpenAI && apiKey) {
      const raw = await callOpenAI(buildKeyPointsPrompt(transcript, language));
      return parseKeyPoints(raw);
    }
    return mockKeyPoints(transcript);
  }

  function buildKeyPointsPrompt(text, lang) {
    const langStr = lang === 'vi' ? 'Tiếng Việt' : 'English';
    return [
      { role: 'system', content: `Bạn là chuyên gia phân tích nội dung học thuật. Hãy trích xuất 3-5 ý chính quan trọng nhất từ bài giảng bằng ${langStr}. Trả về theo định dạng:\n1. [Ý chính 1]\n2. [Ý chính 2]\n...` },
      { role: 'user', content: text }
    ];
  }

  function parseKeyPoints(raw) {
    return raw.split('\n')
      .map(l => l.replace(/^\d+\.\s*/, '').trim())
      .filter(l => l.length > 5)
      .slice(0, 5);
  }

  function mockKeyPoints(transcript) {
    const sents = transcript.split(/[.!?]/).filter(s => s.trim().length > 30);
    const points = sents.slice(0, 4).map(s => s.trim().replace(/^\s*[-•]\s*/, ''));
    if (points.length < 2) points.push('Xem lại toàn bộ nội dung để nắm các ý chính.');
    return Promise.resolve(points);
  }

  // ---- FLASHCARDS ----
  async function generateFlashcards(transcript, language = 'vi', count = 5) {
    if (useGemini || useProxy) {
      const langStr = language === 'vi' ? 'Tiếng Việt' : 'English';
      const systemInstruction = `Bạn tạo flashcard ôn tập từ nội dung bài giảng bằng ${langStr}. Tạo ${count} cặp Q&A. Định dạng:\nQ: [Câu hỏi]\nA: [Trả lời ngắn gọn]\n---`;
      try {
        const raw = await callGemini(systemInstruction, transcript);
        return parseFlashcards(raw);
      } catch(e) {
        console.error('Gemini generateFlashcards error, falling back to mock:', e);
      }
    }
    if (useOpenAI && apiKey) {
      const raw = await callOpenAI(buildFlashcardPrompt(transcript, language, count));
      return parseFlashcards(raw);
    }
    return mockFlashcards(transcript, count);
  }

  function buildFlashcardPrompt(text, lang, count) {
    const langStr = lang === 'vi' ? 'Tiếng Việt' : 'English';
    return [
      { role: 'system', content: `Bạn tạo flashcard ôn tập từ nội dung bài giảng bằng ${langStr}. Tạo ${count} cặp Q&A. Định dạng:\nQ: [Câu hỏi]\nA: [Trả lời ngắn gọn]\n---` },
      { role: 'user', content: text }
    ];
  }

  function parseFlashcards(raw) {
    const cards = [];
    const blocks = raw.split('---').map(b => b.trim()).filter(Boolean);
    blocks.forEach((block, i) => {
      const qMatch = block.match(/Q:\s*(.+)/);
      const aMatch = block.match(/A:\s*(.+)/);
      if (qMatch && aMatch) {
        cards.push({ id: `fc-new-${i}-${Date.now()}`, question: qMatch[1].trim(), answer: aMatch[1].trim() });
      }
    });
    return cards;
  }

  function mockFlashcards(transcript, count) {
    const sents = transcript.split(/[.!?]/).filter(s => s.trim().length > 25);
    const cards = [];
    for (let i = 0; i < Math.min(count, sents.length); i++) {
      const sent = sents[i].trim();
      const words = sent.split(' ');
      if (words.length < 4) continue;
      const halfIdx = Math.floor(words.length / 2);
      const question = words.slice(0, halfIdx).join(' ') + '... là gì?';
      const answer = sent;
      cards.push({ id: `fc-mock-${i}-${Date.now()}`, question, answer });
    }
    if (cards.length === 0) {
      cards.push({ id: `fc-mock-default-${Date.now()}`, question: 'Nội dung chính của bài giảng này là gì?', answer: 'Hãy xem lại transcript để ôn tập.' });
    }
    return Promise.resolve(cards);
  }

  // ---- CHATBOT ----
  async function chat(userMessage, transcript, history = [], language = 'vi') {
    if (useGemini || useProxy) {
      try {
        return await callGeminiChat(userMessage, transcript, history, language);
      } catch(e) {
        console.error('Gemini chat error, falling back to mock:', e);
      }
    }
    if (useOpenAI && apiKey) {
      return await callOpenAIChatStream(userMessage, transcript, history, language);
    }
    return mockChat(userMessage, transcript, language);
  }

  async function callOpenAIChatStream(message, transcript, history, lang) {
    const langStr = lang === 'vi' ? 'Tiếng Việt' : 'English';
    const messages = [
      { role: 'system', content: `Bạn là trợ lý học tập thông minh. Trả lời câu hỏi của học sinh DỰA TRÊN nội dung bài giảng sau bằng ${langStr}. Nếu câu hỏi không liên quan đến bài giảng, hãy trả lời dựa trên kiến thức chung nhưng ưu tiên nội dung bài giảng.\n\nBÀI GIẢNG:\n${transcript.substring(0, 3000)}` },
      ...history.slice(-6),
      { role: 'user', content: message }
    ];
    return callOpenAI(messages);
  }

  function mockChat(message, transcript, lang) {
    const responses_vi = [
      'Dựa trên nội dung bài giảng, tôi hiểu rằng đây là một khái niệm quan trọng. Hãy xem lại phần transcript để nắm rõ hơn.',
      'Câu hỏi hay! Theo bài giảng, nội dung này liên quan đến các khái niệm đã được đề cập. Bạn có thể xem lại phần đánh dấu ★ để tìm thêm thông tin.',
      'Tôi đã phân tích bài giảng. Đây là một điểm cần chú ý trong quá trình học. Hãy đặt câu hỏi cụ thể hơn để tôi hỗ trợ tốt hơn.',
      'Rất tốt khi bạn đặt câu hỏi này! Nội dung liên quan có trong transcript. Để có câu trả lời chính xác hơn, hãy cấu hình OpenAI API key trong phần Cài đặt.',
    ];
    const responses_en = [
      'Based on the lecture content, this is an important concept. Please review the transcript for more details.',
      'Great question! According to the lecture, this topic relates to concepts already discussed. Check the bookmarked ★ sections.',
      'I\'ve analyzed the lecture. This is a key learning point. Configure your OpenAI API key in Settings for more precise answers.',
    ];
    const arr = lang === 'vi' ? responses_vi : responses_en;
    const r = arr[Math.floor(Math.random() * arr.length)];
    return Promise.resolve(r);
  }

  // ---- WHISPER TRANSCRIPTION ----
  async function transcribeAudio(audioBlob) {
    if (!useOpenAI || !apiKey) {
      return 'Cấu hình OpenAI API key để sử dụng tính năng transcription chính xác cao qua Whisper API.';
    }
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', Storage.getSetting('language', 'vi'));

      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Whisper API error: ${res.status}`);
      const data = await res.json();
      return data.text || '';
    } catch(e) {
      console.error('Whisper error:', e);
      return null;
    }
  }

  // ---- GEMINI API CALLS ----
  async function callGemini(systemInstruction, userMessage) {
    if (useProxy) {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstruction, userMessage })
      });
      if (!res.ok) throw new Error(`Proxy Gemini error: ${res.status}`);
      const data = await res.json();
      return data.text;
    } else {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
      const body = {
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }]
          }
        ]
      };
      if (systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    }
  }

  async function callGeminiChat(userMessage, transcript, history, lang) {
    const langStr = lang === 'vi' ? 'Tiếng Việt' : 'English';
    const systemInstruction = `Bạn là trợ lý học tập thông minh. Trả lời câu hỏi của học sinh DỰA TRÊN nội dung bài giảng sau bằng ${langStr}. Nếu câu hỏi không liên quan đến bài giảng, hãy trả lời dựa trên kiến thức chung nhưng ưu tiên nội dung bài giảng.\n\nBÀI GIẢNG:\n${transcript.substring(0, 3000)}`;
    
    const contents = [];
    history.slice(-6).forEach(h => {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      });
    });
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    if (useProxy) {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstruction, contents })
      });
      if (!res.ok) throw new Error(`Proxy Gemini Chat error: ${res.status}`);
      const data = await res.json();
      return data.text;
    } else {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          }
        })
      });
      if (!res.ok) throw new Error(`Gemini Chat error: ${res.status}`);
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    }
  }

  // ---- OPENAI API CALL ----
  async function callOpenAI(messages) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }

  // ---- PROCESS ALL (after recording stops) ----
  async function processTranscript(transcript, language = 'vi', onProgress) {
    const results = { summary: '', keyPoints: [], flashcards: [] };

    onProgress && onProgress('summary', 'loading');
    try { results.summary = await summarize(transcript, language); }
    catch(e) { results.summary = '⚠️ Không thể tạo tóm tắt.'; }
    onProgress && onProgress('summary', 'done');

    onProgress && onProgress('keyPoints', 'loading');
    try { results.keyPoints = await extractKeyPoints(transcript, language); }
    catch(e) { results.keyPoints = ['⚠️ Không thể trích xuất key points.']; }
    onProgress && onProgress('keyPoints', 'done');

    onProgress && onProgress('flashcards', 'loading');
    try { results.flashcards = await generateFlashcards(transcript, language, 5); }
    catch(e) { results.flashcards = []; }
    onProgress && onProgress('flashcards', 'done');

    return results;
  }

  loadConfig();
  return { 
    configure, 
    configureGemini,
    summarize, 
    extractKeyPoints, 
    generateFlashcards, 
    chat, 
    transcribeAudio, 
    processTranscript, 
    isUsingOpenAI: () => useOpenAI,
    isUsingGemini: () => (useGemini || useProxy)
  };
})();

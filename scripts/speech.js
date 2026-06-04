/* ==========================================
   Speech Recognition Module
   Sử dụng Web Speech API (Chrome native)
   ========================================== */
const SpeechEngine = (() => {
  let recognition = null;
  let mediaRecorder = null;
  let audioChunks = [];
  let isRecording = false;
  let isPaused = false;
  let listeners = {};
  let currentLanguage = 'vi-VN';
  let meetingMode = false;
  let currentSpeaker = 1;
  let speakerChangeTimer = null;
  let startTime = null;
  let timerInterval = null;
  let silenceTimer = null;
  let stream = null;

  const SUPPORTED = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function on(event, fn) {
    listeners[event] = fn;
  }

  function emit(event, data) {
    if (listeners[event]) listeners[event](data);
  }

  function setupRecognition() {
    if (!SUPPORTED) return null;
    const r = new SpeechRecognition();
    r.continuous = true;
    r.interimResults = true;
    r.lang = currentLanguage;
    r.maxAlternatives = 1;

    r.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += t + ' ';
          resetSilenceTimer();
        } else {
          interim += t;
        }
      }
      emit('result', { interim, final: final.trim(), speaker: currentSpeaker });
    };

    r.onerror = (e) => {
      if (e.error === 'no-speech') { /* ok */ return; }
      if (e.error === 'aborted') return;
      emit('error', e.error);
    };

    r.onend = () => {
      if (isRecording && !isPaused) {
        // Auto-restart for continuous recording
        try { r.start(); } catch(ex) { /* already started */ }
      }
    };

    return r;
  }

  function resetSilenceTimer() {
    if (!meetingMode) return;
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      // Switch speaker after 3s silence
      currentSpeaker = currentSpeaker === 1 ? 2 : 1;
      emit('speakerChange', currentSpeaker);
    }, 3000);
  }

  async function startRecording(lang, meeting) {
    if (isRecording) return;
    currentLanguage = lang || 'vi-VN';
    meetingMode = meeting || false;
    currentSpeaker = 1;
    audioChunks = [];
    isRecording = true;
    isPaused = false;

    // Request microphone
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (e) {
      emit('error', 'Không thể truy cập microphone: ' + e.message);
      isRecording = false;
      return;
    }

    // Setup media recorder for audio capture
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };
      mediaRecorder.start(1000);
    } catch(e) {
      console.warn('MediaRecorder not supported, audio export will not work');
    }

    // Start speech recognition
    if (SUPPORTED) {
      recognition = setupRecognition();
      try { recognition.start(); } catch(ex) {}
    } else {
      emit('error', 'Trình duyệt không hỗ trợ nhận diện giọng nói. Vui lòng sử dụng Chrome.');
    }

    // Start timer
    startTime = Date.now();
    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      emit('timer', elapsed);
    }, 1000);

    // Start audio level monitoring
    monitorAudioLevel(stream);

    emit('started', { language: currentLanguage, meetingMode });
  }

  function monitorAudioLevel(stream) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);
      analyser.fftSize = 256;
      const data = new Uint8Array(analyser.frequencyBinCount);

      function tick() {
        if (!isRecording || isPaused) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a,b) => a+b, 0) / data.length;
        emit('audioLevel', Math.min(avg / 50, 1));
        requestAnimationFrame(tick);
      }
      tick();
    } catch(e) { /* AudioContext not available */ }
  }

  function pauseRecording() {
    if (!isRecording || isPaused) return;
    isPaused = true;
    if (recognition) { try { recognition.stop(); } catch(ex) {} }
    if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.pause();
    clearInterval(timerInterval);
    emit('paused');
  }

  function resumeRecording() {
    if (!isRecording || !isPaused) return;
    isPaused = false;
    if (recognition) {
      recognition = setupRecognition();
      try { recognition.start(); } catch(ex) {}
    }
    if (mediaRecorder && mediaRecorder.state === 'paused') mediaRecorder.resume();
    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      emit('timer', elapsed);
    }, 1000);
    emit('resumed');
  }

  function stopRecording() {
    if (!isRecording) return;
    isRecording = false;
    isPaused = false;
    clearInterval(timerInterval);
    clearTimeout(silenceTimer);

    if (recognition) { try { recognition.stop(); } catch(ex) {} recognition = null; }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }

    const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    emit('stopped', { duration: `${mm}:${ss}`, audioChunks });
  }

  function setLanguage(lang) {
    currentLanguage = lang;
    if (recognition) recognition.lang = lang;
  }

  function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function isSupported() { return SUPPORTED; }
  function getStatus() { return { isRecording, isPaused, currentSpeaker, currentLanguage, meetingMode }; }

  return { on, startRecording, pauseRecording, resumeRecording, stopRecording, setLanguage, isSupported, getStatus, formatTime };
})();

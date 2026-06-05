// api/transcribe.js — Vercel Edge Function
// Nhận file audio/video từ client, gọi OpenAI Whisper hoặc Google Gemini để nhận diện giọng nói
// API key được bảo mật hoàn toàn phía server, không lộ ra client

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!openaiKey && !geminiKey) {
    return new Response(
      JSON.stringify({
        error: 'Chưa cấu hình API key trên Vercel. Vui lòng vào Vercel Dashboard → Settings → Environment Variables và thêm GEMINI_API_KEY hoặc OPENAI_API_KEY.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const language = formData.get('language') || 'vi';

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy file trong request' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- CASE 1: Sử dụng OpenAI Whisper nếu có OPENAI_API_KEY (độ chính xác cao cho audio) ---
    if (openaiKey) {
      const apiForm = new FormData();
      apiForm.append('file', file);
      apiForm.append('model', 'whisper-1');
      apiForm.append('language', language);

      const apiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: apiForm,
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        console.error('OpenAI API Error:', errText);
        let errorMessage = errText;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error && errJson.error.message) {
            errorMessage = errJson.error.message;
          }
        } catch (e) {}
        return new Response(
          JSON.stringify({ error: `Whisper API error: ${errorMessage}` }),
          { status: apiRes.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const data = await apiRes.json();
      return new Response(
        JSON.stringify({ text: data.text || '', engine: 'whisper' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- CASE 2: Sử dụng Gemini Multimodal API nếu chỉ có GEMINI_API_KEY ---
    if (geminiKey) {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      
      // Chuẩn hóa MimeType cho Gemini API
      let mimeType = file.type || 'audio/mp3';
      if (mimeType === 'audio/x-m4a' || mimeType === 'audio/m4a') {
        mimeType = 'audio/mp4'; // Gemini hỗ trợ audio/mp4 tốt hơn
      }

      const model = 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

      const promptText = language === 'en'
        ? "Transcribe the audio/video file exactly as spoken. Output ONLY the transcript text, without any introduction, headers, comments, or markdown formatting."
        : "Hãy chuyển đổi chính xác lời nói trong file âm thanh/video này thành văn bản tiếng Việt. CHỈ trả về đoạn văn bản hội thoại được dịch ra, không thêm lời chào, không thêm nhận xét, giải thích hay bất kỳ định dạng markdown nào.";

      const payload = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              },
              {
                text: promptText
              }
            ]
          }
        ]
      };

      const apiRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        console.error('Gemini Transcription Error:', errText);
        let errorMessage = errText;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error && errJson.error.message) {
            errorMessage = errJson.error.message;
          }
        } catch (e) {}
        return new Response(
          JSON.stringify({ error: `Gemini Transcribe API error: ${errorMessage}` }),
          { status: apiRes.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const data = await apiRes.json();
      const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return new Response(
        JSON.stringify({ text: transcript.trim(), engine: 'gemini' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (err) {
    console.error('Transcribe runtime error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

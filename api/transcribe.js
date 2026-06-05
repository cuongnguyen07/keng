// api/transcribe.js — Vercel Edge Function
// Nhận file audio từ client, gọi OpenAI Whisper để nhận diện giọng nói
// Dùng Edge Runtime để tăng giới hạn timeout lên 30 giây (Serverless Hobby chỉ có 10 giây)
// và tận dụng bộ lọc FormData tự động của Web Standard API.

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
  if (!openaiKey) {
    return new Response(
      JSON.stringify({
        error: 'Chưa cấu hình OPENAI_API_KEY trên Vercel. Vui lòng vào Vercel Dashboard → Settings → Environment Variables và thêm OPENAI_API_KEY.'
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

    // Gửi request đến OpenAI Whisper API sử dụng FormData chuẩn của Edge Runtime
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
      
      // Thử parse lỗi JSON từ OpenAI để trả về chi tiết hơn
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

  } catch (err) {
    console.error('Transcribe runtime error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

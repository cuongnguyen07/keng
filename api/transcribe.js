// api/transcribe.js — Vercel Serverless Function
// Nhận file audio từ client, gọi OpenAI Whisper hoặc Gemini để nhận diện giọng nói
// API key được bảo mật hoàn toàn phía server, không lộ ra client

export const config = {
  api: {
    bodyParser: false, // Dùng raw FormData
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!openaiKey && !geminiKey) {
    return res.status(500).json({
      error: 'Chưa cấu hình API key trên Vercel. Vào Vercel Dashboard → Settings → Environment Variables và thêm OPENAI_API_KEY hoặc GEMINI_API_KEY.'
    });
  }

  try {
    // Parse FormData from request
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);

    // Extract boundary from Content-Type header
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (!boundaryMatch) {
      return res.status(400).json({ error: 'Invalid multipart/form-data request' });
    }
    const boundary = '--' + boundaryMatch[1];

    // Parse file and language from multipart body
    const { fileBuffer, mimeType, fileName, language } = parseMultipart(rawBody, boundary);

    if (!fileBuffer) {
      return res.status(400).json({ error: 'Không tìm thấy file trong request' });
    }

    // Prefer OpenAI Whisper if available (highest accuracy)
    if (openaiKey) {
      const text = await transcribeWithWhisper(openaiKey, fileBuffer, mimeType, fileName, language);
      return res.status(200).json({ text, engine: 'whisper' });
    }

    // Fallback: try to return a message since Gemini doesn't support audio transcription the same way
    return res.status(200).json({
      text: '(Cần cấu hình OPENAI_API_KEY để nhận diện file âm thanh bằng Whisper)',
      engine: 'none'
    });

  } catch (err) {
    console.error('Transcribe error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function transcribeWithWhisper(apiKey, fileBuffer, mimeType, fileName, language) {
  // Build multipart form manually since we can't use FormData in Node.js easily
  const boundary = '----WhisperFormBoundary' + Date.now();
  const parts = [];

  // File part
  parts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`
  );

  // Model part
  const modelPart =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="model"\r\n\r\n` +
    `whisper-1\r\n`;

  // Language part
  const langPart =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="language"\r\n\r\n` +
    `${language || 'vi'}\r\n`;

  const endPart = `--${boundary}--\r\n`;

  const headerBuffer = Buffer.from(parts[0], 'utf-8');
  const crlf = Buffer.from('\r\n', 'utf-8');
  const body = Buffer.concat([
    headerBuffer,
    fileBuffer,
    crlf,
    Buffer.from(modelPart, 'utf-8'),
    Buffer.from(langPart, 'utf-8'),
    Buffer.from(endPart, 'utf-8'),
  ]);

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Whisper API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.text || '';
}

function parseMultipart(rawBody, boundary) {
  const boundaryBuffer = Buffer.from(boundary);
  let fileBuffer = null;
  let mimeType = 'audio/webm';
  let fileName = 'audio.webm';
  let language = 'vi';

  // Split by boundary
  const parts = splitBuffer(rawBody, boundaryBuffer);

  for (const part of parts) {
    if (part.length === 0) continue;

    // Find header/body separator (\r\n\r\n)
    const separator = Buffer.from('\r\n\r\n');
    const sepIdx = indexOf(part, separator);
    if (sepIdx === -1) continue;

    const headerSection = part.slice(0, sepIdx).toString('utf-8');
    const bodySection = part.slice(sepIdx + 4);

    // Remove trailing \r\n
    const body = bodySection.slice(-2).toString() === '\r\n'
      ? bodySection.slice(0, -2)
      : bodySection;

    const dispositionMatch = headerSection.match(/Content-Disposition:[^\r\n]*name="([^"]+)"/i);
    if (!dispositionMatch) continue;
    const fieldName = dispositionMatch[1];

    if (fieldName === 'file') {
      const filenameMatch = headerSection.match(/filename="([^"]+)"/i);
      if (filenameMatch) fileName = filenameMatch[1];
      const ctMatch = headerSection.match(/Content-Type:\s*([^\r\n]+)/i);
      if (ctMatch) mimeType = ctMatch[1].trim();
      fileBuffer = body;
    } else if (fieldName === 'language') {
      language = body.toString('utf-8').trim();
    }
  }

  return { fileBuffer, mimeType, fileName, language };
}

function splitBuffer(buf, delimiter) {
  const results = [];
  let start = 0;
  let idx = indexOf(buf, delimiter, start);
  while (idx !== -1) {
    results.push(buf.slice(start, idx));
    start = idx + delimiter.length;
    // Skip \r\n after boundary
    if (buf[start] === 13 && buf[start + 1] === 10) start += 2;
    idx = indexOf(buf, delimiter, start);
  }
  if (start < buf.length) results.push(buf.slice(start));
  return results;
}

function indexOf(buf, search, offset = 0) {
  for (let i = offset; i <= buf.length - search.length; i++) {
    let found = true;
    for (let j = 0; j < search.length; j++) {
      if (buf[i + j] !== search[j]) { found = false; break; }
    }
    if (found) return i;
  }
  return -1;
}

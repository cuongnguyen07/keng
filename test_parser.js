const fs = require('fs');

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

function parseMultipart(rawBody, boundary) {
  const boundaryBuffer = Buffer.from(boundary);
  let fileBuffer = null;
  let mimeType = 'audio/webm';
  let fileName = 'audio.webm';
  let language = 'vi';

  const parts = splitBuffer(rawBody, boundaryBuffer);
  console.log('Total parts split:', parts.length);
  for (let i = 0; i < parts.length; i++) {
    console.log(`Part ${i} size:`, parts[i].length);
    console.log(`Part ${i} text preview:`, parts[i].slice(0, 100).toString('utf-8'));
  }

  for (const part of parts) {
    if (part.length === 0) continue;

    const separator = Buffer.from('\r\n\r\n');
    const sepIdx = indexOf(part, separator);
    if (sepIdx === -1) continue;

    const headerSection = part.slice(0, sepIdx).toString('utf-8');
    const bodySection = part.slice(sepIdx + 4);

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

// Create a mock multipart body
const boundary = '----WebKitFormBoundaryT9L4y3f1sB2j4N8G';
const mockBody = Buffer.concat([
  Buffer.from(`--${boundary}\r\n`, 'utf-8'),
  Buffer.from('Content-Disposition: form-data; name="file"; filename="test.txt"\r\n', 'utf-8'),
  Buffer.from('Content-Type: text/plain\r\n\r\n', 'utf-8'),
  Buffer.from('Hello, this is file content!\nLine 2.\nLine 3.', 'utf-8'),
  Buffer.from(`\r\n--${boundary}\r\n`, 'utf-8'),
  Buffer.from('Content-Disposition: form-data; name="language"\r\n\r\n', 'utf-8'),
  Buffer.from('en', 'utf-8'),
  Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8')
]);

console.log('Mock body total size:', mockBody.length);
const result = parseMultipart(mockBody, '--' + boundary);
console.log('Result:', {
  fileContent: result.fileBuffer ? result.fileBuffer.toString('utf-8') : null,
  fileName: result.fileName,
  mimeType: result.mimeType,
  language: result.language
});

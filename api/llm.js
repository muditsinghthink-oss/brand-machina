import https from 'https';

function proxyRequest(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname, port: 443,
      path: parsed.pathname + parsed.search, method, headers,
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  }

  try {
    const incoming = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const systemPrompt = incoming.system || '';
    const messages = incoming.messages || [];
    const geminiContents = [];

    if (systemPrompt) {
      geminiContents.push({
        role: 'user',
        parts: [{ text: 'SYSTEM INSTRUCTIONS (follow these exactly):\n\n' + systemPrompt + '\n\nCRITICAL: Respond with ONLY valid JSON. No markdown. No backticks. No text before or after the JSON.' }]
      });
      geminiContents.push({
        role: 'model',
        parts: [{ text: '{"message":"Understood.","ui":null,"state":{"flow":null,"phase":"init","resolved":{}}}' }]
      });
    }

    for (const msg of messages) {
      geminiContents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    const geminiBody = JSON.stringify({
      contents: geminiContents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048, responseMimeType: 'application/json' }
    });

    const result = await proxyRequest(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + geminiKey,
      'POST', { 'Content-Type': 'application/json' }, geminiBody
    );

    const geminiData = JSON.parse(result.body);
    if (geminiData.error) {
      return res.status(400).json({ error: 'Gemini: ' + (geminiData.error.message || JSON.stringify(geminiData.error)) });
    }

    const geminiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    return res.status(200).json({
      content: [{ type: 'text', text: geminiText }],
      model: 'gemini-2.0-flash',
      role: 'assistant',
    });

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}

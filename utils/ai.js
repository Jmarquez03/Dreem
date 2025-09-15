import { getApiKey } from './storage';

export async function getAiInterpretation(text, date, moonPhase) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('Please set your OpenAI API key in Settings.');

  const system = 'You are a thoughtful dream interpreter. Offer gentle, non-judgmental insights, patterns, and questions. Avoid medical or legal advice.';
  const prompt = `Dream date: ${date.toDateString()}\nMoon phase: ${moonPhase}\n\nDream:\n${text}\n\nProvide a concise interpretation (150-250 words), noting themes, emotions, symbols, and possible real-life connections.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 400,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
    }
    throw new Error(`API error: ${res.status} ${err}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Empty response from AI');
  return content;
}

export async function verifyApiKey() {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key saved. Add it in Settings.');

  const res = await fetch('https://api.openai.com/v1/models', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Validation failed: ${res.status} ${err}`);
  }
  return true;
}




const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY ?? '';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-1.5-pro';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function generateText(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) return '(Gemini API 키가 설정되지 않았습니다)';
  const res = await fetch(`${BASE}/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function chat(messages: GeminiMessage[], systemPrompt?: string): Promise<string> {
  if (!GEMINI_API_KEY) return '(Gemini API 키가 설정되지 않았습니다)';
  const body: any = { contents: messages };
  if (systemPrompt) body.system_instruction = { parts: [{ text: systemPrompt }] };
  const res = await fetch(`${BASE}/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

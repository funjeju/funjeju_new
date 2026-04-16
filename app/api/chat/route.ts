import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { chat, GeminiMessage } from '@/lib/gemini/client';

const SYSTEM_PROMPT = `당신은 제주도 전문 AI 여행 가이드입니다.
- 제주 관광지, 맛집, 숙소, 오름, CCTV 날씨 정보를 안내합니다
- 할루시네이션 없이 제공된 DB 데이터 기반으로만 답변합니다
- 친근하고 현지인처럼 제주 감성으로 답변합니다
- 모르는 것은 솔직하게 모른다고 합니다
- 답변은 간결하게 3~5문장으로 합니다`;

export async function POST(req: NextRequest) {
  const { messages, userLat, userLng } = await req.json() as {
    messages: GeminiMessage[];
    userLat?: number;
    userLng?: number;
  };

  const lastMsg = messages[messages.length - 1]?.parts[0]?.text ?? '';

  // GPS 기반 주변 POI 검색
  let contextDocs = '';
  if (userLat && userLng) {
    try {
      const snap = await getDocs(query(collection(db, 'pois'), limit(20)));
      const pois = snap.docs.map(d => d.data());
      const nearby = pois
        .filter(p => {
          const dist = Math.hypot(p.lat - userLat, p.lng - userLng);
          return dist < 0.05; // 약 5km
        })
        .slice(0, 5)
        .map(p => `${p.name}(${p.type}, ${p.address})`);
      if (nearby.length) contextDocs = `\n[주변 장소(5km): ${nearby.join(', ')}]`;
    } catch { /* 무시 */ }
  }

  // 키워드 기반 POI 검색
  if (!contextDocs && lastMsg.length > 2) {
    try {
      const snap = await getDocs(query(collection(db, 'pois'), limit(100)));
      const pois = snap.docs.map(d => d.data());
      const keywords = lastMsg.split(/\s+/).filter(w => w.length > 1);
      const matched = pois
        .filter(p => keywords.some(k => p.name?.includes(k) || p.tags?.some((t: string) => t.includes(k)) || p.region?.includes(k)))
        .slice(0, 5)
        .map(p => `${p.name}(${p.address || p.region}): ${p.description?.slice(0, 60) ?? ''}`);
      if (matched.length) contextDocs = `\n[관련 장소 DB: ${matched.join(' / ')}]`;
    } catch { /* 무시 */ }
  }

  const augmentedMessages: GeminiMessage[] = [
    ...messages.slice(0, -1),
    {
      role: 'user',
      parts: [{ text: lastMsg + contextDocs }],
    },
  ];

  const reply = await chat(augmentedMessages, SYSTEM_PROMPT);

  return NextResponse.json({ reply });
}

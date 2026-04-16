import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { generateText } from '@/lib/gemini/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cctvId = searchParams.get('cctvId') ?? 'jejusi-tapdonggwangjang';

  // 캐시 확인 (10분)
  const cacheRef = doc(db, 'weather_cache', cctvId);
  const cached = await getDoc(cacheRef);
  if (cached.exists()) {
    const d = cached.data();
    const age = (Date.now() - d.updatedAt.toMillis()) / 1000;
    if (age < 600) return NextResponse.json(d);
  }

  // 기상청 단기예보 (제주 격자: nx=53, ny=38)
  let kmaData = { temp: 18, humidity: 65, windSpeed: 3, windDir: '북', rainProb: 10 };
  const kmaKey = process.env.KMA_API_KEY;
  if (kmaKey) {
    try {
      const now = new Date();
      const yyyyMMdd = now.toISOString().slice(0, 10).replace(/-/g, '');
      const hour = now.getHours();
      const baseTime = hour < 2 ? '2300' : hour < 5 ? '0200' : hour < 8 ? '0500' : hour < 11 ? '0800' : hour < 14 ? '1100' : hour < 17 ? '1400' : hour < 20 ? '1700' : '2000';
      const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${kmaKey}&numOfRows=100&pageNo=1&dataType=JSON&base_date=${yyyyMMdd}&base_time=${baseTime}&nx=53&ny=38`;
      const r = await fetch(url);
      const kma = await r.json();
      const items = kma.response?.body?.items?.item ?? [];
      const get = (cat: string) => items.find((i: any) => i.category === cat)?.fcstValue ?? null;
      kmaData = {
        temp: parseFloat(get('TMP') ?? '18'),
        humidity: parseFloat(get('REH') ?? '65'),
        windSpeed: parseFloat(get('WSD') ?? '3'),
        windDir: ['북', '북동', '동', '남동', '남', '남서', '서', '북서'][Math.round((parseFloat(get('VEC') ?? '0') / 45)) % 8],
        rainProb: parseFloat(get('POP') ?? '10'),
      };
    } catch { /* 기본값 사용 */ }
  }

  // Gemini 브리핑
  const briefing = await generateText(
    `제주도 날씨 정보: 기온 ${kmaData.temp}°C, 습도 ${kmaData.humidity}%, 풍속 ${kmaData.windSpeed}m/s, 풍향 ${kmaData.windDir}, 강수확률 ${kmaData.rainProb}%. 제주 현지인처럼 친근하고 생생하게 날씨 브리핑 2-3문장으로 작성해주세요.`
  );

  const result = { cctvId, kmaData, briefing, updatedAt: Timestamp.now() };
  await setDoc(cacheRef, result);

  return NextResponse.json(result);
}

import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { generateText } from '@/lib/gemini/client';

export const runtime = 'nodejs';
export const maxDuration = 30;

const CHANNELS = [
  { id: 'UCfamilyid1', name: '펀제주' },       // 실제 채널 ID로 교체
];

const SEARCH_QUERIES = [
  '제주도 여행',
  '제주 오름',
  '제주 맛집',
  '제주 날씨 CCTV',
  '제주 축제',
];

function getCategory(title: string): string {
  if (/오름|한라산|트레킹|등산/.test(title)) return '자연';
  if (/맛집|흑돼지|해산물|카페|식당/.test(title)) return '맛집';
  if (/CCTV|날씨|실시간/.test(title)) return '여행';
  if (/축제|행사|공연|문화/.test(title)) return '문화';
  if (/서핑|스쿠버|레저|액티비티/.test(title)) return '액티비티';
  return '여행';
}

export async function POST(req: NextRequest) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'YOUTUBE_API_KEY not set' }, { status: 500 });
  }

  const results: string[] = [];

  // 검색어별 최신 영상 가져오기
  for (const q of SEARCH_QUERIES) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q + ' 제주')}&type=video&regionCode=KR&relevanceLanguage=ko&maxResults=5&order=date&key=${key}`;
      const res = await fetch(url);
      const data = await res.json();

      for (const item of data.items ?? []) {
        const videoId = item.id?.videoId;
        if (!videoId) continue;

        const snippet = item.snippet;
        const title = snippet.title;

        // Gemini 한줄 요약
        let summary = '';
        try {
          summary = await generateText(
            `다음 제주도 유튜브 영상 제목을 보고 한국어로 1문장 요약해줘 (이모지 1개 포함, 20자 이내): "${title}"`
          );
        } catch { summary = title.slice(0, 30); }

        const docData = {
          videoId,
          title,
          channelName: snippet.channelTitle,
          thumbnail: snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url ?? '',
          publishedAt: Timestamp.fromDate(new Date(snippet.publishedAt)),
          category: getCategory(title),
          summary,
          cachedAt: Timestamp.now(),
        };

        await setDoc(doc(collection(db, 'jeju_tube_cache'), videoId), docData);
        results.push(`OK ${videoId}: ${title.slice(0, 30)}`);
      }
    } catch (e) {
      results.push(`ERR ${q}: ${e}`);
    }
  }

  return NextResponse.json({ count: results.length, results });
}

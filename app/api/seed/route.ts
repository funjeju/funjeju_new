/**
 * Firestore 초기 seed 데이터 API
 * POST /api/seed          → 없는 문서만 추가
 * POST /api/seed?force=1  → 전체 덮어쓰기
 */
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ──────────────────────────────────────
// 실제 CCTV 데이터 (funjeju.com 운영 스트림)
// ──────────────────────────────────────
const CCTV_SEED = [
  // ── 제주시 ──
  { id: 'jejusi-tapdonggwangjang', name: '탑동광장', region: '제주시', lat: 33.5140, lng: 126.5213, streamUrl: 'http://59.8.86.94:8080/media/api/v1/hls/vurix/192871/100001/0/1/1.m3u8', tags: ['제주시', '도심', '해안'], ubinWrId: 61 },
  { id: 'jejusi-airport', name: '제주공항', region: '제주시', lat: 33.5113, lng: 126.4930, streamUrl: 'http://123.140.197.51/stream/33/play.m3u8', tags: ['제주시', '공항'], ubinWrId: 51 },
  { id: 'jejusi-iho', name: '이호해변', region: '제주시', lat: 33.5043, lng: 126.4522, streamUrl: 'http://211.114.96.121:1935/jejusi7/11-30T.stream/playlist.m3u8', tags: ['제주시', '해수욕장', '해안'], ubinWrId: 53 },
  { id: 'jejusi-dodu항', name: '도두항 도두봉', region: '제주시', lat: 33.5112, lng: 126.4730, streamUrl: 'http://211.114.96.121:1935/jejusi6/11-13.stream/playlist.m3u8', tags: ['제주시', '항구', '해안'], ubinWrId: 54 },
  { id: 'jejusi-samyang', name: '삼양해변', region: '제주시', lat: 33.5272, lng: 126.5780, streamUrl: 'http://211.114.96.121:1935/jejusi6/11-14.stream/playlist.m3u8', tags: ['제주시', '해수욕장', '해안'], ubinWrId: 56 },
  // ── 애월 ──
  { id: 'aewol-hagwi', name: '하귀 가문동포구', region: '애월', lat: 33.4740, lng: 126.4218, streamUrl: 'http://211.114.96.121:1935/jejusi6/11-15.stream/playlist.m3u8', tags: ['애월', '포구', '해안'], ubinWrId: 33 },
  { id: 'aewol-gwakji', name: '곽지해수욕장', region: '애월', lat: 33.4600, lng: 126.3580, streamUrl: 'http://211.114.96.121:1935/jejusi6/11-16.stream/playlist.m3u8', tags: ['애월', '해수욕장', '해안'], ubinWrId: 24 },
  // ── 한림 ──
  { id: 'hallim-hyupjae', name: '협재해수욕장', region: '한림', lat: 33.3940, lng: 126.2390, streamUrl: 'http://211.114.96.121:1935/jejusi6/11-17.stream/playlist.m3u8', tags: ['한림', '해수욕장', '해안'], ubinWrId: 19 },
  { id: 'hallim-ongpo', name: '옹포항', region: '한림', lat: 33.3993, lng: 126.2512, streamUrl: 'http://59.8.86.94:8080/media/api/v1/hls/vurix/192871/100005/0/1/1.m3u8', tags: ['한림', '항구', '해안'], ubinWrId: 25 },
  // ── 한경 ──
  { id: 'hangyeong-panpo', name: '판포해변', region: '한경', lat: 33.3740, lng: 126.1815, streamUrl: 'http://211.114.96.121:1935/jejusi6/11-18.stream/playlist.m3u8', tags: ['한경', '해수욕장', '해안'], ubinWrId: 20 },
  { id: 'hangyeong-sinchang', name: '신창포구 풍차해안', region: '한경', lat: 33.3294, lng: 126.1440, streamUrl: 'http://59.8.86.94:8080/media/api/v1/hls/vurix/192871/100004/0/1/1.m3u8', tags: ['한경', '포구', '해안', '드라이브', '풍차'], ubinWrId: 26 },
  // ── 조천·구좌 ──
  { id: 'jocheon-hamduk', name: '함덕해수욕장', region: '조천', lat: 33.5430, lng: 126.6698, streamUrl: 'http://211.114.96.121:1935/jejusi6/11-19.stream/playlist.m3u8', tags: ['조천', '해수욕장', '해안'], ubinWrId: 52 },
  { id: 'gujwa-gimnyeong', name: '김녕해수욕장', region: '구좌', lat: 33.5568, lng: 126.7540, streamUrl: 'http://211.114.96.121:1935/jejusi6/11-20.stream/playlist.m3u8', tags: ['구좌', '해수욕장', '해안'] },
  { id: 'gujwa-woljung', name: '월정해수욕장', region: '구좌', lat: 33.5590, lng: 126.7952, streamUrl: 'http://211.114.96.121:1935/jejusi7/11-21.stream/playlist.m3u8', tags: ['구좌', '해수욕장', '해안', '카페거리'] },
  { id: 'gujwa-pyeongdae', name: '평대해수욕장', region: '구좌', lat: 33.5540, lng: 126.8210, streamUrl: 'http://211.114.96.121:1935/jejusi7/11-22.stream/playlist.m3u8', tags: ['구좌', '해수욕장', '해안'], ubinWrId: 3 },
  // ── 우도 ──
  { id: 'udo-cheonjin', name: '우도 천진항', region: '우도', lat: 33.5090, lng: 126.9523, streamUrl: 'http://211.114.96.121:1935/jejusi7/11-24.stream/playlist.m3u8', tags: ['우도', '항구', '해안'] },
  { id: 'udo-hawoomok', name: '우도 하우목동항', region: '우도', lat: 33.4921, lng: 126.9532, streamUrl: 'http://211.114.96.121:1935/jejusi7/11-23.stream/playlist.m3u8', tags: ['우도', '항구', '해안'] },
  // ── 추자도 ──
  { id: 'chuja-daeseo', name: '추자 대서리', region: '추자', lat: 33.9612, lng: 126.2991, streamUrl: 'http://211.114.96.121:1935/jejusi7/11-26.stream/playlist.m3u8', tags: ['추자', '항구', '해안', '낚시'] },
  { id: 'chuja-sinyang', name: '추자 신양리', region: '추자', lat: 33.9598, lng: 126.3150, streamUrl: 'http://211.114.96.121:1935/jejusi7/11-28.stream/playlist.m3u8', tags: ['추자', '항구', '해안'] },
  { id: 'chuja-mungni', name: '추자 묵리', region: '추자', lat: 33.9512, lng: 126.3010, streamUrl: 'http://211.114.96.121:1935/jejusi7/11-27.stream/playlist.m3u8', tags: ['추자', '해안'] },
  { id: 'chuja-yecho', name: '추자 예초리', region: '추자', lat: 33.9481, lng: 126.2904, streamUrl: 'http://211.114.96.121:1935/jejusi7/11-29.stream/playlist.m3u8', tags: ['추자', '해안'] },
  // ── 성산 ──
  { id: 'seongsan-ilchulbong', name: '성산일출봉', region: '성산', lat: 33.4581, lng: 126.9425, streamUrl: 'http://123.140.197.51/stream/34/play.m3u8', tags: ['성산', '관광명소', '일출봉', '유네스코'], ubinWrId: 59 },
  { id: 'seongsan-항', name: '성산항', region: '성산', lat: 33.4740, lng: 126.9280, streamUrl: 'http://211.34.191.215:1935/live/1-140.stream/playlist.m3u8', tags: ['성산', '항구', '해안'] },
  { id: 'seongsan-suma', name: '성산 수마포구', region: '성산', lat: 33.4521, lng: 126.9198, streamUrl: 'http://211.34.191.215:1935/live/1-76.stream/playlist.m3u8', tags: ['성산', '포구', '해안'] },
  { id: 'seongsan-seopji', name: '섭지코지', region: '성산', lat: 33.4281, lng: 126.9310, streamUrl: 'http://211.34.191.215:1935/live/1-116.stream/playlist.m3u8', tags: ['성산', '해안', '드라이브', '관광명소'] },
  { id: 'seongsan-sinsan', name: '신산포구', region: '성산', lat: 33.4180, lng: 126.8910, streamUrl: 'http://211.34.191.215:1935/live/1-143.stream/playlist.m3u8', tags: ['성산', '포구', '해안'] },
  // ── 표선 ──
  { id: 'pyoseon-dangke', name: '표선 당케포구', region: '표선', lat: 33.3715, lng: 126.8421, streamUrl: 'http://211.34.191.215:1935/live/1-77.stream/playlist.m3u8', tags: ['표선', '포구', '해안'], ubinWrId: 60 },
  // ── 남원 ──
  { id: 'namwon-taeheung', name: '남원 태흥포구', region: '남원', lat: 33.2982, lng: 126.7412, streamUrl: 'http://211.34.191.215:1935/live/1-146.stream/playlist.m3u8', tags: ['남원', '포구', '해안'], ubinWrId: 45 },
  { id: 'namwon-deokdol', name: '남원 덕돌', region: '남원', lat: 33.2701, lng: 126.7380, streamUrl: 'http://59.8.86.94:8080/media/api/v1/hls/vurix/192871/100006/0/1/1.m3u8', tags: ['남원', '해안'] },
  // ── 서귀포 ──
  { id: 'seogwipo-항', name: '서귀포항', region: '서귀포', lat: 33.2490, lng: 126.5610, streamUrl: 'http://59.8.86.94:8080/media/api/v1/hls/vurix/192871/100009/0/1/1.m3u8', tags: ['서귀포', '항구', '해안'], ubinWrId: 44 },
  { id: 'seogwipo-항2', name: '서귀항', region: '서귀포', lat: 33.2468, lng: 126.5580, streamUrl: 'http://211.34.191.215:1935/live/1-34.stream/playlist.m3u8', tags: ['서귀포', '항구', '해안'] },
  { id: 'seogwipo-saeyeon', name: '새연교', region: '서귀포', lat: 33.2468, lng: 126.5630, streamUrl: 'http://123.140.197.51/stream/35/play.m3u8', tags: ['서귀포', '관광명소', '해안'] },
  { id: 'seogwipo-cheonjiyeon', name: '천지연폭포', region: '서귀포', lat: 33.2502, lng: 126.5560, streamUrl: 'http://211.34.191.215:1935/live/1-72.stream/playlist.m3u8', tags: ['서귀포', '폭포', '관광명소'], ubinWrId: 47 },
  { id: 'seogwipo-nongjiitmul', name: '논짓물', region: '서귀포', lat: 33.2430, lng: 126.5480, streamUrl: 'http://211.34.191.215:1935/live/1-193.stream/playlist.m3u8', tags: ['서귀포', '해안'], ubinWrId: 50 },
  { id: 'seogwipo-bomok', name: '보목포구', region: '서귀포', lat: 33.2380, lng: 126.5860, streamUrl: 'http://211.34.191.215:1935/live/1-152.stream/playlist.m3u8', tags: ['서귀포', '포구', '해안'] },
  { id: 'seogwipo-wonang', name: '돈내코 원앙폭포', region: '서귀포', lat: 33.2980, lng: 126.5940, streamUrl: 'http://211.34.191.215:1935/live/1-31.stream/playlist.m3u8', tags: ['서귀포', '폭포', '트레킹'], ubinWrId: 58 },
  // ── 중문 ──
  { id: 'jungmun-beach', name: '중문해수욕장', region: '중문', lat: 33.2430, lng: 126.4120, streamUrl: 'http://59.8.86.94:8080/media/api/v1/hls/vurix/192871/100010/0/1/1.m3u8', tags: ['중문', '해수욕장', '해안', '관광명소'], ubinWrId: 41 },
  { id: 'jungmun-daepohang', name: '대포항', region: '중문', lat: 33.2390, lng: 126.4180, streamUrl: 'http://211.34.191.215:1935/live/1-115.stream/playlist.m3u8', tags: ['중문', '항구', '해안'], ubinWrId: 48 },
  // ── 안덕 ──
  { id: 'andeok-hwasun', name: '화순해수욕장 산방산', region: '안덕', lat: 33.2381, lng: 126.3180, streamUrl: 'http://59.8.86.94:8080/media/api/v1/hls/vurix/192871/100012/0/1/1.m3u8', tags: ['안덕', '해수욕장', '산방산', '관광명소'], ubinWrId: 31 },
  { id: 'andeok-hwasunbeach', name: '화순해변', region: '안덕', lat: 33.2360, lng: 126.3140, streamUrl: 'http://211.34.191.215:1935/live/11-25.stream/playlist.m3u8', tags: ['안덕', '해수욕장', '해안'], ubinWrId: 57 },
  // ── 대정 ──
  { id: 'daejeong-sindobapo', name: '신도포구', region: '대정', lat: 33.2240, lng: 126.2190, streamUrl: 'http://211.34.191.215:1935/live/1-71.stream/playlist.m3u8', tags: ['대정', '포구', '해안'], ubinWrId: 27 },
  { id: 'daejeong-hamo', name: '하모해수욕장', region: '대정', lat: 33.2180, lng: 126.2440, streamUrl: 'http://211.34.191.215:1935/live/11-24.stream/playlist.m3u8', tags: ['대정', '해수욕장', '해안'], ubinWrId: 32 },
  { id: 'daejeong-hamo2', name: '대정 하모리', region: '대정', lat: 33.2192, lng: 126.2460, streamUrl: 'http://211.34.191.215:1935/live/1-73.stream/playlist.m3u8', tags: ['대정', '해안'], ubinWrId: 29 },
  { id: 'daejeong-mosulpo', name: '모슬포항', region: '대정', lat: 33.2150, lng: 126.2510, streamUrl: 'http://211.34.191.215:1935/live/1-155.stream/playlist.m3u8', tags: ['대정', '항구', '마라도', '해안'], ubinWrId: 30 },
];

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === '1';

  const results: string[] = [];

  // CCTV seed
  for (const cctv of CCTV_SEED) {
    const ref = doc(db, 'cctv_locations', cctv.id);
    if (!force) {
      const snap = await getDoc(ref);
      if (snap.exists()) { results.push(`SKIP cctv_locations/${cctv.id}`); continue; }
    }
    await setDoc(ref, {
      ...cctv,
      nearbyPoiIds: [],
      nearbyOreumIds: [],
      isActive: true,
      thumbnailUrl: '',
      lastThumbnailAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      ...(cctv.ubinWrId ? { ubinWrId: cctv.ubinWrId } : {}),
    });
    results.push(`OK   cctv_locations/${cctv.id}`);
  }

  // 잘못 생성된 CCTV 기반 live_feeds 문서 전부 삭제
  const { deleteDoc } = await import('firebase/firestore');
  const STALE_FEED_IDS = [
    'feed-cctv-1','feed-cctv-2','feed-cctv-3','feed-cctv-4','feed-cctv-5',
    'feed-cctv-6','feed-cctv-7','feed-cctv-8','feed-cctv-9','feed-cctv-10',
    'feed-cctv-11','feed-cctv-12',
    'jejusi-6-1','aewol-coast-1','seogwipo-1','feed-1','feed-2','feed-3',
  ];
  for (const id of STALE_FEED_IDS) {
    try { await deleteDoc(doc(db, 'live_feeds', id)); results.push(`DEL  live_feeds/${id}`); } catch { /* 없으면 무시 */ }
  }

  return NextResponse.json({ total: CCTV_SEED.length, results });
}

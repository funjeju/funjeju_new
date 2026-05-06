import { NextRequest, NextResponse } from 'next/server';
import ExifReader from 'exifreader';
import { FieldValue } from 'firebase-admin/firestore';
import { adminStorage, adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const maxDuration = 30;

// ── freshScore 계산 ──────────────────────────
function calcFreshScore(shootAt: Date): number {
  const diffHours = (Date.now() - shootAt.getTime()) / 3_600_000;
  if (diffHours < 1)  return 100;
  if (diffHours < 3)  return 80;
  if (diffHours < 6)  return 60;
  if (diffHours < 24) return 40;
  return 0;
}

function freshLabel(shootAt: Date): string {
  const diffMin = Math.floor((Date.now() - shootAt.getTime()) / 60_000);
  if (diffMin < 1)  return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}시간 전`;
}

// ── 카카오 역지오코딩 ───────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = process.env.KAKAO_REST_API_KEY ?? process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  if (!key) return latLngToArea(lat);
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
      { headers: { Authorization: `KakaoAK ${key}` } }
    );
    const data = await res.json();
    const addr = data.documents?.[0]?.address;
    if (!addr) return latLngToArea(lat);
    const r2 = addr.region_2depth_name ?? ''; // 제주시 / 서귀포시
    const r3 = addr.region_3depth_name ?? ''; // 애월읍 / 중문동 등
    if (r2 && r3) return `${r2} ${r3}`;
    if (r2) return r2;
    return latLngToArea(lat);
  } catch {
    return latLngToArea(lat);
  }
}

// 위도로 대략적인 행정구역 추정 (API 실패 시 폴백)
function latLngToArea(lat: number): string {
  return lat >= 33.45 ? '제주시' : '서귀포시';
}

// ── Gemini Vision 분석 ──────────────────────
async function analyzeWithGemini(
  photoUrl: string,
  locationName: string,
  shootAt: Date,
): Promise<string> {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return `${locationName}에서 방금 촬영된 현장 사진입니다.`;

  const prompt = `이 사진은 제주도 ${locationName}에서 방금 촬영된 사진입니다.
사진 속 풍경, 날씨, 분위기를 SNS 여행 감성 일기 스타일로 한 문장만 써줘.
조건: 반드시 30~50자 이내, 이모지 1개 포함, 홍보 문구 금지, 감성적·시적 표현 사용.
예시: "바람이 풍차를 밀어내는 오후, 제주의 파랑이 찰랑인다 🌊"`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'image/jpeg', data: await fetchImageAsBase64(photoUrl) } },
            ],
          }],
          generationConfig: { maxOutputTokens: 80, temperature: 0.85 },
        }),
        signal: AbortSignal.timeout(15_000),
      }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text
      ?? `${locationName}의 하늘 아래, 오늘도 제주는 살아 숨쉰다 🌿`;
  } catch {
    return `${locationName}의 하늘 아래, 오늘도 제주는 살아 숨쉰다 🌿`;
  }
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  const buf = await res.arrayBuffer();
  return Buffer.from(buf).toString('base64');
}

// ── 메인 핸들러 ─────────────────────────────
export async function POST(req: NextRequest) {
  try {
  const formData = await req.formData();
  const file = formData.get('photo') as File | null;
  const partnerId = formData.get('partnerId') as string ?? 'anonymous';
  const businessName = formData.get('businessName') as string ?? '제주 파트너';
  const ctaType = (formData.get('ctaType') as string) ?? 'visit';
  const ctaLabel = (formData.get('ctaLabel') as string) ?? '지금 방문하기';
  const ctaUrl = (formData.get('ctaUrl') as string) ?? null;
  const ctaPhone = (formData.get('ctaPhone') as string) ?? null;
  const manualLat = formData.get('manualLat') ? Number(formData.get('manualLat')) : null;
  const manualLng = formData.get('manualLng') ? Number(formData.get('manualLng')) : null;

  if (!file) return NextResponse.json({ error: 'NO_FILE' }, { status: 400 });

  const buffer = await file.arrayBuffer();

  // ① EXIF 추출
  let exifLat: number | null = null;
  let exifLng: number | null = null;
  let shootAt: Date = new Date();

  try {
    const tags = ExifReader.load(buffer);

    // GPS 좌표
    const latVal = tags['GPSLatitude']?.description;
    const lngVal = tags['GPSLongitude']?.description;
    const latRefVal = tags['GPSLatitudeRef']?.value;
    const lngRefVal = tags['GPSLongitudeRef']?.value;
    const latRef = (Array.isArray(latRefVal) ? latRefVal[0] : latRefVal) ?? 'N';
    const lngRef = (Array.isArray(lngRefVal) ? lngRefVal[0] : lngRefVal) ?? 'E';

    if (latVal != null && lngVal != null) {
      exifLat = latRef === 'S' ? -Number(latVal) : Number(latVal);
      exifLng = lngRef === 'W' ? -Number(lngVal) : Number(lngVal);
    }

    // 촬영 시각
    const dt = tags['DateTimeOriginal']?.description ?? tags['DateTime']?.description;
    if (dt) {
      // "2024:03:15 14:30:00" → ISO
      const iso = dt.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
      shootAt = new Date(iso);
    }
  } catch { /* EXIF 없음 */ }

  const lat = exifLat ?? manualLat;
  const lng = exifLng ?? manualLng;

  if (!lat || !lng) {
    return NextResponse.json({ error: 'NO_GPS', message: 'GPS 정보가 없는 사진입니다. 스마트폰 카메라로 직접 촬영한 사진을 올려주세요.' }, { status: 400 });
  }

  const freshScore = calcFreshScore(shootAt);
  if (freshScore === 0) {
    return NextResponse.json({ error: 'TOO_OLD', message: '24시간 이상 경과된 사진은 등록할 수 없습니다.' }, { status: 400 });
  }

  // ② Firebase Storage 업로드 (Admin SDK — Security Rules 우회)
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const storagePath = `live_feeds/${partnerId}/${Date.now()}.${ext}`;
  let photoUrl: string;
  try {
    const { randomUUID } = await import('crypto');
    const token = randomUUID();
    const bucket = adminStorage();
    const fileRef = bucket.file(storagePath);
    await fileRef.save(Buffer.from(buffer), {
      metadata: {
        contentType: file.type || 'image/jpeg',
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
    // Firebase 스타일 영구 다운로드 URL (makePublic 불필요)
    photoUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
  } catch (err) {
    console.error('[upload] Firebase Storage 오류:', err);
    return NextResponse.json({ error: 'STORAGE_ERROR', message: `이미지 저장 오류: ${String(err)}` }, { status: 500 });
  }

  // ③ 역지오코딩
  const locationName = await reverseGeocode(lat, lng);

  // ④ Gemini Vision 분석
  const aiContent = await analyzeWithGemini(photoUrl, locationName, shootAt);

  // ⑤ Firestore 저장 (Admin SDK)
  const feedDoc = {
    partnerId,
    businessName,
    photoUrl,
    caption: aiContent,
    region: locationName,
    tags: [],
    exifLat: lat,
    exifLng: lng,
    exifTakenAt: shootAt,
    freshScore,
    freshLabel: freshLabel(shootAt),
    ctaType,
    ctaLabel,
    ctaUrl: ctaUrl || null,
    ctaPhone: ctaPhone || null,
    isApproved: true,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 24 * 3_600_000),
  };

  let ref: FirebaseFirestore.DocumentReference;
  try {
    ref = await adminDb().collection('live_feeds').add(feedDoc);
  } catch (err) {
    console.error('[upload] Firestore 저장 오류:', err);
    return NextResponse.json({ error: 'DB_ERROR', message: '피드 저장 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({
    id: ref.id,
    preview: aiContent,
    locationName,
    freshScore,
    freshLabel: freshLabel(shootAt),
    photoUrl,
  });
  } catch (err) {
    console.error('[upload] 예상치 못한 오류:', err);
    return NextResponse.json({ error: 'INTERNAL', message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

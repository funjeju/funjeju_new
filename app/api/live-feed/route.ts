export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs, query, where, orderBy, limit, Timestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// GET: 승인된 라이브 피드 목록
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all') === '1'; // admin용

  const constraints: any[] = all
    ? [orderBy('createdAt', 'desc'), limit(50)]
    : [where('isApproved', '==', true), orderBy('createdAt', 'desc'), limit(20)];

  const snap = await getDocs(query(collection(db, 'live_feeds'), ...constraints));
  const feeds = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ feeds });
}

// POST: 새 라이브 피드 등록 (파트너/어드민)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    partnerId, businessName, photoUrl, caption,
    region, tags = [],
    exifLat, exifLng, exifTakenAt,
    ctaType, ctaLabel, ctaUrl, ctaPhone,
    autoApprove = false,
  } = body;

  if (!businessName || !photoUrl || !ctaType || !ctaLabel) {
    return NextResponse.json({ error: '필수 필드 누락' }, { status: 400 });
  }

  // CTA 라벨 자동생성 fallback
  const defaultLabels: Record<string, string> = {
    visit: '지금 방문하기',
    call: '전화하기',
    menu: '메뉴 보기',
    reserve: '예약하기',
  };

  const feed = {
    partnerId: partnerId ?? 'admin',
    businessName,
    photoUrl,
    caption: caption ?? '',
    region: region ?? '제주',
    tags,
    exifLat: exifLat ?? null,
    exifLng: exifLng ?? null,
    exifTakenAt: exifTakenAt ? Timestamp.fromDate(new Date(exifTakenAt)) : null,
    ctaType,
    ctaLabel: ctaLabel || defaultLabels[ctaType] || '자세히 보기',
    ctaUrl: ctaUrl ?? null,
    ctaPhone: ctaPhone ?? null,
    isApproved: autoApprove,
    createdAt: Timestamp.now(),
  };

  const ref = await addDoc(collection(db, 'live_feeds'), feed);
  return NextResponse.json({ id: ref.id, ...feed });
}

// PATCH: 승인 처리 (어드민)
export async function PATCH(req: NextRequest) {
  const { id, isApproved } = await req.json();
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });
  await updateDoc(doc(db, 'live_feeds', id), { isApproved });
  return NextResponse.json({ ok: true });
}

// DELETE: 삭제 (어드민)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });
  await deleteDoc(doc(db, 'live_feeds', id));
  return NextResponse.json({ ok: true });
}

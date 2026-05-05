import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snap = await getDoc(doc(db, 'geocaches', id));
  if (!snap.exists()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ id: snap.id, ...snap.data() });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { adminUid, ...fields } = body;

  // 관리자 확인은 클라이언트 측에서 처리 (이미 /admin 라우트 보호됨)
  const allowed = ['isPublished', 'isActive', 'isArchived', 'hintPhotos', 'title', 'description'];
  const update: Record<string, unknown> = { updatedAt: serverTimestamp() };
  for (const key of allowed) {
    if (key in fields) update[key] = fields[key];
  }

  await updateDoc(doc(db, 'geocaches', id), update);
  return NextResponse.json({ ok: true });
}

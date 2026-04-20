import { NextRequest, NextResponse } from 'next/server';
import {
  collection, addDoc, updateDoc, doc, increment, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cacheId = params.id;
  const body = await req.json() as {
    uid: string;
    userName: string;
    userPhotoUrl?: string;
    type: 'found' | 'dnf' | 'note' | 'needs_maintenance' | 'owner_maintenance';
    comment: string;
    isGiftClaimed?: boolean;
    completedWaypoints?: number[];
  };

  if (!body.uid || !body.type || !body.comment?.trim()) {
    return NextResponse.json({ error: 'uid, type, comment 필수' }, { status: 400 });
  }

  const cacheRef = doc(db, 'geocaches', cacheId);
  const cacheSnap = await getDoc(cacheRef);
  if (!cacheSnap.exists()) {
    return NextResponse.json({ error: '캐시를 찾을 수 없어요' }, { status: 404 });
  }

  const cacheData = cacheSnap.data();

  const logRef = await addDoc(collection(db, 'cache_logs'), {
    cacheId,
    cacheTitle: cacheData.title,
    uid: body.uid,
    userName: body.userName,
    userPhotoUrl: body.userPhotoUrl ?? null,
    type: body.type,
    comment: body.comment.trim(),
    photoUrl: null,
    loggedAt: serverTimestamp(),
    isGiftClaimed: body.isGiftClaimed ?? false,
    completedWaypoints: body.completedWaypoints ?? [],
  });

  // 카운터 업데이트
  if (body.type === 'found') {
    await updateDoc(cacheRef, {
      foundCount: increment(1),
      lastFoundAt: serverTimestamp(),
    });
    // 유저 통계
    await updateDoc(doc(db, 'users', body.uid), {
      'geocacheStats.cachesFound': increment(1),
    }).catch(() => {}); // 유저 문서 없으면 skip
  } else if (body.type === 'dnf') {
    await updateDoc(cacheRef, { dnfCount: increment(1) });
  }

  return NextResponse.json({ id: logRef.id });
}

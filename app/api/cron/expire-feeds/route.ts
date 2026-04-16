import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const runtime = 'nodejs';

// 12시간 초과 라이브 피드 자동 삭제
// Vercel Cron: 매 시간 실행 (Hobby 플랜 → 하루 1회로 제한)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = Timestamp.fromDate(new Date(Date.now() - 12 * 3_600_000));

  const snap = await getDocs(
    query(collection(db, 'live_feeds'), where('exifTakenAt', '<', cutoff))
  );

  let deleted = 0;
  for (const d_ of snap.docs) {
    await deleteDoc(doc(db, 'live_feeds', d_.id));
    deleted++;
  }

  return NextResponse.json({ deleted });
}

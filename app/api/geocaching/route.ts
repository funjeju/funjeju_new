export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const region = searchParams.get('region');
  const hasGift = searchParams.get('hasGift');
  const pageLimit = parseInt(searchParams.get('limit') ?? '50');

  const constraints: any[] = [
    where('isPublished', '==', true),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc'),
    limit(pageLimit),
  ];

  if (type && type !== 'all') constraints.push(where('type', '==', type));
  if (region) constraints.push(where('region', '==', region));
  if (hasGift === '1') constraints.push(where('hasGift', '==', true));

  const snap = await getDocs(query(collection(db, 'geocaches'), ...constraints));
  const caches = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  return NextResponse.json({ caches });
}

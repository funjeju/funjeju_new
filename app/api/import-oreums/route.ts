export const dynamic = 'force-dynamic';
/**
 * POST /api/import-oreums
 * k-lokal JSON 중 Oroom + Mountain 카테고리 → Firestore oreums 컬렉션
 */
import { NextRequest, NextResponse } from 'next/server';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const filePath = path.join(process.cwd(), 'k-lokal_filtered-spots_2026-04-16.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const all = JSON.parse(raw) as any[];

  const oreums = all.filter(s =>
    s.categories?.some((c: string) => c === 'Oroom' || c === 'Mountain') &&
    s.location?.latitude
  );

  const batches: ReturnType<typeof writeBatch>[] = [];
  let current = writeBatch(db);
  let count = 0;
  let batchCount = 0;

  for (const s of oreums) {
    const ref = doc(db, 'oreums', s.place_id);
    current.set(ref, {
      id: s.place_id,
      name: s.place_name,
      nameOrigin: '',
      description: s.description ?? s.expert_tip_raw ?? '',
      characteristics: '',
      lat: s.location.latitude,
      lng: s.location.longitude,
      stampLat: s.location.latitude,
      stampLng: s.location.longitude,
      altitude: 0,
      address: s.address ?? '',
      region: s.region ?? '',
      direction: 'N',
      difficulty: 2,
      bestSeasons: ['spring', 'autumn'],
      monthKeywords: [3, 4, 5, 9, 10, 11],
      tags: s.tags ?? [],
      parking: '',
      trailInfo: '',
      openTime: '일출~일몰',
      photos: { main: s.images?.map((i: any) => i.url) ?? [], summit: [], parking: [], trail: [], view: [] },
      thumbnailUrl: s.images?.[0]?.url ?? '',
      thumbnailBwUrl: '',
      nearbyPoiIds: [],
      linkedMissionIds: [],
      isPublished: false,
      stampCount: 0,
      source: 'visitjeju',
    }, { merge: true });

    count++;
    batchCount++;

    if (batchCount === 400) {
      batches.push(current);
      current = writeBatch(db);
      batchCount = 0;
    }
  }
  if (batchCount > 0) batches.push(current);

  await Promise.all(batches.map(b => b.commit()));

  return NextResponse.json({ imported: count, total: oreums.length });
}

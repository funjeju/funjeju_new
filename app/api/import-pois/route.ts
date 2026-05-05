export const dynamic = 'force-dynamic';
/**
 * POST /api/import-pois?offset=0&limit=200
 * k-lokal JSON → Firestore pois 컬렉션 배치 import
 */
import { NextRequest, NextResponse } from 'next/server';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import fs from 'fs';
import path from 'path';

const CAT_MAP: Record<string, string> = {
  Attraction: 'attraction', Accommodation: 'accommodation', Cafe: 'cafe',
  Restaurant: 'restaurant', Activity: 'attraction', Mountain: 'attraction',
  Beach: 'attraction', Culture: 'attraction', Oroom: 'attraction',
  Festival: 'attraction', Park: 'attraction', Shopping: 'attraction',
  Exhibition: 'attraction', Museum: 'attraction', Performance: 'attraction',
  Drive: 'attraction', Forest: 'attraction', PhotoSpot: 'attraction',
};

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get('offset') ?? '0');
  const limit = parseInt(searchParams.get('limit') ?? '200');

  const filePath = path.join(process.cwd(), 'k-lokal_filtered-spots_2026-04-16.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const all = JSON.parse(raw) as any[];
  const slice = all.slice(offset, offset + limit);

  const batch = writeBatch(db);
  let count = 0;

  for (const s of slice) {
    if (!s.location?.latitude || !s.location?.longitude) continue;
    const type = CAT_MAP[s.categories?.[0]] ?? 'attraction';
    const ref = doc(db, 'pois', s.place_id);
    batch.set(ref, {
      id: s.place_id,
      name: s.place_name,
      type,
      lat: s.location.latitude,
      lng: s.location.longitude,
      address: s.address ?? '',
      description: s.description ?? s.expert_tip_raw ?? '',
      phone: s.public_info?.phone_number ?? null,
      hours: s.public_info?.operating_hours ?? null,
      tags: s.tags ?? [],
      categories: s.categories ?? [],
      categories_kr: s.categories_kr ?? [],
      thumbnailUrl: s.images?.[0]?.url ?? '',
      region: s.region ?? '',
      source: 'visitjeju',
      status: s.status ?? 'draft',
    }, { merge: true });
    count++;
  }

  await batch.commit();

  return NextResponse.json({
    imported: count,
    offset,
    limit,
    total: all.length,
    next: offset + limit < all.length ? offset + limit : null,
  });
}

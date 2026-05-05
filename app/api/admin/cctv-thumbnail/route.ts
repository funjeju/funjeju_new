export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminStorage, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('photo') as File | null;
    const cctvId = formData.get('cctvId') as string | null;

    if (!file) return NextResponse.json({ error: 'NO_FILE' }, { status: 400 });
    if (!cctvId) return NextResponse.json({ error: 'NO_ID' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const storagePath = `cctv_thumbnails/${cctvId}.${ext}`;

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

    const thumbnailUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;

    await adminDb().collection('cctv_locations').doc(cctvId).update({
      thumbnailUrl,
      lastThumbnailAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ thumbnailUrl });
  } catch (err) {
    console.error('[cctv-thumbnail]', err);
    return NextResponse.json({ error: 'INTERNAL', message: String(err) }, { status: 500 });
  }
}

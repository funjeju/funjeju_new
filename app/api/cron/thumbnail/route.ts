export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Vercel Cron: runs every 10 minutes (see vercel.json)
// Captures a thumbnail frame from each CCTV HLS stream
// Stores a proxy-safe preview URL for the landing page hero

const HLS_ALLOWED_HOSTS = (process.env.HLS_ALLOWED_HOSTS ?? '').split(',').map(h => h.trim());

function isAllowedHost(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return HLS_ALLOWED_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}

async function fetchM3u8(streamUrl: string): Promise<string | null> {
  try {
    const res = await fetch(streamUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractFirstSegment(m3u8: string, baseUrl: string): string | null {
  const lines = m3u8.split('\n').map(l => l.trim());
  for (const line of lines) {
    if (line && !line.startsWith('#')) {
      if (line.startsWith('http')) return line;
      // relative path
      const base = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
      return base + line;
    }
  }
  return null;
}

interface CCTVDoc {
  id: string;
  streamUrl: string;
  isActive: boolean;
}

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const snap = await getDocs(query(collection(db, 'cctv_locations'), where('isActive', '==', true)));
  const cctvs = snap.docs.map(d => ({ id: d.id, ...d.data() } as CCTVDoc));

  const results: { id: string; status: string; segmentUrl?: string }[] = [];

  for (const cctv of cctvs.slice(0, 10)) { // process max 10 per cron run to stay within time limit
    if (!isAllowedHost(cctv.streamUrl)) {
      results.push({ id: cctv.id, status: 'skipped_host' });
      continue;
    }

    const m3u8 = await fetchM3u8(cctv.streamUrl);
    if (!m3u8) {
      results.push({ id: cctv.id, status: 'fetch_failed' });
      // Mark stream as inactive if repeatedly unreachable
      continue;
    }

    // Check if this is a master playlist (contains other m3u8 variants)
    let segmentUrl: string | null = null;
    const variantMatch = m3u8.match(/^(?!#)(.*\.m3u8.*)$/m);
    if (variantMatch) {
      const variantUrl = variantMatch[0].startsWith('http')
        ? variantMatch[0]
        : cctv.streamUrl.substring(0, cctv.streamUrl.lastIndexOf('/') + 1) + variantMatch[0];
      const variantM3u8 = await fetchM3u8(variantUrl);
      if (variantM3u8) {
        segmentUrl = extractFirstSegment(variantM3u8, variantUrl);
      }
    } else {
      segmentUrl = extractFirstSegment(m3u8, cctv.streamUrl);
    }

    if (segmentUrl) {
      // Store proxy-safe segment URL as thumbnail pointer
      const proxySegmentUrl = `/api/hls-proxy?url=${encodeURIComponent(segmentUrl)}`;
      await updateDoc(doc(db, 'cctv_locations', cctv.id), {
        lastSegmentUrl: proxySegmentUrl,
        lastCheckedAt: new Date().toISOString(),
        isActive: true,
      });
      results.push({ id: cctv.id, status: 'ok', segmentUrl: proxySegmentUrl });
    } else {
      results.push({ id: cctv.id, status: 'no_segment' });
    }
  }

  return NextResponse.json({ updated: results.filter(r => r.status === 'ok').length, results });
}

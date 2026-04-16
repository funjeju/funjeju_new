export const runtime = 'nodejs';
export const maxDuration = 30;
export const preferredRegion = 'icn1'; // 서울 리전 (Vercel Pro) or 'nrt1' 도쿄

const ALLOWED_HOSTS = (process.env.HLS_ALLOWED_HOSTS || '211.114.96.121').split(',');

function isAllowedHost(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_HOSTS.some(h => hostname === h.trim());
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const streamUrl = decodeURIComponent(searchParams.get('url') || '');

  if (!streamUrl.startsWith('http://')) {
    return new Response('Invalid URL: must start with http://', { status: 400 });
  }

  if (!isAllowedHost(streamUrl)) {
    return new Response('Forbidden: host not allowed', { status: 403 });
  }

  let response: Response;
  try {
    response = await fetch(streamUrl);
  } catch {
    return new Response('Failed to fetch stream', { status: 502 });
  }

  const contentType = response.headers.get('content-type') || '';

  // .m3u8 플레이리스트 — 세그먼트 URL을 프록시 경유로 rewrite
  if (contentType.includes('mpegurl') || streamUrl.includes('.m3u8')) {
    const content = await response.text();
    const baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1);
    const rewritten = content
      .split('\n')
      .map(line => {
        if (line.startsWith('#') || line.trim() === '') return line;
        const absoluteUrl = line.startsWith('http') ? line : baseUrl + line;
        return `/api/hls-proxy?url=${encodeURIComponent(absoluteUrl)}`;
      })
      .join('\n');

    return new Response(rewritten, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  }

  // .ts 세그먼트 — 바이너리 그대로 전달
  return new Response(response.body, {
    headers: {
      'Content-Type': contentType || 'video/MP2T',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
  });
}

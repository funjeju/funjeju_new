export function getProxyUrl(originalStreamUrl: string): string {
  if (!originalStreamUrl.startsWith('http://')) return originalStreamUrl;
  return `/api/hls-proxy?url=${encodeURIComponent(originalStreamUrl)}`;
}

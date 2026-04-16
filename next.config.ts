import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Firebase Storage
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      // 비짓제주 API 이미지
      {
        protocol: 'https',
        hostname: 'api.visitjeju.net',
      },
      // 한국관광공사 Tour API 이미지
      {
        protocol: 'http',
        hostname: 'tong.visitkorea.or.kr',
      },
      // 유튜브 썸네일
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
};

export default nextConfig;

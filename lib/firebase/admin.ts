import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

function ensureInit() {
  if (getApps().length > 0) return;

  const sa = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY 환경변수가 없습니다');

  // Admin SDK는 GCS 실제 버킷명(.appspot.com)을 써야 함
  // NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET이 .firebasestorage.app 형식이면 변환
  const clientBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '';
  const adminBucket = clientBucket.endsWith('.firebasestorage.app')
    ? clientBucket.replace('.firebasestorage.app', '.appspot.com')
    : clientBucket;

  initializeApp({
    credential: cert(JSON.parse(sa)),
    storageBucket: adminBucket,
  });
}

export function adminStorage() {
  ensureInit();
  return getStorage().bucket();
}

export function adminDb() {
  ensureInit();
  return getFirestore();
}

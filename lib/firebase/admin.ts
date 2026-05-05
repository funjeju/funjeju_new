import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

function ensureInit() {
  if (getApps().length > 0) return;

  const sa = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY 환경변수가 없습니다');

  initializeApp({
    credential: cert(JSON.parse(sa)),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
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

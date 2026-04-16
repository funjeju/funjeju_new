import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  WithFieldValue,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// 단일 문서 조회
export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

// 컬렉션 조회 (제약조건 배열)
export async function getCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
}

// 문서 생성/덮어쓰기
export async function setDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: WithFieldValue<T>
): Promise<void> {
  await setDoc(doc(db, collectionName, id), data);
}

// 문서 부분 업데이트
export async function updateDocument(
  collectionName: string,
  id: string,
  data: Partial<DocumentData>
): Promise<void> {
  await updateDoc(doc(db, collectionName, id), data);
}

// 문서 삭제
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

// 자주 쓰는 쿼리 빌더 재export
export { where, orderBy, limit, serverTimestamp };

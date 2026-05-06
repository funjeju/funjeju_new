'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';

interface UserProfile {
  displayName: string;
  photoURL: string | null;
  role: 'user' | 'store';
  businessName?: string;
  businessCategory?: string;
  businessWebsite?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 동적 임포트로 SSR 단계에서 Firebase 초기화를 피함
    let unsub: (() => void) | undefined;

    (async () => {
      try {
        const { onAuthChange } = await import('@/lib/firebase/auth');
        const { db } = await import('@/lib/firebase/config');
        const { doc, getDoc } = await import('firebase/firestore');

        unsub = onAuthChange(async (u) => {
          setUser(u);
          if (u) {
            try {
              const snap = await getDoc(doc(db, 'users', u.uid));
              const data = snap.data();
              const partner = data?.partnerProfile;
              setUserProfile({
                displayName: u.displayName || u.email || '사용자',
                photoURL: u.photoURL,
                role: partner ? 'store' : 'user',
                businessName: partner?.businessName,
                businessCategory: partner?.businessCategory,
                businessWebsite: partner?.ctaUrl,
              });
            } catch {
              setUserProfile({
                displayName: u.displayName || u.email || '사용자',
                photoURL: u.photoURL,
                role: 'user',
              });
            }
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        });
      } catch (e) {
        console.error('Firebase auth 초기화 실패:', e);
        setLoading(false);
      }
    })();

    return () => unsub?.();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

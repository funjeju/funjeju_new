'use client';

import { useEffect } from 'react';
import { onAuthChange } from '@/lib/firebase/auth';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, [setUser, setLoading]);

  return { user, loading };
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/lib/firebase/auth';

type Mode = 'login' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setLoading(true); setError('');
    try { await signInWithGoogle(); router.push('/'); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      if (mode === 'login') await signInWithEmail(email, password);
      else await signUpWithEmail(email, password, name);
      router.push('/');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F8FAFC]">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-[#1A2F4B] text-center mb-1">STAYLINK</h1>
        <p className="text-sm text-[#64748B] text-center mb-6">제주 스마트 관광 플랫폼</p>

        {/* 탭 */}
        <div className="flex rounded-lg bg-[#F8FAFC] p-1 mb-6">
          {(['login', 'signup'] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === m ? 'bg-white text-[#0EA5A0] shadow-sm' : 'text-[#64748B]'}`}>
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading}
          className="w-full flex items-center justify-center gap-2 border border-[#E2E8F0] rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors mb-4">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Google로 계속하기
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[#E2E8F0]" />
          <span className="text-xs text-[#64748B]">또는</span>
          <div className="flex-1 h-px bg-[#E2E8F0]" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmail} className="space-y-3">
          {mode === 'signup' && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="이름"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0EA5A0]" required />
          )}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일"
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0EA5A0]" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호"
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0EA5A0]" required />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#0EA5A0] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#0D7A76] transition-colors disabled:opacity-50">
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
}

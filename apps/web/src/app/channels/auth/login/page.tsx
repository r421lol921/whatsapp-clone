'use client';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ChannelLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/channels');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4" style={{ background: '#111' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: '#25d366' }}>
          P
        </div>
        <span className="text-white font-semibold text-sm tracking-widest uppercase">PeytOtoria</span>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl p-8" style={{ background: '#111', border: '1px solid #222' }}>
          <h1 className="text-white text-2xl font-bold mb-1">Sign in</h1>
          <p className="text-sm mb-8" style={{ color: '#888' }}>
            Access your PeytOtoria channels
          </p>

          {error && (
            <div className="rounded-lg px-4 py-3 mb-5 text-sm" style={{ background: '#2a1a1a', color: '#f87171', border: '1px solid #3a1a1a' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#888' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none focus:ring-2 transition-all"
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any}
                onFocus={(e) => (e.target.style.borderColor = '#25d366')}
                onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#888' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none transition-all"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                onFocus={(e) => (e.target.style.borderColor = '#25d366')}
                onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-opacity mt-2"
              style={{ background: '#25d366', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#666' }}>
            {"Don't have an account? "}
            <Link href="/channels/auth/signup" className="font-medium" style={{ color: '#25d366' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

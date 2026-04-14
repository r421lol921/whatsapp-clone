'use client';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ChannelSignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
        data: { display_name: displayName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // If email confirmation is disabled, go straight to channels
    setTimeout(() => router.push('/channels'), 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a' }}>
        <div className="flex items-center gap-3 px-6 py-4" style={{ background: '#111' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: '#25d366' }}>
            P
          </div>
          <span className="text-white font-semibold text-sm tracking-widest uppercase">PeytOtoria</span>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#25d36622', border: '2px solid #25d366' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#25d366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-bold mb-2">Account created!</h2>
            <p className="text-sm" style={{ color: '#888' }}>
              Check your email to confirm, then you can sign in.
            </p>
            <p className="text-xs mt-2" style={{ color: '#555' }}>Redirecting to channels...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a' }}>
      <div className="flex items-center gap-3 px-6 py-4" style={{ background: '#111' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: '#25d366' }}>
          P
        </div>
        <span className="text-white font-semibold text-sm tracking-widest uppercase">PeytOtoria</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl p-8" style={{ background: '#111', border: '1px solid #222' }}>
          <h1 className="text-white text-2xl font-bold mb-1">Create account</h1>
          <p className="text-sm mb-8" style={{ color: '#888' }}>
            Join PeytOtoria channels today
          </p>

          {error && (
            <div className="rounded-lg px-4 py-3 mb-5 text-sm" style={{ background: '#2a1a1a', color: '#f87171', border: '1px solid #3a1a1a' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#888' }}>
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Your name"
                className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none transition-all"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                onFocus={(e) => (e.target.style.borderColor = '#25d366')}
                onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
              />
            </div>

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
                className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none transition-all"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
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
                minLength={6}
                placeholder="Min. 6 characters"
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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#666' }}>
            Already have an account?{' '}
            <Link href="/channels/auth/login" className="font-medium" style={{ color: '#25d366' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

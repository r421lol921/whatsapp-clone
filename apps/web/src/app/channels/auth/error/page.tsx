import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="text-center px-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: '#2a1a1a', border: '1px solid #3a1a1a' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h1 className="text-white text-xl font-bold mb-2">Authentication Error</h1>
        <p className="text-sm mb-6" style={{ color: '#666' }}>
          Something went wrong during sign in. Please try again.
        </p>
        <Link
          href="/channels/auth/login"
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#25d366' }}
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

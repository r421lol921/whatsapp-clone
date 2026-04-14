'use client';
import Link from 'next/link';
import OdometerCounter from './OdometerCounter';

interface ChannelCardProps {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  member_count: number;
  isJoined: boolean;
  isOwner: boolean;
  onJoin?: (id: string) => void;
  onLeave?: (id: string) => void;
  joining?: boolean;
}

export default function ChannelCard({
  id,
  name,
  description,
  avatar_url,
  member_count,
  isJoined,
  isOwner,
  onJoin,
  onLeave,
  joining,
}: ChannelCardProps) {
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer group"
      style={{ background: '#161616', border: '1px solid #222' }}
    >
      {/* Avatar */}
      <Link href={`/channels/${id}`} className="flex-shrink-0">
        {avatar_url ? (
          <img
            src={avatar_url}
            alt={name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ background: '#25d36633', border: '1px solid #25d36655', color: '#25d366' }}
          >
            {initials}
          </div>
        )}
      </Link>

      {/* Info */}
      <Link href={`/channels/${id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm truncate">{name}</span>
          {isOwner && (
            <span
              className="text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0"
              style={{ background: '#25d36622', color: '#25d366' }}
            >
              Owner
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs truncate mt-0.5" style={{ color: '#666' }}>
            {description}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#555" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <OdometerCounter value={member_count} className="text-xs" style={{ color: '#666' } as React.CSSProperties} />
          <span className="text-xs" style={{ color: '#555' }}>/ 10M</span>
        </div>
      </Link>

      {/* Join/Leave button */}
      {!isOwner && (
        <button
          onClick={(e) => {
            e.preventDefault();
            if (isJoined) onLeave?.(id);
            else onJoin?.(id);
          }}
          disabled={joining}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={
            isJoined
              ? { background: '#222', color: '#888', border: '1px solid #333' }
              : { background: '#25d366', color: '#fff' }
          }
        >
          {joining ? '...' : isJoined ? 'Joined' : 'Follow'}
        </button>
      )}
    </div>
  );
}

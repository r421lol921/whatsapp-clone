'use client';
import { useRef, useState, useEffect } from 'react';
import OdometerCounter from './OdometerCounter';
import { createClient } from '@/lib/supabase/client';

interface VideoPostCardProps {
  postId: string;
  mediaUrl: string;
  content?: string | null;
  viewCount: number;
  createdAt: string;
  isOwner: boolean;
  onDelete?: (id: string) => void;
  onViewIncrement?: (id: string) => void;
}

export default function VideoPostCard({
  postId,
  mediaUrl,
  content,
  viewCount,
  createdAt,
  isOwner,
  onDelete,
  onViewIncrement,
}: VideoPostCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [localViews, setLocalViews] = useState(viewCount);
  const [counted, setCounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Sync prop changes
  useEffect(() => {
    setLocalViews(viewCount);
  }, [viewCount]);

  const handlePlay = async () => {
    setPlaying(true);
    if (!counted) {
      setCounted(true);
      const newCount = localViews + 1;
      setLocalViews(newCount);
      onViewIncrement?.(postId);

      const supabase = createClient();
      await supabase
        .from('channel_posts')
        .update({ view_count: newCount })
        .eq('id', postId);
    }
  };

  const handlePause = () => setPlaying(false);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#111', border: '1px solid #1e1e1e' }}
    >
      {/* Video container */}
      <div className="relative" style={{ aspectRatio: '16/9', background: '#000' }}>
        <video
          ref={videoRef}
          src={mediaUrl}
          className="w-full h-full object-cover"
          controls
          preload="metadata"
          onPlay={handlePlay}
          onPause={handlePause}
          playsInline
        />

        {/* View count bottom-left overlay */}
        <div
          className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
        >
          {/* Eye icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#25d366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <OdometerCounter
            value={localViews}
            className="text-xs font-bold"
            style={{ color: '#fff' } as React.CSSProperties}
          />
        </div>

        {/* Owner options */}
        {isOwner && (
          <div className="absolute top-3 right-3">
            <button
              onClick={() => setShowDelete((p) => !p)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.6)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {showDelete && (
              <div
                className="absolute right-0 top-10 rounded-xl overflow-hidden shadow-lg z-10"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', minWidth: 120 }}
              >
                <button
                  onClick={() => { setShowDelete(false); onDelete?.(postId); }}
                  className="w-full px-4 py-2.5 text-sm text-left transition-colors"
                  style={{ color: '#f87171' }}
                >
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Caption + time */}
      {(content || createdAt) && (
        <div className="px-4 py-3">
          {content && (
            <p className="text-sm text-white mb-1.5 leading-relaxed">{content}</p>
          )}
          <span className="text-xs" style={{ color: '#555' }}>{timeAgo(createdAt)}</span>
        </div>
      )}
    </div>
  );
}

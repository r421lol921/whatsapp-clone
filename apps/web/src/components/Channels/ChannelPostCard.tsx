'use client';
import { useEffect, useRef, useState } from 'react';
import OdometerCounter from './OdometerCounter';
import { createClient } from '@/lib/supabase/client';

interface ChannelPostCardProps {
  postId: string;
  mediaUrl?: string | null;
  mediaType: 'image' | 'text';
  content?: string | null;
  viewCount: number;
  createdAt: string;
  isOwner: boolean;
  onDelete?: (id: string) => void;
}

export default function ChannelPostCard({
  postId,
  mediaUrl,
  mediaType,
  content,
  viewCount,
  createdAt,
  isOwner,
  onDelete,
}: ChannelPostCardProps) {
  const [localViews, setLocalViews] = useState(viewCount);
  const [counted, setCounted] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalViews(viewCount);
  }, [viewCount]);

  // Increment view count when post enters viewport
  useEffect(() => {
    if (counted) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting) {
          setCounted(true);
          const newCount = localViews + 1;
          setLocalViews(newCount);
          const supabase = createClient();
          await supabase.from('channel_posts').update({ view_count: newCount }).eq('id', postId);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [counted, localViews, postId]);

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
      ref={cardRef}
      className="rounded-2xl overflow-hidden"
      style={{ background: '#111', border: '1px solid #1e1e1e' }}
    >
      {/* Image */}
      {mediaType === 'image' && mediaUrl && (
        <div className="relative">
          <img
            src={mediaUrl}
            alt="Post media"
            className="w-full object-cover"
            style={{ maxHeight: 480 }}
          />
          {/* View count bottom-left */}
          <div
            className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#25d366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <OdometerCounter
              value={localViews}
              className="text-xs font-bold text-white"
            />
          </div>
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
                  className="absolute right-0 top-10 rounded-xl shadow-lg z-10"
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', minWidth: 120 }}
                >
                  <button
                    onClick={() => { setShowDelete(false); onDelete?.(postId); }}
                    className="w-full px-4 py-2.5 text-sm text-left"
                    style={{ color: '#f87171' }}
                  >
                    Delete post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Text / caption */}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {content && (
            <p className="text-sm text-white leading-relaxed mb-1.5 whitespace-pre-wrap">{content}</p>
          )}
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: '#555' }}>{timeAgo(createdAt)}</span>
            {/* View count for text posts */}
            {mediaType === 'text' && (
              <div className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#25d366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <OdometerCounter value={localViews} className="text-xs" style={{ color: '#888' } as React.CSSProperties} />
              </div>
            )}
          </div>
        </div>
        {isOwner && mediaType === 'text' && (
          <div className="relative">
            <button
              onClick={() => setShowDelete((p) => !p)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: '#1a1a1a' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#666">
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {showDelete && (
              <div
                className="absolute right-0 top-10 rounded-xl shadow-lg z-10"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', minWidth: 120 }}
              >
                <button
                  onClick={() => { setShowDelete(false); onDelete?.(postId); }}
                  className="w-full px-4 py-2.5 text-sm text-left"
                  style={{ color: '#f87171' }}
                >
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

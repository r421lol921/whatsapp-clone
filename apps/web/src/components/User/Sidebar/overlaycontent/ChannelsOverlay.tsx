'use client';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import OdometerCounter from '@/components/Channels/OdometerCounter';

interface Channel {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  member_count: number;
  owner_id: string;
}

export default function ChannelsOverlay() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setAuthed(false);
      setLoading(false);
      return;
    }

    setAuthed(true);
    setUserId(user.id);

    const [{ data: channelsData }, { data: membersData }] = await Promise.all([
      supabase.from('channels').select('*').order('member_count', { ascending: false }).limit(30),
      supabase.from('channel_members').select('channel_id').eq('user_id', user.id),
    ]);

    setChannels(channelsData ?? []);
    setJoinedIds(new Set((membersData ?? []).map((m) => m.channel_id)));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleJoin = async (channelId: string) => {
    if (!userId) return;
    setJoiningId(channelId);
    const supabase = createClient();
    const channel = channels.find((c) => c.id === channelId);
    await supabase.from('channel_members').insert({ channel_id: channelId, user_id: userId });
    if (channel) {
      await supabase.from('channels').update({ member_count: channel.member_count + 1 }).eq('id', channelId);
    }
    setJoinedIds((prev) => new Set([...prev, channelId]));
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, member_count: c.member_count + 1 } : c)),
    );
    setJoiningId(null);
  };

  const handleLeave = async (channelId: string) => {
    if (!userId) return;
    setJoiningId(channelId);
    const supabase = createClient();
    const channel = channels.find((c) => c.id === channelId);
    await supabase.from('channel_members').delete().eq('channel_id', channelId).eq('user_id', userId);
    if (channel) {
      await supabase.from('channels').update({ member_count: Math.max(0, channel.member_count - 1) }).eq('id', channelId);
    }
    setJoinedIds((prev) => { const n = new Set(prev); n.delete(channelId); return n; });
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, member_count: Math.max(0, c.member_count - 1) } : c)),
    );
    setJoiningId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: '#25d36633', borderTopColor: '#25d366' }} />
      </div>
    );
  }

  if (authed === false) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#25d36622' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#25d366" strokeWidth="1.5" strokeLinecap="round">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-1">Sign in to PeytOtoria Channels</p>
          <p className="text-xs" style={{ color: '#666' }}>Follow channels and get the latest updates</p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Link
            href="/channels/auth/login"
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white text-center"
            style={{ background: '#25d366' }}
          >
            Sign in
          </Link>
          <Link
            href="/channels/auth/signup"
            className="w-full py-2.5 rounded-lg text-sm font-medium text-center"
            style={{ background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a' }}
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Go to full channels page */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#555' }}>
          {channels.length} channels
        </span>
        <Link
          href="/channels"
          className="text-xs font-medium flex items-center gap-1"
          style={{ color: '#25d366' }}
        >
          See all
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </div>

      {channels.length === 0 && (
        <div className="text-center py-10">
          <p className="text-sm" style={{ color: '#555' }}>No channels yet</p>
          <Link href="/channels" className="text-xs mt-1 block" style={{ color: '#25d366' }}>
            Create one
          </Link>
        </div>
      )}

      <div className="flex flex-col">
        {channels.map((channel) => {
          const isOwner = channel.owner_id === userId;
          const isJoined = joinedIds.has(channel.id);
          const initials = channel.name.slice(0, 2).toUpperCase();
          return (
            <div
              key={channel.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors"
              style={{ borderBottom: '1px solid #0f0f0f' }}
            >
              <Link href={`/channels/${channel.id}`} className="flex-shrink-0">
                {channel.avatar_url ? (
                  <img src={channel.avatar_url} alt={channel.name} className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: '#25d36622', color: '#25d366' }}
                  >
                    {initials}
                  </div>
                )}
              </Link>

              <Link href={`/channels/${channel.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-white truncate">{channel.name}</span>
                  {isOwner && (
                    <span className="text-xs px-1 py-0.5 rounded flex-shrink-0" style={{ background: '#25d36622', color: '#25d366' }}>
                      Owner
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                  <OdometerCounter value={channel.member_count} className="text-xs" style={{ color: '#666' } as React.CSSProperties} />
                </div>
              </Link>

              {!isOwner && (
                <button
                  onClick={() => isJoined ? handleLeave(channel.id) : handleJoin(channel.id)}
                  disabled={joiningId === channel.id}
                  className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={
                    isJoined
                      ? { background: '#1a1a1a', color: '#666', border: '1px solid #2a2a2a' }
                      : { background: '#25d366', color: '#fff' }
                  }
                >
                  {joiningId === channel.id ? '...' : isJoined ? 'Joined' : 'Follow'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

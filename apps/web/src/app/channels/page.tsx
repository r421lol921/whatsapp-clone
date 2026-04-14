'use client';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ChannelCard from '@/components/Channels/ChannelCard';
import CreateChannelModal from '@/components/Channels/CreateChannelModal';

interface Channel {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  member_count: number;
  owner_id: string;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/channels/auth/login');
      return;
    }

    setUserId(user.id);

    const [{ data: channelsData }, { data: membersData }] = await Promise.all([
      supabase.from('channels').select('*').order('member_count', { ascending: false }),
      supabase.from('channel_members').select('channel_id').eq('user_id', user.id),
    ]);

    setChannels(channelsData ?? []);
    setJoinedIds(new Set((membersData ?? []).map((m) => m.channel_id)));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleJoin = async (channelId: string) => {
    if (!userId) return;
    setJoiningId(channelId);
    const supabase = createClient();

    await supabase.from('channel_members').insert({ channel_id: channelId, user_id: userId });
    // Increment member count
    const channel = channels.find((c) => c.id === channelId);
    if (channel) {
      await supabase
        .from('channels')
        .update({ member_count: channel.member_count + 1 })
        .eq('id', channelId);
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

    await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', userId);
    const channel = channels.find((c) => c.id === channelId);
    if (channel) {
      await supabase
        .from('channels')
        .update({ member_count: Math.max(0, channel.member_count - 1) })
        .eq('id', channelId);
    }

    setJoinedIds((prev) => {
      const next = new Set(prev);
      next.delete(channelId);
      return next;
    });
    setChannels((prev) =>
      prev.map((c) =>
        c.id === channelId ? { ...c, member_count: Math.max(0, c.member_count - 1) } : c,
      ),
    );
    setJoiningId(null);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/channels/auth/login');
  };

  const filtered = channels.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const myChannels = filtered.filter((c) => c.owner_id === userId);
  const followedChannels = filtered.filter((c) => c.owner_id !== userId && joinedIds.has(c.id));
  const discoverChannels = filtered.filter((c) => c.owner_id !== userId && !joinedIds.has(c.id));

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
        style={{ background: '#111', borderBottom: '1px solid #1a1a1a' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white"
            style={{ background: '#25d366' }}
          >
            P
          </div>
          <span className="text-white font-semibold text-sm tracking-wider uppercase">Channels</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: '#25d366' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New
          </button>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: '#1a1a1a', color: '#888' }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3" style={{ background: '#111' }}>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#555"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search channels..."
            className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm text-white outline-none"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: '#25d36633', borderTopColor: '#25d366' }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {myChannels.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#555' }}>
                  My Channels
                </h2>
                <div className="flex flex-col gap-2">
                  {myChannels.map((c) => (
                    <ChannelCard
                      key={c.id}
                      {...c}
                      isJoined={joinedIds.has(c.id)}
                      isOwner={c.owner_id === userId}
                      onJoin={handleJoin}
                      onLeave={handleLeave}
                      joining={joiningId === c.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {followedChannels.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#555' }}>
                  Following
                </h2>
                <div className="flex flex-col gap-2">
                  {followedChannels.map((c) => (
                    <ChannelCard
                      key={c.id}
                      {...c}
                      isJoined={joinedIds.has(c.id)}
                      isOwner={c.owner_id === userId}
                      onJoin={handleJoin}
                      onLeave={handleLeave}
                      joining={joiningId === c.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {discoverChannels.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#555' }}>
                  Discover
                </h2>
                <div className="flex flex-col gap-2">
                  {discoverChannels.map((c) => (
                    <ChannelCard
                      key={c.id}
                      {...c}
                      isJoined={joinedIds.has(c.id)}
                      isOwner={c.owner_id === userId}
                      onJoin={handleJoin}
                      onLeave={handleLeave}
                      joining={joiningId === c.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {filtered.length === 0 && !loading && (
              <div className="text-center py-16">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: '#161616' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                  </svg>
                </div>
                <p className="text-sm" style={{ color: '#555' }}>
                  {search ? 'No channels match your search' : 'No channels yet — create one!'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreate && userId && (
        <CreateChannelModal
          userId={userId}
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}

'use client';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OdometerCounter from '@/components/Channels/OdometerCounter';
import VideoPostCard from '@/components/Channels/VideoPostCard';
import ChannelPostCard from '@/components/Channels/ChannelPostCard';
import ChannelAdminPanel from '@/components/Channels/ChannelAdminPanel';

interface Post {
  id: string;
  channel_id: string;
  owner_id: string;
  content: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'text';
  thumbnail_url: string | null;
  view_count: number;
  created_at: string;
}

interface Channel {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  member_count: number;
  owner_id: string;
}

type MediaType = 'text' | 'image' | 'video';

export default function ChannelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Post creation state
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postMediaType, setPostMediaType] = useState<MediaType>('text');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const router = useRouter();

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/channels/auth/login');
      return;
    }

    setUserId(user.id);

    const [{ data: channelData }, { data: postsData }, { data: memberData }] = await Promise.all([
      supabase.from('channels').select('*').eq('id', id).single(),
      supabase.from('channel_posts').select('*').eq('channel_id', id).order('created_at', { ascending: false }),
      supabase.from('channel_members').select('id').eq('channel_id', id).eq('user_id', user.id).maybeSingle(),
    ]);

    setChannel(channelData);
    setPosts(postsData ?? []);
    setIsJoined(!!memberData);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = channel?.owner_id === userId;

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !channel) return;
    if (postMediaType !== 'text' && !postMediaUrl.trim()) {
      setPostError('Please provide a media URL');
      return;
    }
    setPosting(true);
    setPostError('');

    const supabase = createClient();
    const { error } = await supabase.from('channel_posts').insert({
      channel_id: id,
      owner_id: userId,
      content: postContent.trim() || null,
      media_url: postMediaUrl.trim() || null,
      media_type: postMediaType,
      view_count: 0,
    });

    if (error) {
      setPostError(error.message);
      setPosting(false);
      return;
    }

    setPostContent('');
    setPostMediaUrl('');
    setPostMediaType('text');
    setPosting(false);
    load();
  };

  const handleDeletePost = async (postId: string) => {
    const supabase = createClient();
    await supabase.from('channel_posts').delete().eq('id', postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleJoinLeave = async () => {
    if (!userId || !channel) return;
    const supabase = createClient();
    if (isJoined) {
      await supabase.from('channel_members').delete().eq('channel_id', id).eq('user_id', userId);
      await supabase.from('channels').update({ member_count: Math.max(0, channel.member_count - 1) }).eq('id', id);
      setChannel((c) => c ? { ...c, member_count: Math.max(0, c.member_count - 1) } : c);
      setIsJoined(false);
    } else {
      await supabase.from('channel_members').insert({ channel_id: id, user_id: userId });
      await supabase.from('channels').update({ member_count: channel.member_count + 1 }).eq('id', id);
      setChannel((c) => c ? { ...c, member_count: c.member_count + 1 } : c);
      setIsJoined(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#25d36633', borderTopColor: '#25d366' }} />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <p className="text-white">Channel not found</p>
      </div>
    );
  }

  const initials = channel.name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
        style={{ background: '#111', borderBottom: '1px solid #1a1a1a' }}
      >
        <Link
          href="/channels"
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#1a1a1a', color: '#888' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>

        {channel.avatar_url ? (
          <img src={channel.avatar_url} alt={channel.name} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
            style={{ background: '#25d36633', color: '#25d366' }}
          >
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-white font-semibold text-sm truncate">{channel.name}</h1>
          <div className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <OdometerCounter value={channel.member_count} className="text-xs" style={{ color: '#666' } as React.CSSProperties} />
            <span className="text-xs" style={{ color: '#555' }}>members</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => setShowAdmin(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: '#1a1a1a', color: '#25d366', border: '1px solid #25d36633' }}
            >
              Admin
            </button>
          )}
          {!isOwner && (
            <button
              onClick={handleJoinLeave}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: isJoined ? '#1a1a1a' : '#25d366', color: isJoined ? '#888' : '#fff', border: isJoined ? '1px solid #333' : 'none' }}
            >
              {isJoined ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Channel info */}
      {channel.description && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #1a1a1a' }}>
          <p className="text-sm" style={{ color: '#888' }}>{channel.description}</p>
        </div>
      )}

      {/* Owner post composer */}
      {isOwner && (
        <div className="px-4 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
          <form onSubmit={handlePost} className="flex flex-col gap-3">
            {postError && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#2a1a1a', color: '#f87171' }}>
                {postError}
              </div>
            )}

            {/* Media type tabs */}
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#1a1a1a' }}>
              {(['text', 'image', 'video'] as MediaType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPostMediaType(type)}
                  className="flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-all"
                  style={
                    postMediaType === type
                      ? { background: '#25d366', color: '#fff' }
                      : { color: '#666' }
                  }
                >
                  {type}
                </button>
              ))}
            </div>

            {postMediaType !== 'text' && (
              <input
                type="url"
                value={postMediaUrl}
                onChange={(e) => setPostMediaUrl(e.target.value)}
                placeholder={postMediaType === 'image' ? 'Image URL...' : 'Video URL (mp4, webm)...'}
                className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none transition-all"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                onFocus={(e) => (e.target.style.borderColor = '#25d366')}
                onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
              />
            )}

            <div className="flex gap-2 items-end">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Write something..."
                rows={2}
                className="flex-1 rounded-lg px-4 py-3 text-sm text-white outline-none resize-none transition-all"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                onFocus={(e) => (e.target.style.borderColor = '#25d366')}
                onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
              />
              <button
                type="submit"
                disabled={posting || (postMediaType === 'text' && !postContent.trim())}
                className="px-4 py-3 rounded-lg text-sm font-semibold text-white flex-shrink-0 transition-opacity"
                style={{ background: '#25d366', opacity: posting ? 0.6 : 1 }}
              >
                {posting ? '...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts feed */}
      <div className="px-4 py-4 flex flex-col gap-4 max-w-2xl mx-auto">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: '#555' }}>
              {isOwner ? 'Post your first update above' : 'No posts yet'}
            </p>
          </div>
        ) : (
          posts.map((post) =>
            post.media_type === 'video' && post.media_url ? (
              <VideoPostCard
                key={post.id}
                postId={post.id}
                mediaUrl={post.media_url}
                content={post.content}
                viewCount={post.view_count}
                createdAt={post.created_at}
                isOwner={isOwner}
                onDelete={handleDeletePost}
              />
            ) : (
              <ChannelPostCard
                key={post.id}
                postId={post.id}
                mediaUrl={post.media_url}
                mediaType={post.media_type === 'video' ? 'text' : post.media_type}
                content={post.content}
                viewCount={post.view_count}
                createdAt={post.created_at}
                isOwner={isOwner}
                onDelete={handleDeletePost}
              />
            ),
          )
        )}
      </div>

      {/* Admin panel modal */}
      {showAdmin && channel && userId && (
        <ChannelAdminPanel
          channel={channel}
          onClose={() => setShowAdmin(false)}
          onSaved={(updated) => {
            setChannel(updated);
            setShowAdmin(false);
          }}
          onUpdatePost={(postId, updates) => {
            setPosts((prev) =>
              prev.map((p) => (p.id === postId ? { ...p, ...updates } : p)),
            );
          }}
          posts={posts}
        />
      )}
    </div>
  );
}

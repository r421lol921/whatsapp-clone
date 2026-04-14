'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Post {
  id: string;
  content: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'text';
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

interface ChannelAdminPanelProps {
  channel: Channel;
  posts: Post[];
  onClose: () => void;
  onSaved: (updated: Channel) => void;
  onUpdatePost: (postId: string, updates: Partial<Post>) => void;
}

type Tab = 'channel' | 'posts';

export default function ChannelAdminPanel({ channel, posts, onClose, onSaved, onUpdatePost }: ChannelAdminPanelProps) {
  const [tab, setTab] = useState<Tab>('channel');

  // Channel fields
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description ?? '');
  const [memberCount, setMemberCount] = useState(String(channel.member_count));
  const [avatarUrl, setAvatarUrl] = useState(channel.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [channelError, setChannelError] = useState('');
  const [channelSuccess, setChannelSuccess] = useState(false);

  // Post editing state: postId -> field overrides
  const [postEdits, setPostEdits] = useState<Record<string, { view_count?: string; content?: string }>>({});
  const [savingPost, setSavingPost] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);

  const handleSaveChannel = async () => {
    setSaving(true);
    setChannelError('');
    setChannelSuccess(false);

    const count = parseInt(memberCount, 10);
    if (isNaN(count) || count < 0 || count > 10_000_000) {
      setChannelError('Member count must be between 0 and 10,000,000');
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('channels')
      .update({
        name: name.trim(),
        description: description.trim() || null,
        member_count: count,
        avatar_url: avatarUrl.trim() || null,
      })
      .eq('id', channel.id)
      .select()
      .single();

    if (error) {
      setChannelError(error.message);
      setSaving(false);
      return;
    }

    setChannelSuccess(true);
    setSaving(false);
    onSaved(data);
  };

  const handleSavePost = async (postId: string) => {
    const edits = postEdits[postId] ?? {};
    setSavingPost(postId);

    const updates: Partial<Post> = {};
    if (edits.view_count !== undefined) {
      const v = parseInt(edits.view_count, 10);
      if (!isNaN(v)) updates.view_count = v;
    }
    if (edits.content !== undefined) {
      updates.content = edits.content || null;
    }

    const supabase = createClient();
    const { error } = await supabase.from('channel_posts').update(updates).eq('id', postId);

    if (!error) {
      onUpdatePost(postId, updates);
      setPostSuccess(postId);
      setTimeout(() => setPostSuccess(null), 2000);
    }

    setSavingPost(null);
  };

  const updatePostEdit = (postId: string, field: 'view_count' | 'content', value: string) => {
    setPostEdits((prev) => ({
      ...prev,
      [postId]: { ...(prev[postId] ?? {}), [field]: value },
    }));
  };

  const getPostEdit = (postId: string, field: 'view_count' | 'content', fallback: string) => {
    return postEdits[postId]?.[field] ?? fallback;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#111', border: '1px solid #222', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1e1e1e' }}>
          <h2 className="text-white text-base font-bold">Channel Admin</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#1a1a1a', color: '#888' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: '1px solid #1e1e1e' }}>
          {(['channel', 'posts'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-3 text-sm font-medium capitalize transition-colors"
              style={
                tab === t
                  ? { color: '#25d366', borderBottom: '2px solid #25d366' }
                  : { color: '#666' }
              }
            >
              {t === 'channel' ? 'Channel Info' : 'Post Stats'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto scrollbar flex-1">
          {tab === 'channel' && (
            <div className="p-5 flex flex-col gap-4">
              {channelError && (
                <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#2a1a1a', color: '#f87171' }}>
                  {channelError}
                </div>
              )}
              {channelSuccess && (
                <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#1a2a1a', color: '#4ade80' }}>
                  Saved successfully
                </div>
              )}

              {[
                { label: 'Channel Name', value: name, setter: setName, placeholder: 'Channel name' },
                { label: 'Avatar URL', value: avatarUrl, setter: setAvatarUrl, placeholder: 'https://...' },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#888' }}>
                    {label}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none transition-all"
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                    onFocus={(e) => (e.target.style.borderColor = '#25d366')}
                    onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
                  />
                </div>
              ))}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#888' }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Channel description..."
                  className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none resize-none transition-all"
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                  onFocus={(e) => (e.target.style.borderColor = '#25d366')}
                  onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#888' }}>
                  Member Count{' '}
                  <span className="normal-case" style={{ color: '#555' }}>(max 10,000,000)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={10_000_000}
                  value={memberCount}
                  onChange={(e) => setMemberCount(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none transition-all"
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                  onFocus={(e) => (e.target.style.borderColor = '#25d366')}
                  onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
                />
              </div>

              <button
                onClick={handleSaveChannel}
                disabled={saving}
                className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-opacity"
                style={{ background: '#25d366', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {tab === 'posts' && (
            <div className="p-5 flex flex-col gap-4">
              {posts.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: '#555' }}>
                  No posts yet
                </p>
              )}
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-xl p-4 flex flex-col gap-3"
                  style={{ background: '#161616', border: '1px solid #1e1e1e' }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded font-medium uppercase tracking-wide"
                      style={{ background: '#25d36622', color: '#25d366' }}
                    >
                      {post.media_type}
                    </span>
                    <span className="text-xs" style={{ color: '#555' }}>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {post.media_url && (
                    <p className="text-xs truncate" style={{ color: '#555' }}>
                      {post.media_url}
                    </p>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-wider" style={{ color: '#666' }}>
                      Caption / Text
                    </label>
                    <textarea
                      value={getPostEdit(post.id, 'content', post.content ?? '')}
                      onChange={(e) => updatePostEdit(post.id, 'content', e.target.value)}
                      rows={2}
                      className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-none transition-all"
                      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                      onFocus={(e) => (e.target.style.borderColor = '#25d366')}
                      onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-wider" style={{ color: '#666' }}>
                      View Count
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={getPostEdit(post.id, 'view_count', String(post.view_count))}
                      onChange={(e) => updatePostEdit(post.id, 'view_count', e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-all"
                      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                      onFocus={(e) => (e.target.style.borderColor = '#25d366')}
                      onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
                    />
                  </div>

                  {postSuccess === post.id && (
                    <div className="rounded-lg px-3 py-1.5 text-xs" style={{ background: '#1a2a1a', color: '#4ade80' }}>
                      Saved
                    </div>
                  )}

                  <button
                    onClick={() => handleSavePost(post.id)}
                    disabled={savingPost === post.id}
                    className="w-full rounded-lg py-2 text-sm font-semibold text-white transition-opacity"
                    style={{ background: '#25d366', opacity: savingPost === post.id ? 0.6 : 1 }}
                  >
                    {savingPost === post.id ? 'Saving...' : 'Update Post'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

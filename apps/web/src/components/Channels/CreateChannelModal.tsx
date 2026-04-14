'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CreateChannelModalProps {
  onClose: () => void;
  onCreated: () => void;
  userId: string;
}

export default function CreateChannelModal({ onClose, onCreated, userId }: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.from('channels').insert({
      name: name.trim(),
      description: description.trim() || null,
      owner_id: userId,
      member_count: 0,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    onCreated();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl p-6"
        style={{ background: '#111', border: '1px solid #222' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-lg font-bold">New Channel</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: '#1a1a1a', color: '#888' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="rounded-lg px-3 py-2 mb-4 text-xs" style={{ background: '#2a1a1a', color: '#f87171' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#888' }}>
              Channel name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              placeholder="e.g. Daily Updates"
              className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none transition-all"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
              onFocus={(e) => (e.target.style.borderColor = '#25d366')}
              onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#888' }}>
              Description <span style={{ color: '#555' }}>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="What is this channel about?"
              className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none resize-none transition-all"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
              onFocus={(e) => (e.target.style.borderColor = '#25d366')}
              onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors"
              style={{ background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity"
              style={{ background: '#25d366', opacity: loading || !name.trim() ? 0.5 : 1 }}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

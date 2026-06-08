"use client";

import { useState, useEffect } from 'react';
import { VoiceMemo } from '@/types';
import { createClient } from '@/lib/supabase/client';

export default function MemosHistory() {
  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMemos() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('voice_memos')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setMemos(data.map(m => ({
          id: m.id,
          userId: m.user_id,
          audioUrl: m.audio_url,
          transcript: m.transcript,
          status: m.status,
          createdAt: m.created_at
        })));
      }
      setLoading(false);
    }

    fetchMemos();
  }, [supabase]);

  return (
    <div className="container" style={{ maxWidth: '800px', marginTop: '2rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Voice Memos</h2>
        <p style={{ color: 'var(--text-muted)' }}>History of all your recorded and transcribed thoughts.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading memos history...</div>
      ) : memos.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          No memos recorded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {memos.map(memo => (
            <div key={memo.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {new Date(memo.createdAt).toLocaleString()}
                </span>
                <span className="status-pill status-completed">Transcribed</span>
              </div>
              <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-main)', borderLeft: '3px solid var(--primary)', paddingLeft: '1rem' }}>
                "{memo.transcript}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

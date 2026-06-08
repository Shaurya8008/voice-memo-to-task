"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, VoiceMemo } from '@/types';
import { createClient } from '@/lib/supabase/client';
import VoiceRecorder from '@/components/VoiceRecorder';
import TaskReview from '@/components/TaskReview';
import TaskCard from '@/components/TaskCard';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review State
  const [reviewMemo, setReviewMemo] = useState<VoiceMemo | null>(null);
  const [reviewTasks, setReviewTasks] = useState<Partial<Task>[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const supabase = createClient();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setLoading(false);
      return;
    }

    try {
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksData) {
        setTasks(tasksData.map(t => ({
          id: t.id,
          userId: t.user_id,
          memoId: t.memo_id,
          title: t.title,
          description: t.description,
          dueDate: t.due_date,
          priority: t.priority,
          status: t.status,
          category: t.category,
          createdAt: t.created_at,
          updatedAt: t.updated_at
        })));
      }

      const { data: memosData } = await supabase
        .from('voice_memos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (memosData) {
        setMemos(memosData.map(m => ({
          id: m.id,
          userId: m.user_id,
          audioUrl: m.audio_url,
          transcript: m.transcript,
          status: m.status,
          createdAt: m.created_at
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const handleTranscriptionSuccess = async (memo: VoiceMemo) => {
    setReviewMemo(memo);
    setIsExtracting(true);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: memo.transcript, memoId: memo.id })
      });
      const data = await res.json();
      if (res.ok) setReviewTasks(data.tasks || []);
    } catch (err) {
      setReviewTasks([]);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReviewCancel = () => {
    setReviewMemo(null);
    setReviewTasks([]);
    fetchDashboardData();
  };

  const handleSaveComplete = () => {
    setReviewMemo(null);
    setReviewTasks([]);
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '2rem' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(to right, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Capture Thoughts, Instantly.
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Speak your tasks naturally. We'll transcribe, extract dates, and organize your to-dos automatically.
        </p>
      </div>

      {reviewMemo ? (
        isExtracting ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', maxWidth: '600px', margin: '0 auto' }}>
            <svg className="animate-spin" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem', margin: '0 auto' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            <h3 style={{ color: 'var(--text-main)' }}>AI is extracting tasks...</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Using Google Gemini API</p>
          </div>
        ) : (
          <TaskReview 
            memo={reviewMemo} 
            initialTasks={reviewTasks} 
            onCancel={handleReviewCancel}
            onSaveComplete={handleSaveComplete}
          />
        )
      ) : (
        <>
          <div style={{ marginBottom: '4rem' }}>
            <VoiceRecorder onTranscriptionSuccess={handleTranscriptionSuccess} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
            
            {/* Task List Section */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0 }}>Your Tasks</h3>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Search tasks..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'white' }}
                  />
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'white' }}
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading tasks...</div>
              ) : filteredTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  {tasks.length === 0 ? "No tasks yet. Start recording to create some!" : "No tasks match your filters."}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredTasks.map(task => (
                    <TaskCard key={task.id} task={task} onUpdate={fetchDashboardData} />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Memos Section */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Recent Memos</h3>
                <a href="/memos" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>View All →</a>
              </div>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>
              ) : memos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  No voice memos recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {memos.map(memo => (
                    <div key={memo.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(memo.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{memo.transcript}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .container > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </div>
  );
}

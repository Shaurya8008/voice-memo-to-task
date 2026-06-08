"use client";

import { Task } from '@/types';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
}

export default function TaskCard({ task, onUpdate }: TaskCardProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const toggleStatus = async () => {
    setLoading(true);
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id);
      
    if (!error) onUpdate();
    setLoading(false);
  };

  const deleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setLoading(true);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id);
      
    if (!error) onUpdate();
    setLoading(false);
  };

  const isCompleted = task.status === 'completed';

  return (
    <div className={`glass-panel p-4 mb-4 ${isCompleted ? 'opacity-60' : ''}`} style={{ padding: '1rem', marginBottom: '1rem', transition: 'all 0.3s ease' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={isCompleted} 
            onChange={toggleStatus}
            disabled={loading}
            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', accentColor: 'var(--primary)' }}
          />
          <h4 style={{ margin: 0, textDecoration: isCompleted ? 'line-through' : 'none', color: isCompleted ? 'var(--text-muted)' : 'var(--text-main)' }}>
            {task.title}
          </h4>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`status-pill ${isCompleted ? 'status-completed' : 'status-pending'}`}>
            {task.priority}
          </span>
          <button 
            onClick={deleteTask}
            disabled={loading}
            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.7, padding: '0.2rem' }}
            title="Delete Task"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex gap-4" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '1.7rem' }}>
        {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleString()}</span>}
        <span>📁 {task.category}</span>
        {task.description && <span>📝 {task.description}</span>}
      </div>
    </div>
  );
}

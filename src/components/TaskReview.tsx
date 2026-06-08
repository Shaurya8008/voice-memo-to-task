"use client";

import { useState } from 'react';
import { Task, VoiceMemo } from '@/types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface TaskReviewProps {
  memo: VoiceMemo;
  initialTasks: Partial<Task>[];
  onCancel: () => void;
  onSaveComplete: () => void;
}

export default function TaskReview({ memo, initialTasks, onCancel, onSaveComplete }: TaskReviewProps) {
  const [tasks, setTasks] = useState<Partial<Task>[]>(initialTasks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTask = (index: number, field: keyof Task, value: any) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const removeTask = (index: number) => {
    const updated = tasks.filter((_, i) => i !== index);
    setTasks(updated);
  };

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        title: "New Task",
        priority: "medium",
        category: "Inbox",
        memoId: memo.id
      }
    ]);
  };

  const saveTasks = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to save tasks');
      onSaveComplete();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error saving tasks');
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Review Extracted Tasks</h2>
        <span className="status-pill status-completed">Transcript Processed</span>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Transcript Reference */}
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Raw Transcript</p>
        <p style={{ fontStyle: 'italic', margin: 0, borderLeft: '3px solid var(--primary)', paddingLeft: '1rem' }}>
          "{memo.transcript}"
        </p>
      </div>

      {/* Editable Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        {tasks.map((task, index) => (
          <div key={index} style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', position: 'relative' }}>
            
            <button 
              onClick={() => removeTask(index)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              title="Remove Task"
            >
              ✕
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              
              {/* Title */}
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Task Title</label>
                <input 
                  type="text" 
                  value={task.title || ''} 
                  onChange={(e) => updateTask(index, 'title', e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'white', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                
                {/* Category */}
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Category</label>
                  <input 
                    type="text" 
                    value={task.category || ''} 
                    onChange={(e) => updateTask(index, 'category', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'white', outline: 'none' }}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Priority</label>
                  <select 
                    value={task.priority || 'medium'} 
                    onChange={(e) => updateTask(index, 'priority', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'white', outline: 'none' }}
                  >
                    <option value="low" style={{ background: 'var(--surface)' }}>Low</option>
                    <option value="medium" style={{ background: 'var(--surface)' }}>Medium</option>
                    <option value="high" style={{ background: 'var(--surface)' }}>High</option>
                  </select>
                </div>

                {/* Date/Time Picker */}
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: '0.85rem', color: !task.dueDate ? 'var(--warning)' : 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    {task.dueDate ? 'Due Date & Time' : 'Needs Date/Time (Optional)'}
                  </label>
                  <DatePicker
                    selected={task.dueDate ? new Date(task.dueDate) : null}
                    onChange={(date) => updateTask(index, 'dueDate', date ? date.toISOString() : undefined)}
                    showTimeSelect
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="custom-datepicker"
                    placeholderText="Select date and time"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={addTask} className="btn btn-secondary" style={{ borderStyle: 'dashed' }}>
          + Add Another Task
        </button>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={onCancel} className="btn btn-secondary" disabled={saving}>
            Cancel
          </button>
          <button onClick={saveTasks} className="btn btn-primary" disabled={saving || tasks.length === 0}>
            {saving ? 'Saving...' : `Confirm & Save ${tasks.length} Tasks`}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-datepicker {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255,255,255,0.03) !important;
          border: 1px solid var(--border) !important;
          border-radius: var(--radius-sm) !important;
          color: white !important;
          outline: none;
        }
        .react-datepicker {
          background-color: var(--surface) !important;
          border: 1px solid var(--border) !important;
          color: var(--text-main) !important;
          font-family: inherit !important;
        }
        .react-datepicker__header {
          background-color: var(--surface-hover) !important;
          border-bottom: 1px solid var(--border) !important;
        }
        .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
          color: var(--text-main) !important;
        }
        .react-datepicker__day {
          color: var(--text-main) !important;
        }
        .react-datepicker__day:hover {
          background-color: var(--primary) !important;
        }
        .react-datepicker__day--selected {
          background-color: var(--primary) !important;
        }
        .react-datepicker__time-container {
          border-left: 1px solid var(--border) !important;
        }
        .react-datepicker__time-list-item {
          background-color: var(--surface) !important;
          color: var(--text-main) !important;
        }
        .react-datepicker__time-list-item:hover {
          background-color: var(--primary) !important;
        }
      `}} />
    </div>
  );
}

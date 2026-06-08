"use client";

import { useState, useRef, useEffect } from 'react';
import { VoiceMemo } from '@/types';

type RecorderState = 'idle' | 'recording' | 'paused' | 'reviewing' | 'uploading' | 'processing';

interface VoiceRecorderProps {
  onTranscriptionSuccess: (memo: VoiceMemo) => void;
}

export default function VoiceRecorder({ onTranscriptionSuccess }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [mode, setMode] = useState<'record' | 'upload'>('record');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDuration = 120; // 2 minutes

  useEffect(() => {
    if (state === 'recording') {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration - 1) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState('reviewing');
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setState('recording');
      setRecordingTime(0);
    } catch (err: any) {
      console.error(err);
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setState('reviewing');
    }
  };

  const reset = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setState('idle');
    setError(null);
  };

  const submitAudio = async () => {
    if (!audioBlob) return;
    setState('processing');
    setError(null);

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      const response = await fetch('/api/memos', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process audio');
      }

      onTranscriptionSuccess(data.memo);
      reset();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during transcription.');
      setState('reviewing');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', margin: '0 auto', overflow: 'hidden' }}>
      
      {/* Tab Switcher */}
      {state === 'idle' && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <button 
            onClick={() => setMode('record')}
            style={{ 
              background: 'none', border: 'none', color: mode === 'record' ? 'var(--primary)' : 'var(--text-muted)', 
              fontWeight: mode === 'record' ? 600 : 400, cursor: 'pointer', fontSize: '1rem', transition: 'color 0.2s'
            }}
          >
            Voice Record
          </button>
          <button 
            onClick={() => setMode('upload')}
            style={{ 
              background: 'none', border: 'none', color: mode === 'upload' ? 'var(--primary)' : 'var(--text-muted)', 
              fontWeight: mode === 'upload' ? 600 : 400, cursor: 'pointer', fontSize: '1rem', transition: 'color 0.2s'
            }}
          >
            Upload File
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Recording UI */}
      {mode === 'record' && (state === 'idle' || state === 'recording') && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0' }}>
          
          <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}>
            {state === 'recording' && (
              <>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--danger)', opacity: 0.2, animation: 'pulseGlow 1.5s infinite ease-out' }} />
                <div style={{ position: 'absolute', inset: '10px', borderRadius: '50%', background: 'var(--danger)', opacity: 0.3, animation: 'pulseGlow 1.5s infinite ease-out 0.3s' }} />
              </>
            )}
            
            <button
              onClick={state === 'idle' ? startRecording : stopRecording}
              style={{
                width: '80px', height: '80px', borderRadius: '50%', 
                background: state === 'idle' ? 'var(--primary)' : 'var(--danger)',
                color: 'white', border: 'none', cursor: 'pointer', zIndex: 10,
                boxShadow: state === 'idle' ? '0 8px 24px rgba(99, 102, 241, 0.4)' : '0 8px 24px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex', justifyContent: 'center', alignItems: 'center'
              }}
            >
              {state === 'idle' ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              )}
            </button>
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: state === 'recording' ? 'var(--text-main)' : 'var(--text-muted)' }}>
            {formatTime(recordingTime)}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Max 2 minutes
          </div>
        </div>
      )}

      {/* Upload UI */}
      {mode === 'upload' && state === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.02)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Select an audio file to transcribe</p>
          <input 
            type="file" 
            accept="audio/*" 
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="audio-upload"
          />
          <label htmlFor="audio-upload" className="btn btn-secondary">
            Browse Files
          </label>
        </div>
      )}

      {/* Reviewing & Processing UI */}
      {(state === 'reviewing' || state === 'processing') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
          
          <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 500 }}>Ready to Transcribe</p>
              {recordingTime > 0 && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Length: {formatTime(recordingTime)}</p>}
            </div>
          </div>

          {audioUrl && (
            <audio src={audioUrl} controls style={{ width: '100%', height: '40px', outline: 'none' }} />
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              onClick={reset} 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
              disabled={state === 'processing'}
            >
              Retry
            </button>
            <button 
              onClick={submitAudio} 
              className="btn btn-primary" 
              style={{ flex: 2 }}
              disabled={state === 'processing'}
            >
              {state === 'processing' ? (
                <>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <line x1="12" x2="12" y1="2" y2="6" />
                    <line x1="12" x2="12" y1="18" y2="22" />
                    <line x1="4.93" x2="7.76" y1="4.93" y2="7.76" />
                    <line x1="16.24" x2="19.07" y1="16.24" y2="19.07" />
                    <line x1="2" x2="6" y1="12" y2="12" />
                    <line x1="18" x2="22" y1="12" y2="12" />
                    <line x1="4.93" x2="7.76" y1="19.07" y2="16.24" />
                    <line x1="16.24" x2="19.07" y1="7.76" y2="4.93" />
                  </svg>
                  Processing...
                </>
              ) : (
                'Transcribe & Extract Tasks'
              )}
            </button>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}

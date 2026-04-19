'use client';

import { useState } from 'react';
import { createProject } from '@/lib/data';
import { Project, Mode, Category, Platform, Style } from '@/lib/types';

interface Props {
  onClose: () => void;
  onCreate: (projectId: string) => void;
}

export default function NewProjectModal({ onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('school');
  const [platform, setPlatform] = useState<Platform>('google-slides');
  const [mode, setMode] = useState<Mode>('professional');
  const [style, setStyle] = useState<Style>('minimal');

  function handleCreate() {
    if (!title.trim()) return;
    const project: Project = {
      id: `proj-${Date.now()}`,
      title: title.trim(),
      category, platform, mode, style,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      progressStatus: { cover: false, diagram: false, divider: false, extras: false },
    };
    createProject(project);
    onCreate(project.id);
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-sm rounded-md border p-5 space-y-4" style={{ background: '#0e0e18', borderColor: '#1e1e2a' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight" style={{ color: '#f0f0f8' }}>New Project</h2>
          <button onClick={onClose} className="text-lg leading-none transition-colors" style={{ color: '#33334a' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#9090a8'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#33334a'; }}
          >×</button>
        </div>

        <input
          type="text"
          placeholder="Project title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          className="w-full rounded-md px-3 py-2 text-sm focus:outline-none transition-colors border"
          style={{ background: '#0a0a14', borderColor: '#1e1e2a', color: '#d0d0e8' }}
          onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = '#4f6ef7'; }}
          onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1e1e2a'; }}
          autoFocus
        />

        <div className="space-y-2">
          <label className="text-xs" style={{ color: '#33334a' }}>Category</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['school','club','internship','casual'] as Category[]).map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className="py-1.5 rounded text-xs font-medium capitalize transition-all border"
                style={{
                  background: category === c ? '#0d1a2e' : '#0e0e18',
                  borderColor: category === c ? '#4f6ef7' : '#1e1e2a',
                  color: category === c ? '#6090d0' : '#44445a',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs" style={{ color: '#33334a' }}>Mode</label>
          <div className="grid grid-cols-2 gap-1.5">
            {([['professional','Professional'],['personal','Personal']] as [Mode,string][]).map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)}
                className="py-1.5 rounded text-xs font-medium transition-all"
                style={{
                  background: mode === m ? (m === 'professional' ? '#3b82f6' : '#f59e0b') : '#0e0e18',
                  color: mode === m ? '#fff' : '#44445a',
                  border: `1px solid ${mode === m ? 'transparent' : '#1e1e2a'}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs" style={{ color: '#33334a' }}>Platform</label>
          <div className="grid grid-cols-3 gap-1.5">
            {([['google-slides','Slides'],['powerpoint','PowerPoint'],[null,'None']] as [Platform, string][]).map(([val, label]) => (
              <button key={String(val)} onClick={() => setPlatform(val)}
                className="py-1.5 rounded text-xs font-medium transition-all border"
                style={{
                  background: platform === val ? '#0d1a2e' : '#0e0e18',
                  borderColor: platform === val ? '#4f6ef7' : '#1e1e2a',
                  color: platform === val ? '#6090d0' : '#44445a',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs" style={{ color: '#33334a' }}>Style</label>
          <div className="flex flex-wrap gap-1.5">
            {(['minimal','corporate','academic','fun','meme'] as Style[]).map(s => (
              <button key={s} onClick={() => setStyle(s)}
                className="px-3 py-1 rounded text-xs font-medium capitalize transition-all border"
                style={{
                  background: style === s ? '#0d1a2e' : '#0e0e18',
                  borderColor: style === s ? '#4f6ef7' : '#1e1e2a',
                  color: style === s ? '#6090d0' : '#44445a',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!title.trim()}
          className="w-full font-medium py-2 rounded-md text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#4f6ef7', color: '#fff' }}
          onMouseEnter={e => { if (title.trim()) (e.currentTarget as HTMLElement).style.background = '#6080ff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4f6ef7'; }}
        >
          Create Project →
        </button>
      </div>
    </div>
  );
}

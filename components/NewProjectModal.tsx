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
    <div className="absolute inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(32,33,36,0.6)' }}>
      <div className="w-full max-w-sm rounded-xl border shadow-lg" style={{ background: '#fff', borderColor: '#e0e0e0' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: '#e0e0e0' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: '#202124' }}>New Project</h2>
            <p className="text-xs mt-0.5" style={{ color: '#9aa0a6' }}>Create a presentation project</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors text-lg leading-none"
            style={{ color: '#9aa0a6' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f1f3f4'; (e.currentTarget as HTMLElement).style.color = '#5f6368'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9aa0a6'; }}
          >×</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: '#9aa0a6', letterSpacing: '0.08em' }}>Title</label>
            <input
              type="text"
              placeholder="e.g. Internship Final Presentation"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-all border"
              style={{ background: '#fff', borderColor: '#dadce0', color: '#202124' }}
              onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1a73e8'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px #e8f0fe'; }}
              onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = '#dadce0'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              autoFocus
            />
          </div>

          {/* Mode */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: '#9aa0a6', letterSpacing: '0.08em' }}>Mode</label>
            <div className="flex rounded-lg border p-1 gap-1" style={{ background: '#f8f9fa', borderColor: '#e0e0e0' }}>
              {([['professional', 'Professional'], ['personal', 'Personal']] as [Mode, string][]).map(([m, label]) => (
                <button key={m} onClick={() => setMode(m)}
                  className="flex-1 py-2 rounded-md text-xs font-semibold transition-all"
                  style={{
                    background: mode === m ? (m === 'professional' ? '#1a73e8' : '#e8710a') : 'transparent',
                    color: mode === m ? '#fff' : '#9aa0a6',
                    boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: '#9aa0a6', letterSpacing: '0.08em' }}>Category</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['school', 'club', 'internship', 'casual'] as Category[]).map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className="py-2 rounded-lg text-xs font-medium capitalize transition-all border"
                  style={{
                    background: category === c ? '#e8f0fe' : '#fff',
                    borderColor: category === c ? '#1a73e8' : '#dadce0',
                    color: category === c ? '#1a73e8' : '#5f6368',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: '#9aa0a6', letterSpacing: '0.08em' }}>Platform</label>
            <div className="grid grid-cols-3 gap-1.5">
              {([['google-slides', 'Slides'], ['powerpoint', 'PowerPoint'], [null, 'None']] as [Platform, string][]).map(([val, label]) => (
                <button key={String(val)} onClick={() => setPlatform(val)}
                  className="py-2 rounded-lg text-xs font-medium transition-all border"
                  style={{
                    background: platform === val ? '#e8f0fe' : '#fff',
                    borderColor: platform === val ? '#1a73e8' : '#dadce0',
                    color: platform === val ? '#1a73e8' : '#5f6368',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: '#9aa0a6', letterSpacing: '0.08em' }}>Visual Style</label>
            <div className="flex flex-wrap gap-1.5">
              {(['minimal', 'corporate', 'academic', 'fun', 'meme'] as Style[]).map(s => (
                <button key={s} onClick={() => setStyle(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all border"
                  style={{
                    background: style === s ? '#e8f0fe' : '#fff',
                    borderColor: style === s ? '#1a73e8' : '#dadce0',
                    color: style === s ? '#1a73e8' : '#5f6368',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 font-medium py-2.5 rounded-lg text-sm transition-colors border"
            style={{ background: '#fff', borderColor: '#dadce0', color: '#5f6368' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f1f3f4'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="flex-1 font-semibold py-2.5 rounded-lg text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            style={{ background: '#1a73e8', color: '#fff' }}
            onMouseEnter={e => { if (title.trim()) (e.currentTarget as HTMLElement).style.background = '#1557b0'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#1a73e8'; }}
          >
            Create Project →
          </button>
        </div>
      </div>
    </div>
  );
}

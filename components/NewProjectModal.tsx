'use client';

import { useState } from 'react';
import { createProject } from '@/lib/data';
import { Project, Mode, Category, Platform, Style } from '@/lib/types';

interface Props {
  onClose: () => void;
  onCreate: () => void;
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
    onCreate();
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">New Project</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
        </div>

        <input
          type="text"
          placeholder="Project title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
        />

        <div className="space-y-2">
          <label className="text-gray-400 text-xs">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {(['school','club','internship','casual'] as Category[]).map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${category === c ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-gray-400 text-xs">Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {(['professional','personal'] as Mode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${mode === m ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-gray-400 text-xs">Platform</label>
          <div className="grid grid-cols-3 gap-2">
            {([['google-slides','Slides'],['powerpoint','PowerPoint'],[null,'None']] as [Platform, string][]).map(([val, label]) => (
              <button key={String(val)} onClick={() => setPlatform(val)}
                className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${platform === val ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-gray-400 text-xs">Style</label>
          <div className="flex flex-wrap gap-2">
            {(['minimal','corporate','academic','fun','meme'] as Style[]).map(s => (
              <button key={s} onClick={() => setStyle(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${style === s ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!title.trim()}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg text-sm transition-colors"
        >
          Create Project
        </button>
      </div>
    </div>
  );
}

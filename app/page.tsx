'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import NewProjectModal from '@/components/NewProjectModal';
import { initData, getProjects, getSessions, getAssets } from '@/lib/data';
import { Project, SessionScore } from '@/lib/types';

const CATEGORY_LABELS: Record<string, string> = {
  school: 'School', club: 'Club', internship: 'Internship', casual: 'Casual',
};

function progressCount(p: Project) {
  return Object.values(p.progressStatus).filter(Boolean).length;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<SessionScore[]>([]);
  const [assetCounts, setAssetCounts] = useState<Record<string, number>>({});
  const [showModal, setShowModal] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);

  function refresh() {
    const projs = getProjects();
    setProjects(projs);
    setSessions(getSessions());
    const counts: Record<string, number> = {};
    projs.forEach(p => { counts[p.id] = getAssets(p.id).length; });
    setAssetCounts(counts);
    for (const p of projs) {
      const assets = getAssets(p.id);
      if (assets.length > 0) { setFeaturedImage(assets[assets.length - 1].url); break; }
    }
  }

  useEffect(() => {
    initData();
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const latestScore = sessions.length ? sessions[sessions.length - 1].avgScore : 0;
  const firstScore = sessions.length ? sessions[0].avgScore : 0;
  const scoreDelta = latestScore - firstScore;
  const next = projects.find(p => progressCount(p) < 4) ?? projects[0];

  return (
    <AppShell slideImage={featuredImage}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b flex items-center justify-between" style={{ borderColor: '#e0e0e0' }}>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: '#9aa0a6', letterSpacing: '0.1em' }}>Dashboard</p>
            <h1 className="text-xl font-semibold" style={{ color: '#202124' }}>Your Projects</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-1.5"
            style={{ background: '#1a73e8', color: '#fff' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1557b0'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#1a73e8'; }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Score widget */}
          <div className="mx-5 mt-5 rounded-xl border overflow-hidden" style={{ borderColor: '#e0e0e0' }}>
            <div className="px-5 pt-4 pb-3 border-b" style={{ background: '#f8f9fa', borderColor: '#e0e0e0' }}>
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#9aa0a6', letterSpacing: '0.1em' }}>AI Literacy Score</p>
            </div>
            <div className="px-5 py-4" style={{ background: '#fff' }}>
              <div className="flex items-end justify-between mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold" style={{ color: '#202124', fontSize: '48px', lineHeight: 1 }}>{latestScore}</span>
                  <span className="text-lg font-normal" style={{ color: '#9aa0a6' }}>/100</span>
                  {scoreDelta > 0 && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#e6f4ea', color: '#188038' }}>
                      +{scoreDelta} pts
                    </span>
                  )}
                </div>
                {/* Mini bar chart */}
                <div className="flex items-end gap-1.5 h-10">
                  {sessions.map((s, i) => (
                    <div key={i} title={`Session ${s.session}: ${s.avgScore}`} className="w-2.5 rounded-sm transition-all"
                      style={{
                        height: `${Math.max(6, (s.avgScore / 100) * 40)}px`,
                        background: i === sessions.length - 1 ? '#1a73e8' : '#e8eaed',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-xs" style={{ color: '#9aa0a6' }}>
                <span>Session 1 — {firstScore}</span>
                <span>Now — {latestScore}</span>
              </div>
              <p className="text-xs mt-2.5 leading-relaxed" style={{ color: '#9aa0a6' }}>
                Every prompt — professional or personal — builds this score.
              </p>
            </div>
          </div>

          {/* Continue card */}
          {next && (() => {
            const remaining = (['cover','diagram','divider','extras'] as const).find(k => !next.progressStatus[k]);
            const action = remaining ? `Next: create a ${remaining} visual` : 'All visuals complete';
            const isPro = next.mode === 'professional';
            return (
              <div className="px-5 mt-5">
                <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#9aa0a6', letterSpacing: '0.1em' }}>Continue</p>
                <div
                  className="rounded-xl border cursor-pointer transition-all"
                  style={{ background: '#fff', borderColor: '#e0e0e0' }}
                  onClick={() => router.push(`/project/${next.id}`)}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#1a73e8';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 6px rgba(26,115,232,0.15)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#e0e0e0';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-center gap-4 px-4 py-3.5">
                    <div className="w-1 h-10 rounded-full shrink-0" style={{ background: isPro ? '#1a73e8' : '#e8710a' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#202124' }}>{next.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#9aa0a6' }}>{action} · {progressCount(next)}/4 done</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: '#1a73e8', flexShrink: 0 }}>
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {/* Progress bar */}
                  <div className="px-4 pb-3 flex gap-1.5">
                    {Object.entries(next.progressStatus).map(([key, done]) => (
                      <div key={key} className="h-1 flex-1 rounded-full" style={{ background: done ? (isPro ? '#1a73e8' : '#e8710a') : '#e8eaed' }} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Project list */}
          <div className="px-5 mt-5 pb-6">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#9aa0a6', letterSpacing: '0.1em' }}>Projects</p>
            <div className="space-y-2">
              {projects.map(p => {
                const isPro = p.mode === 'professional';
                return (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/project/${p.id}`)}
                    className="rounded-xl border cursor-pointer transition-all"
                    style={{ background: '#fff', borderColor: '#e0e0e0' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#dadce0';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#e0e0e0';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                      <div className="w-1 h-8 rounded-full shrink-0" style={{ background: isPro ? '#1a73e8' : '#e8710a' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold truncate" style={{ color: '#202124' }}>{p.title}</p>
                          <span className="text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full"
                            style={{ background: isPro ? '#e8f0fe' : '#fce8d8', color: isPro ? '#1a73e8' : '#e8710a' }}>
                            {isPro ? 'Pro' : 'Personal'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs" style={{ color: '#9aa0a6' }}>
                            {CATEGORY_LABELS[p.category]}{p.platform ? ` · ${p.platform === 'google-slides' ? 'Slides' : 'PPT'}` : ''}
                          </span>
                          <span className="text-xs" style={{ color: '#bdc1c6' }}>
                            {assetCounts[p.id] ?? 0} assets · {formatDate(p.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 pb-3 flex gap-1.5">
                      {Object.entries(p.progressStatus).map(([key, done]) => (
                        <div key={key} className="h-1 flex-1 rounded-full" style={{ background: done ? (isPro ? '#1a73e8' : '#e8710a') : '#e8eaed' }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {projects.length === 0 && (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-medium mb-1" style={{ color: '#5f6368' }}>No projects yet</p>
              <p className="text-xs" style={{ color: '#9aa0a6' }}>Create one to start building AI literacy</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreate={(projectId) => { setShowModal(false); router.push(`/project/${projectId}`); }}
        />
      )}
    </AppShell>
  );
}

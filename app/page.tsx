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
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: '#1a1a26' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase mb-0.5" style={{ color: '#33334a', letterSpacing: '0.1em' }}>Dashboard</p>
              <h1 className="text-lg font-semibold tracking-tight" style={{ color: '#f0f0f8' }}>Your Projects</h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-all"
              style={{ background: '#4f6ef7', color: '#fff' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#6080ff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4f6ef7'; }}
            >
              + New
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Score section */}
          <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: '#1a1a26' }}>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#44445a' }}>AI Literacy Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight" style={{ color: '#f0f0f8', lineHeight: 1 }}>{latestScore}</span>
                  <span className="text-sm" style={{ color: '#33334a' }}>/100</span>
                  {scoreDelta > 0 && (
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: '#0d2a1a', color: '#3d9970' }}>
                      +{scoreDelta}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-end gap-1 h-8">
                {sessions.map((s, i) => (
                  <div
                    key={i}
                    title={`Session ${s.session}: ${s.avgScore}`}
                    className="w-2 rounded-sm transition-all"
                    style={{
                      height: `${Math.max(4, (s.avgScore / 100) * 32)}px`,
                      background: i === sessions.length - 1 ? '#4f6ef7' : '#22223a',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between text-xs" style={{ color: '#33334a' }}>
              <span>Session 1 — {firstScore}</span>
              <span>Now — {latestScore}</span>
            </div>
          </div>

          {/* Next step */}
          {next && (() => {
            const remaining = (['cover','diagram','divider','extras'] as const).find(k => !next.progressStatus[k]);
            const action = remaining ? `Next: ${remaining} visual` : 'All visuals complete';
            return (
              <div
                className="mx-5 mt-4 rounded-md px-4 py-3 cursor-pointer transition-all border"
                style={{ background: '#0e0e1a', borderColor: '#2a2a44' }}
                onClick={() => router.push(`/project/${next.id}`)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#4f6ef7'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a44'; }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full shrink-0" style={{ background: next.mode === 'professional' ? '#3b82f6' : '#f59e0b' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium tracking-tight truncate" style={{ color: '#d0d0e8' }}>{next.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#44445a' }}>{action} · {progressCount(next)}/4 done</p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: '#4f6ef7' }}>→</span>
                </div>
              </div>
            );
          })()}

          {/* Projects list */}
          <div className="px-5 mt-5">
            <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: '#33334a', letterSpacing: '0.1em' }}>
              Projects
            </p>
            <div className="space-y-px">
              {projects.map(p => {
                const isPro = p.mode === 'professional';
                const done = progressCount(p);
                return (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/project/${p.id}`)}
                    className="group cursor-pointer rounded-md px-3 py-3 transition-all"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#12121c'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Mode bar */}
                      <div className="w-0.5 h-full min-h-[36px] rounded-full self-stretch shrink-0 mt-0.5" style={{ background: isPro ? '#3b82f6' : '#f59e0b', opacity: 0.7 }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-medium tracking-tight truncate" style={{ color: '#d8d8f0' }}>{p.title}</p>
                          <span className="text-xs shrink-0 font-medium" style={{ color: isPro ? '#6090d0' : '#c09040' }}>
                            {isPro ? 'Pro' : 'Personal'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs capitalize" style={{ color: '#33334a' }}>{CATEGORY_LABELS[p.category]}</span>
                            {p.platform && <span className="text-xs" style={{ color: '#2a2a3a' }}>· {p.platform === 'google-slides' ? 'Slides' : 'PPT'}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: '#2a2a3a' }}>{assetCounts[p.id] ?? 0} assets</span>
                            <span className="text-xs" style={{ color: '#22222e' }}>·</span>
                            <span className="text-xs" style={{ color: '#2a2a3a' }}>{formatDate(p.updatedAt)}</span>
                          </div>
                        </div>
                        {/* Progress pills */}
                        <div className="flex gap-1 mt-2">
                          {Object.entries(p.progressStatus).map(([key, done_]) => (
                            <div key={key} className="h-0.5 flex-1 rounded-full" style={{ background: done_ ? (isPro ? '#3b82f6' : '#f59e0b') : '#1e1e2a' }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {projects.length === 0 && (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-medium mb-1" style={{ color: '#44445a' }}>No projects yet</p>
              <p className="text-xs" style={{ color: '#22223a' }}>Create one to start building AI literacy</p>
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

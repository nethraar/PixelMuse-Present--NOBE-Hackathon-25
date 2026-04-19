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
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: '#1e1e30' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: '#4a4a68', letterSpacing: '0.12em' }}>Dashboard</p>
              <h1 className="text-lg font-semibold tracking-tight" style={{ color: '#eeeef8' }}>Your Projects</h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all"
              style={{ background: '#5b7af8', color: '#fff' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#6f8cff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#5b7af8'; }}
            >
              + New
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Score section */}
          <div className="px-5 pt-5 pb-5 border-b" style={{ borderColor: '#1e1e30' }}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#4a4a68', letterSpacing: '0.12em' }}>AI Literacy Score</p>
            <div className="flex items-end justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <span className="font-bold tracking-tight" style={{ color: '#eeeef8', fontSize: '42px', lineHeight: 1 }}>{latestScore}</span>
                <span className="text-base" style={{ color: '#4a4a68' }}>/100</span>
                {scoreDelta > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-sm" style={{ background: '#0d2a1a', color: '#3eca7a' }}>
                    +{scoreDelta}
                  </span>
                )}
              </div>
              {/* Session bars */}
              <div className="flex items-end gap-1 h-9">
                {sessions.map((s, i) => (
                  <div
                    key={i}
                    title={`Session ${s.session}: ${s.avgScore}`}
                    className="w-2 rounded-sm"
                    style={{
                      height: `${Math.max(4, (s.avgScore / 100) * 36)}px`,
                      background: i === sessions.length - 1 ? '#5b7af8' : '#1e1e30',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between" style={{ color: '#6868a0', fontSize: '11px' }}>
              <span>Session 1 — {firstScore}</span>
              <span>Now — {latestScore}</span>
            </div>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: '#5858809' }}>
              Every prompt — professional or personal — builds this score.
            </p>
          </div>

          {/* Next step */}
          {next && (() => {
            const remaining = (['cover','diagram','divider','extras'] as const).find(k => !next.progressStatus[k]);
            const action = remaining ? `Next: ${remaining} visual` : 'All visuals complete';
            return (
              <div className="px-5 pt-4">
                <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#4a4a68', letterSpacing: '0.12em' }}>Continue</p>
                <div
                  className="rounded-md px-4 py-3 cursor-pointer transition-all border"
                  style={{ background: '#111120', borderColor: '#252538' }}
                  onClick={() => router.push(`/project/${next.id}`)}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#5b7af8'; (e.currentTarget as HTMLElement).style.background = '#14142a'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#252538'; (e.currentTarget as HTMLElement).style.background = '#111120'; }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-0.5 h-8 rounded-full shrink-0" style={{ background: next.mode === 'professional' ? '#4b8ef0' : '#f0a030' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium tracking-tight truncate" style={{ color: '#ddddf0' }}>{next.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6868a0' }}>{action} · {progressCount(next)}/4 done</p>
                    </div>
                    <span className="text-sm shrink-0" style={{ color: '#5b7af8' }}>→</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Projects list */}
          <div className="px-5 mt-5 pb-4">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#4a4a68', letterSpacing: '0.12em' }}>
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
                    className="cursor-pointer rounded-md px-3 py-3 transition-all border"
                    style={{ background: 'transparent', borderColor: 'transparent' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = '#111120';
                      (e.currentTarget as HTMLElement).style.borderColor = '#252538';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-0.5 min-h-[40px] rounded-full self-stretch shrink-0 mt-0.5" style={{ background: isPro ? '#4b8ef0' : '#f0a030' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-medium tracking-tight truncate" style={{ color: '#ddddf0' }}>{p.title}</p>
                          <span className="text-xs shrink-0 font-semibold" style={{ color: isPro ? '#4b8ef0' : '#f0a030' }}>
                            {isPro ? 'Pro' : 'Personal'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: '#7878a0' }}>{CATEGORY_LABELS[p.category]}</span>
                            {p.platform && <span className="text-xs" style={{ color: '#5050809' }}>· {p.platform === 'google-slides' ? 'Slides' : 'PPT'}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: '#5050809' }}>{assetCounts[p.id] ?? 0} assets</span>
                            <span className="text-xs" style={{ color: '#3a3a58' }}>·</span>
                            <span className="text-xs" style={{ color: '#5050809' }}>{formatDate(p.updatedAt)}</span>
                          </div>
                        </div>
                        {/* Progress pills */}
                        <div className="flex gap-1">
                          {Object.entries(p.progressStatus).map(([key, done_]) => (
                            <div key={key} className="h-0.5 flex-1 rounded-full" style={{ background: done_ ? (isPro ? '#4b8ef0' : '#f0a030') : '#1e1e30' }} />
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
              <p className="text-sm font-medium mb-1" style={{ color: '#6868a0' }}>No projects yet</p>
              <p className="text-xs" style={{ color: '#3a3a58' }}>Create one to start building AI literacy</p>
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

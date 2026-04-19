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

  function refresh() {
    const projs = getProjects();
    setProjects(projs);
    setSessions(getSessions());
    const counts: Record<string, number> = {};
    projs.forEach(p => { counts[p.id] = getAssets(p.id).length; });
    setAssetCounts(counts);
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

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        {/* Score trajectory widget */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold text-sm">AI Literacy Score</span>
            <span className="text-violet-400 font-bold text-lg">{latestScore}<span className="text-gray-500 text-xs">/100</span></span>
          </div>
          <div className="flex items-end gap-1.5 h-10 mb-2">
            {sessions.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-end" title={`Session ${s.session}: ${s.avgScore}`}>
                <div
                  className={`w-full rounded-t transition-all ${i === sessions.length - 1 ? 'bg-violet-500' : 'bg-gray-700'}`}
                  style={{ height: `${(s.avgScore / 100) * 40}px` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Session 1: {firstScore}</span>
            <span>Now: {latestScore} {latestScore > firstScore ? `↑${latestScore - firstScore} pts` : ''}</span>
          </div>
          <p className="text-gray-500 text-xs mt-2">Every prompt — professional or personal — builds this score.</p>
        </div>

        {/* Next step suggestion */}
        {(() => {
          const next = projects.find(p => progressCount(p) < 4) ?? projects[0];
          if (!next) return null;
          const remaining = (['cover','diagram','divider','extras'] as const).find(k => !next.progressStatus[k]);
          const action = remaining ? `Next: create a ${remaining} visual` : 'All visuals done — share your project!';
          return (
            <div
              className="bg-violet-950 border border-violet-800 rounded-xl p-3 flex items-start gap-3 cursor-pointer hover:bg-violet-900 transition-colors"
              onClick={() => router.push(`/project/${next.id}`)}
            >
              <div className="text-violet-400 text-lg mt-0.5">→</div>
              <div>
                <p className="text-violet-200 text-sm font-medium">Continue {next.title}</p>
                <p className="text-violet-400 text-xs mt-0.5">{action} — {progressCount(next)}/4 done</p>
              </div>
            </div>
          );
        })()}

        {/* Projects header */}
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold text-sm">Projects</span>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            + New
          </button>
        </div>

        {/* Project cards */}
        <div className="space-y-2">
          {projects.map(p => (
            <div
              key={p.id}
              onClick={() => router.push(`/project/${p.id}`)}
              className="bg-gray-900 border border-gray-800 rounded-xl p-3 cursor-pointer hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-white text-sm font-medium leading-tight">{p.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${p.mode === 'professional' ? 'bg-blue-900 text-blue-300' : 'bg-amber-900 text-amber-300'}`}>
                  {p.mode === 'professional' ? '🎓 Pro' : '🎉 Personal'}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2 items-center">
                  <span className="text-gray-500 text-xs">{CATEGORY_LABELS[p.category]}</span>
                  {p.platform && <span className="text-gray-600 text-xs">· {p.platform === 'google-slides' ? 'Google Slides' : 'PowerPoint'}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs">{assetCounts[p.id] ?? 0} assets</span>
                  <span className="text-gray-700 text-xs">·</span>
                  <span className="text-gray-600 text-xs">{formatDate(p.updatedAt)}</span>
                </div>
              </div>
              <div className="flex gap-1">
                {Object.entries(p.progressStatus).map(([key, done]) => (
                  <div key={key} className={`h-1 flex-1 rounded-full ${done ? p.mode === 'professional' ? 'bg-blue-500' : 'bg-amber-500' : 'bg-gray-800'}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreate={(projectId) => {
            setShowModal(false);
            router.push(`/project/${projectId}`);
          }}
        />
      )}
    </AppShell>
  );
}

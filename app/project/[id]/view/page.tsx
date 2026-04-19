'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProject, getAssets } from '@/lib/data';
import { Project, Asset } from '@/lib/types';

export default function PublicProjectView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try decoding from URL hash first (shared link)
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(hash))));
        setProject(decoded.project);
        setAssets(decoded.assets ?? []);
        setLoading(false);
        return;
      } catch {
        // fall through to localStorage
      }
    }
    // Fallback: read from localStorage (same browser)
    const p = getProject(id);
    setProject(p);
    if (p) setAssets(getAssets(id));
    setLoading(false);
  }, [id]);

  const avgScore = assets.length
    ? Math.round(assets.reduce((sum, a) => sum + a.promptScore.overall, 0) / assets.length)
    : 0;

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500 text-sm">Loading project...</div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center flex-col gap-4">
      <p className="text-gray-500">Project not found.</p>
      <button onClick={() => router.push('/')} className="text-violet-400 text-sm hover:underline">Start your own →</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold">P</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-semibold truncate">{project.title}</h1>
              <p className="text-gray-500 text-xs capitalize">{project.category} · {project.mode} mode</p>
            </div>
          </div>
          {/* AI Literacy Score badge */}
          <div className="bg-violet-950 border border-violet-800 rounded-xl px-4 py-2 text-center shrink-0">
            <p className="text-violet-400 font-bold text-2xl leading-none">{avgScore}</p>
            <p className="text-violet-500 text-xs mt-0.5">AI Literacy Score</p>
          </div>
        </div>
      </div>

      {/* Assets grid */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {assets.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">No visuals in this project yet.</p>
            <button onClick={() => router.push('/')} className="text-violet-400 text-sm hover:underline">Start your own project →</button>
          </div>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-5">
              {assets.length} original visual{assets.length !== 1 ? 's' : ''} — generated with PixelMuse Present
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {assets.map(a => (
                <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <img src={a.url} alt={a.prompt} className="w-full aspect-video object-cover" />
                  <div className="p-3">
                    <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">{a.prompt}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${a.mode === 'professional' ? 'bg-blue-900 text-blue-300' : 'bg-amber-900 text-amber-300'}`}>
                        {a.mode === 'professional' ? 'Pro' : 'Personal'}
                      </span>
                      <span className="text-violet-400 text-xs font-medium">{a.promptScore.overall}/100</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="border-t border-gray-800 bg-gray-900 fixed bottom-0 left-0 right-0">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm">Made with PixelMuse Present</p>
            <p className="text-gray-500 text-xs truncate">AI literacy trainer · meaningfully safer than pulling copyrighted images</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="shrink-0 bg-violet-600 hover:bg-violet-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
          >
            Start your own →
          </button>
        </div>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    const p = getProject(id);
    setProject(p);
    if (p) setAssets(getAssets(id));
  }, [id]);

  const avgScore = assets.length
    ? Math.round(assets.reduce((sum, a) => sum + a.promptScore.overall, 0) / assets.length)
    : 0;

  if (!project) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-500">Project not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <div>
              <h1 className="text-white font-semibold">{project.title}</h1>
              <p className="text-gray-500 text-xs capitalize">{project.category} · {project.mode} mode</p>
            </div>
          </div>
          {/* AI Literacy Score badge */}
          <div className="bg-violet-950 border border-violet-800 rounded-xl px-4 py-2 text-center">
            <p className="text-violet-400 font-bold text-xl leading-none">{avgScore}</p>
            <p className="text-violet-500 text-xs mt-0.5">AI Literacy Score</p>
          </div>
        </div>
      </div>

      {/* Assets grid */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {assets.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No visuals in this project yet.</p>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-4">{assets.length} original visual{assets.length !== 1 ? 's' : ''} — generated with PixelMuse Present</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {assets.map(a => (
                <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <img src={a.url} alt={a.prompt} className="w-full aspect-video object-cover" />
                  <div className="p-3">
                    <p className="text-gray-400 text-xs line-clamp-2">{a.prompt}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-600 text-xs capitalize">{a.mode}</span>
                      <span className="text-violet-400 text-xs font-medium">{a.promptScore.overall}/100</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="border-t border-gray-800 bg-gray-900 sticky bottom-0">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-sm">Made with PixelMuse Present</p>
            <p className="text-gray-500 text-xs">AI literacy trainer for students · meaningfully safer than pulling copyrighted images</p>
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

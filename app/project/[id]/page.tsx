'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { getProject, getAssets, saveAsset, saveProject } from '@/lib/data';
import { Project, Asset, Mode, PromptScore } from '@/lib/types';

declare const puter: any;

const PRO_CHIPS = [
  'Clean title slide visual', 'Minimalist process diagram',
  'Academic cover image', 'Data visualization chart',
  'Section divider, professional', 'Timeline graphic, minimal',
];
const PERSONAL_CHIPS = [
  'Funny birthday meme', 'Group chat reaction image',
  'Meme-style party invite', 'Cartoon celebration visual',
  'Fun collage background', 'Vibrant social graphic',
];

type Tab = 'generate' | 'assets' | 'export';

function ScoreDisplay({ score }: { score: PromptScore }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 space-y-2 border border-gray-700">
      <div className="flex items-center justify-between">
        <span className="text-white font-semibold text-sm">Prompt Score</span>
        <span className="text-violet-400 font-bold">{score.overall}<span className="text-gray-500 text-xs">/100</span></span>
      </div>
      {[['Specificity', score.specificity], ['Style', score.style], ['Context', score.context]].map(([label, val]) => (
        <div key={label as string} className="flex items-center gap-2">
          <span className="text-gray-400 text-xs w-16 shrink-0">{label as string}</span>
          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${val}%` }} />
          </div>
          <span className="text-gray-400 text-xs w-6 text-right">{val as number}</span>
        </div>
      ))}
      <p className="text-amber-300 text-xs pt-1">💡 {score.tip}</p>
    </div>
  );
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tab, setTab] = useState<Tab>('generate');
  const [mode, setMode] = useState<Mode>('professional');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [score, setScore] = useState<PromptScore | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getProject(id);
    if (!p) { router.push('/'); return; }
    setProject(p);
    setMode(p.mode);
    setAssets(getAssets(id));
  }, [id, router]);

  async function handleGenerate() {
    if (!prompt.trim() || !project) return;
    setGenerating(true);
    setGeneratedUrl(null);
    setScore(null);
    setSaved(false);

    const fullPrompt = `${mode === 'professional' ? 'Professional presentation visual' : 'Fun personal visual'}: ${prompt}. Project: ${project.title}. Style: ${project.style}.`;

    // Fire scorer + image gen simultaneously
    const [scoreRes] = await Promise.allSettled([
      fetch('/api/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: fullPrompt }) }).then(r => r.json()),
    ]);

    // Puter image generation
    try {
      const imgEl = await puter.ai.txt2img(fullPrompt);
      const url = imgEl?.src || imgEl;
      setGeneratedUrl(url);
    } catch {
      // Fallback placeholder if Puter fails
      setGeneratedUrl(`https://placehold.co/400x300/1e1b4b/a78bfa?text=${encodeURIComponent(prompt.slice(0, 20))}`);
    }

    if (scoreRes.status === 'fulfilled') setScore(scoreRes.value);
    setGenerating(false);
  }

  function handleSave() {
    if (!generatedUrl || !score || !project) return;
    const asset: Asset = {
      id: `asset-${Date.now()}`,
      projectId: project.id,
      url: generatedUrl,
      prompt,
      mode,
      createdAt: new Date().toISOString().split('T')[0],
      promptScore: score,
    };
    saveAsset(asset);
    setAssets(getAssets(project.id));
    setSaved(true);

    // Update project updatedAt
    saveProject({ ...project, updatedAt: new Date().toISOString().split('T')[0] });
  }

  function handleShareLink() {
    const url = `${window.location.origin}/project/${id}/view`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const chips = mode === 'professional' ? PRO_CHIPS : PERSONAL_CHIPS;

  if (!project) return null;

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Project header */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-800">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-300 text-xs mb-1 flex items-center gap-1">
            ← Dashboard
          </button>
          <h2 className="text-white font-semibold text-sm leading-tight">{project.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-500 text-xs capitalize">{project.category}</span>
            {project.platform && <span className="text-gray-600 text-xs">· {project.platform === 'google-slides' ? 'Google Slides' : 'PowerPoint'}</span>}
          </div>
          {/* Progress tracker */}
          <div className="flex gap-2 mt-2">
            {[['Cover','cover'],['Diagram','diagram'],['Divider','divider'],['Extras','extras']].map(([label, key]) => (
              <div key={key} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${project.progressStatus[key as keyof typeof project.progressStatus] ? 'bg-violet-500' : 'bg-gray-700'}`} />
                <span className="text-gray-500 text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(['generate','assets','export'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${tab === t ? 'text-violet-400 border-b-2 border-violet-500' : 'text-gray-500 hover:text-gray-300'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* GENERATE TAB */}
          {tab === 'generate' && (
            <>
              {/* Mode toggle */}
              <div className="flex bg-gray-900 rounded-lg p-1 gap-1">
                {(['professional','personal'] as Mode[]).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${mode === m ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                    {m}
                  </button>
                ))}
              </div>

              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-1.5">
                {chips.map(chip => (
                  <button key={chip} onClick={() => setPrompt(chip)}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full transition-colors border border-gray-700">
                    {chip}
                  </button>
                ))}
              </div>

              {/* Prompt input */}
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={mode === 'professional' ? 'Describe your presentation visual...' : 'Describe your image...'}
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
              />

              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {generating ? (
                  <><span className="animate-spin">⟳</span> Generating...</>
                ) : (
                  '✦ Generate with PixelMuse'
                )}
              </button>

              {/* Generated image */}
              {generatedUrl && (
                <div className="space-y-3">
                  <img src={generatedUrl} alt="Generated" className="w-full rounded-xl border border-gray-700 object-cover" />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saved}
                      className="flex-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-800 disabled:text-gray-500 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                    >
                      {saved ? '✓ Saved' : 'Save to Project'}
                    </button>
                    <button onClick={() => { setPrompt(''); setGeneratedUrl(null); setScore(null); setSaved(false); }}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors">
                      Clear
                    </button>
                  </div>
                  {score && <ScoreDisplay score={score} />}
                </div>
              )}
            </>
          )}

          {/* ASSETS TAB */}
          {tab === 'assets' && (
            <>
              <p className="text-gray-500 text-xs">{assets.length} saved visual{assets.length !== 1 ? 's' : ''}</p>
              {assets.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-sm">No saved assets yet.<br />Generate and save visuals first.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {assets.map(a => (
                    <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group">
                      <img src={a.url} alt={a.prompt} className="w-full aspect-video object-cover" />
                      <div className="p-2 space-y-1">
                        <p className="text-gray-400 text-xs leading-tight line-clamp-2">{a.prompt}</p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${a.mode === 'professional' ? 'bg-blue-900 text-blue-300' : 'bg-amber-900 text-amber-300'}`}>
                            {a.mode === 'professional' ? 'Pro' : 'Personal'}
                          </span>
                          <span className="text-violet-400 text-xs font-medium">{a.promptScore.overall}</span>
                        </div>
                        <button
                          onClick={() => { setPrompt(a.prompt); setMode(a.mode); setTab('generate'); }}
                          className="w-full text-xs text-gray-500 hover:text-violet-400 transition-colors text-left"
                        >
                          ↺ Reuse style
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* EXPORT TAB */}
          {tab === 'export' && (
            <div className="space-y-3">
              <p className="text-gray-400 text-xs">{assets.length} asset{assets.length !== 1 ? 's' : ''} ready to export</p>

              <button onClick={handleShareLink}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                {copied ? '✓ Link Copied!' : '🔗 Share Project Link'}
              </button>
              <p className="text-gray-600 text-xs text-center">Anyone with the link sees your project + can start their own</p>

              <div className="border-t border-gray-800 pt-3 space-y-2">
                {[
                  ['📊 Send to Google Slides', 'bg-blue-900 hover:bg-blue-800 text-blue-100'],
                  ['📝 Export to PowerPoint', 'bg-indigo-900 hover:bg-indigo-800 text-indigo-100'],
                  ['⬇️ Download PNG Assets', 'bg-gray-800 hover:bg-gray-700 text-gray-200'],
                ].map(([label, cls]) => (
                  <button key={label as string}
                    onClick={() => alert(`${label} — export simulation`)}
                    className={`w-full ${cls} font-medium py-2 rounded-xl text-sm transition-colors`}>
                    {label as string}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

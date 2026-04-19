'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { getProject, getAssets, saveAsset, saveProject, addSession } from '@/lib/data';
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

type Tab = 'generate' | 'assets' | 'brief' | 'export';

const CATEGORY_BRIEF: Record<string, string> = {
  school: 'Academic presentation — clean, clear, citation-friendly visuals.',
  club: 'Club/org pitch — engaging visuals that show personality and purpose.',
  internship: 'Professional work context — polished, minimal, business-appropriate.',
  casual: 'Personal/social use — fun, expressive, shareable visuals.',
};

function ScoreDisplay({ score, mode }: { score: PromptScore; mode: Mode }) {
  const accent = mode === 'professional' ? 'bg-blue-500' : 'bg-amber-500';
  const textAccent = mode === 'professional' ? 'text-blue-400' : 'text-amber-400';
  return (
    <div className="bg-gray-800 rounded-xl p-3 space-y-2 border border-gray-700">
      <div className="flex items-center justify-between">
        <span className="text-white font-semibold text-sm">Prompt Score</span>
        <span className={`font-bold ${textAccent}`}>{score.overall}<span className="text-gray-500 text-xs">/100</span></span>
      </div>
      {[['Specificity', score.specificity], ['Style', score.style], ['Context', score.context]].map(([label, val]) => (
        <div key={label as string} className="flex items-center gap-2">
          <span className="text-gray-400 text-xs w-16 shrink-0">{label as string}</span>
          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full ${accent} rounded-full`} style={{ width: `${val}%` }} />
          </div>
          <span className="text-gray-400 text-xs w-6 text-right">{val as number}</span>
        </div>
      ))}
      <p className="text-amber-300 text-xs pt-1">💡 {score.tip}</p>
    </div>
  );
}

async function downloadAssets(assets: Asset[], projectTitle: string) {
  for (let i = 0; i < assets.length; i++) {
    try {
      const res = await fetch(assets[i].url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectTitle.replace(/\s+/g, '-')}-asset-${i + 1}.png`;
      a.click();
      URL.revokeObjectURL(url);
      await new Promise(r => setTimeout(r, 300));
    } catch {
      // If CORS blocks blob download, open in new tab
      window.open(assets[i].url, '_blank');
    }
  }
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
  const [downloading, setDownloading] = useState(false);

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

    const scorePromise = fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: fullPrompt }),
    }).then(r => r.json()).then(s => { setScore(s); return s; }).catch(() => null);

    const imagePromise = (async () => {
      try {
        const imgEl = await puter.ai.txt2img(fullPrompt);
        const url = imgEl?.src || imgEl;
        setGeneratedUrl(url);
      } catch {
        setGeneratedUrl(`https://placehold.co/400x300/1e1b4b/a78bfa?text=${encodeURIComponent(prompt.slice(0, 20))}`);
      }
    })();

    await Promise.allSettled([scorePromise, imagePromise]);
    setGenerating(false);
  }

  function handleSave() {
    if (!generatedUrl || !project) return;
    const fallbackScore: PromptScore = { specificity: 50, style: 50, context: 50, overall: 50, tip: 'Add more detail to improve your score.' };
    const asset: Asset = {
      id: `asset-${Date.now()}`,
      projectId: project.id,
      url: generatedUrl,
      prompt,
      mode,
      createdAt: new Date().toISOString().split('T')[0],
      promptScore: score ?? fallbackScore,
    };
    saveAsset(asset);
    const updatedAssets = getAssets(project.id);
    setAssets(updatedAssets);
    setSaved(true);

    const avgScore = Math.round(
      updatedAssets.reduce((sum, a) => sum + a.promptScore.overall, 0) / updatedAssets.length
    );
    addSession(avgScore);
    saveProject({ ...project, updatedAt: new Date().toISOString().split('T')[0] });
  }

  function handleShareLink() {
    if (!project) return;
    const payload = { project, assets };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const url = `${window.location.origin}/project/${id}/view#${encoded}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownload() {
    if (!project || assets.length === 0) return;
    setDownloading(true);
    await downloadAssets(assets, project.title);
    setDownloading(false);
  }

  const chips = mode === 'professional' ? PRO_CHIPS : PERSONAL_CHIPS;
  const isPro = mode === 'professional';
  const modeAccent = isPro ? 'bg-blue-600 hover:bg-blue-500' : 'bg-amber-500 hover:bg-amber-400';
  const modeChipBorder = isPro ? 'border-blue-900 hover:border-blue-700' : 'border-amber-900 hover:border-amber-700';

  if (!project) return null;

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Project header */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-800">
          <button
            onClick={() => { window.dispatchEvent(new Event('storage')); router.push('/'); }}
            className="text-gray-500 hover:text-gray-300 text-xs mb-1 flex items-center gap-1"
          >
            ← Dashboard
          </button>
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-white font-semibold text-sm leading-tight">{project.title}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${isPro ? 'bg-blue-900 text-blue-300' : 'bg-amber-900 text-amber-300'}`}>
              {isPro ? '🎓 Pro' : '🎉 Personal'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-gray-500 text-xs capitalize">{project.category}</span>
            {project.platform && <span className="text-gray-600 text-xs">· {project.platform === 'google-slides' ? 'Google Slides' : 'PowerPoint'}</span>}
            <span className="text-gray-700 text-xs">· {assets.length} assets</span>
          </div>
          {/* Progress tracker */}
          <div className="flex gap-2 mt-2">
            {([['Cover','cover'],['Diagram','diagram'],['Divider','divider'],['Extras','extras']] as [string,keyof typeof project.progressStatus][]).map(([label, key]) => {
              const done = project.progressStatus[key];
              return (
                <button key={key} onClick={() => {
                  const updated = { ...project, progressStatus: { ...project.progressStatus, [key]: !done } };
                  saveProject(updated);
                  setProject(updated);
                }} className="flex items-center gap-1 group">
                  <div className={`w-2 h-2 rounded-full transition-colors ${done ? isPro ? 'bg-blue-500' : 'bg-amber-500' : 'bg-gray-700 group-hover:bg-gray-500'}`} />
                  <span className={`text-xs transition-colors ${done ? isPro ? 'text-blue-400' : 'text-amber-400' : 'text-gray-500 group-hover:text-gray-400'}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(['generate','assets','brief','export'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${tab === t ? `${isPro ? 'text-blue-400 border-b-2 border-blue-500' : 'text-amber-400 border-b-2 border-amber-500'}` : 'text-gray-500 hover:text-gray-300'}`}>
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
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === m ? m === 'professional' ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                    {m === 'professional' ? '🎓 Professional' : '🎉 Personal'}
                  </button>
                ))}
              </div>

              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-1.5">
                {chips.map(chip => (
                  <button key={chip} onClick={() => setPrompt(chip)}
                    className={`text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full transition-colors border ${modeChipBorder}`}>
                    {chip}
                  </button>
                ))}
              </div>

              {/* Prompt input */}
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={isPro ? 'Describe your presentation visual...' : 'Describe your fun image...'}
                rows={3}
                className={`w-full bg-gray-900 border rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none resize-none transition-colors ${isPro ? 'border-gray-700 focus:border-blue-500' : 'border-gray-700 focus:border-amber-500'}`}
              />

              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className={`w-full ${modeAccent} disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2`}
              >
                {generating ? (
                  <><span className="animate-spin inline-block">⟳</span> Generating...</>
                ) : (
                  '✦ Generate with PixelMuse'
                )}
              </button>

              {generatedUrl && (
                <div className="space-y-3">
                  <img src={generatedUrl} alt="Generated" className="w-full rounded-xl border border-gray-700 object-cover" />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saved}
                      className="flex-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-800 disabled:text-gray-500 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                    >
                      {saved ? '✓ Saved to Project' : 'Save to Project'}
                    </button>
                    <button
                      onClick={() => { setPrompt(''); setGeneratedUrl(null); setScore(null); setSaved(false); }}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  {score && <ScoreDisplay score={score} mode={mode} />}
                </div>
              )}
            </>
          )}

          {/* ASSETS TAB */}
          {tab === 'assets' && (
            <>
              <p className="text-gray-500 text-xs">{assets.length} saved visual{assets.length !== 1 ? 's' : ''}</p>
              {assets.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-sm">
                  No saved assets yet.<br />Generate and save visuals first.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {assets.map(a => (
                    <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                      <img src={a.url} alt={a.prompt} className="w-full aspect-video object-cover" />
                      <div className="p-2 space-y-1">
                        <p className="text-gray-400 text-xs leading-tight line-clamp-2">{a.prompt}</p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${a.mode === 'professional' ? 'bg-blue-900 text-blue-300' : 'bg-amber-900 text-amber-300'}`}>
                            {a.mode === 'professional' ? '🎓 Pro' : '🎉 Personal'}
                          </span>
                          <span className={`text-xs font-medium ${a.mode === 'professional' ? 'text-blue-400' : 'text-amber-400'}`}>{a.promptScore.overall}</span>
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

          {/* BRIEF TAB */}
          {tab === 'brief' && (
            <div className="space-y-4">
              <div className={`rounded-xl p-3 border ${isPro ? 'bg-blue-950 border-blue-900' : 'bg-amber-950 border-amber-900'}`}>
                <p className={`text-xs font-medium mb-1 ${isPro ? 'text-blue-400' : 'text-amber-400'}`}>
                  {isPro ? '🎓 Professional Mode' : '🎉 Personal Mode'}
                </p>
                <p className={`text-sm ${isPro ? 'text-blue-200' : 'text-amber-200'}`}>
                  {isPro
                    ? 'Generating clean, slide-ready visuals for presentations. Prompts are tuned for clarity, minimal design, and professional context.'
                    : 'Generating fun, expressive visuals for personal use. Prompts are tuned for creativity, humor, and shareability.'}
                </p>
              </div>

              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 space-y-3">
                <p className="text-white font-semibold text-sm">Project Details</p>
                {[
                  ['Title', project.title],
                  ['Category', `${project.category.charAt(0).toUpperCase() + project.category.slice(1)} — ${CATEGORY_BRIEF[project.category]}`],
                  ['Platform', project.platform === 'google-slides' ? 'Google Slides' : project.platform === 'powerpoint' ? 'PowerPoint' : 'No platform set'],
                  ['Style', project.style.charAt(0).toUpperCase() + project.style.slice(1)],
                  ['Created', project.createdAt],
                  ['Last updated', project.updatedAt],
                  ['Assets saved', `${assets.length} visual${assets.length !== 1 ? 's' : ''}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-2">
                    <span className="text-gray-500 text-xs w-24 shrink-0">{label}</span>
                    <span className="text-gray-300 text-xs leading-relaxed">{value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
                <p className="text-white font-semibold text-sm mb-2">Visual Checklist</p>
                {([['Cover', 'cover'], ['Diagram', 'diagram'], ['Section Divider', 'divider'], ['Extras', 'extras']] as [string, keyof typeof project.progressStatus][]).map(([label, key]) => (
                  <button key={key} onClick={() => {
                    const updated = { ...project, progressStatus: { ...project.progressStatus, [key]: !project.progressStatus[key] } };
                    saveProject(updated);
                    setProject(updated);
                  }} className="w-full flex items-center gap-3 py-2 border-b border-gray-800 last:border-0 hover:bg-gray-800 rounded px-1 transition-colors">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${project.progressStatus[key] ? isPro ? 'bg-blue-500 border-blue-500' : 'bg-amber-500 border-amber-500' : 'border-gray-600'}`}>
                      {project.progressStatus[key] && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className={`text-sm ${project.progressStatus[key] ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{label} visual</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* EXPORT TAB */}
          {tab === 'export' && (
            <div className="space-y-3">
              <p className="text-gray-400 text-xs">{assets.length} asset{assets.length !== 1 ? 's' : ''} ready to export</p>

              <button onClick={handleShareLink}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                {copied ? '✓ Link Copied!' : '🔗 Share Project Link'}
              </button>
              <p className="text-gray-600 text-xs text-center">Shared link shows your project + prompts recipient to start their own</p>

              <div className="border-t border-gray-800 pt-3 space-y-2">
                <button
                  onClick={() => alert('📊 Google Slides integration — coming in v2. Download PNGs and insert manually for now.')}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-blue-100 font-medium py-2 rounded-xl text-sm transition-colors"
                >
                  📊 Send to Google Slides
                </button>
                <button
                  onClick={() => alert('📝 PowerPoint integration — coming in v2. Download PNGs and insert manually for now.')}
                  className="w-full bg-indigo-900 hover:bg-indigo-800 text-indigo-100 font-medium py-2 rounded-xl text-sm transition-colors"
                >
                  📝 Export to PowerPoint
                </button>
                <button
                  onClick={handleDownload}
                  disabled={assets.length === 0 || downloading}
                  className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 font-medium py-2 rounded-xl text-sm transition-colors"
                >
                  {downloading ? 'Downloading...' : `⬇️ Download ${assets.length} PNG Asset${assets.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

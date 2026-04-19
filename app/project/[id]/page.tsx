'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell, { PlacedItem } from '@/components/AppShell';
import { getProject, getAssets, saveAsset, saveProject, addSession } from '@/lib/data';
import { Project, Asset, Mode, Style, PromptScore } from '@/lib/types';


const STYLE_LOOK: Record<string, string> = {
  minimal:  'minimalist, clean, white background, simple shapes',
  corporate:'corporate, sleek, professional, modern',
  academic: 'educational, clean diagram style, organized',
  fun:      'colorful, playful, vibrant, cartoon',
  meme:     'bold, high contrast, simple, pop art',
};

function buildImagePrompt(userPrompt: string, mode: Mode, style: Style, iconMode: boolean): string {
  if (iconMode) {
    // Icon mode: flat vector on pure white — critical for Remove BG to work via blend mode
    return `flat vector icon, ${userPrompt}, pure white background, simple clean shapes, flat design, no shadows, no gradients, no 3D effects, minimal, solid colors, SVG style, no text, no letters`;
  }
  const look = STYLE_LOOK[style] ?? 'clean, modern';
  const prefix = mode === 'professional'
    ? 'professional presentation visual,'
    : 'fun digital graphic,';
  return `${prefix} ${userPrompt}, ${look}, no text, no letters, no watermarks`;
}

// Canvas-based background removal: samples corner pixels as bg color, removes similar pixels
async function canvasRemoveBg(dataUrl: string, tolerance = 35): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Sample 4 corners + center-edges to determine bg color
      const samples = [
        [0,0], [w-1,0], [0,h-1], [w-1,h-1],
        [Math.floor(w/2),0], [0,Math.floor(h/2)],
      ];
      let rSum = 0, gSum = 0, bSum = 0;
      for (const [x,y] of samples) {
        const i = (y * w + x) * 4;
        rSum += d[i]; gSum += d[i+1]; bSum += d[i+2];
      }
      const bgR = rSum / samples.length;
      const bgG = gSum / samples.length;
      const bgB = bSum / samples.length;

      // Remove pixels within tolerance of bg color (simple threshold, no flood fill)
      for (let i = 0; i < d.length; i += 4) {
        const diff = Math.abs(d[i] - bgR) + Math.abs(d[i+1] - bgG) + Math.abs(d[i+2] - bgB);
        if (diff < tolerance * 3) {
          // Fade out pixels near bg (smooth edges)
          const alpha = Math.min(255, Math.round((diff / (tolerance * 3)) * 255 * 2));
          d[i+3] = alpha;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl); // fallback: return original
    img.src = dataUrl;
  });
}

async function loadPDFJS(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).pdfjsLib) return (window as any).pdfjsLib;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return (window as any).pdfjsLib;
}

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
  const isPro = mode === 'professional';
  const barColor = isPro ? 'bg-blue-500' : 'bg-amber-500';
  const textAccent = isPro ? 'text-blue-400' : 'text-amber-400';
  const bgAccent = isPro ? 'bg-blue-950 border-blue-900' : 'bg-amber-950 border-amber-900';
  const scoreColor = score.overall >= 70 ? 'text-green-400' : score.overall >= 45 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="rounded-xl border border-gray-700 overflow-hidden" style={{ background: '#111118' }}>
      <div className={`px-4 py-3 flex items-center justify-between border-b border-gray-800 ${bgAccent}`}>
        <div>
          <p className="text-white font-semibold text-sm">Prompt Quality Score</p>
          <p className="text-gray-500 text-xs mt-0.5">Your AI literacy rating</p>
        </div>
        <div className="text-right">
          <span className={`font-bold text-2xl leading-none ${scoreColor}`}>{score.overall}</span>
          <span className="text-gray-500 text-sm">/100</span>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        {([['Specificity', score.specificity], ['Style', score.style], ['Context', score.context]] as [string, number][]).map(([label, val]) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-gray-400 text-xs w-20 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${val}%` }} />
            </div>
            <span className={`text-xs w-7 text-right font-medium ${textAccent}`}>{val}</span>
          </div>
        ))}
        <div className={`mt-1 pt-2 border-t border-gray-800 flex items-start gap-2`}>
          <span className="text-sm shrink-0 mt-0.5">💡</span>
          <p className={`text-xs leading-relaxed ${isPro ? 'text-blue-300' : 'text-amber-300'}`}>{score.tip}</p>
        </div>
      </div>
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
  const [genError, setGenError] = useState(false);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [placed, setPlaced] = useState(false);
  const [iconMode, setIconMode] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [uploadedSlides, setUploadedSlides] = useState<string[]>([]);
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [loadingSlides, setLoadingSlides] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setGenError(false);
    setPlaced(false);

    const imagePrompt = buildImagePrompt(prompt, mode, project.style, iconMode);

    // Score the raw user prompt — not the injected system text
    const scorePromise = fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, mode, style: project.style, category: project.category }),
    }).then(r => r.json()).then(s => { setScore(s); return s; }).catch(() => null);

    const imagePromise = (async () => {
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: imagePrompt }),
        });
        if (!res.ok) throw new Error(`Generate API returned ${res.status}`);
        const data = await res.json();
        if (!data.url) throw new Error('No URL in response');
        setGeneratedUrl(data.url);
      } catch (e: any) {
        console.error('Image generation error:', e?.message);
        setGenError(true);
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

  async function placeOnSlide() {
    if (!generatedUrl) return;
    const offset = placedItems.length * 3;
    let url = generatedUrl;

    if (iconMode) {
      // Run canvas-based background removal for icon mode
      setRemovingBg(true);
      try { url = await canvasRemoveBg(generatedUrl); } catch { /* use original */ }
      setRemovingBg(false);
    }

    const newItem: PlacedItem = {
      id: `placed-${Date.now()}`,
      url,
      x: 10 + offset, y: 10 + offset,
      w: iconMode ? 20 : 40,
      h: iconMode ? 30 : 60,
      removeBg: false,
      slideIndex: selectedSlide,
    };
    setPlacedItems(prev => [...prev, newItem]);
    setPlaced(true);
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

  async function handleFileUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setLoadingSlides(true);
    setUploadedSlides([]);
    setSelectedSlide(0);

    try {
      const pdfjsLib = await loadPDFJS();
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageCount = Math.min(pdf.numPages, 30);

      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        // Stream slides in as they render
        setUploadedSlides(prev => [...prev, dataUrl]);
      }
    } catch (e) {
      console.error('PDF render failed:', e);
      alert('Could not load PDF. Make sure the file is a valid PDF.\nFor PPTX: File → Download → PDF in Google Slides, or Save As → PDF in PowerPoint.');
    } finally {
      setLoadingSlides(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const chips = mode === 'professional' ? PRO_CHIPS : PERSONAL_CHIPS;
  const isPro = mode === 'professional';
  const modeAccent = isPro ? 'bg-blue-600 hover:bg-blue-500' : 'bg-amber-500 hover:bg-amber-400';
  const modeChipBorder = isPro ? 'border-blue-900 hover:border-blue-700' : 'border-amber-900 hover:border-amber-700';

  if (!project) return null;

  return (
    <>
    <input
      ref={fileInputRef}
      type="file"
      accept=".pdf"
      style={{ display: 'none' }}
      onChange={e => handleFileUpload(e.target.files)}
    />
    <AppShell
      generating={generating}
      projectTitle={project.title}
      placedItems={placedItems}
      onUpdateItem={(id, patch) => setPlacedItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))}
      onRemoveItem={(id) => setPlacedItems(prev => prev.filter(it => it.id !== id))}
      onRemoveBg={async (id) => {
        const item = placedItems.find(it => it.id === id);
        if (!item) return;
        const newUrl = await canvasRemoveBg(item.url);
        setPlacedItems(prev => prev.map(it => it.id === id ? { ...it, url: newUrl } : it));
      }}
      uploadedSlides={uploadedSlides}
      selectedSlide={selectedSlide}
      onSelectSlide={setSelectedSlide}
      onRequestUpload={() => fileInputRef.current?.click()}
      loadingSlides={loadingSlides}
    >
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

              {/* Icon mode toggle */}
              <button
                onClick={() => setIconMode(v => !v)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-colors text-sm font-medium ${iconMode ? 'bg-violet-950 border-violet-700 text-violet-200' : 'border-gray-800 text-gray-400 hover:border-gray-700'}`}
                style={{ background: iconMode ? undefined : '#111118' }}
              >
                <span className="flex items-center gap-2">
                  <span>🎯</span>
                  <span>Icon / Symbol mode</span>
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${iconMode ? 'bg-violet-700 text-violet-100' : 'bg-gray-800 text-gray-500'}`}>
                  {iconMode ? 'ON — flat + auto remove BG' : 'OFF'}
                </span>
              </button>

              {/* Suggestion chips */}
              <div>
                <p className="text-gray-500 text-xs mb-1.5">Quick starts</p>
                <div className="flex flex-wrap gap-1.5">
                  {chips.map(chip => (
                    <button key={chip} onClick={() => setPrompt(chip)}
                      className={`text-xs bg-gray-900 hover:bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full transition-colors border ${modeChipBorder}`}>
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-gray-400 text-xs font-medium">Your prompt</p>
                  <span className="text-gray-600 text-xs">{prompt.length} chars</span>
                </div>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                  placeholder={isPro ? 'Describe your presentation visual in detail...' : 'Describe your fun image...'}
                  rows={3}
                  className={`w-full rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none resize-none transition-colors border ${isPro ? 'border-gray-700 focus:border-blue-500' : 'border-gray-700 focus:border-amber-500'}`}
                  style={{ background: '#111118' }}
                />
                <p className="text-gray-700 text-xs mt-1">⌘↩ to generate</p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className={`w-full ${modeAccent} disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg`}
              >
                {generating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>✦ Generate with PixelMuse</>
                )}
              </button>

              {genError && (
                <div className="rounded-xl border border-red-900 bg-red-950/50 px-4 py-3 text-center">
                  <p className="text-red-400 text-sm font-medium">Generation failed</p>
                  <p className="text-red-500 text-xs mt-1">Image service timed out. Try a simpler prompt or retry.</p>
                  <button onClick={handleGenerate} className="mt-2 text-xs text-red-400 hover:text-red-300 underline">Retry</button>
                </div>
              )}

              {generatedUrl && (
                <div className="space-y-3 pt-1">
                  <div className="rounded-xl overflow-hidden border border-gray-800">
                    <img src={generatedUrl} alt="Generated" className="w-full object-cover" />
                    <div className="px-3 py-2.5 space-y-2" style={{ background: '#111118' }}>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={saved}
                          className={`flex-1 text-white text-xs font-medium py-2 rounded-lg transition-colors ${saved ? 'bg-gray-800 text-gray-400 cursor-default' : 'bg-green-700 hover:bg-green-600'}`}
                        >
                          {saved ? '✓ Saved' : '↓ Save to Project'}
                        </button>
                        <button
                          onClick={placeOnSlide}
                          disabled={placed || removingBg}
                          className={`flex-1 text-white text-xs font-medium py-2 rounded-lg transition-colors ${placed ? 'bg-gray-800 text-gray-400 cursor-default' : 'bg-blue-700 hover:bg-blue-600 disabled:opacity-60'}`}
                        >
                          {removingBg ? 'Removing BG...' : placed ? '✓ On Slide' : '⊞ Place on Slide'}
                        </button>
                        <button
                          onClick={() => { setPrompt(''); setGeneratedUrl(null); setScore(null); setSaved(false); setPlaced(false); }}
                          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-lg transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-gray-700 text-xs text-center">Place on Slide → drag &amp; resize on canvas · toggle Remove BG for icons</p>
                    </div>
                  </div>
                  {score && <ScoreDisplay score={score} mode={mode} />}
                  {!score && generating === false && (
                    <div className="rounded-xl border border-gray-800 px-4 py-3" style={{ background: '#111118' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-violet-400/40 border-t-violet-400 rounded-full animate-spin" />
                        <span className="text-gray-500 text-xs">Scoring your prompt...</span>
                      </div>
                    </div>
                  )}
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
    </>
  );
}

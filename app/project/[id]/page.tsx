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
  const barBg = isPro ? '#4b8ef0' : '#f0a030';
  const scoreColor = score.overall >= 70 ? '#3eca7a' : score.overall >= 45 ? '#f0a030' : '#e87070';
  return (
    <div className="rounded-md overflow-hidden border" style={{ background: '#111120', borderColor: '#1e1e30' }}>
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: '#1e1e30' }}>
        <div>
          <p className="text-sm font-semibold tracking-tight" style={{ color: '#ddddf0' }}>Prompt Score</p>
          <p className="text-xs mt-0.5" style={{ color: '#6868a0' }}>AI literacy rating</p>
        </div>
        <div className="text-right">
          <span className="font-bold text-3xl leading-none tracking-tight" style={{ color: scoreColor }}>{score.overall}</span>
          <span className="text-sm ml-0.5" style={{ color: '#4a4a68' }}>/100</span>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        {([['Specificity', score.specificity], ['Style', score.style], ['Context', score.context]] as [string, number][]).map(([label, val]) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs w-20 shrink-0 font-medium" style={{ color: '#7878a0' }}>{label}</span>
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: '#1e1e30' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${val}%`, background: barBg }} />
            </div>
            <span className="text-xs w-6 text-right font-bold tabular-nums" style={{ color: barBg }}>{val}</span>
          </div>
        ))}
        <div className="pt-2 border-t flex items-start gap-2" style={{ borderColor: '#1e1e30' }}>
          <span className="text-xs shrink-0 mt-0.5 font-bold" style={{ color: barBg }}>→</span>
          <p className="text-xs leading-relaxed" style={{ color: '#9898bc' }}>{score.tip}</p>
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
  const modeColor = isPro ? '#4b8ef0' : '#f0a030';
  const modeBg = isPro ? '#0d1a2e' : '#2a1800';
  const modeBorder = isPro ? '#1a3050' : '#3a2200';

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
        {/* Sticky project header */}
        <div className="px-4 pt-4 pb-3 border-b shrink-0" style={{ borderColor: '#1e1e30' }}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="text-sm font-semibold tracking-tight leading-tight" style={{ color: '#eeeef8' }}>{project.title}</h2>
            <span className="text-xs px-2 py-0.5 rounded shrink-0 font-semibold" style={{ background: modeBg, color: modeColor, border: `1px solid ${modeBorder}` }}>
              {isPro ? 'Pro' : 'Personal'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs capitalize" style={{ color: '#7878a0' }}>{project.category}</span>
            {project.platform && <span className="text-xs" style={{ color: '#5858809' }}>· {project.platform === 'google-slides' ? 'Google Slides' : 'PowerPoint'}</span>}
            <span className="text-xs" style={{ color: '#4a4a68' }}>· {assets.length} assets</span>
          </div>
          {/* Progress tracker */}
          <div className="flex gap-3 mt-2.5">
            {([['Cover','cover'],['Diagram','diagram'],['Divider','divider'],['Extras','extras']] as [string,keyof typeof project.progressStatus][]).map(([label, key]) => {
              const done = project.progressStatus[key];
              return (
                <button key={key} onClick={() => {
                  const updated = { ...project, progressStatus: { ...project.progressStatus, [key]: !done } };
                  saveProject(updated);
                  setProject(updated);
                }} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full transition-colors" style={{ background: done ? modeColor : '#252538' }} />
                  <span className="text-xs font-medium" style={{ color: done ? modeColor : '#5050809' }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0" style={{ borderColor: '#1e1e30' }}>
          {(['generate','assets','brief','export'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 text-xs font-semibold capitalize transition-colors"
              style={{
                color: tab === t ? '#eeeef8' : '#5858809',
                borderBottom: tab === t ? `2px solid ${modeColor}` : '2px solid transparent',
              }}
              onMouseEnter={e => { if (tab !== t) (e.currentTarget as HTMLElement).style.color = '#9898bc'; }}
              onMouseLeave={e => { if (tab !== t) (e.currentTarget as HTMLElement).style.color = '#5858809'; }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* GENERATE TAB */}
          {tab === 'generate' && (
            <>
              {/* Mode toggle */}
              <div className="flex rounded-md p-1 gap-1 border" style={{ background: '#111120', borderColor: '#1e1e30' }}>
                {(['professional','personal'] as Mode[]).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className="flex-1 py-1.5 rounded text-xs font-semibold transition-all"
                    style={{
                      background: mode === m ? (m === 'professional' ? '#4b8ef0' : '#f0a030') : 'transparent',
                      color: mode === m ? '#fff' : '#7878a0',
                    }}
                  >
                    {m === 'professional' ? 'Professional' : 'Personal'}
                  </button>
                ))}
              </div>

              {/* Icon mode toggle */}
              <button
                onClick={() => setIconMode(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-md border transition-all text-xs font-medium"
                style={{
                  background: iconMode ? '#0d1a2e' : '#111120',
                  borderColor: iconMode ? '#4b8ef0' : '#1e1e30',
                  color: iconMode ? '#7ab0f0' : '#7878a0',
                }}
              >
                <span>Icon / Symbol mode</span>
                <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: iconMode ? '#1a3050' : '#1c1c2e', color: iconMode ? '#7ab0f0' : '#5858809' }}>
                  {iconMode ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Suggestion chips */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#4a4a68', letterSpacing: '0.1em' }}>Quick starts</p>
                <div className="flex flex-wrap gap-1.5">
                  {chips.map(chip => (
                    <button key={chip} onClick={() => setPrompt(chip)}
                      className="text-xs px-2.5 py-1 rounded transition-all border"
                      style={{ background: '#111120', borderColor: '#1e1e30', color: '#7878a0' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c8c8e8'; (e.currentTarget as HTMLElement).style.borderColor = '#252538'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7878a0'; (e.currentTarget as HTMLElement).style.borderColor = '#1e1e30'; }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#4a4a68', letterSpacing: '0.1em' }}>Prompt</p>
                  <span className="text-xs" style={{ color: '#4a4a68' }}>{prompt.length} chars</span>
                </div>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                  placeholder={isPro ? 'Describe your presentation visual...' : 'Describe your fun image...'}
                  rows={3}
                  className="w-full rounded-md px-3 py-2.5 text-sm focus:outline-none resize-none transition-colors border"
                  style={{
                    background: '#0a0a14',
                    color: '#ddddf0',
                    borderColor: '#1e1e30',
                    caretColor: modeColor,
                  }}
                  onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = modeColor; }}
                  onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1e1e30'; }}
                />
                <p className="text-xs mt-1" style={{ color: '#3a3a58' }}>⌘↩ to generate</p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full font-semibold py-2.5 rounded-md text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: modeColor, color: '#fff' }}
              >
                {generating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>✦ Generate with PixelMuse</>
                )}
              </button>

              {genError && (
                <div className="rounded-md border px-4 py-3 text-center" style={{ background: '#1a0e0e', borderColor: '#3a1a1a' }}>
                  <p className="text-sm font-semibold" style={{ color: '#e87070' }}>Generation failed</p>
                  <p className="text-xs mt-1" style={{ color: '#905050' }}>Image service timed out. Try a simpler prompt or retry.</p>
                  <button onClick={handleGenerate} className="mt-2 text-xs underline" style={{ color: '#e87070' }}>Retry</button>
                </div>
              )}

              {generatedUrl && (
                <div className="space-y-3 pt-1">
                  <div className="rounded-md overflow-hidden border" style={{ borderColor: '#1e1e30' }}>
                    <img src={generatedUrl} alt="Generated" className="w-full object-cover" />
                    <div className="px-3 py-2.5 space-y-2" style={{ background: '#111120' }}>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={saved}
                          className="flex-1 text-xs font-semibold py-2 rounded-md transition-colors"
                          style={{ background: saved ? '#161628' : '#0d2a1a', color: saved ? '#5858809' : '#3eca7a', border: `1px solid ${saved ? '#1e1e30' : '#1a4030'}` }}
                        >
                          {saved ? '✓ Saved' : '↓ Save to Project'}
                        </button>
                        <button
                          onClick={placeOnSlide}
                          disabled={placed || removingBg}
                          className="flex-1 text-xs font-semibold py-2 rounded-md transition-all disabled:opacity-60"
                          style={{ background: placed ? '#161628' : modeBg, color: placed ? '#5858809' : modeColor, border: `1px solid ${placed ? '#1e1e30' : modeBorder}` }}
                        >
                          {removingBg ? 'Removing BG…' : placed ? '✓ On Slide' : '⊞ Place on Slide'}
                        </button>
                        <button
                          onClick={() => { setPrompt(''); setGeneratedUrl(null); setScore(null); setSaved(false); setPlaced(false); }}
                          className="px-3 py-2 rounded-md text-xs transition-colors"
                          style={{ background: '#161628', color: '#6868a0', border: '1px solid #1e1e30' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1c1c2e'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#161628'; }}
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-xs text-center" style={{ color: '#4a4a68' }}>Place on Slide → drag &amp; resize on canvas</p>
                    </div>
                  </div>
                  {score && <ScoreDisplay score={score} mode={mode} />}
                  {!score && generating === false && (
                    <div className="rounded-md border px-4 py-3" style={{ background: '#111120', borderColor: '#1e1e30' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: '#252538', borderTopColor: '#5b7af8' }} />
                        <span className="text-xs" style={{ color: '#7878a0' }}>Scoring your prompt…</span>
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
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#4a4a68', letterSpacing: '0.1em' }}>
                {assets.length} saved visual{assets.length !== 1 ? 's' : ''}
              </p>
              {assets.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm font-medium mb-1" style={{ color: '#6868a0' }}>No saved assets yet</p>
                  <p className="text-xs" style={{ color: '#3a3a58' }}>Generate and save visuals first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {assets.map(a => (
                    <div key={a.id} className="rounded-md overflow-hidden border" style={{ background: '#111120', borderColor: '#1e1e30' }}>
                      <img src={a.url} alt={a.prompt} className="w-full aspect-video object-cover" />
                      <div className="p-2 space-y-1.5">
                        <p className="text-xs leading-tight line-clamp-2" style={{ color: '#9898bc' }}>{a.prompt}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold" style={{ color: a.mode === 'professional' ? '#4b8ef0' : '#f0a030' }}>
                            {a.mode === 'professional' ? 'Pro' : 'Personal'}
                          </span>
                          <span className="text-xs font-bold tabular-nums" style={{ color: a.mode === 'professional' ? '#4b8ef0' : '#f0a030' }}>{a.promptScore.overall}</span>
                        </div>
                        <button
                          onClick={() => { setPrompt(a.prompt); setMode(a.mode); setTab('generate'); }}
                          className="w-full text-xs text-left transition-colors"
                          style={{ color: '#6868a0' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#9898bc'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6868a0'; }}
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
            <div className="space-y-3">
              <div className="rounded-md px-4 py-3 border" style={{ background: '#111120', borderColor: '#1e1e30', borderLeft: `3px solid ${modeColor}` }}>
                <p className="text-xs font-semibold mb-1" style={{ color: modeColor }}>
                  {isPro ? 'Professional Mode' : 'Personal Mode'}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#8888a8' }}>
                  {isPro
                    ? 'Clean, slide-ready visuals for presentations. Prompts tuned for clarity, minimal design, and professional context.'
                    : 'Fun, expressive visuals for personal use. Prompts tuned for creativity, humor, and shareability.'}
                </p>
              </div>

              <div className="rounded-md border overflow-hidden" style={{ background: '#111120', borderColor: '#1e1e30' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: '#1e1e30' }}>
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#4a4a68', letterSpacing: '0.1em' }}>Project Details</p>
                </div>
                <div className="px-4 py-3 space-y-2.5">
                  {[
                    ['Title', project.title],
                    ['Category', `${project.category.charAt(0).toUpperCase() + project.category.slice(1)} — ${CATEGORY_BRIEF[project.category]}`],
                    ['Platform', project.platform === 'google-slides' ? 'Google Slides' : project.platform === 'powerpoint' ? 'PowerPoint' : 'None'],
                    ['Style', project.style.charAt(0).toUpperCase() + project.style.slice(1)],
                    ['Created', project.createdAt],
                    ['Last updated', project.updatedAt],
                    ['Assets saved', `${assets.length} visual${assets.length !== 1 ? 's' : ''}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-3">
                      <span className="text-xs w-24 shrink-0 font-medium" style={{ color: '#6868a0' }}>{label}</span>
                      <span className="text-xs leading-relaxed" style={{ color: '#9898bc' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border overflow-hidden" style={{ background: '#111120', borderColor: '#1e1e30' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: '#1e1e30' }}>
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#4a4a68', letterSpacing: '0.1em' }}>Visual Checklist</p>
                </div>
                <div className="px-4 py-1">
                  {([['Cover', 'cover'], ['Diagram', 'diagram'], ['Section Divider', 'divider'], ['Extras', 'extras']] as [string, keyof typeof project.progressStatus][]).map(([label, key]) => (
                    <button key={key} onClick={() => {
                      const updated = { ...project, progressStatus: { ...project.progressStatus, [key]: !project.progressStatus[key] } };
                      saveProject(updated);
                      setProject(updated);
                    }} className="w-full flex items-center gap-3 py-2.5 border-b last:border-0 transition-all group"
                    style={{ borderColor: '#1a1a2e' }}>
                      <div className="w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          background: project.progressStatus[key] ? modeColor : 'transparent',
                          borderColor: project.progressStatus[key] ? modeColor : '#252538',
                        }}>
                        {project.progressStatus[key] && <span className="text-white font-bold" style={{ fontSize: '9px' }}>✓</span>}
                      </div>
                      <span className="text-xs font-medium transition-colors" style={{
                        color: project.progressStatus[key] ? '#5858809' : '#9898bc',
                        textDecoration: project.progressStatus[key] ? 'line-through' : 'none'
                      }}>{label} visual</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* EXPORT TAB */}
          {tab === 'export' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#4a4a68', letterSpacing: '0.1em' }}>
                {assets.length} asset{assets.length !== 1 ? 's' : ''} ready
              </p>

              <button onClick={handleShareLink}
                className="w-full font-semibold py-2.5 rounded-md text-sm transition-all"
                style={{ background: '#5b7af8', color: '#fff' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#6f8cff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#5b7af8'; }}
              >
                {copied ? '✓ Link Copied!' : '↗ Share Project Link'}
              </button>
              <p className="text-xs text-center" style={{ color: '#4a4a68' }}>Prompts recipient to start their own project</p>

              <div className="pt-1 space-y-2">
                <button
                  onClick={() => alert('Google Slides integration — coming in v2. Download PNGs and insert manually for now.')}
                  className="w-full font-medium py-2 rounded-md text-sm transition-colors border"
                  style={{ background: '#0d1a2e', borderColor: '#1a3050', color: '#7ab0f0' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#101e38'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0d1a2e'; }}
                >
                  Send to Google Slides
                </button>
                <button
                  onClick={() => alert('PowerPoint integration — coming in v2. Download PNGs and insert manually for now.')}
                  className="w-full font-medium py-2 rounded-md text-sm transition-colors border"
                  style={{ background: '#0d1a2e', borderColor: '#1a3050', color: '#7ab0f0' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#101e38'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0d1a2e'; }}
                >
                  Export to PowerPoint
                </button>
                <button
                  onClick={handleDownload}
                  disabled={assets.length === 0 || downloading}
                  className="w-full font-medium py-2 rounded-md text-sm transition-colors border disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#161628', borderColor: '#252538', color: '#c8c8e8' }}
                  onMouseEnter={e => { if (!downloading && assets.length > 0) (e.currentTarget as HTMLElement).style.background = '#1c1c30'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#161628'; }}
                >
                  {downloading ? 'Downloading…' : `↓ Download ${assets.length} PNG Asset${assets.length !== 1 ? 's' : ''}`}
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

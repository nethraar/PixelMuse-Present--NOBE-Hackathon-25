'use client';

import { useRef } from 'react';

export interface PlacedItem {
  id: string;
  url: string;
  x: number;
  y: number;
  w: number;
  h: number;
  removeBg: boolean;
  slideIndex: number;
}

interface DragState {
  itemId: string;
  mode: 'move' | 'resize';
  startClientX: number;
  startClientY: number;
  startItemX: number;
  startItemY: number;
  startItemW: number;
  startItemH: number;
  liveX: number;
  liveY: number;
  liveW: number;
  liveH: number;
}

interface AppShellProps {
  children: React.ReactNode;
  slideImage?: string | null;
  generating?: boolean;
  projectTitle?: string;
  placedItems?: PlacedItem[];
  onUpdateItem?: (id: string, patch: Partial<PlacedItem>) => void;
  onRemoveItem?: (id: string) => void;
  onRemoveBg?: (id: string) => void;
  uploadedSlides?: string[];
  selectedSlide?: number;
  onSelectSlide?: (index: number) => void;
  onRequestUpload?: () => void;
  loadingSlides?: boolean;
}

export default function AppShell({
  children, slideImage, generating, projectTitle,
  placedItems = [], onUpdateItem, onRemoveItem, onRemoveBg,
  uploadedSlides = [], selectedSlide = 0, onSelectSlide, onRequestUpload, loadingSlides,
}: AppShellProps) {
  const slideRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragState = useRef<DragState | null>(null);

  const hasUploadedSlides = uploadedSlides.length > 0;
  const currentSlideImage = hasUploadedSlides ? uploadedSlides[selectedSlide] : null;
  const visibleItems = placedItems.filter(it => it.slideIndex === selectedSlide);
  const hasPlaced = visibleItems.length > 0;

  function startDrag(e: React.PointerEvent, item: PlacedItem, mode: 'move' | 'resize') {
    e.preventDefault();
    e.stopPropagation();
    dragState.current = {
      itemId: item.id, mode,
      startClientX: e.clientX, startClientY: e.clientY,
      startItemX: item.x, startItemY: item.y,
      startItemW: item.w, startItemH: item.h,
      liveX: item.x, liveY: item.y, liveW: item.w, liveH: item.h,
    };
  }

  function onSlidePointerMove(e: React.PointerEvent) {
    const ds = dragState.current;
    if (!ds || !slideRef.current) return;
    const el = itemRefs.current[ds.itemId];
    if (!el) return;
    const rect = slideRef.current.getBoundingClientRect();
    const dx = ((e.clientX - ds.startClientX) / rect.width) * 100;
    const dy = ((e.clientY - ds.startClientY) / rect.height) * 100;
    if (ds.mode === 'move') {
      ds.liveX = Math.max(0, Math.min(85, ds.startItemX + dx));
      ds.liveY = Math.max(0, Math.min(85, ds.startItemY + dy));
      el.style.left = `${ds.liveX}%`;
      el.style.top = `${ds.liveY}%`;
    } else {
      ds.liveW = Math.max(5, Math.min(100 - ds.startItemX, ds.startItemW + dx));
      ds.liveH = Math.max(5, Math.min(100 - ds.startItemY, ds.startItemH + dy));
      el.style.width = `${ds.liveW}%`;
      el.style.height = `${ds.liveH}%`;
    }
  }

  function onSlidePointerUp() {
    const ds = dragState.current;
    if (!ds || !onUpdateItem) { dragState.current = null; return; }
    onUpdateItem(ds.itemId, { x: ds.liveX, y: ds.liveY, w: ds.liveW, h: ds.liveH });
    dragState.current = null;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080810' }}>
      {/* Google Slides canvas */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: '#1a1a22' }}>
        {/* Top menu bar */}
        <div className="h-10 flex items-center px-4 gap-3 shrink-0 border-b" style={{ background: '#1e1e28', borderColor: '#2a2a38' }}>
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold" style={{ background: '#FBBC04' }}>G</div>
            <span className="text-sm font-medium truncate max-w-52 tracking-tight" style={{ color: '#e0e0e8' }}>{projectTitle || 'Untitled Presentation'}</span>
          </div>
          <div className="flex items-center gap-0.5 ml-4">
            {['File','Edit','View','Insert','Format','Tools','Extensions','Help'].map(m => (
              <span key={m} className="text-xs px-2 py-1 rounded cursor-default transition-colors hover:bg-white/8" style={{ color: '#9090a8' }}>{m}</span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {hasPlaced && (
              <span className="text-xs" style={{ color: '#55556a' }}>drag · resize</span>
            )}
            {onRequestUpload && (
              <button
                onClick={onRequestUpload}
                className="text-xs px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 border"
                style={{ background: '#22222e', borderColor: '#2e2e3e', color: '#b0b0c8' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#2a2a38'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#22222e'; }}
              >
                {loadingSlides ? (
                  <><span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" /> Rendering…</>
                ) : (
                  <>{hasUploadedSlides ? '↺ Replace' : '↑ Upload PDF'}</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="h-9 flex items-center px-3 gap-1 shrink-0 border-b" style={{ background: '#1e1e28', borderColor: '#2a2a38' }}>
          {['↩','↪','T','⬜','🖊'].map((icon, i) => (
            <div key={i} className="w-7 h-7 rounded flex items-center justify-center text-xs cursor-default transition-colors hover:bg-white/8" style={{ color: '#9090a8' }}>{icon}</div>
          ))}
          <div className="w-px h-4 mx-2" style={{ background: '#2e2e3e' }} />
          <span className="text-xs" style={{ color: '#55556a' }}>100%</span>
          {hasUploadedSlides && (
            <span className="ml-3 text-xs font-medium" style={{ color: '#6868a0' }}>
              Slide {selectedSlide + 1} / {uploadedSlides.length}
            </span>
          )}
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Slide strip */}
          <div className="w-[68px] flex flex-col items-center py-3 gap-2 overflow-y-auto shrink-0 border-r" style={{ background: '#16161e', borderColor: '#2a2a38' }}>
            {hasUploadedSlides ? (
              uploadedSlides.map((slideUrl, i) => {
                const itemsOnSlide = placedItems.filter(it => it.slideIndex === i).length;
                return (
                  <button
                    key={i}
                    onClick={() => onSelectSlide?.(i)}
                    className="relative w-12 rounded overflow-hidden shrink-0 transition-all"
                    style={{
                      height: '36px',
                      outline: i === selectedSlide ? '2px solid #4f6ef7' : '2px solid transparent',
                      outlineOffset: '1px',
                    }}
                  >
                    <img src={slideUrl} className="w-full h-full object-cover" alt={`Slide ${i + 1}`} />
                    {itemsOnSlide > 0 && (
                      <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white font-bold" style={{ fontSize: '8px', background: '#4f6ef7' }}>
                        {itemsOnSlide}
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              [1,2,3,4,5,6].map(i => (
                <div key={i} className="w-12 rounded overflow-hidden shrink-0 flex items-center justify-center transition-all"
                  style={{ height: '36px', background: '#22222e', outline: i === 1 ? '2px solid #4285F4' : '2px solid transparent', outlineOffset: '1px' }}>
                  {i === 1 && slideImage ? (
                    <img src={slideImage} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-xs" style={{ color: '#44445a' }}>{i}</span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Main slide canvas */}
          <div className="flex-1 flex items-center justify-center p-10" style={{ background: '#1a1a22' }}>
            <div
              ref={slideRef}
              className="w-full max-w-3xl aspect-video rounded-md shadow-2xl overflow-hidden relative select-none"
              style={{ background: '#fff', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
              onPointerMove={onSlidePointerMove}
              onPointerUp={onSlidePointerUp}
              onPointerLeave={onSlidePointerUp}
            >
              {generating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20" style={{ background: '#08080f' }}>
                  <div className="w-10 h-10 rounded-full border-2 animate-spin mb-4" style={{ borderColor: '#4f6ef720', borderTopColor: '#4f6ef7' }} />
                  <p className="text-sm font-medium tracking-tight" style={{ color: '#8080a8' }}>Generating…</p>
                </div>
              ) : currentSlideImage ? (
                <img src={currentSlideImage} alt={`Slide ${selectedSlide + 1}`} className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain', background: '#fff' }} draggable={false} />
              ) : !hasPlaced && slideImage ? (
                <img src={slideImage} alt="Slide visual" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
              ) : !hasPlaced ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-16" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8edff 100%)' }}>
                  <div className="w-32 h-1.5 rounded-full mb-5" style={{ background: '#c5cef8' }} />
                  <div className="w-56 h-3 rounded-full mb-2" style={{ background: '#d8def8' }} />
                  <div className="w-44 h-3 rounded-full mb-2" style={{ background: '#e4e8f8' }} />
                  <div className="w-48 h-3 rounded-full mb-10" style={{ background: '#eceef8' }} />
                  <p className="text-xs text-center" style={{ color: '#8898c8' }}>Upload PDF or generate a visual → Place on Slide</p>
                </div>
              ) : null}

              {visibleItems.map(item => (
                <div
                  key={item.id}
                  ref={el => { itemRefs.current[item.id] = el; }}
                  style={{ position: 'absolute', left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%`, cursor: 'move', zIndex: 10 }}
                  onPointerDown={(e) => startDrag(e, item, 'move')}
                  className="group"
                >
                  <img src={item.url} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} alt="" />
                  <div className="absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ outline: '2px solid #4f6ef7', outlineOffset: '-1px' }} />
                  <div className="absolute -top-7 left-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onPointerDown={e => e.stopPropagation()}
                      onClick={() => onRemoveBg?.(item.id)}
                      className="text-xs px-2 py-0.5 rounded font-medium transition-colors"
                      style={{ background: '#22222e', color: '#9090a8', border: '1px solid #2e2e3e' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4f6ef7'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#22222e'; (e.currentTarget as HTMLElement).style.color = '#9090a8'; }}
                    >
                      Remove BG
                    </button>
                    <button
                      onPointerDown={e => e.stopPropagation()}
                      onClick={() => onRemoveItem?.(item.id)}
                      className="text-xs px-1.5 py-0.5 rounded font-medium transition-colors"
                      style={{ background: '#3a1a1a', color: '#e06060', border: '1px solid #4a2020' }}
                    >
                      ✕
                    </button>
                  </div>
                  {(['se','sw','ne','nw'] as const).map(corner => (
                    <div
                      key={corner}
                      style={{
                        position: 'absolute',
                        right: corner.includes('e') ? -4 : 'auto', left: corner.includes('w') ? -4 : 'auto',
                        bottom: corner.includes('s') ? -4 : 'auto', top: corner.includes('n') ? -4 : 'auto',
                        width: 8, height: 8, cursor: `${corner}-resize`,
                        background: '#4f6ef7', border: '1.5px solid #fff', borderRadius: 1, zIndex: 20, opacity: 0,
                      }}
                      className="group-hover:opacity-100 transition-opacity"
                      onPointerDown={(e) => { e.stopPropagation(); startDrag(e, item, 'resize'); }}
                    />
                  ))}
                </div>
              ))}

              <div className="absolute bottom-2 right-2.5 text-xs z-30" style={{ color: '#888', background: 'rgba(255,255,255,0.9)', padding: '1px 6px', borderRadius: 3 }}>
                {hasUploadedSlides ? `${selectedSlide + 1} / ${uploadedSlides.length}` : '1 / 8'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PixelMuse Present sidebar */}
      <div className="w-[390px] flex flex-col shrink-0 border-l" style={{ background: '#0c0c14', borderColor: '#1e1e2a' }}>
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-3 shrink-0 border-b" style={{ background: '#0c0c14', borderColor: '#1e1e2a' }}>
          <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 border" style={{ background: '#14141e', borderColor: '#2a2a3a' }}>
            <span className="font-bold text-xs tracking-tight" style={{ color: '#f0f0f8' }}>PM</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold tracking-tight leading-tight" style={{ color: '#f0f0f8' }}>PixelMuse Present</p>
            <p className="text-xs leading-tight" style={{ color: '#44445a' }}>AI literacy trainer</p>
          </div>
          <span className="text-xs font-medium" style={{ color: '#333345' }}>beta</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

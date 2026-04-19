'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';

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

const MENU_ITEMS = ['File', 'Edit', 'View', 'Insert', 'Format', 'Slide', 'Arrange', 'Tools', 'Extensions', 'Help'];

export default function AppShell({
  children, slideImage, generating, projectTitle,
  placedItems = [], onUpdateItem, onRemoveItem, onRemoveBg,
  uploadedSlides = [], selectedSlide = 0, onSelectSlide, onRequestUpload, loadingSlides,
}: AppShellProps) {
  const router = useRouter();
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
    <div className="flex h-screen overflow-hidden" style={{ background: '#f1f3f4' }}>
      {/* ── Google Slides mock left panel ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Title bar */}
        <div className="shrink-0 border-b" style={{ background: '#fff', borderColor: '#e0e0e0' }}>
          <div className="flex items-center px-3 pt-2 pb-1 gap-3">
            {/* Slides icon */}
            <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded" style={{ background: '#FBBC04' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="3" width="16" height="14" rx="1.5" fill="white"/>
                <rect x="4.5" y="6" width="11" height="1.5" rx="0.75" fill="#FBBC04"/>
                <rect x="4.5" y="9" width="11" height="1.5" rx="0.75" fill="#FBBC04"/>
                <rect x="4.5" y="12" width="7" height="1.5" rx="0.75" fill="#FBBC04"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#202124' }}>
                {projectTitle || 'Untitled presentation'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {hasPlaced && (
                <span className="text-xs" style={{ color: '#9aa0a6' }}>drag · resize</span>
              )}
              <button
                className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                style={{ background: '#e8f0fe', color: '#1a73e8' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#d2e3fc'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#e8f0fe'; }}
              >
                Share
              </button>
              {onRequestUpload && (
                <button
                  onClick={onRequestUpload}
                  className="text-xs font-medium px-3 py-1.5 rounded-md border transition-colors flex items-center gap-1.5"
                  style={{ background: '#fff', borderColor: '#dadce0', color: '#444746' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f1f3f4'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                >
                  {loadingSlides ? (
                    <><span className="w-3 h-3 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin inline-block" /> Rendering…</>
                  ) : (
                    <>{hasUploadedSlides ? '↺ Replace slides' : '↑ Upload PDF'}</>
                  )}
                </button>
              )}
            </div>
          </div>
          {/* Menu bar */}
          <div className="flex items-center px-3 pb-1 gap-0.5">
            {MENU_ITEMS.map(m => (
              <button key={m} className="text-xs px-2 py-1 rounded transition-colors" style={{ color: '#444746' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f1f3f4'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >{m}</button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="h-10 flex items-center px-3 gap-1 shrink-0 border-b" style={{ background: '#fff', borderColor: '#e0e0e0' }}>
          {/* Undo / Redo */}
          {[
            <svg key="undo" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" fill="currentColor"/></svg>,
            <svg key="redo" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" fill="currentColor"/></svg>,
          ].map((icon, i) => (
            <button key={i} className="w-8 h-8 flex items-center justify-center rounded transition-colors" style={{ color: '#444746' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f1f3f4'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >{icon}</button>
          ))}
          <div className="w-px h-5 mx-1" style={{ background: '#e0e0e0' }} />
          {/* Zoom */}
          <button className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors" style={{ color: '#444746', border: '1px solid #e0e0e0' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f1f3f4'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            100%
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
          </button>
          <div className="w-px h-5 mx-1" style={{ background: '#e0e0e0' }} />
          {/* Text, Shape, Image tools */}
          {[
            { label: 'T', title: 'Text' },
            { label: '⬜', title: 'Shape' },
            { label: '/', title: 'Line' },
          ].map(({ label, title }) => (
            <button key={title} title={title} className="w-8 h-8 flex items-center justify-center rounded text-sm transition-colors" style={{ color: '#444746' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f1f3f4'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >{label}</button>
          ))}
          {hasUploadedSlides && (
            <span className="ml-auto text-xs font-medium" style={{ color: '#9aa0a6' }}>
              Slide {selectedSlide + 1} of {uploadedSlides.length}
            </span>
          )}
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Slide strip */}
          <div className="w-[72px] flex flex-col items-center py-3 gap-2 overflow-y-auto shrink-0 border-r" style={{ background: '#f8f9fa', borderColor: '#e0e0e0' }}>
            {hasUploadedSlides ? (
              uploadedSlides.map((slideUrl, i) => {
                const itemsOnSlide = placedItems.filter(it => it.slideIndex === i).length;
                return (
                  <button
                    key={i}
                    onClick={() => onSelectSlide?.(i)}
                    className="relative w-14 rounded overflow-hidden shrink-0 transition-all"
                    style={{
                      height: '40px',
                      outline: i === selectedSlide ? '2px solid #1a73e8' : '2px solid transparent',
                      outlineOffset: '1px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    }}
                  >
                    <img src={slideUrl} className="w-full h-full object-cover" alt={`Slide ${i + 1}`} />
                    {itemsOnSlide > 0 && (
                      <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold" style={{ fontSize: '8px', background: '#1a73e8' }}>
                        {itemsOnSlide}
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              [1,2,3,4,5,6].map(i => (
                <div key={i}
                  className="w-14 rounded overflow-hidden shrink-0 flex items-center justify-center transition-all"
                  style={{
                    height: '40px',
                    background: '#fff',
                    outline: i === 1 ? '2px solid #1a73e8' : '1px solid #e0e0e0',
                    outlineOffset: '1px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}>
                  {i === 1 && slideImage ? (
                    <img src={slideImage} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-xs font-medium" style={{ color: '#bdc1c6' }}>{i}</span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Main slide canvas */}
          <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#f1f3f4' }}>
            <div
              ref={slideRef}
              className="w-full max-w-3xl aspect-video rounded overflow-hidden relative select-none"
              style={{
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.08)',
              }}
              onPointerMove={onSlidePointerMove}
              onPointerUp={onSlidePointerUp}
              onPointerLeave={onSlidePointerUp}
            >
              {generating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20" style={{ background: 'rgba(255,255,255,0.95)' }}>
                  <div className="w-10 h-10 rounded-full border-2 animate-spin mb-4" style={{ borderColor: '#e8f0fe', borderTopColor: '#1a73e8' }} />
                  <p className="text-sm font-medium" style={{ color: '#5f6368' }}>Generating…</p>
                </div>
              ) : currentSlideImage ? (
                <img src={currentSlideImage} alt={`Slide ${selectedSlide + 1}`} className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain', background: '#fff' }} draggable={false} />
              ) : !hasPlaced && slideImage ? (
                <img src={slideImage} alt="Slide visual" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
              ) : !hasPlaced ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-20" style={{ background: 'linear-gradient(135deg, #fafbff 0%, #f3f6ff 100%)' }}>
                  <div className="w-40 h-2 rounded-full mb-6" style={{ background: '#e8edf8' }} />
                  <div className="w-64 h-3.5 rounded-full mb-3" style={{ background: '#eef1fa' }} />
                  <div className="w-52 h-3.5 rounded-full mb-3" style={{ background: '#f1f4fb' }} />
                  <div className="w-56 h-3.5 rounded-full mb-12" style={{ background: '#f4f6fc' }} />
                  <p className="text-sm text-center font-medium" style={{ color: '#9aa0a6' }}>
                    Upload a PDF or generate a visual → Place on Slide
                  </p>
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
                  <div className="absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ outline: '2px solid #1a73e8', outlineOffset: '-1px' }} />
                  <div className="absolute -top-8 left-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onPointerDown={e => e.stopPropagation()}
                      onClick={() => onRemoveBg?.(item.id)}
                      className="text-xs px-2 py-1 rounded font-medium shadow-sm transition-colors"
                      style={{ background: '#fff', color: '#444746', border: '1px solid #dadce0' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#e8f0fe'; (e.currentTarget as HTMLElement).style.color = '#1a73e8'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#444746'; }}
                    >
                      Remove BG
                    </button>
                    <button
                      onPointerDown={e => e.stopPropagation()}
                      onClick={() => onRemoveItem?.(item.id)}
                      className="text-xs px-1.5 py-1 rounded font-medium shadow-sm"
                      style={{ background: '#fff', color: '#d93025', border: '1px solid #fad2cf' }}
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
                        background: '#1a73e8', border: '1.5px solid #fff', borderRadius: 1, zIndex: 20, opacity: 0,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}
                      className="group-hover:opacity-100 transition-opacity"
                      onPointerDown={(e) => { e.stopPropagation(); startDrag(e, item, 'resize'); }}
                    />
                  ))}
                </div>
              ))}

              <div className="absolute bottom-2 right-2.5 text-xs z-30" style={{ color: '#9aa0a6', background: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: 4, border: '1px solid #e0e0e0' }}>
                {hasUploadedSlides ? `${selectedSlide + 1} / ${uploadedSlides.length}` : '1 / 8'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PixelMuse Present sidebar ── */}
      <div className="w-[380px] flex flex-col shrink-0 border-l" style={{ background: '#fff', borderColor: '#e0e0e0' }}>
        {/* Persistent header */}
        <div className="px-4 py-3 flex items-center gap-3 shrink-0 border-b" style={{ background: '#fff', borderColor: '#e0e0e0' }}>
          <button
            onClick={() => { window.dispatchEvent(new Event('storage')); router.push('/'); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
            style={{ background: '#e8f0fe' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#d2e3fc'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#e8f0fe'; }}
            title="Back to Dashboard"
          >
            <span className="font-bold text-xs" style={{ color: '#1a73e8' }}>PM</span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight" style={{ color: '#202124' }}>PixelMuse Present</p>
            <p className="text-xs leading-tight" style={{ color: '#9aa0a6' }}>AI literacy trainer</p>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#e8f0fe', color: '#1a73e8' }}>beta</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

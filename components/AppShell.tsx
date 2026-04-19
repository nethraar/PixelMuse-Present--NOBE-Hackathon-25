'use client';

import { useRef } from 'react';

export interface PlacedItem {
  id: string;
  url: string;
  x: number; // % of slide width
  y: number; // % of slide height
  w: number; // % of slide width
  h: number; // % of slide height
  removeBg: boolean;
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
}

export default function AppShell({
  children, slideImage, generating, projectTitle,
  placedItems = [], onUpdateItem, onRemoveItem, onRemoveBg,
}: AppShellProps) {
  const slideRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragState = useRef<DragState | null>(null);

  const hasPlaced = placedItems.length > 0;
  const firstItemWithImage = placedItems[0];

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
      ds.liveW = Math.max(8, Math.min(100 - ds.startItemX, ds.startItemW + dx));
      ds.liveH = Math.max(8, Math.min(100 - ds.startItemY, ds.startItemH + dy));
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
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Google Slides canvas */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: '#1e1e1e' }}>
        {/* Top menu bar */}
        <div className="h-10 flex items-center px-4 gap-3 shrink-0 border-b" style={{ background: '#2d2d2d', borderColor: '#3a3a3a' }}>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold" style={{ background: '#FBBC04' }}>G</div>
            <span className="text-gray-300 text-xs font-medium truncate max-w-48">{projectTitle || 'Untitled Presentation'}</span>
          </div>
          <div className="flex items-center gap-1 ml-3">
            {['File','Edit','View','Insert','Format','Tools','Extensions','Help'].map(m => (
              <span key={m} className="text-xs px-2 py-0.5 rounded cursor-default hover:bg-white/10 transition-colors" style={{ color: '#c9c9c9' }}>{m}</span>
            ))}
          </div>
        </div>
        {/* Toolbar */}
        <div className="h-9 flex items-center px-3 gap-1.5 shrink-0 border-b" style={{ background: '#2d2d2d', borderColor: '#3a3a3a' }}>
          {['↩','↪','🖨','⤢','T','⬜','⟠','🖊','🎨','⬡'].map((icon, i) => (
            <div key={i} className="w-7 h-7 rounded flex items-center justify-center text-xs cursor-default hover:bg-white/10 transition-colors" style={{ color: '#c9c9c9' }}>{icon}</div>
          ))}
          <div className="w-px h-5 mx-1" style={{ background: '#505050' }} />
          <span className="text-xs" style={{ color: '#aaa' }}>100% ▾</span>
          {hasPlaced && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded" style={{ background: '#3a3a3a', color: '#888' }}>
              {placedItems.length} element{placedItems.length !== 1 ? 's' : ''} — drag to move · corner to resize
            </span>
          )}
        </div>
        {/* Canvas area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Slide strip */}
          <div className="w-[72px] flex flex-col items-center py-3 gap-2 overflow-y-auto shrink-0 border-r" style={{ background: '#252525', borderColor: '#3a3a3a' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="w-14 rounded flex items-center justify-center overflow-hidden cursor-pointer border-2 transition-colors"
                style={{ height: '40px', background: '#3a3a3a', borderColor: i === 1 ? '#4285F4' : 'transparent' }}>
                {i === 1 && (hasPlaced ? (
                  <img src={placedItems[0].url} className="w-full h-full object-cover" alt="" />
                ) : slideImage ? (
                  <img src={slideImage} className="w-full h-full object-cover" alt="" />
                ) : null)}
                {!(i === 1 && (hasPlaced || slideImage)) && (
                  <span className="text-xs" style={{ color: '#666' }}>{i}</span>
                )}
              </div>
            ))}
          </div>

          {/* Main slide */}
          <div className="flex-1 flex items-center justify-center p-10" style={{ background: '#1e1e1e' }}>
            <div
              ref={slideRef}
              className="w-full max-w-3xl aspect-video rounded-lg shadow-2xl overflow-hidden relative select-none"
              style={{ background: hasPlaced ? '#fff' : undefined }}
              onPointerMove={onSlidePointerMove}
              onPointerUp={onSlidePointerUp}
              onPointerLeave={onSlidePointerUp}
            >
              {/* Background / state */}
              {generating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a0533 0%, #0d1a33 100%)' }}>
                  <div className="w-14 h-14 rounded-full border-4 border-violet-400/30 border-t-violet-400 animate-spin mb-4" />
                  <p className="text-violet-300 text-sm font-medium">Generating visual...</p>
                  <p className="text-violet-500 text-xs mt-1">Powered by PixelMuse</p>
                </div>
              ) : !hasPlaced && slideImage ? (
                <img src={slideImage} alt="Slide visual" className="absolute inset-0 w-full h-full object-cover" />
              ) : !hasPlaced ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-16" style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' }}>
                  <div className="w-28 h-2 bg-indigo-200 rounded-full mb-5" />
                  <div className="w-60 h-3.5 bg-indigo-300/60 rounded-full mb-2.5" />
                  <div className="w-44 h-3 bg-indigo-200/60 rounded-full mb-2" />
                  <div className="w-52 h-3 bg-indigo-200/40 rounded-full mb-8" />
                  <p className="text-indigo-400/70 text-xs text-center">Generate a visual → Place on Slide</p>
                </div>
              ) : null}

              {/* White slide bg when has items */}
              {hasPlaced && (
                <div className="absolute inset-0" style={{ background: '#fff' }} />
              )}

              {/* Placed items */}
              {placedItems.map(item => (
                <div
                  key={item.id}
                  ref={el => { itemRefs.current[item.id] = el; }}
                  style={{
                    position: 'absolute',
                    left: `${item.x}%`, top: `${item.y}%`,
                    width: `${item.w}%`, height: `${item.h}%`,
                    cursor: 'move',
                    zIndex: 10,
                  }}
                  onPointerDown={(e) => startDrag(e, item, 'move')}
                  className="group"
                >
                  <img
                    src={item.url}
                    draggable={false}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'contain',
                      mixBlendMode: item.removeBg ? 'multiply' : 'normal',
                      display: 'block',
                      pointerEvents: 'none',
                    }}
                    alt=""
                  />

                  {/* Selection border */}
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* Controls — top bar */}
                  <div className="absolute -top-7 left-0 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onPointerDown={e => e.stopPropagation()}
                      onClick={() => onRemoveBg?.(item.id)}
                      className="text-xs px-1.5 py-0.5 rounded font-medium transition-colors bg-gray-700 text-gray-300 hover:bg-violet-600 hover:text-white"
                    >
                      Remove BG
                    </button>
                    <button
                      onPointerDown={e => e.stopPropagation()}
                      onClick={() => onRemoveItem?.(item.id)}
                      className="text-xs px-1.5 py-0.5 rounded bg-red-800 hover:bg-red-700 text-white font-medium transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Resize handle — bottom-right corner */}
                  <div
                    style={{
                      position: 'absolute', right: -5, bottom: -5,
                      width: 12, height: 12, cursor: 'se-resize',
                      background: '#3b82f6', border: '2px solid #fff',
                      borderRadius: 2, zIndex: 20,
                      opacity: 0,
                    }}
                    className="group-hover:opacity-100 transition-opacity"
                    onPointerDown={(e) => { e.stopPropagation(); startDrag(e, item, 'resize'); }}
                  />

                  {/* Top-left corner handle */}
                  <div
                    style={{
                      position: 'absolute', left: -5, top: -5,
                      width: 12, height: 12, cursor: 'nw-resize',
                      background: '#3b82f6', border: '2px solid #fff',
                      borderRadius: 2, zIndex: 20,
                      opacity: 0,
                    }}
                    className="group-hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}

              <div className="absolute bottom-2 right-3 text-xs rounded px-1.5 py-0.5" style={{ color: '#999', background: 'rgba(255,255,255,0.85)', zIndex: 5 }}>
                Slide 1 of 8
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PixelMuse Present sidebar */}
      <div className="w-[400px] flex flex-col shrink-0 border-l border-gray-800" style={{ background: '#0a0a0f' }}>
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2.5 shrink-0" style={{ background: '#111118' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)' }}>
            <span className="text-white text-xs font-bold">PM</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">PixelMuse Present</p>
            <p className="text-violet-400 text-xs leading-tight">AI Literacy Trainer</p>
          </div>
          <div className="ml-auto">
            <div className="text-xs px-2 py-0.5 rounded-full border border-violet-800 text-violet-400 font-medium">Beta</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

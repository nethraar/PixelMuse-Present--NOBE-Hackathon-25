'use client';

interface AppShellProps {
  children: React.ReactNode;
  slideImage?: string | null;
  generating?: boolean;
  projectTitle?: string;
}

export default function AppShell({ children, slideImage, generating, projectTitle }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Google Slides canvas — left */}
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
          <div className="flex items-center gap-1">
            {['100%','▾'].map((t, i) => (
              <span key={i} className="text-xs" style={{ color: '#aaa' }}>{t}</span>
            ))}
          </div>
        </div>
        {/* Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Slide strip */}
          <div className="w-[72px] flex flex-col items-center py-3 gap-2 overflow-y-auto shrink-0 border-r" style={{ background: '#252525', borderColor: '#3a3a3a' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className={`w-14 rounded flex items-center justify-center overflow-hidden cursor-pointer border-2 transition-colors`}
                style={{ height: '40px', background: '#3a3a3a', borderColor: i === 1 ? '#4285F4' : 'transparent' }}>
                {i === 1 && slideImage ? (
                  <img src={slideImage} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-xs" style={{ color: '#666' }}>{i}</span>
                )}
              </div>
            ))}
          </div>
          {/* Main slide area */}
          <div className="flex-1 flex items-center justify-center p-10" style={{ background: '#1e1e1e' }}>
            <div className="w-full max-w-3xl aspect-video rounded-lg shadow-2xl overflow-hidden relative" style={{ background: '#fff' }}>
              {generating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a0533 0%, #0d1a33 100%)' }}>
                  <div className="w-14 h-14 rounded-full border-4 border-violet-400/30 border-t-violet-400 animate-spin mb-4" />
                  <p className="text-violet-300 text-sm font-medium">Generating visual...</p>
                  <p className="text-violet-500 text-xs mt-1">Powered by PixelMuse</p>
                </div>
              ) : slideImage ? (
                <img src={slideImage} alt="Slide visual" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-16" style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' }}>
                  <div className="w-28 h-2 bg-indigo-200 rounded-full mb-5" />
                  <div className="w-60 h-3.5 bg-indigo-300/60 rounded-full mb-2.5" />
                  <div className="w-44 h-3 bg-indigo-200/60 rounded-full mb-2" />
                  <div className="w-52 h-3 bg-indigo-200/40 rounded-full mb-8" />
                  <p className="text-indigo-400/70 text-xs text-center">Generate a visual with PixelMuse Present →</p>
                </div>
              )}
              <div className="absolute bottom-2 right-3 text-xs rounded px-1.5 py-0.5" style={{ color: '#999', background: 'rgba(255,255,255,0.85)' }}>
                Slide 1 of 8
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PixelMuse Present sidebar */}
      <div className="w-[400px] flex flex-col shrink-0 border-l border-gray-800" style={{ background: '#0a0a0f' }}>
        {/* Header */}
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

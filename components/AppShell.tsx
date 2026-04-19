'use client';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Fake slides canvas — left side */}
      <div className="flex-1 bg-gray-900 flex flex-col items-center justify-center gap-6 p-8 border-r border-gray-800">
        <div className="text-gray-500 text-sm font-medium tracking-widest uppercase mb-2">Google Slides</div>
        {/* Mock slide */}
        <div className="w-full max-w-2xl aspect-video bg-white rounded-lg shadow-2xl flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100" />
          <div className="relative z-10 text-center px-12">
            <div className="w-32 h-2 bg-indigo-300 rounded mx-auto mb-4" />
            <div className="w-64 h-3 bg-gray-300 rounded mx-auto mb-2" />
            <div className="w-48 h-3 bg-gray-200 rounded mx-auto" />
          </div>
          <div className="absolute bottom-4 right-4 text-xs text-gray-400">Slide 1 of 8</div>
        </div>
        {/* Slide thumbnails strip */}
        <div className="flex gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className={`w-20 h-14 rounded border-2 ${i === 1 ? 'border-blue-500' : 'border-gray-700'} bg-gray-800 flex items-center justify-center`}>
              <span className="text-gray-500 text-xs">{i}</span>
            </div>
          ))}
        </div>
        {/* Bottom toolbar mock */}
        <div className="flex gap-4 text-gray-600 text-xs">
          <span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Format</span><span>Tools</span>
        </div>
      </div>

      {/* PixelMuse Present sidebar — right side */}
      <div className="w-96 flex flex-col bg-gray-950 border-l border-gray-800 overflow-hidden flex-shrink-0">
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2 bg-gray-900">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <span className="text-white font-semibold text-sm">PixelMuse Present</span>
          <span className="ml-auto text-gray-500 text-xs">AI Literacy Trainer</span>
        </div>
        {/* Sidebar content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

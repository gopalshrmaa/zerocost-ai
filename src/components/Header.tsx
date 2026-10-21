import React from 'react';
import { Cloud, BookOpen } from 'lucide-react';

interface HeaderProps {
  onOpenProjectGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenProjectGuide }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">ZeroCost AI</span>
              <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
                FinOps AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Predict. Optimize. Save.
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenProjectGuide}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Project Guide & Viva Notes</span>
            <span className="sm:hidden">Guide</span>
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Prototype Mode
          </span>
        </div>
      </div>
    </header>
  );
};

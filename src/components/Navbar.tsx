import React from 'react';
import { ViewTab } from '../types/parking';
import { Code2, Play, Pause } from 'lucide-react';

interface NavbarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenCodeModal: () => void;
  autoSimulate: boolean;
  onToggleAutoSimulate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCodeModal,
  autoSimulate,
  onToggleAutoSimulate,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('dashboard');
            }}
            className="text-base font-semibold tracking-tight text-white hover:text-emerald-400 transition-colors"
          >
            ParkVision Smart Parking
          </a>
          <span className="hidden sm:inline-block text-xs text-slate-500 font-mono">
            College / Mall System
          </span>
        </div>

        {/* Zone 2: Clean text navigation links */}
        <nav className="flex items-center gap-1 sm:gap-4 text-xs sm:text-sm font-medium text-slate-400">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap ${
              currentTab === 'dashboard'
                ? 'text-emerald-400 font-semibold bg-emerald-950/40'
                : 'hover:text-slate-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onSelectTab('cv-feed')}
            className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap ${
              currentTab === 'cv-feed'
                ? 'text-emerald-400 font-semibold bg-emerald-950/40'
                : 'hover:text-slate-200'
            }`}
          >
            Live Camera CV
          </button>
          <button
            onClick={() => onSelectTab('admin')}
            className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap ${
              currentTab === 'admin'
                ? 'text-emerald-400 font-semibold bg-emerald-950/40'
                : 'hover:text-slate-200'
            }`}
          >
            History & Admin
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap ${
              currentTab === 'analytics'
                ? 'text-emerald-400 font-semibold bg-emerald-950/40'
                : 'hover:text-slate-200'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => onSelectTab('stages')}
            className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap ${
              currentTab === 'stages'
                ? 'text-emerald-400 font-semibold bg-emerald-950/40'
                : 'hover:text-slate-200'
            }`}
          >
            Stage Guide
          </button>
        </nav>

        {/* Zone 3: Primary actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleAutoSimulate}
            title={autoSimulate ? 'Pause automated traffic simulation' : 'Start automated traffic simulation'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
              autoSimulate
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {autoSimulate ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sim Running</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Auto Traffic</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenCodeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded hover:bg-emerald-900/60 transition-colors whitespace-nowrap"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Python Backend</span>
          </button>
        </div>
      </div>
    </header>
  );
};

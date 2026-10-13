import React, { useState } from 'react';
import { RefreshCw, Radio, CheckCircle, AlertCircle } from 'lucide-react';
import { SSEConnectionStatus } from '../../hooks/useRealtimeFinOps.ts';

interface HeaderProps {
  currentTabName: string;
  connectionStatus: SSEConnectionStatus;
  lastEventTime?: string;
  onSync: () => Promise<void>;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabName,
  connectionStatus,
  lastEventTime,
  onSync,
  isSyncing
}) => {
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncClick = async () => {
    try {
      setSyncFeedback('Syncing...');
      await onSync();
      setSyncFeedback('Synced');
      setTimeout(() => setSyncFeedback(null), 2500);
    } catch (e) {
      setSyncFeedback('Failed');
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  return (
    <header className="h-16 px-6 bg-[#0a0f1d] border-b border-slate-800 flex items-center justify-between gap-8 shrink-0">
      {/* Zone 1: Breadcrumb & Contextual Title */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <span className="text-xs text-slate-400 font-medium">Orchestrator</span>
        <span className="text-slate-600 text-xs">/</span>
        <h1 className="text-sm font-semibold text-slate-100 tracking-tight">
          {currentTabName}
        </h1>
      </div>

      {/* Zone 2: Telemetry Status Stream */}
      <div className="hidden md:flex items-center gap-6 text-xs text-slate-400 whitespace-nowrap shrink-0">
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Stream Connected</span>
            </div>
          ) : connectionStatus === 'connecting' ? (
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Radio className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-rose-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Reconnecting</span>
            </div>
          )}
        </div>

        {lastEventTime && (
          <span className="font-mono text-[11px] text-slate-500">
            Last Event {new Date(lastEventTime).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Zone 3: Primary Action & Controls */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <button
          onClick={handleSyncClick}
          disabled={isSyncing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
          <span>{syncFeedback || (isSyncing ? 'Syncing...' : 'Sync Telemetry')}</span>
        </button>

        <div className="h-7 w-[1px] bg-slate-800" />

        {/* User Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white text-xs font-semibold">
            SC
          </div>
          <div className="hidden lg:block text-left leading-none">
            <div className="text-xs font-medium text-slate-200">Sarah Chen</div>
            <div className="text-[10px] text-slate-400 mt-0.5">FinOps Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};

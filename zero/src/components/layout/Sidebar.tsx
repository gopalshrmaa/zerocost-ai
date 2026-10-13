import React from 'react';
import { 
  LayoutDashboard, 
  Cloud, 
  Server, 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Sliders, 
  Bell, 
  FileText, 
  Settings,
  ShieldCheck
} from 'lucide-react';

export type ActiveTab = 
  | 'overview' 
  | 'accounts' 
  | 'resources' 
  | 'costs' 
  | 'forecast' 
  | 'optimization' 
  | 'simulator' 
  | 'alerts' 
  | 'audit' 
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  pendingOptimizationsCount?: number;
  unreadAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingOptimizationsCount = 0,
  unreadAlertsCount = 0
}) => {
  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'accounts' as const, label: 'Cloud Accounts', icon: Cloud },
    { id: 'resources' as const, label: 'Resource Explorer', icon: Server },
    { id: 'costs' as const, label: 'Costs & Telemetry', icon: BarChart3 },
    { id: 'forecast' as const, label: 'AI Forecast', icon: TrendingUp },
    { 
      id: 'optimization' as const, 
      label: 'Optimization', 
      icon: Zap,
      badge: pendingOptimizationsCount > 0 ? pendingOptimizationsCount : undefined
    },
    { id: 'simulator' as const, label: 'What-If Simulator', icon: Sliders },
    { 
      id: 'alerts' as const, 
      label: 'Alerts & Budgets', 
      icon: Bell,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined
    },
    { id: 'audit' as const, label: 'Audit Logs', icon: FileText },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0d1322] border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
            ZC
          </div>
          <div>
            <div className="font-bold text-slate-100 text-sm tracking-tight leading-none">
              ZeroCost AI
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium leading-none">
              Multi-Cloud FinOps
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive 
                  ? 'bg-slate-800/90 text-emerald-400 shadow-sm border border-slate-700/60' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-semibold ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Cloud Providers Status Card */}
      <div className="p-4 border-t border-slate-800/80 bg-[#090e1a]">
        <div className="text-[11px] text-slate-400 font-medium mb-2.5 flex items-center justify-between">
          <span>Active Clouds</span>
          <span className="text-[10px] text-emerald-400 font-mono">3 / 3</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
          <div className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-center text-slate-300">
            <span className="text-amber-400 font-semibold">AWS</span>
          </div>
          <div className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-center text-slate-300">
            <span className="text-blue-400 font-semibold">AZURE</span>
          </div>
          <div className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-center text-slate-300">
            <span className="text-emerald-400 font-semibold">GCP</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="truncate">RBAC: FinOps Admin</span>
        </div>
      </div>
    </aside>
  );
};

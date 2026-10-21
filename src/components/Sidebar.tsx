import React from 'react';
import { LayoutDashboard, BarChart3, Lightbulb, MessageSquare } from 'lucide-react';

export type TabType = 'dashboard' | 'analysis' | 'recommendations' | 'assistant';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navItems: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analysis', label: 'Cloud Analysis', icon: BarChart3 },
    { id: 'recommendations', label: 'AI Recommendations', icon: Lightbulb },
    { id: 'assistant', label: 'AI Assistant', icon: MessageSquare }
  ];

  return (
    <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-950 p-4 hidden md:flex flex-col justify-between min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="px-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Navigation
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Student/Prototype Info Note */}
      <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 text-xs text-slate-400">
        <div className="font-semibold text-slate-300 mb-0.5">ZeroCost AI</div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Predict. Optimize. Save.
        </p>
      </div>
    </aside>
  );
};

import React from 'react';
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowUpRight, 
  Zap, 
  CheckCircle2, 
  Server,
  Cloud
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  DashboardSummary, 
  Anomaly, 
  OptimizationRecommendation, 
  CloudResource, 
  AuditLog, 
  DailyForecastPoint 
} from '../../types.ts';

interface OverviewViewProps {
  summary: DashboardSummary | null;
  anomalies: Anomaly[];
  recommendations: OptimizationRecommendation[];
  expensiveResources: CloudResource[];
  auditLogs: AuditLog[];
  forecastPoints: DailyForecastPoint[];
  onNavigate: (tab: any) => void;
  onApproveRecommendation: (id: string) => Promise<void>;
  onInspectResource: (resourceId: string) => void;
}

const PROVIDER_COLORS: Record<string, string> = {
  aws: '#f59e0b',   // Amber
  azure: '#3b82f6', // Blue
  gcp: '#10b981',   // Emerald
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  summary,
  anomalies,
  recommendations,
  expensiveResources,
  auditLogs,
  forecastPoints,
  onNavigate,
  onApproveRecommendation,
  onInspectResource,
}) => {
  if (!summary) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading telemetry stream...</span>
        </div>
      </div>
    );
  }

  const { budgetHealth } = summary;

  // Chart data: merge forecast points or generate time points
  const timelineData = forecastPoints && forecastPoints.length > 0
    ? forecastPoints.map(p => ({
        date: p.date.slice(5), // MM-DD
        spend: p.actualCost ?? p.forecastedCost,
        forecast: p.forecastedCost,
        upper: p.upperBound,
        lower: p.lowerBound
      }))
    : [
        { date: '03-01', spend: 54.2, forecast: 54.2 },
        { date: '03-02', spend: 56.8, forecast: 56.8 },
        { date: '03-03', spend: 58.1, forecast: 58.1 },
        { date: '03-04', spend: 57.4, forecast: 57.4 },
        { date: '03-05', spend: 61.2, forecast: 61.2 },
        { date: '03-06', spend: 63.5, forecast: 63.5 },
        { date: '03-07', spend: 62.0, forecast: 64.1 },
        { date: '03-08', spend: null, forecast: 65.4 },
        { date: '03-09', spend: null, forecast: 64.9 },
        { date: '03-10', spend: null, forecast: 66.2 },
      ];

  const pieData = summary.providerSpend.map(p => ({
    name: p.provider.toUpperCase(),
    value: p.monthlySpend,
    color: PROVIDER_COLORS[p.provider] || '#94a3b8'
  }));

  return (
    <div className="space-y-6">
      {/* 1. TOP STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Current Monthly Spend</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
              ${summary.currentMonthlySpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ mo</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span>Today:</span>
            <span className="text-slate-200 font-mono font-medium">${summary.todaySpend.toFixed(2)}</span>
            <span className="text-slate-600">·</span>
            <span>{summary.totalResourcesCount} active workloads</span>
          </div>
        </div>

        {/* Projected Month-End Spend */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Projected Month-End</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
              ${summary.projectedMonthlySpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-amber-400 font-mono">
              {budgetHealth.isOverBudget ? `+$${budgetHealth.overrunAmount.toFixed(0)} risk` : 'on track'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span>Budget Ceiling:</span>
            <span className="text-slate-200 font-mono font-medium">${budgetHealth.totalBudget.toLocaleString()}</span>
          </div>
        </div>

        {/* Potential Reclamation / Savings */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Actionable Savings</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-400 font-mono tabular-nums">
              ${summary.potentialMonthlySavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ mo</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-mono font-semibold">{summary.activeOptimizationsCount} opportunities</span>
            <span className="text-slate-600">·</span>
            <span>~{Math.round((summary.potentialMonthlySavings / (summary.currentMonthlySpend || 1)) * 100)}% reduction</span>
          </div>
        </div>

        {/* Budget Health */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Budget Health</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
              {budgetHealth.usagePercent}%
            </span>
            <span className="text-xs text-slate-400 font-mono">used</span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${budgetHealth.usagePercent > 90 ? 'bg-rose-500' : budgetHealth.usagePercent > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, budgetHealth.usagePercent)}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Spent ${budgetHealth.actualSpend.toFixed(0)}</span>
              <span>Left ${budgetHealth.remainingBudget.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CENTER CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Cost & Forecast Timeline (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Daily Cost Velocity & ML Forecast</h2>
              <p className="text-xs text-slate-400 mt-0.5">Historical daily run rate combined with 14-day predictive trend</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-slate-300">Actual Spend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                <span className="text-slate-300">ML Forecast</span>
              </div>
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, '']}
                />
                <Area type="monotone" dataKey="spend" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#spendGrad)" connectNulls={false} />
                <Area type="monotone" dataKey="forecast" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#forecastGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Cloud Provider Breakdown (1 col) */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white">Cloud Provider Share</h2>
              <button onClick={() => onNavigate('accounts')} className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5">
                Manage <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">Normalized distribution across AWS, Azure, and GCP</p>

            <div className="h-[150px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Spend']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {summary.providerSpend.map((p) => (
              <div key={p.provider} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[p.provider] }} />
                  <span className="font-semibold text-slate-200 uppercase">{p.provider}</span>
                  <span className="text-slate-400 font-mono">({p.resourceCount} res)</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-300 font-medium">${p.monthlySpend.toFixed(2)}</span>
                  <span className="text-slate-400 font-semibold">{p.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: QUICK ACTIONS & ANOMALIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Optimization Recommendations */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Top Optimization Candidates</h2>
            </div>
            <button 
              onClick={() => onNavigate('optimization')}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View all ({recommendations.length})
            </button>
          </div>

          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec) => (
              <div 
                key={rec.id}
                className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-300 uppercase font-mono">{rec.provider}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{rec.service}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-emerald-400 font-mono font-medium">Save ${rec.estimatedMonthlySavings.toFixed(2)}/mo</span>
                  </div>
                  <div className="text-xs font-medium text-slate-100">{rec.title}</div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{rec.reason}</p>
                </div>

                <div className="shrink-0 pt-0.5">
                  <button
                    onClick={() => onApproveRecommendation(rec.id)}
                    className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Detected Anomalies Feed */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Detected Spikes & Waste Anomalies</h2>
            </div>
            <button 
              onClick={() => onNavigate('alerts')}
              className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              Alert Center
            </button>
          </div>

          <div className="space-y-3">
            {anomalies.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No active anomalies detected across connected cloud accounts.
              </div>
            ) : (
              anomalies.slice(0, 3).map((anom) => (
                <div 
                  key={anom.id}
                  className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-semibold uppercase font-mono ${
                        anom.severity === 'CRITICAL' ? 'text-rose-400' : anom.severity === 'HIGH' ? 'text-amber-400' : 'text-sky-400'
                      }`}>
                        {anom.severity}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-300 font-medium">{anom.resourceName}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">{anom.service}</span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Impact: <span className="text-rose-400 font-mono font-medium">+${anom.estimatedCostImpactMonthly.toFixed(2)}/mo</span>
                      {' '}(deviation {anom.deviationPct > 0 ? '+' : ''}{anom.deviationPct}%)
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{anom.recommendedAction}</p>
                  </div>

                  <button
                    onClick={() => onInspectResource(anom.resourceId)}
                    className="shrink-0 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
                  >
                    Inspect
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. TOP EXPENSIVE WORKLOADS ROW */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Highest Run-Rate Cloud Resources</h2>
            <p className="text-xs text-slate-400 mt-0.5">Top workloads driving monthly infrastructure invoice</p>
          </div>
          <button 
            onClick={() => onNavigate('resources')}
            className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            Open Explorer <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Resource Name</th>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3 text-right">CPU Avg</th>
                <th className="py-2.5 px-3 text-right">Monthly Spend</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {expensiveResources.map((res) => (
                <tr key={res.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                    <button 
                      onClick={() => onInspectResource(res.id)}
                      className="hover:text-emerald-400 transition-colors text-left"
                    >
                      {res.name}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 uppercase text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[res.provider] }} />
                      {res.provider}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{res.resourceType}</td>
                  <td className="py-2.5 px-3 text-slate-400">{res.region}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">
                    {res.currentCpuPct}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-100 tabular-nums">
                    ${res.costMonthly.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <button
                      onClick={() => onInspectResource(res.id)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Telemetry
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

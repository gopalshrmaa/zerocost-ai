import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  DollarSign, 
  Filter,
  CheckCheck
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Alert, Budget, AnomalySeverity } from '../../types.ts';

export const AlertsBudgetsView: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // New Budget Modal state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetName, setBudgetName] = useState('');
  const [budgetScope, setBudgetScope] = useState<'TOTAL' | 'PROVIDER' | 'ENVIRONMENT'>('PROVIDER');
  const [scopeValue, setScopeValue] = useState('aws');
  const [budgetAmount, setBudgetAmount] = useState('1200');
  const [thresholdPct, setThresholdPct] = useState('80');

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.getAlerts(), api.getBudgets()])
      .then(([aRes, bRes]) => {
        setAlerts(aRes.alerts);
        setBudgets(bRes.budgets);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkRead = async (id: string) => {
    await api.markAlertRead(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const handleMarkAllRead = async () => {
    await api.markAllAlertsRead();
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createBudget({
      name: budgetName,
      scope: budgetScope,
      scopeValue,
      monthlyBudget: parseFloat(budgetAmount),
      alertThresholdPct: parseInt(thresholdPct, 10)
    });
    setShowBudgetModal(false);
    setBudgetName('');
    fetchData();
  };

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">FinOps Alert Center & Budget Governance</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time policy guardrails, overrun warnings, and waste threshold telemetry
          </p>
        </div>

        <button
          onClick={() => setShowBudgetModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Configure Cloud Budget</span>
        </button>
      </div>

      {/* 1. CLOUD BUDGETS GRID */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Active Multi-Cloud Budgets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {budgets.map(b => {
            const usagePct = Math.round((b.actualSpend / (b.monthlyBudget || 1)) * 100);
            const isWarning = usagePct >= b.alertThresholdPct;
            const isExceeded = usagePct > 100;

            return (
              <div 
                key={b.id}
                className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white truncate">{b.name}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                    isExceeded 
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
                      : isWarning
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isExceeded ? 'EXCEEDED' : isWarning ? 'WARNING' : 'HEALTHY'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block">Incurred Spend</span>
                    <span className="text-base font-bold text-white tabular-nums">${b.actualSpend.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-sans block">Ceiling Target</span>
                    <span className="text-slate-300">${b.monthlyBudget.toFixed(2)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full transition-all ${isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, usagePct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{usagePct}% consumed</span>
                    <span>Alert threshold: {b.alertThresholdPct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. ALERTS FEED */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-200">System Telemetry Alerts</h3>
            {/* Filter by severity */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    severityFilter === sev ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        </div>

        <div className="rounded-xl bg-[#0f172a] border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No alerts matching selected severity.
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div 
                key={alert.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${alert.read ? 'opacity-65 hover:opacity-100' : 'bg-slate-900/30'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {alert.severity === 'CRITICAL' ? (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    ) : alert.severity === 'HIGH' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Bell className="w-4 h-4 text-sky-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-mono font-bold uppercase ${
                        alert.severity === 'CRITICAL' ? 'text-rose-400' : alert.severity === 'HIGH' ? 'text-amber-400' : 'text-sky-400'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="font-semibold text-white">{alert.title}</span>
                      {alert.provider && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="font-mono text-slate-400 uppercase">{alert.provider}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">{alert.message}</p>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                {!alert.read && (
                  <button
                    onClick={() => handleMarkRead(alert.id)}
                    className="shrink-0 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0d1322] border border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-semibold text-white">Create Infrastructure Budget</h3>
            <form onSubmit={handleCreateBudget} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Budget Name</label>
                <input
                  type="text"
                  required
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  placeholder="e.g. Production Compute Monthly Cap"
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium">Scope</label>
                  <select
                    value={budgetScope}
                    onChange={(e: any) => setBudgetScope(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="TOTAL">Total Organization</option>
                    <option value="PROVIDER">Provider Specific</option>
                    <option value="ENVIRONMENT">Environment</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Scope Target</label>
                  <input
                    type="text"
                    value={scopeValue}
                    onChange={(e) => setScopeValue(e.target.value)}
                    placeholder="all / aws / azure / prod"
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium">Monthly Amount (USD)</label>
                  <input
                    type="number"
                    required
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Alert Threshold (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={thresholdPct}
                    onChange={(e) => setThresholdPct(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-semibold bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-colors"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Play, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { OptimizationRecommendation, OptimizationStatus, RiskLevel } from '../../types.ts';

interface OptimizationViewProps {
  recommendations: OptimizationRecommendation[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  onExecute: (id: string) => Promise<void>;
  onRollback: (id: string) => Promise<void>;
}

const PROVIDER_COLORS: Record<string, string> = {
  aws: '#f59e0b',
  azure: '#3b82f6',
  gcp: '#10b981',
};

export const OptimizationView: React.FC<OptimizationViewProps> = ({
  recommendations,
  onApprove,
  onReject,
  onExecute,
  onRollback
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [activeModalRec, setActiveModalRec] = useState<OptimizationRecommendation | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  const filtered = recommendations.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    return true;
  });

  const totalActionableSavings = recommendations
    .filter(r => r.status === 'PENDING' || r.status === 'APPROVED')
    .reduce((acc, r) => acc + r.estimatedMonthlySavings, 0);

  const executedSavings = recommendations
    .filter(r => r.status === 'EXECUTED')
    .reduce((acc, r) => acc + r.estimatedMonthlySavings, 0);

  const handleExecuteInModal = async () => {
    if (!activeModalRec) return;
    try {
      setIsExecuting(true);
      setExecutionMessage('Dispatching provider API orchestration...');
      await onExecute(activeModalRec.id);
      setExecutionMessage('Verification complete. State transitioned.');
      setTimeout(() => {
        setIsExecuting(false);
        setActiveModalRec(null);
        setExecutionMessage(null);
      }, 1200);
    } catch (err: any) {
      setIsExecuting(false);
      setExecutionMessage(`Failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Top Savings Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">FinOps Optimization Orchestrator</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Controlled recommendation approval, risk simulation, automated execution, and safety rollback
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Pending Reclaim: <span className="font-bold">${totalActionableSavings.toFixed(2)}/mo</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            Realized Reclaim: <span className="font-bold text-white">${executedSavings.toFixed(2)}/mo</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
          {(['ALL', 'PENDING', 'APPROVED', 'EXECUTED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Category:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none font-mono"
          >
            <option value="ALL">All Categories</option>
            <option value="RIGHTSIZE">Right-Sizing</option>
            <option value="STOP_IDLE">Stop Idle Workloads</option>
            <option value="SCHEDULE_SHUTDOWN">Off-Hours Scheduling</option>
            <option value="SERVERLESS_MEMORY">Serverless Memory Tuning</option>
            <option value="STORAGE_TIER">Storage Archival</option>
          </select>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 rounded-xl bg-[#0f172a] border border-slate-800">
            No optimization recommendations match current filter criteria.
          </div>
        ) : (
          filtered.map(rec => (
            <div
              key={rec.id}
              className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-slate-700/80 transition-all space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold uppercase text-slate-300">
                        {rec.provider}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-slate-400 font-mono">{rec.service}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-slate-300 font-medium">{rec.resourceName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Risk Badge */}
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-slate-400">Risk:</span>
                    <span className={`font-semibold ${rec.riskLevel === 'LOW' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {rec.riskLevel}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold uppercase ${
                    rec.status === 'EXECUTED' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : rec.status === 'APPROVED'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                      : rec.status === 'REJECTED'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {rec.status}
                  </span>
                </div>
              </div>

              {/* Title & Technical Reason */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-white">{rec.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{rec.reason}</p>
                <div className="text-[11px] font-mono text-emerald-400/90 bg-emerald-950/20 border border-emerald-900/40 p-2 rounded-lg">
                  Action: {rec.actionDescription}
                </div>
              </div>

              {/* Financial & Safety Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-slate-400">Current Cost</div>
                  <div className="font-semibold text-slate-200 mt-0.5">${rec.currentCostMonthly.toFixed(2)}/mo</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Optimized Cost</div>
                  <div className="font-semibold text-slate-200 mt-0.5">${rec.estimatedOptimizedCostMonthly.toFixed(2)}/mo</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Monthly Savings</div>
                  <div className="font-bold text-emerald-400 mt-0.5">${rec.estimatedMonthlySavings.toFixed(2)}/mo</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Confidence</div>
                  <div className="font-semibold text-indigo-300 mt-0.5">{rec.confidencePct}% verified</div>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Downtime: {rec.expectedDowntimeSeconds}s</span>
                  <span className="text-slate-600">·</span>
                  <span>Rollback: {rec.rollbackAvailable ? 'Guaranteed' : 'Manual snapshot'}</span>
                </div>

                <div className="flex items-center gap-2">
                  {rec.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => onReject(rec.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => onApprove(rec.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setActiveModalRec(rec)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center gap-1.5"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Execute Now</span>
                      </button>
                    </>
                  )}

                  {rec.status === 'APPROVED' && (
                    <button
                      onClick={() => setActiveModalRec(rec)}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Execute Approved Action</span>
                    </button>
                  )}

                  {rec.status === 'EXECUTED' && rec.rollbackAvailable && (
                    <button
                      onClick={() => onRollback(rec.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Rollback State</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Safety Execution Modal */}
      {activeModalRec && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0d1322] border border-slate-800 rounded-xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Controlled Execution Protocol</h3>
                <p className="text-xs text-slate-400">Explicit confirmation required for cloud orchestration</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300 font-mono">
                <span>Target Workload:</span>
                <span className="font-semibold text-white">{activeModalRec.resourceName}</span>
              </div>
              <div className="flex justify-between text-slate-300 font-mono">
                <span>Cloud Provider:</span>
                <span className="uppercase text-emerald-400 font-semibold">{activeModalRec.provider}</span>
              </div>
              <div className="flex justify-between text-slate-300 font-mono">
                <span>Estimated Reclaim:</span>
                <span className="text-emerald-400 font-bold">${activeModalRec.estimatedMonthlySavings.toFixed(2)} / month</span>
              </div>
              <div className="flex justify-between text-slate-300 font-mono">
                <span>Expected Downtime:</span>
                <span>{activeModalRec.expectedDowntimeSeconds} seconds</span>
              </div>
              <div className="flex justify-between text-slate-300 font-mono">
                <span>Rollback Capability:</span>
                <span className="text-sky-400 font-semibold">Available via Immutable Snapshot</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Applying this action will call the <span className="font-mono text-emerald-400">{activeModalRec.provider.toUpperCase()}</span> orchestration API. All telemetry transitions and config states will be recorded in the immutable audit log.
            </p>

            {executionMessage && (
              <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/40 text-xs text-indigo-300 font-mono">
                {executionMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveModalRec(null)}
                disabled={isExecuting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteInModal}
                disabled={isExecuting}
                className="px-5 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center gap-1.5"
              >
                {isExecuting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Confirm & Orchestrate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

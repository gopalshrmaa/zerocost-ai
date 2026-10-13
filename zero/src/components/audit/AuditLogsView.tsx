import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, CheckCircle2, RotateCcw, AlertTriangle, Search } from 'lucide-react';
import { api } from '../../services/api.ts';
import { AuditLog } from '../../types.ts';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getAuditLogs()
      .then(res => {
        setLogs(res.auditLogs);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = logs.filter(l => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.user.toLowerCase().includes(q) ||
      l.resourceName.toLowerCase().includes(q) ||
      l.provider.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">FinOps Immutable Compliance & Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Append-only verification log of all automated orchestrations, user approvals, and state rollbacks
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, user, or workload..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60"
          />
        </div>
      </div>

      {/* Compliance Banner */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SOC 2 Type II / ISO 27001 FinOps Audit Invariants Active</span>
        </div>
        <span className="text-slate-400">{logs.length} Immutable Events Recorded</span>
      </div>

      {/* Audit Table */}
      <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium bg-slate-900/60">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Cloud Provider</th>
                <th className="py-3 px-3">Resource Target</th>
                <th className="py-3 px-3">State Transition</th>
                <th className="py-3 px-3 text-right">Saving Delta</th>
                <th className="py-3 px-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Retrieving signed audit trail...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(item.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-200 font-medium">
                      {item.user}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-300">
                      {item.action}
                    </td>
                    <td className="py-3 px-3 uppercase text-slate-300">
                      {item.provider}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300 max-w-[160px] truncate">
                      {item.resourceName}
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-[200px] truncate" title={`${item.previousState} -> ${item.newState}`}>
                      <span className="text-slate-400">{item.previousState}</span>
                      <span className="text-slate-600 mx-1">→</span>
                      <span className="text-emerald-400">{item.newState}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400 tabular-nums">
                      {item.estimatedSavingMonthly > 0 ? `+$${item.estimatedSavingMonthly.toFixed(2)}/mo` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.result === 'SUCCESS' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : item.result === 'ROLLED_BACK'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.result}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

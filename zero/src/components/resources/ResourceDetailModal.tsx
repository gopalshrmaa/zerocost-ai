import React, { useEffect, useState } from 'react';
import { X, Server, Activity, AlertCircle, Zap, ShieldAlert, Cpu, HardDrive, Network } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { api } from '../../services/api.ts';
import { CloudResource, ResourceMetricPoint, OptimizationRecommendation, Anomaly } from '../../types.ts';

interface ResourceDetailModalProps {
  resourceId: string;
  onClose: () => void;
  onExecuteRecommendation?: (id: string) => Promise<void>;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resourceId,
  onClose,
  onExecuteRecommendation
}) => {
  const [data, setData] = useState<{
    resource: CloudResource;
    metrics: ResourceMetricPoint[];
    recommendations: OptimizationRecommendation[];
    anomalies: Anomaly[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframeHours, setTimeframeHours] = useState(72);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getResourceDetails(resourceId, timeframeHours)
      .then(res => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [resourceId, timeframeHours]);

  if (!resourceId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0d1322] border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0a0f1d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Server className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  {data?.resource.name || 'Resource Telemetry'}
                </h3>
                {data && (
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {data.resource.provider}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {data?.resource.id} · {data?.resource.region}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timeframe selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setTimeframeHours(24)}
                className={`px-2.5 py-1 rounded ${timeframeHours === 24 ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
              >
                24H
              </button>
              <button
                onClick={() => setTimeframeHours(72)}
                className={`px-2.5 py-1 rounded ${timeframeHours === 72 ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
              >
                72H
              </button>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-20 flex items-center justify-center text-slate-400 text-xs">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-2" />
              Ingesting workload telemetry...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Specs & Spend Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Monthly Run Rate</div>
                  <div className="text-lg font-bold font-mono text-white mt-1 tabular-nums">
                    ${data.resource.costMonthly.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    ${data.resource.costHourly.toFixed(4)} / hour
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Workload Profile</div>
                  <div className="text-sm font-semibold text-slate-200 mt-1 truncate">
                    {data.resource.resourceType}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {data.resource.cpuCores} vCPU · {data.resource.memoryGb} GB RAM
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Average CPU</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                    {data.resource.currentCpuPct}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Mem: {data.resource.currentMemPct}%
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Optimization Saving</div>
                  <div className="text-lg font-bold font-mono text-indigo-400 mt-1 tabular-nums">
                    {data.resource.potentialSavingMonthly > 0 ? `$${data.resource.potentialSavingMonthly.toFixed(2)}` : '$0.00'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {data.resource.potentialSavingMonthly > 0 ? 'Identified reclaim' : 'Optimal config'}
                  </div>
                </div>
              </div>

              {/* CPU & Memory Telemetry Chart */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-semibold text-white">CPU Utilization & Memory Pressure Timeline</h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-slate-300">CPU %</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span className="text-slate-300">Mem %</span>
                    </div>
                  </div>
                </div>

                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={data.metrics.map(m => ({
                        time: m.timestamp.slice(11, 16),
                        cpu: m.cpuPct,
                        mem: m.memPct,
                        reqs: m.requestCount
                      }))}
                      margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }}
                      />
                      <Area type="monotone" dataKey="cpu" stroke="#10b981" strokeWidth={1.5} fill="#10b981" fillOpacity={0.15} />
                      <Area type="monotone" dataKey="mem" stroke="#818cf8" strokeWidth={1.5} fill="#818cf8" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Active Recommendations on this Resource */}
              {data.recommendations.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-semibold text-emerald-300">Available Optimization Action</h4>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      Save ${data.recommendations[0].estimatedMonthlySavings.toFixed(2)}/mo
                    </span>
                  </div>

                  <div className="text-xs text-slate-200">
                    <div className="font-semibold">{data.recommendations[0].title}</div>
                    <p className="text-slate-400 mt-1">{data.recommendations[0].reason}</p>
                  </div>

                  {onExecuteRecommendation && data.recommendations[0].status === 'PENDING' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => onExecuteRecommendation(data.recommendations[0].id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors"
                      >
                        Execute Optimization
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Active Anomalies */}
              {data.anomalies.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <ShieldAlert className="w-4 h-4" />
                    <h4 className="text-xs font-semibold">Historical Waste & Anomaly Signatures</h4>
                  </div>
                  {data.anomalies.map(a => (
                    <div key={a.id} className="text-xs text-slate-300 space-y-0.5">
                      <div className="font-medium text-amber-300">{a.metricType}: Deviation {a.deviationPct}%</div>
                      <p className="text-slate-400 text-[11px]">{a.recommendedAction}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

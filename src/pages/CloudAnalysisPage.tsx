import React from 'react';
import { FinOpsData } from '../types/finops.ts';
import { Sparkles, CheckCircle2, Info, Lightbulb } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface CloudAnalysisPageProps {
  data: FinOpsData;
}

export const CloudAnalysisPage: React.FC<CloudAnalysisPageProps> = ({ data }) => {
  const { providerCosts, costForecast } = data;

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Cloud Analysis</h1>
        <p className="text-sm text-slate-400 mt-1">
          Compare provider pricing and view your 30-day projected cost trajectory.
        </p>
      </div>

      {/* 1. Compare Cloud Providers Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm space-y-4">
        <div className="pb-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-base font-semibold text-white">Compare Cloud Providers</h2>
            <p className="text-xs text-slate-400">Monthly normalized run-rate and workload utilization</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Simulated Baseline</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-xs font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Monthly Cost</th>
                <th className="py-3 px-4">Usage</th>
                <th className="py-3 px-4">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {providerCosts.map((item) => {
                const isCheapest = item.recommendation === 'Cheapest';

                return (
                  <tr
                    key={item.provider}
                    className={`transition-colors ${
                      isCheapest ? 'bg-emerald-950/20 font-medium' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                      <span>{item.provider}</span>
                      {isCheapest && (
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                          Lowest Cost
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={isCheapest ? 'text-emerald-400' : 'text-slate-100'}>
                        ${item.cost}
                      </span>
                      <span className="text-xs text-slate-400 font-normal ml-1">/mo</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {item.usage}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.recommendation === 'Cheapest' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Cheapest
                        </span>
                      ) : item.recommendation === 'Best Value' ? (
                        <span className="text-xs font-semibold text-blue-400">
                          Best Value
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Good
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Human explanation notes below table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
            <strong className="text-emerald-400 block mb-1">Why Google Cloud is cheapest ($334):</strong>
            GCP applies automatic sustained-use discounts for servers running throughout the month, without locking you into long-term contracts.
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
            <strong className="text-blue-400 block mb-1">Why Azure is rated "Best Value" ($430):</strong>
            Azure provides strong burstable VM pricing paired with affordable Cool Blob Storage for asynchronous queue processing.
          </div>
        </div>
      </div>

      {/* 2. Cost Forecast Chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm space-y-4">
        <div className="pb-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-base font-semibold text-white">Cost Forecast</h2>
            <p className="text-xs text-slate-400">Expected cloud cost trajectory for the next 30 days</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Day 1 to Day 30</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={costForecast} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                formatter={(val: any) => [`$${val} / day`, 'Expected Cost']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="cost"
                name="Projected Daily Cost"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[11px] text-slate-400 px-1">
          * Notice the daily expense climbs from $42.1/day to $51.0/day by Day 30, which compounds to our predicted $1,417 monthly run-rate.
        </p>
      </div>

      {/* 3. AI Insight Box */}
      <div className="rounded-xl border border-blue-900/40 bg-gradient-to-r from-slate-900 via-blue-950/20 to-slate-900 p-5 shadow-sm flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white mb-1">AI Insight</h3>
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            "Based on the simulated workload, Azure currently provides the best balance between cost and usage."
          </p>
          <div className="mt-2 text-xs text-slate-400 border-t border-slate-800/80 pt-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>Student tip:</strong> When presenting, mention that cross-cloud multi-homing helps prevent vendor lock-in while cutting hosting bills.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

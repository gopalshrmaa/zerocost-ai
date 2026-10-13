import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { Download, Filter, Calendar } from 'lucide-react';
import { api } from '../../services/api.ts';
import { NormalizedCostRecord } from '../../types.ts';

const PROVIDER_COLORS: Record<string, string> = {
  aws: '#f59e0b',
  azure: '#3b82f6',
  gcp: '#10b981',
};

export const CostTelemetryView: React.FC = () => {
  const [records, setRecords] = useState<NormalizedCostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '90d'>('30d');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    api.getCosts({
      provider: selectedProvider !== 'all' ? selectedProvider : undefined,
      service: selectedService !== 'all' ? selectedService : undefined,
      timeframe
    }).then(res => {
      setRecords(res.records);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [timeframe, selectedProvider, selectedService]);

  // Aggregate daily records for stacked chart
  const dailyStackedData = useMemo(() => {
    const map = new Map<string, { date: string; aws: number; azure: number; gcp: number; total: number }>();

    for (const r of records) {
      const d = r.timestamp.slice(5, 10); // MM-DD
      if (!map.has(d)) {
        map.set(d, { date: d, aws: 0, azure: 0, gcp: 0, total: 0 });
      }
      const entry = map.get(d)!;
      if (r.provider === 'aws') entry.aws += r.cost;
      else if (r.provider === 'azure') entry.azure += r.cost;
      else if (r.provider === 'gcp') entry.gcp += r.cost;
      entry.total += r.cost;
    }

    return Array.from(map.values())
      .map(entry => ({
        ...entry,
        aws: Math.round(entry.aws * 100) / 100,
        azure: Math.round(entry.azure * 100) / 100,
        gcp: Math.round(entry.gcp * 100) / 100,
        total: Math.round(entry.total * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  // Aggregation by service
  const serviceSummary = useMemo(() => {
    const map = new Map<string, { service: string; provider: string; totalCost: number; count: number }>();
    for (const r of records) {
      const key = `${r.service}_${r.provider}`;
      if (!map.has(key)) {
        map.set(key, { service: r.service, provider: r.provider, totalCost: 0, count: 0 });
      }
      const e = map.get(key)!;
      e.totalCost += r.cost;
      e.count += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.totalCost - a.totalCost);
  }, [records]);

  const totalPeriodSpend = records.reduce((acc, r) => acc + r.cost, 0);

  const exportCSV = () => {
    const headers = ['ID', 'Provider', 'Service', 'Resource', 'Region', 'Timestamp', 'Cost_USD', 'Env'];
    const rows = records.map(r => [
      r.id,
      r.provider,
      r.service,
      `"${r.resourceName}"`,
      r.region,
      r.timestamp,
      r.cost.toFixed(2),
      r.environment
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zerocost_telemetry_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Normalized Multi-Cloud Cost Telemetry</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-provider normalized cost ledger ingested from Cloud Billing & Cost APIs
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe Filter */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
            {(['24h', '7d', '30d', '90d'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-2.5 py-1 rounded transition-colors uppercase ${
                  timeframe === t ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium">Provider:</span>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            {(['all', 'aws', 'azure', 'gcp'] as const).map(p => (
              <button
                key={p}
                onClick={() => setSelectedProvider(p)}
                className={`px-2 py-0.5 rounded text-xs font-mono uppercase ${
                  selectedProvider === p ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total Period Incurred: <span className="text-white font-bold text-sm">${totalPeriodSpend.toFixed(2)}</span>
        </div>
      </div>

      {/* Daily Cost Velocity Chart */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Daily Multi-Cloud Incurrence</h3>
            <p className="text-xs text-slate-400 mt-0.5">Stacked normalized daily cost records by provider</p>
          </div>
        </div>

        <div className="h-[260px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Aggregating cost records...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStackedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [`$${Number(val).toFixed(2)}`, String(name).toUpperCase()]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="aws" name="AWS" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="azure" name="Azure" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="gcp" name="GCP" stackId="a" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Service Breakdown & Ingestion Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Aggregation (1 col) */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <h3 className="text-sm font-semibold text-white mb-1">Spend by Cloud Service</h3>
          <p className="text-xs text-slate-400 mb-4">Ranked by total cost over selected {timeframe}</p>

          <div className="space-y-3 font-mono text-xs">
            {serviceSummary.map((item, idx) => {
              const pct = totalPeriodSpend > 0 ? Math.round((item.totalCost / totalPeriodSpend) * 100) : 0;
              return (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="font-sans font-medium">{item.service}</span>
                    <span className="font-bold text-white">${item.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="uppercase">{item.provider}</span>
                    <span>{pct}% of period</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${pct}%`, 
                        backgroundColor: PROVIDER_COLORS[item.provider] || '#10b981' 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Normalized Cost Records (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Normalized Billing Ledger</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ingested records with standard unit mapping</p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {records.length} records
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium bg-slate-900/60">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">Region</th>
                  <th className="py-2.5 px-3 text-right">Cost (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {records.slice(0, 15).map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-slate-300">{r.timestamp.slice(0, 10)}</td>
                    <td className="py-2 px-3 uppercase text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[r.provider] }} />
                        {r.provider}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300 font-sans">{r.service}</td>
                    <td className="py-2 px-3 text-slate-400 max-w-[140px] truncate">{r.resourceName}</td>
                    <td className="py-2 px-3 text-slate-400">{r.region}</td>
                    <td className="py-2 px-3 text-right font-bold text-white tabular-nums">${r.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

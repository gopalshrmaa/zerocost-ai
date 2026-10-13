import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ExternalLink, 
  Server, 
  Cpu, 
  HardDrive, 
  Layers, 
  SlidersHorizontal 
} from 'lucide-react';
import { CloudResource, CloudProviderId, ServiceCategory } from '../../types.ts';
import { ResourceDetailModal } from './ResourceDetailModal.tsx';

interface ResourceExplorerViewProps {
  resources: CloudResource[];
  selectedResourceId?: string | null;
  onSelectResource: (id: string | null) => void;
  onExecuteRecommendation?: (id: string) => Promise<void>;
}

const PROVIDER_COLORS: Record<string, string> = {
  aws: '#f59e0b',
  azure: '#3b82f6',
  gcp: '#10b981',
};

export const ResourceExplorerView: React.FC<ResourceExplorerViewProps> = ({
  resources,
  selectedResourceId,
  onSelectResource,
  onExecuteRecommendation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [envFilter, setEnvFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'cost' | 'savings' | 'cpu'>('cost');

  const filteredResources = useMemo(() => {
    return resources
      .filter((r) => {
        if (providerFilter !== 'all' && r.provider !== providerFilter) return false;
        if (categoryFilter !== 'all' && r.serviceCategory !== categoryFilter) return false;
        if (envFilter !== 'all' && r.environment !== envFilter) return false;
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          return (
            r.name.toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q) ||
            r.service.toLowerCase().includes(q) ||
            r.resourceType.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'cost') return b.costMonthly - a.costMonthly;
        if (sortBy === 'savings') return b.potentialSavingMonthly - a.potentialSavingMonthly;
        if (sortBy === 'cpu') return b.currentCpuPct - a.currentCpuPct;
        return 0;
      });
  }, [resources, providerFilter, categoryFilter, envFilter, statusFilter, searchTerm, sortBy]);

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Resource Inventory & Topology</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry and rightsizing candidates across connected accounts ({filteredResources.length} matching)
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search resources, services, IDs..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500/60"
          />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Provider Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            {(['all', 'aws', 'azure', 'gcp'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setProviderFilter(p)}
                className={`px-2.5 py-1 rounded text-xs font-medium uppercase font-mono transition-colors ${
                  providerFilter === p
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Service Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="compute">Compute</option>
            <option value="serverless">Serverless</option>
            <option value="storage">Storage</option>
            <option value="database">Database</option>
          </select>

          {/* Environment */}
          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none"
          >
            <option value="all">All Environments</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="running">Running</option>
            <option value="idle">Idle</option>
            <option value="optimized">Optimized</option>
            <option value="stopped">Stopped</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none font-mono"
          >
            <option value="cost">Highest Spend</option>
            <option value="savings">Reclaim Potential</option>
            <option value="cpu">CPU Utilization</option>
          </select>
        </div>
      </div>

      {/* Resources Table */}
      <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium bg-slate-900/60">
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-3">Provider</th>
                <th className="py-3 px-3">Type & Specs</th>
                <th className="py-3 px-3">Region & Env</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">CPU / Mem</th>
                <th className="py-3 px-3 text-right">Monthly Spend</th>
                <th className="py-3 px-3 text-right">Saving Potential</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No resources matched the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredResources.map((res) => (
                  <tr 
                    key={res.id} 
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectResource(res.id)}
                  >
                    {/* Name */}
                    <td className="py-3 px-4 font-medium text-slate-200">
                      <div className="font-sans flex items-center gap-2">
                        <span className="truncate max-w-[220px] group-hover:text-emerald-400 transition-colors">
                          {res.name}
                        </span>
                        {res.hasAnomaly && (
                          <span className="text-[10px] text-amber-400 font-mono font-semibold">
                            ANOMALY
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-[220px]">
                        {res.service} · {res.id}
                      </div>
                    </td>

                    {/* Provider */}
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1.5 font-mono uppercase text-slate-300 font-semibold">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: PROVIDER_COLORS[res.provider] }} 
                        />
                        {res.provider}
                      </span>
                    </td>

                    {/* Type & Specs */}
                    <td className="py-3 px-3 text-slate-300 font-mono">
                      <div>{res.resourceType}</div>
                      <div className="text-[11px] text-slate-400">
                        {res.cpuCores > 0 ? `${res.cpuCores} vCPU` : 'Serverless'} 
                        {res.memoryGb > 0 ? ` · ${res.memoryGb}GB` : ''}
                      </div>
                    </td>

                    {/* Region & Env */}
                    <td className="py-3 px-3 text-slate-400 text-xs">
                      <div>{res.region}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{res.environment}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center text-[11px] font-mono font-semibold uppercase ${
                        res.status === 'running' 
                          ? 'text-emerald-400' 
                          : res.status === 'idle'
                          ? 'text-amber-400'
                          : res.status === 'optimized'
                          ? 'text-sky-400'
                          : 'text-slate-400'
                      }`}>
                        {res.status}
                      </span>
                    </td>

                    {/* CPU & Mem */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                      <div>{res.currentCpuPct}% CPU</div>
                      <div className="text-[11px] text-slate-400">{res.currentMemPct}% Mem</div>
                    </td>

                    {/* Monthly Spend */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-white tabular-nums">
                      ${res.costMonthly.toFixed(2)}
                      <div className="text-[11px] text-slate-400 font-normal">
                        ${res.costHourly.toFixed(3)}/hr
                      </div>
                    </td>

                    {/* Saving Potential */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {res.potentialSavingMonthly > 0 ? (
                        <span className="text-emerald-400 font-semibold">
                          -${res.potentialSavingMonthly.toFixed(2)}/mo
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectResource(res.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Slide-over */}
      {selectedResourceId && (
        <ResourceDetailModal
          resourceId={selectedResourceId}
          onClose={() => onSelectResource(null)}
          onExecuteRecommendation={onExecuteRecommendation}
        />
      )}
    </div>
  );
};

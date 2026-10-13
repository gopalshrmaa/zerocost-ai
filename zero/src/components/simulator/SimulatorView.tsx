import React, { useState, useEffect } from 'react';
import { Sliders, Calculator, ArrowRight, DollarSign, Sparkles, Server, HardDrive, Zap } from 'lucide-react';
import { api } from '../../services/api.ts';
import { SimulationRequest, SimulationResult, CloudProviderId } from '../../types.ts';

const INSTANCES_BY_PROVIDER: Record<CloudProviderId, string[]> = {
  aws: ['t3.micro', 't3.medium', 'c5.large', 'c5.2xlarge', 'm5.large', 'r5.xlarge'],
  azure: ['Standard_B1s', 'Standard_B2s', 'Standard_D2s_v5', 'Standard_D4s_v5', 'Standard_E4s_v5'],
  gcp: ['e2-micro', 'e2-medium', 'e2-standard-4', 'n2-standard-4', 'n2-highmem-4'],
};

const REGIONS_BY_PROVIDER: Record<CloudProviderId, string[]> = {
  aws: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
  azure: ['eastus', 'westeurope', 'southeastasia'],
  gcp: ['us-central1', 'europe-west1', 'asia-east1'],
};

export const SimulatorView: React.FC = () => {
  const [provider, setProvider] = useState<CloudProviderId>('aws');
  const [instanceType, setInstanceType] = useState<string>('c5.2xlarge');
  const [instanceCount, setInstanceCount] = useState<number>(4);
  const [region, setRegion] = useState<string>('us-east-1');
  const [hoursPerMonth, setHoursPerMonth] = useState<number>(730);
  const [pricingModel, setPricingModel] = useState<'on_demand' | 'savings_plan_1yr' | 'savings_plan_3yr' | 'spot'>('savings_plan_1yr');
  const [storageGb, setStorageGb] = useState<number>(250);
  const [storageType, setStorageType] = useState<'gp3' | 'io2' | 'standard_ssd' | 'premium_ssd' | 'standard_hdd'>('gp3');
  
  // Serverless
  const [serverlessRequests, setServerlessRequests] = useState<number>(12); // in Millions
  const [serverlessMemory, setServerlessMemory] = useState<number>(512); // MB
  const [serverlessDuration, setServerlessDuration] = useState<number>(180); // ms

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Auto-switch default instance & region when provider changes
  const handleProviderChange = (newP: CloudProviderId) => {
    setProvider(newP);
    setInstanceType(INSTANCES_BY_PROVIDER[newP][0]);
    setRegion(REGIONS_BY_PROVIDER[newP][0]);
  };

  useEffect(() => {
    setCalculating(true);
    const req: SimulationRequest = {
      provider,
      serviceCategory: 'compute',
      instanceType,
      instanceCount,
      region,
      hoursPerMonth,
      pricingModel,
      cpuCores: 4,
      memoryGb: 16,
      storageGb,
      storageType,
      serverlessRequestsMillions: serverlessRequests,
      serverlessMemoryMb: serverlessMemory,
      serverlessAvgDurationMs: serverlessDuration
    };

    api.calculateSimulation(req)
      .then(res => {
        setResult(res);
        setCalculating(false);
      })
      .catch(err => {
        console.error(err);
        setCalculating(false);
      });
  }, [
    provider, 
    instanceType, 
    instanceCount, 
    region, 
    hoursPerMonth, 
    pricingModel, 
    storageGb, 
    storageType, 
    serverlessRequests, 
    serverlessMemory, 
    serverlessDuration
  ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">Interactive What-If Infrastructure Simulator</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Model reservation savings, rightsized instances, serverless concurrency, and multi-region cost differentials
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Controls (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Workload Configuration Parameters</h3>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium">Cloud Provider Target</label>
            <div className="grid grid-cols-3 gap-2">
              {(['aws', 'azure', 'gcp'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold uppercase border transition-all ${
                    provider === p
                      ? 'bg-slate-800 border-emerald-500/80 text-white shadow-xs'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Instance Type & Region */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">Instance Profile</label>
              <select
                value={instanceType}
                onChange={(e) => setInstanceType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500/60"
              >
                {INSTANCES_BY_PROVIDER[provider].map(it => (
                  <option key={it} value={it}>{it}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">Deployment Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500/60"
              >
                {REGIONS_BY_PROVIDER[provider].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Instance Count Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Instance Quantity</span>
              <span className="text-white font-mono font-bold">{instanceCount} units</span>
            </div>
            <input
              type="range"
              min="1"
              max="32"
              value={instanceCount}
              onChange={(e) => setInstanceCount(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Monthly Runtime Hours Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Runtime Hours per Month</span>
              <span className="text-white font-mono font-bold">
                {hoursPerMonth} hrs {hoursPerMonth === 730 ? '(24/7 Always-On)' : `(~${Math.round(hoursPerMonth / 30)}h/day)`}
              </span>
            </div>
            <input
              type="range"
              min="160"
              max="730"
              step="10"
              value={hoursPerMonth}
              onChange={(e) => setHoursPerMonth(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Pricing Model Commitment */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium">Procurement / Pricing Model</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              {[
                { id: 'on_demand', label: 'On-Demand', disc: '0% off' },
                { id: 'savings_plan_1yr', label: '1-Yr Plan', disc: '38% off' },
                { id: 'savings_plan_3yr', label: '3-Yr Reserved', disc: '62% off' },
                { id: 'spot', label: 'Spot / Preempt', disc: '70% off' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setPricingModel(item.id as any)}
                  className={`p-2 rounded-lg text-left border transition-all ${
                    pricingModel === item.id
                      ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-white">{item.label}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">{item.disc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Attached Storage & Serverless Parameters */}
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">Storage per Node (GB)</label>
              <input
                type="number"
                min="0"
                max="5000"
                value={storageGb}
                onChange={(e) => setStorageGb(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">Serverless Invocations (M/mo)</label>
              <input
                type="number"
                min="0"
                max="500"
                value={serverlessRequests}
                onChange={(e) => setServerlessRequests(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Calculated Outcome (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-gradient-to-b from-[#0f172a] to-[#090e1a] border border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Projected Financial Impact</h3>
              </div>
              {calculating && (
                <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {result ? (
              <>
                {/* Side-by-side Cost Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Baseline Baseline</div>
                    <div className="text-lg font-bold font-mono text-slate-300 mt-1 tabular-nums line-through opacity-70">
                      ${result.currentCostMonthly.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Full On-Demand</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/40">
                    <div className="text-[11px] text-emerald-400">Simulated Target</div>
                    <div className="text-xl font-bold font-mono text-emerald-300 mt-1 tabular-nums">
                      ${result.newCostMonthly.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-emerald-400/80 mt-0.5">Optimized rate</div>
                  </div>
                </div>

                {/* Monthly & Yearly Delta */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-sans">Monthly Reclaimed Cash:</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      +${result.monthlyDifference.toFixed(2)} / mo
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-sans">Annualized Bottom-Line Delta:</span>
                    <span className="text-white font-bold text-sm">
                      +${result.yearlyDifference.toLocaleString(undefined, { minimumFractionDigits: 2 })} / yr
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                    <span className="text-slate-400 font-sans">Percentage Cost Reduction:</span>
                    <span className="text-indigo-400 font-bold text-sm">
                      {result.percentageSavings}%
                    </span>
                  </div>
                </div>

                {/* Sub-charges breakdown */}
                <div className="space-y-2 text-xs font-mono">
                  <div className="text-[11px] text-slate-400 font-sans font-medium">Estimated Itemized Breakdown</div>
                  <div className="flex justify-between text-slate-300">
                    <span>Compute Base:</span>
                    <span>${result.costBreakdown.computeCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>EBS / Persistent Storage:</span>
                    <span>${result.costBreakdown.storageCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Serverless Invocations:</span>
                    <span>${result.costBreakdown.serverlessCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-semibold pt-1 border-t border-slate-800">
                    <span>Reservation Discount:</span>
                    <span>-${result.costBreakdown.discountApplied.toFixed(2)}</span>
                  </div>
                </div>

                {/* Recommendation Note */}
                <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{result.recommendationNote}</p>
                </div>
              </>
            ) : null}
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
            Simulations consume multi-cloud pricing tables and region multipliers from the ZeroCost Engine.
          </div>
        </div>
      </div>
    </div>
  );
};

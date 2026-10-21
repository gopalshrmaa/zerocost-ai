import React from 'react';
import { FinOpsData } from '../types/finops.ts';
import { DollarSign, TrendingUp, PiggyBank, Gauge, Info } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface DashboardPageProps {
  data: FinOpsData;
}

const PROVIDER_COLORS: Record<string, string> = {
  AWS: '#f59e0b',
  Azure: '#0284c7',
  'Google Cloud': '#10b981'
};

const BREAKDOWN_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export const DashboardPage: React.FC<DashboardPageProps> = ({ data }) => {
  const { currentCost, predictedCost, potentialSavings, efficiencyScore, monthlyTrend, providerCosts, costBreakdown } = data;

  return (
    <div className="space-y-8">
      {/* Friendly Welcome Banner */}
      <div className="rounded-xl border border-blue-900/40 bg-gradient-to-r from-slate-900 via-blue-950/20 to-slate-900 p-4 shadow-sm flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">Welcome to the ZeroCost AI Demo:</strong> This dashboard tracks a simulated startup running workloads across AWS, Azure, and Google Cloud. Notice how small optimizations in idle compute and storage can save over <strong>$326 each month</strong>!
        </div>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Cloud Cost Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">
          Understand your cloud spending and discover potential savings.
        </p>
      </div>

      {/* 4 Main Cards with Human-Friendly Subtitles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current Cost */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Current Cost</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white font-mono">
                ${currentCost.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">/ month</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/80">
            Combined spend across AWS, Azure & GCP
          </p>
        </div>

        {/* Card 2: Predicted Cost */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Predicted Cost</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white font-mono">
                ${predictedCost.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">/ month</span>
            </div>
          </div>
          <p className="text-[11px] text-amber-400/80 mt-3 pt-2 border-t border-slate-800/80">
            +10.4% projected next month without fixes
          </p>
        </div>

        {/* Card 3: Potential Savings */}
        <div className="rounded-xl border border-emerald-900/40 bg-slate-900/90 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-400">Potential Savings</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                ${potentialSavings.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">/ month</span>
            </div>
          </div>
          <p className="text-[11px] text-emerald-400 mt-3 pt-2 border-t border-emerald-950">
            Trims monthly bill down to $958/month
          </p>
        </div>

        {/* Card 4: Cloud Efficiency */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Cloud Efficiency</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Gauge className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white font-mono">{efficiencyScore}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/80">
            Grade B (Moderate) — 4 clear waste areas
          </p>
        </div>
      </div>

      {/* 3 Main Dashboard Charts with Human Explanatory Notes */}
      <div className="space-y-6">
        {/* Chart 1: Monthly Cost Trend */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
          <div className="pb-3 border-b border-slate-800 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h2 className="text-base font-semibold text-white">Monthly Cost Trend</h2>
              <p className="text-xs text-slate-400">Last 6 months actual spending vs predicted cost</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">May – October</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(value: any) => [`$${value}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Cost"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6' }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="Predicted Cost"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Student Commentary Note */}
          <div className="mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
            <strong className="text-slate-300">Observation:</strong> The cost trajectory increased from $1,040 in May to $1,284 in October due to natural user request growth and new database replicas. Notice how closely the actual bill followed the predicted line.
          </div>
        </div>

        {/* Charts Row 2: Provider Cost & Cost Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 2: Cloud Provider Cost */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-slate-800 mb-4">
                <h2 className="text-base font-semibold text-white">Cloud Provider Cost</h2>
                <p className="text-xs text-slate-400">Monthly spend comparison across cloud platforms</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={providerCosts} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="provider" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                    <Tooltip
                      formatter={(value: any) => [`$${value}/month`, 'Monthly Cost']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="cost" name="Monthly Cost" radius={[6, 6, 0, 0]}>
                      {providerCosts.map((entry) => (
                        <Cell key={entry.provider} fill={PROVIDER_COLORS[entry.provider] || '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
              <strong className="text-slate-300">Observation:</strong> AWS holds the largest share ($520) because primary API servers run on EC2. Google Cloud ($334) is the most economical per unit of computing.
            </div>
          </div>

          {/* Chart 3: Cost Breakdown */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-slate-800 mb-4">
                <h2 className="text-base font-semibold text-white">Cost Breakdown</h2>
                <p className="text-xs text-slate-400">Spending across infrastructure service categories</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(val: any, name: any) => [`$${val} (${data.costBreakdown.find(s => s.service === name)?.percentage}%)`, name]}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                    <Pie
                      data={costBreakdown}
                      dataKey="cost"
                      nameKey="service"
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {costBreakdown.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]}
                          stroke="#0f172a"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
              <strong className="text-slate-300">Observation:</strong> Compute is exactly 50% ($642) of all costs. That means focusing our optimization efforts on VM right-sizing and serverless yields the highest dollar returns.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

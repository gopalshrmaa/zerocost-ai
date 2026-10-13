import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Calendar, 
  ArrowUpRight, 
  Target,
  BarChart2
} from 'lucide-react';
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
import { CostForecast } from '../../types.ts';

export const ForecastView: React.FC = () => {
  const [forecast, setForecast] = useState<CostForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getForecast()
      .then(res => {
        setForecast(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !forecast) {
    return (
      <div className="py-24 flex items-center justify-center text-xs text-slate-400">
        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-2" />
        Running regression time-series forecasting engine...
      </div>
    );
  }

  const chartData = forecast.dailyPoints.map(p => ({
    date: p.date.slice(5),
    actual: p.actualCost ?? null,
    forecast: p.forecastedCost,
    lower: p.lowerBound,
    upper: p.upperBound,
  }));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight">AI & Predictive Cost Forecasting</h2>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              R² Fit {forecast.confidenceScorePct}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical regression time-series with day-of-week seasonality and expanding confidence cones
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Horizon: 30-Day Extrapolation</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-xs text-slate-400">Current Run Rate</div>
          <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
            ${forecast.currentRunRateMonthly.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Annualized: ${(forecast.currentRunRateMonthly * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-xs text-slate-400">Forecasted Month-End</div>
          <div className="text-xl font-bold font-mono text-indigo-400 mt-1 tabular-nums">
            ${forecast.forecastedMonthEndSpend.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {forecast.growthRatePct >= 0 ? `+${forecast.growthRatePct}%` : `${forecast.growthRatePct}%`} 14-day velocity
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-xs text-slate-400">Projected Overrun</div>
          <div className={`text-xl font-bold font-mono mt-1 tabular-nums ${forecast.projectedOverrun > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            ${forecast.projectedOverrun.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {forecast.projectedOverrun > 0 ? 'Exceeds budget target' : 'Within budget margin'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="text-xs text-slate-400">Model Confidence</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            {forecast.confidenceScorePct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Standard error ±${((forecast.forecastedMonthEndSpend * (1 - forecast.confidenceScorePct / 100)) / 10).toFixed(2)}/day
          </div>
        </div>
      </div>

      {/* AI FinOps Architect Briefing Card */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/30 via-slate-900 to-[#0f172a] border border-indigo-500/30">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                FinOps Intelligence Synthesis
              </h3>
              <span className="text-[10px] font-mono text-indigo-400">Automated Reasoning</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {forecast.aiFinOpsSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Uncertainty Cone Chart */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">30-Day Cost Prediction Cone</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical actuals with upper (95th percentile) and lower (5th percentile) uncertainty bounds
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-slate-300">Historical Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
              <span className="text-slate-300">Expected Value</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-900 border border-indigo-700" />
              <span className="text-slate-400">95% Confidence Cone</span>
            </div>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="coneGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any, name: any) => [`$${Number(val).toFixed(2)}`, name === 'actual' ? 'Actual' : name === 'forecast' ? 'Forecast' : name]}
              />
              <Area type="monotone" dataKey="upper" stroke="#4338ca" strokeWidth={1} strokeDasharray="2 2" fill="url(#coneGrad)" />
              <Area type="monotone" dataKey="lower" stroke="#4338ca" strokeWidth={1} strokeDasharray="2 2" fill="transparent" />
              <Area type="monotone" dataKey="forecast" stroke="#818cf8" strokeWidth={2.5} fill="transparent" />
              <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service Growth Rate Matrix */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <h3 className="text-sm font-semibold text-white mb-1">Service Spend Trajectory Matrix</h3>
        <p className="text-xs text-slate-400 mb-4">Projected growth and run-rate evolution per cloud service</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forecast.serviceBreakdown.map((s, idx) => (
            <div key={idx} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">{s.service}</span>
                <span className={`font-mono font-semibold ${s.growthPct > 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {s.growthPct >= 0 ? `+${s.growthPct}%` : `${s.growthPct}%`}
                </span>
              </div>
              <div className="flex items-baseline justify-between font-mono text-xs">
                <div className="text-slate-400">Current: ${s.currentSpend.toFixed(2)}</div>
                <div className="font-bold text-white">Projected: ${s.forecastedSpend.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

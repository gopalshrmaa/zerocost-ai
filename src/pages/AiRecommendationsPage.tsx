import React, { useState } from 'react';
import { RecommendationItem } from '../types/finops.ts';
import { PiggyBank, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

interface AiRecommendationsPageProps {
  recommendations: RecommendationItem[];
  totalSavings: number;
}

export const AiRecommendationsPage: React.FC<AiRecommendationsPageProps> = ({
  recommendations,
  totalSavings
}) => {
  // Allow toggling recommendations in the demo
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  const toggleApplied = (id: string) => {
    setAppliedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const currentlySaved = appliedIds.reduce((sum, id) => {
    const item = recommendations.find((r) => r.id === id);
    return sum + (item ? item.saving : 0);
  }, 0);

  const remainingToSave = totalSavings - currentlySaved;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Cost Recommendations</h1>
          <p className="text-sm text-slate-400 mt-1">
            Targeted optimization suggestions to eliminate wasted cloud spending.
          </p>
        </div>

        {appliedIds.length > 0 && (
          <button
            onClick={() => setAppliedIds([])}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Toggles</span>
          </button>
        )}
      </div>

      {/* Demo helper tip */}
      <div className="rounded-lg bg-slate-900/60 border border-slate-800 px-4 py-2.5 text-xs text-slate-400 flex items-center justify-between">
        <span>
          💡 <strong className="text-slate-300">Live Demo Feature:</strong> Click <span className="text-emerald-400 font-semibold">"Simulate Fix"</span> on any card below to see live savings calculation during your presentation.
        </span>
        <span className="font-mono text-emerald-400 font-medium">
          {appliedIds.length} / 4 Applied
        </span>
      </div>

      {/* 4 Clean Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {recommendations.map((rec) => {
          const isDone = appliedIds.includes(rec.id);

          return (
            <div
              key={rec.id}
              className={`rounded-xl border p-5 space-y-4 transition-all flex flex-col justify-between ${
                isDone
                  ? 'border-emerald-500/50 bg-emerald-950/20'
                  : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {rec.title}
                    {isDone && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Fixed
                      </span>
                    )}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-slate-400">Save</span>
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      ${rec.saving}
                    </span>
                    <span className="text-xs text-slate-400">/mo</span>
                  </div>
                </div>

                {/* Reason */}
                <div className="text-sm text-slate-300 mt-3">
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Reason:</span>
                  <p className="leading-relaxed">"{rec.reason}"</p>
                </div>

                {/* Action */}
                <div className="text-sm text-slate-300 mt-3">
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Recommended Action:</span>
                  <p className="leading-relaxed text-slate-200">{rec.action}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {isDone ? 'Marked as completed in demo' : 'Click to test in demo'}
                </span>

                <button
                  onClick={() => toggleApplied(rec.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isDone
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  }`}
                >
                  {isDone ? (
                    'Undo Simulation'
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Simulate Fix
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Estimated Savings Banner at the Bottom */}
      <div className="rounded-xl border border-emerald-900/50 bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Optimization Summary
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-0.5">
              Total Estimated Savings: <span className="text-emerald-400">${totalSavings}/month</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 sm:text-right">
          {currentlySaved > 0 ? (
            <div>
              <span className="text-emerald-400 font-semibold block text-sm">
                +${currentlySaved}/mo saved in demo!
              </span>
              <span className="text-[11px] text-slate-400">
                ${remainingToSave}/mo remaining potential
              </span>
            </div>
          ) : (
            <div>
              <span className="block font-medium text-slate-300">Annual Run-rate Reduction:</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                ${(totalSavings * 12).toLocaleString()} / year
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

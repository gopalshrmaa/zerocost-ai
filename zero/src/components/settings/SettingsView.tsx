import React, { useState } from 'react';
import { Settings, Shield, Sliders, BellRing, Save, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [autoExecuteLowRisk, setAutoExecuteLowRisk] = useState(false);
  const [maxAutoSavings, setMaxAutoSavings] = useState('50');
  const [twoPersonApproval, setTwoPersonApproval] = useState(true);
  const [anomalySensitivity, setAnomalySensitivity] = useState('2.5');
  const [telemetryInterval, setTelemetryInterval] = useState('20');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">FinOps Governance & Automation Policies</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure autonomous optimization guardrails, anomaly detection sensitivity, and notification sinks
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Policy Section */}
        <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Autonomous Orchestration Guardrails</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-200">Autonomous Low-Risk Execution</div>
                <div className="text-slate-400 mt-0.5">
                  Automatically apply LOW risk optimizations (e.g. unattached EBS deletion, cold storage transitions)
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoExecuteLowRisk}
                onChange={(e) => setAutoExecuteLowRisk(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-200">Production Two-Person Rule</div>
                <div className="text-slate-400 mt-0.5">
                  Require dual FinOps approvals before executing any compute instance shutdown in Production
                </div>
              </div>
              <input
                type="checkbox"
                checked={twoPersonApproval}
                onChange={(e) => setTwoPersonApproval(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-slate-400 font-medium block">Max Autonomous Action Value ($)</label>
                <input
                  type="number"
                  value={maxAutoSavings}
                  onChange={(e) => setMaxAutoSavings(e.target.value)}
                  className="w-full mt-1.5 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block">Anomaly Sensitivity (Z-Score Threshold)</label>
                <select
                  value={anomalySensitivity}
                  onChange={(e) => setAnomalySensitivity(e.target.value)}
                  className="w-full mt-1.5 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none"
                >
                  <option value="2.0">Strict (2.0σ - High sensitivity, early warning)</option>
                  <option value="2.5">Standard (2.5σ - Balanced false positive rate)</option>
                  <option value="3.0">Conservative (3.0σ - Severe spikes only)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Polling */}
        <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Telemetry & Pipeline Synchronization</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-medium block">Real-time Polling Interval</label>
              <select
                value={telemetryInterval}
                onChange={(e) => setTelemetryInterval(e.target.value)}
                className="w-full mt-1.5 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none"
              >
                <option value="10">10 Seconds (Aggressive)</option>
                <option value="20">20 Seconds (Standard CloudWatch / Metrics sync)</option>
                <option value="60">60 Seconds (Quiet)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium block">FinOps Currency Base</label>
              <input
                type="text"
                disabled
                value="USD ($) - Standardized"
                className="w-full mt-1.5 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 font-mono cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-sm cursor-pointer"
          >
            {savedFeedback ? (
              <>
                <Check className="w-4 h-4" />
                <span>Policies Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save FinOps Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

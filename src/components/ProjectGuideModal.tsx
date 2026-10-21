import React from 'react';
import { X, BookOpen, HelpCircle, Server, Code, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProjectGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectGuideModal: React.FC<ProjectGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 text-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Project Guide & Viva Notes</h2>
              <p className="text-xs text-slate-400">Everything you need to explain this project to professors, peers, or recruiters.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. What problem does this solve? */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
            <Server className="w-4 h-4" /> 1. What problem does ZeroCost AI solve?
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            When teams deploy to the cloud, about <strong>25% to 35% of cloud spend is wasted</strong>. Developers accidentally leave test virtual machines running, choose oversized CPU/RAM flavors "just in case", or forget unattached disk storage. ZeroCost AI simulates a multi-cloud environment (AWS, Azure, GCP) to identify that waste and calculate potential savings before the bill arrives.
          </p>
        </div>

        {/* 2. System Architecture */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <Code className="w-4 h-4" /> 2. Tech Stack & Architecture
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-semibold text-white block mb-0.5">Frontend</span>
              <span className="text-slate-400 text-[11px]">React 19 + Tailwind CSS + Recharts for clean charts</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-semibold text-white block mb-0.5">Backend API</span>
              <span className="text-slate-400 text-[11px]">Node.js with Express delivering normalized simulated data</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-semibold text-white block mb-0.5">AI Engine</span>
              <span className="text-slate-400 text-[11px]">Google Gemini Flash for natural-language cost advice</span>
            </div>
          </div>
        </div>

        {/* 3. Top Viva / Interview Questions */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> 3. Frequently Asked Viva Questions
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <strong className="text-white block mb-1">Q: Why use simulated data instead of real cloud credentials?</strong>
              <p className="text-slate-300 leading-relaxed">
                A: Real cloud accounts require credit cards, permission policies, and carry the risk of accidental teardown. Using realistic, normalized pricing models allows safe academic demonstration of multi-cloud comparison without any billing risk.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <strong className="text-white block mb-1">Q: How was the $326/month savings calculated?</strong>
              <p className="text-slate-300 leading-relaxed">
                A: By aggregating four specific, realistic optimization fixes: stopping an idle EC2 instance ($84), cleaning unattached EBS disks ($52), moving an infrequent batch worker to serverless ($71), and downsizing over-allocated RAM ($119). 84 + 52 + 71 + 119 = $326/month ($3,912/year).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <strong className="text-white block mb-1">Q: What is FinOps?</strong>
              <p className="text-slate-300 leading-relaxed">
                A: FinOps (Financial Operations) is the cultural and operational practice of bringing financial accountability to the variable spend model of cloud computing.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">ZeroCost AI • Student Project Demonstration</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            Got it, back to demo
          </button>
        </div>
      </div>
    </div>
  );
};

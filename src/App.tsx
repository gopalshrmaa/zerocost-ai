/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar, TabType } from './components/Sidebar.tsx';
import { ProjectGuideModal } from './components/ProjectGuideModal.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { CloudAnalysisPage } from './pages/CloudAnalysisPage.tsx';
import { AiRecommendationsPage } from './pages/AiRecommendationsPage.tsx';
import { AiAssistantPage } from './pages/AiAssistantPage.tsx';
import { mockFinopsData } from './data/mockFinopsData.ts';
import { FinOpsData } from './types/finops.ts';
import { LayoutDashboard, BarChart3, Lightbulb, MessageSquare } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [finopsData, setFinopsData] = useState<FinOpsData>(mockFinopsData);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/finops/data')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setFinopsData(json.data);
        }
      })
      .catch((err) => {
        console.error('Using local mock data fallback:', err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header with Project Guide button */}
      <Header onOpenProjectGuide={() => setIsGuideOpen(true)} />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto pb-24 md:pb-8">
          {currentTab === 'dashboard' && <DashboardPage data={finopsData} />}
          {currentTab === 'analysis' && <CloudAnalysisPage data={finopsData} />}
          {currentTab === 'recommendations' && (
            <AiRecommendationsPage
              recommendations={finopsData.recommendations}
              totalSavings={finopsData.potentialSavings}
            />
          )}
          {currentTab === 'assistant' && <AiAssistantPage data={finopsData} />}
        </main>
      </div>

      {/* Mobile Bottom Navigation (4 buttons) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md px-4 py-2 flex items-center justify-around text-xs">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-1 ${
            currentTab === 'dashboard' ? 'text-blue-500 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setCurrentTab('analysis')}
          className={`flex flex-col items-center gap-1 ${
            currentTab === 'analysis' ? 'text-blue-500 font-bold' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analysis</span>
        </button>

        <button
          onClick={() => setCurrentTab('recommendations')}
          className={`flex flex-col items-center gap-1 ${
            currentTab === 'recommendations' ? 'text-blue-500 font-bold' : 'text-slate-400'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Savings</span>
        </button>

        <button
          onClick={() => setCurrentTab('assistant')}
          className={`flex flex-col items-center gap-1 ${
            currentTab === 'assistant' ? 'text-blue-500 font-bold' : 'text-slate-400'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>AI Chat</span>
        </button>
      </div>

      {/* Project Guide & Viva Notes Modal */}
      <ProjectGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}

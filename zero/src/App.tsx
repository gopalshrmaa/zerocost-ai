import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, ActiveTab } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { OverviewView } from './components/overview/OverviewView.tsx';
import { CloudAccountsView } from './components/accounts/CloudAccountsView.tsx';
import { ResourceExplorerView } from './components/resources/ResourceExplorerView.tsx';
import { CostTelemetryView } from './components/costs/CostTelemetryView.tsx';
import { ForecastView } from './components/forecast/ForecastView.tsx';
import { OptimizationView } from './components/optimization/OptimizationView.tsx';
import { SimulatorView } from './components/simulator/SimulatorView.tsx';
import { AlertsBudgetsView } from './components/alerts/AlertsBudgetsView.tsx';
import { AuditLogsView } from './components/audit/AuditLogsView.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';

import { useRealtimeFinOps } from './hooks/useRealtimeFinOps.ts';
import { api } from './services/api.ts';
import { 
  DashboardSummary, 
  Anomaly, 
  OptimizationRecommendation, 
  CloudResource, 
  AuditLog, 
  DailyForecastPoint 
} from './types.ts';

const TAB_TITLES: Record<ActiveTab, string> = {
  overview: 'Executive Multi-Cloud Overview',
  accounts: 'Cloud Accounts & Connectors',
  resources: 'Resource Explorer & Telemetry',
  costs: 'Costs & Billing Normalization',
  forecast: 'AI & Predictive Forecasting',
  optimization: 'Optimization Orchestrator',
  simulator: 'What-If Cost Simulator',
  alerts: 'Alert Center & Budgets',
  audit: 'Immutable Audit Trail',
  settings: 'Governance & Automation Policies',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [expensiveResources, setExpensiveResources] = useState<CloudResource[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [forecastPoints, setForecastPoints] = useState<DailyForecastPoint[]>([]);
  const [allResources, setAllResources] = useState<CloudResource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load Initial Dashboard and Resources Data
  const loadDashboardData = useCallback(async () => {
    try {
      const [dash, forecast, resData] = await Promise.all([
        api.getDashboard(),
        api.getForecast(),
        api.getResources()
      ]);

      setSummary(dash.summary);
      setAnomalies(dash.recentAnomalies);
      setRecommendations(dash.topRecommendations);
      setExpensiveResources(dash.topExpensiveResources);
      setAuditLogs(dash.recentAudit);
      setForecastPoints(forecast.dailyPoints);
      setAllResources(resData.resources);
    } catch (e) {
      console.error('Error fetching dashboard state:', e);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Real-time EventSource Handler
  const handleEventReceived = useCallback((event: any) => {
    // When real-time backend events arrive, smoothly refresh state without full page reload
    if (event.type === 'cost_updated' && event.payload) {
      setSummary(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentMonthlySpend: event.payload.currentMonthlySpend ?? prev.currentMonthlySpend,
          projectedMonthlySpend: event.payload.projectedMonthlySpend ?? prev.projectedMonthlySpend,
          activeAnomaliesCount: event.payload.activeAnomaliesCount ?? prev.activeAnomaliesCount,
          activeOptimizationsCount: event.payload.activeOptimizationsCount ?? prev.activeOptimizationsCount,
          avgCpuUtilizationPct: event.payload.avgCpuUtilizationPct ?? prev.avgCpuUtilizationPct,
        };
      });
    } else if (event.type === 'resource_updated' || event.type === 'optimization_applied') {
      loadDashboardData();
    }
  }, [loadDashboardData]);

  const { status: connectionStatus, lastEvent } = useRealtimeFinOps(handleEventReceived);

  // Manual Instant Telemetry Sync
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await api.triggerSync();
      await loadDashboardData();
    } finally {
      setIsSyncing(false);
    }
  };

  // Optimization Actions
  const handleApproveRecommendation = async (id: string) => {
    await api.approveOptimization(id);
    await loadDashboardData();
  };

  const handleRejectRecommendation = async (id: string, reason?: string) => {
    await api.rejectOptimization(id, reason);
    await loadDashboardData();
  };

  const handleExecuteRecommendation = async (id: string) => {
    await api.executeOptimization(id);
    await loadDashboardData();
  };

  const handleRollbackRecommendation = async (id: string) => {
    await api.rollbackOptimization(id);
    await loadDashboardData();
  };

  const handleInspectResource = (resourceId: string) => {
    setSelectedResourceId(resourceId);
    setActiveTab('resources');
  };

  const pendingOptimizationsCount = recommendations.filter(r => r.status === 'PENDING').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080c14] text-slate-100 font-sans">
      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingOptimizationsCount={pendingOptimizationsCount}
        unreadAlertsCount={anomalies.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar Header adhering to Top Bar Contract */}
        <Header
          currentTabName={TAB_TITLES[activeTab]}
          connectionStatus={connectionStatus}
          lastEventTime={lastEvent?.timestamp}
          onSync={handleSync}
          isSyncing={isSyncing}
        />

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewView
                summary={summary}
                anomalies={anomalies}
                recommendations={recommendations}
                expensiveResources={expensiveResources}
                auditLogs={auditLogs}
                forecastPoints={forecastPoints}
                onNavigate={setActiveTab}
                onApproveRecommendation={handleApproveRecommendation}
                onInspectResource={handleInspectResource}
              />
            )}

            {activeTab === 'accounts' && (
              <CloudAccountsView />
            )}

            {activeTab === 'resources' && (
              <ResourceExplorerView
                resources={allResources}
                selectedResourceId={selectedResourceId}
                onSelectResource={setSelectedResourceId}
                onExecuteRecommendation={handleExecuteRecommendation}
              />
            )}

            {activeTab === 'costs' && (
              <CostTelemetryView />
            )}

            {activeTab === 'forecast' && (
              <ForecastView />
            )}

            {activeTab === 'optimization' && (
              <OptimizationView
                recommendations={recommendations}
                onApprove={handleApproveRecommendation}
                onReject={handleRejectRecommendation}
                onExecute={handleExecuteRecommendation}
                onRollback={handleRollbackRecommendation}
              />
            )}

            {activeTab === 'simulator' && (
              <SimulatorView />
            )}

            {activeTab === 'alerts' && (
              <AlertsBudgetsView />
            )}

            {activeTab === 'audit' && (
              <AuditLogsView />
            )}

            {activeTab === 'settings' && (
              <SettingsView />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

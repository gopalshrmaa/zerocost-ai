import { 
  DashboardSummary, 
  NormalizedCostRecord, 
  CostForecast, 
  CloudResource, 
  ResourceMetricPoint, 
  OptimizationRecommendation, 
  Anomaly, 
  CloudAccount, 
  Budget, 
  Alert, 
  AuditLog, 
  SimulationRequest, 
  SimulationResult 
} from '../types.ts';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Sync
  triggerSync: () => fetchJson<{ success: boolean; summary: DashboardSummary; message: string }>('/api/sync', { method: 'POST' }),

  // Dashboard
  getDashboard: () => fetchJson<{
    summary: DashboardSummary;
    recentAnomalies: Anomaly[];
    topRecommendations: OptimizationRecommendation[];
    topExpensiveResources: CloudResource[];
    recentAudit: AuditLog[];
  }>('/api/dashboard'),

  // Costs
  getCosts: (params?: { provider?: string; service?: string; region?: string; timeframe?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchJson<{ records: NormalizedCostRecord[]; count: number }>(`/api/costs${query ? `?${query}` : ''}`);
  },

  getForecast: () => fetchJson<CostForecast>('/api/costs/forecast'),

  // Resources
  getResources: (params?: { provider?: string; serviceCategory?: string; status?: string; environment?: string; search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchJson<{ resources: CloudResource[]; total: number }>(`/api/resources${query ? `?${query}` : ''}`);
  },

  getResourceDetails: (id: string, hours: number = 72) => 
    fetchJson<{
      resource: CloudResource;
      metrics: ResourceMetricPoint[];
      recommendations: OptimizationRecommendation[];
      anomalies: Anomaly[];
    }>(`/api/resources/${id}?hours=${hours}`),

  // Optimizations
  getOptimizations: () => fetchJson<{ recommendations: OptimizationRecommendation[] }>('/api/optimizations'),
  
  approveOptimization: (id: string) => 
    fetchJson<{ success: boolean; optimization: OptimizationRecommendation }>(`/api/optimizations/${id}/approve`, { method: 'POST' }),

  rejectOptimization: (id: string, reason?: string) => 
    fetchJson<{ success: boolean; optimization: OptimizationRecommendation }>(`/api/optimizations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  executeOptimization: (id: string) => 
    fetchJson<{ success: boolean; optimization: OptimizationRecommendation; result: any }>(`/api/optimizations/${id}/execute`, { method: 'POST' }),

  rollbackOptimization: (id: string) => 
    fetchJson<{ success: boolean; optimization: OptimizationRecommendation; result: any }>(`/api/optimizations/${id}/rollback`, { method: 'POST' }),

  // Anomalies
  getAnomalies: () => fetchJson<{ anomalies: Anomaly[] }>('/api/anomalies'),
  dismissAnomaly: (id: string) => fetchJson<{ success: boolean }>(`/api/anomalies/${id}/dismiss`, { method: 'POST' }),

  // Cloud Accounts
  getCloudAccounts: () => fetchJson<{ accounts: CloudAccount[] }>('/api/cloud-accounts'),
  
  addCloudAccount: (account: Partial<CloudAccount>) => 
    fetchJson<{ success: boolean; account: CloudAccount }>('/api/cloud-accounts', {
      method: 'POST',
      body: JSON.stringify(account)
    }),

  testCloudAccount: (provider: string, accountId: string) => 
    fetchJson<{ connected: boolean; provider: string; permissions: string[]; availableServices: string[]; latencyMs: number; error?: string }>('/api/cloud-accounts/test', {
      method: 'POST',
      body: JSON.stringify({ provider, accountId })
    }),

  deleteCloudAccount: (id: string) => fetchJson<{ success: boolean }>(`/api/cloud-accounts/${id}`, { method: 'DELETE' }),

  // Budgets
  getBudgets: () => fetchJson<{ budgets: Budget[] }>('/api/budgets'),
  createBudget: (budget: Partial<Budget>) => 
    fetchJson<{ success: boolean; budget: Budget }>('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(budget)
    }),
  updateBudget: (id: string, budget: Partial<Budget>) => 
    fetchJson<{ success: boolean; budget: Budget }>(`/api/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budget)
    }),

  // Alerts
  getAlerts: () => fetchJson<{ alerts: Alert[] }>('/api/alerts'),
  markAlertRead: (id: string) => fetchJson<{ success: boolean }>(`/api/alerts/${id}/read`, { method: 'POST' }),
  markAllAlertsRead: () => fetchJson<{ success: boolean }>('/api/alerts/read-all', { method: 'POST' }),

  // Audit Logs
  getAuditLogs: () => fetchJson<{ auditLogs: AuditLog[] }>('/api/audit-logs'),

  // Simulator
  calculateSimulation: (request: SimulationRequest) => 
    fetchJson<SimulationResult>('/api/simulator/calculate', {
      method: 'POST',
      body: JSON.stringify(request)
    }),
};

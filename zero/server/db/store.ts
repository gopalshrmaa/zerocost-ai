import fs from 'fs';
import path from 'path';
import { 
  CloudAccount, 
  CloudResource, 
  NormalizedCostRecord, 
  OptimizationRecommendation, 
  Anomaly, 
  Budget, 
  Alert, 
  AuditLog, 
  DashboardSummary 
} from '../types.ts';
import { providerManager } from '../providers/manager.ts';
import { forecastingEngine } from '../ml/forecast.ts';
import { anomalyDetector } from '../ml/anomaly.ts';

interface DatabaseSchema {
  accounts: CloudAccount[];
  budgets: Budget[];
  alerts: Alert[];
  auditLogs: AuditLog[];
  optimizations: OptimizationRecommendation[];
  anomalies: Anomaly[];
}

export class FinOpsDatabaseStore {
  private dbFilePath: string;
  private data: DatabaseSchema;
  private isInitialized = false;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {
        // ignore
      }
    }
    this.dbFilePath = path.join(dataDir, 'zerocost_db.json');
    this.data = {
      accounts: [],
      budgets: [],
      alerts: [],
      auditLogs: [],
      optimizations: [],
      anomalies: []
    };
  }

  async init() {
    if (this.isInitialized) return;

    if (fs.existsSync(this.dbFilePath)) {
      try {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        this.data = JSON.parse(raw);
        this.isInitialized = true;
        return;
      } catch (err) {
        console.warn('Could not read existing db file, initializing seed defaults:', err);
      }
    }

    // Seed Initial State
    this.seedDefaultData();
    await this.syncProvidersState();
    this.save();
    this.isInitialized = true;
  }

  private seedDefaultData() {
    this.data.accounts = [
      {
        id: 'acc_aws_prod',
        provider: 'aws',
        name: 'AWS Production (us-east-1)',
        accountId: '124982301982',
        arnOrPrincipal: 'arn:aws:iam::124982301982:role/ZeroCostFinOpsRole',
        environment: 'production',
        status: 'connected',
        lastSyncedAt: new Date().toISOString(),
        resourceCount: 5,
        monthlySpend: 973.12,
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'acc_azure_corp',
        provider: 'azure',
        name: 'Azure Enterprise Infrastructure',
        accountId: 'sub-49f8210-99c1-42ab',
        arnOrPrincipal: 'sp-finops-orchestrator@zerocost.onmicrosoft.com',
        environment: 'production',
        status: 'connected',
        lastSyncedAt: new Date().toISOString(),
        resourceCount: 4,
        monthlySpend: 415.44,
        createdAt: '2026-01-05T00:00:00Z'
      },
      {
        id: 'acc_gcp_core',
        provider: 'gcp',
        name: 'GCP Core AI & Data Platform',
        accountId: 'zerocost-prod-infra-7102',
        arnOrPrincipal: 'finops-agent@zerocost-prod-infra-7102.iam.gserviceaccount.com',
        environment: 'production',
        status: 'connected',
        lastSyncedAt: new Date().toISOString(),
        resourceCount: 4,
        monthlySpend: 360.16,
        createdAt: '2026-01-08T00:00:00Z'
      }
    ];

    this.data.budgets = [
      {
        id: 'bgt-total-org',
        name: 'Enterprise Total Cloud Budget',
        scope: 'TOTAL',
        scopeValue: 'all',
        monthlyBudget: 2200.00,
        actualSpend: 1748.72,
        forecastedSpend: 1892.40,
        alertThresholdPct: 80,
        status: 'HEALTHY',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'bgt-aws-compute',
        name: 'AWS Workloads Cap',
        scope: 'PROVIDER',
        scopeValue: 'aws',
        monthlyBudget: 1100.00,
        actualSpend: 973.12,
        forecastedSpend: 1042.80,
        alertThresholdPct: 85,
        status: 'HEALTHY',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'bgt-dev-env',
        name: 'Development Environment Quota',
        scope: 'ENVIRONMENT',
        scopeValue: 'development',
        monthlyBudget: 200.00,
        actualSpend: 136.48,
        forecastedSpend: 236.48,
        alertThresholdPct: 75,
        status: 'WARNING',
        updatedAt: new Date().toISOString()
      }
    ];

    this.data.alerts = [
      {
        id: 'alt-01',
        timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        severity: 'HIGH',
        type: 'COST_SPIKE',
        title: 'Idle AWS EBS Volume Accumulating Waste',
        message: 'Volume vol-0f8a92bc71901a88b has remained unattached for 38 days, incurring $40.00/mo.',
        resourceId: 'vol-0f8a92bc71901a88b',
        provider: 'aws',
        read: false
      },
      {
        id: 'alt-02',
        timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
        severity: 'MEDIUM',
        type: 'OPTIMIZATION_OPPORTUNITY',
        title: 'Compute Rightsizing Identified',
        message: 'AWS EC2 instance c5.2xlarge can be downgraded to c5.large to reclaim $122.40/mo.',
        resourceId: 'i-0a8b9c1d2e3f4001',
        provider: 'aws',
        read: false
      },
      {
        id: 'alt-03',
        timestamp: new Date(Date.now() - 3600 * 1000 * 9).toISOString(),
        severity: 'LOW',
        type: 'BUDGET_OVERRUN',
        title: 'Dev Environment Approaching 75% Threshold',
        message: 'Development environment spend reached $136.48 against $200.00 ceiling.',
        provider: 'gcp',
        read: true
      }
    ];

    this.data.auditLogs = [
      {
        id: 'aud-001',
        timestamp: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
        user: 'sarah.chen@finops.org',
        action: 'SCHEDULE_SHUTDOWN',
        provider: 'azure',
        resourceId: 'vm-westeurope-stage-portal',
        resourceName: 'vm-westeurope-stage-portal',
        previousState: '24/7 Always-On ($138.24/mo)',
        newState: 'Scheduled Off-Hours Mon-Fri 08:00-18:00 UTC ($44.24/mo)',
        estimatedSavingMonthly: 94.00,
        result: 'SUCCESS',
        details: 'Approved automated cron schedule via ZeroCost Orchestrator.'
      },
      {
        id: 'aud-002',
        timestamp: new Date(Date.now() - 86400 * 1000 * 4).toISOString(),
        user: 'alex.finops@zerocost.io',
        action: 'STORAGE_LIFECYCLE',
        provider: 'azure',
        resourceId: 'blob-enterprise-backups-cold',
        resourceName: 'blob-enterprise-backups-cold',
        previousState: 'Hot Tier ($75.60/mo)',
        newState: 'Archive Tier ($16.80/mo)',
        estimatedSavingMonthly: 58.80,
        result: 'SUCCESS',
        details: 'Enforced 30-day non-access transition policy on 4.2TB backup container.'
      }
    ];
  }

  async syncProvidersState() {
    const recs = await providerManager.getAllRecommendations();
    // Preserve existing status if recommendation already exists
    const existingMap = new Map(this.data.optimizations.map(o => [o.id, o]));
    this.data.optimizations = recs.map(r => existingMap.get(r.id) || r);

    // Run anomaly detector
    const resources = await providerManager.getAllResources();
    const metricsMap = new Map();
    for (const res of resources) {
      const m = await providerManager.getResourceMetrics(res.id, 48);
      metricsMap.set(res.id, m);
    }
    const detected = anomalyDetector.detectAnomalies(resources, metricsMap);
    this.data.anomalies = detected;
  }

  save() {
    try {
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to persist database to disk:', e);
    }
  }

  // Cloud Accounts
  getAccounts(): CloudAccount[] {
    return this.data.accounts;
  }

  addAccount(account: CloudAccount): CloudAccount {
    this.data.accounts.push(account);
    this.save();
    return account;
  }

  removeAccount(id: string): boolean {
    const idx = this.data.accounts.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.accounts.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Budgets
  getBudgets(): Budget[] {
    return this.data.budgets;
  }

  updateBudget(id: string, budget: Partial<Budget>): Budget | null {
    const item = this.data.budgets.find(b => b.id === id);
    if (item) {
      Object.assign(item, budget, { updatedAt: new Date().toISOString() });
      this.save();
      return item;
    }
    return null;
  }

  addBudget(budget: Budget): Budget {
    this.data.budgets.push(budget);
    this.save();
    return budget;
  }

  // Alerts
  getAlerts(): Alert[] {
    return this.data.alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  markAlertRead(id: string): boolean {
    const alert = this.data.alerts.find(a => a.id === id);
    if (alert) {
      alert.read = true;
      this.save();
      return true;
    }
    return false;
  }

  markAllAlertsRead(): void {
    this.data.alerts.forEach(a => a.read = true);
    this.save();
  }

  addAlert(alert: Alert): Alert {
    this.data.alerts.unshift(alert);
    this.save();
    return alert;
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.data.auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  addAuditLog(log: AuditLog): AuditLog {
    this.data.auditLogs.unshift(log);
    this.save();
    return log;
  }

  // Optimizations
  getOptimizations(): OptimizationRecommendation[] {
    return this.data.optimizations;
  }

  getOptimizationById(id: string): OptimizationRecommendation | undefined {
    return this.data.optimizations.find(o => o.id === id);
  }

  updateOptimization(id: string, updates: Partial<OptimizationRecommendation>): OptimizationRecommendation | null {
    const opt = this.data.optimizations.find(o => o.id === id);
    if (opt) {
      Object.assign(opt, updates);
      this.save();
      return opt;
    }
    return null;
  }

  // Anomalies
  getAnomalies(): Anomaly[] {
    return this.data.anomalies;
  }

  dismissAnomaly(id: string): boolean {
    const a = this.data.anomalies.find(x => x.id === id);
    if (a) {
      a.status = 'DISMISSED';
      this.save();
      return true;
    }
    return false;
  }

  // Dashboard Aggregates
  async getDashboardSummary(): Promise<DashboardSummary> {
    const resources = await providerManager.getAllResources();
    const costs = await providerManager.getAllCostRecords();

    const currentMonthlySpend = Math.round(resources.reduce((acc, r) => acc + r.costMonthly, 0) * 100) / 100;
    const today = new Date().toISOString().slice(0, 10);
    const todayRecords = costs.filter(c => c.timestamp.startsWith(today));
    const todaySpend = Math.round(todayRecords.reduce((acc, c) => acc + c.cost, 0) * 100) / 100 || Math.round((currentMonthlySpend / 30) * 100) / 100;

    const forecast = await forecastingEngine.generateForecast(costs, currentMonthlySpend);
    const projectedMonthlySpend = forecast.forecastedMonthEndSpend;

    const activeRecs = this.data.optimizations.filter(o => o.status === 'PENDING' || o.status === 'APPROVED');
    const potentialMonthlySavings = Math.round(activeRecs.reduce((acc, o) => acc + o.estimatedMonthlySavings, 0) * 100) / 100;

    const idleCount = resources.filter(r => r.status === 'idle').length;
    const avgCpu = Math.round((resources.reduce((acc, r) => acc + r.currentCpuPct, 0) / (resources.length || 1)) * 10) / 10;
    const avgMem = Math.round((resources.reduce((acc, r) => acc + r.currentMemPct, 0) / (resources.length || 1)) * 10) / 10;

    const providersMap: Record<string, { spend: number; count: number }> = {
      aws: { spend: 0, count: 0 },
      azure: { spend: 0, count: 0 },
      gcp: { spend: 0, count: 0 }
    };

    for (const r of resources) {
      if (providersMap[r.provider]) {
        providersMap[r.provider].spend += r.costMonthly;
        providersMap[r.provider].count += 1;
      }
    }

    const providerSpend = (['aws', 'azure', 'gcp'] as const).map(p => {
      const sp = Math.round(providersMap[p].spend * 100) / 100;
      return {
        provider: p,
        monthlySpend: sp,
        resourceCount: providersMap[p].count,
        percentage: currentMonthlySpend > 0 ? Math.round((sp / currentMonthlySpend) * 100) : 33
      };
    });

    const totalBudget = this.data.budgets.find(b => b.scope === 'TOTAL')?.monthlyBudget || 2200;
    const remainingBudget = Math.max(0, Math.round((totalBudget - currentMonthlySpend) * 100) / 100);
    const isOverBudget = projectedMonthlySpend > totalBudget;
    const overrunAmount = isOverBudget ? Math.round((projectedMonthlySpend - totalBudget) * 100) / 100 : 0;
    const usagePercent = Math.round((currentMonthlySpend / totalBudget) * 100);

    return {
      currentMonthlySpend,
      todaySpend,
      projectedMonthlySpend,
      potentialMonthlySavings,
      activeOptimizationsCount: activeRecs.length,
      activeAnomaliesCount: this.data.anomalies.filter(a => a.status === 'ACTIVE').length,
      totalResourcesCount: resources.length,
      idleResourcesCount: idleCount,
      avgCpuUtilizationPct: avgCpu,
      avgMemoryUtilizationPct: avgMem,
      totalRequestsToday: 1482000,
      totalInvocationsToday: 842000,
      providerSpend,
      budgetHealth: {
        totalBudget,
        actualSpend: currentMonthlySpend,
        forecastedSpend: projectedMonthlySpend,
        remainingBudget,
        isOverBudget,
        overrunAmount,
        usagePercent
      }
    };
  }
}

export const dbStore = new FinOpsDatabaseStore();

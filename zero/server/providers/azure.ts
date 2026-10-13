import { 
  ICloudProvider, 
  ProviderConnectionTestResult, 
  CostDataFilter, 
  OptimizationApplyResult 
} from './types.ts';
import { 
  CloudResource, 
  NormalizedCostRecord, 
  ResourceMetricPoint, 
  OptimizationRecommendation 
} from '../types.ts';
import { generateHistoricalMetrics, generateDailyCostRecords } from './simulatorData.ts';

export class AzureProvider implements ICloudProvider {
  readonly providerId = 'azure' as const;
  readonly accountId: string;
  readonly name: string;
  private resources: CloudResource[] = [];
  private recommendations: OptimizationRecommendation[] = [];

  constructor(accountId: string = 'sub-49f8210-99c1-42ab', name: string = 'Azure Enterprise Core (eastus)') {
    this.accountId = accountId;
    this.name = name;
    this.initResources();
  }

  private initResources() {
    this.resources = [
      {
        id: 'vm-eastus-prod-worker-01',
        provider: 'azure',
        accountId: this.accountId,
        service: 'Azure VM',
        serviceCategory: 'compute',
        resourceType: 'Standard_D4s_v5',
        name: 'vm-eastus-prod-worker-01',
        region: 'eastus',
        status: 'running',
        environment: 'production',
        cpuCores: 4,
        memoryGb: 16,
        costHourly: 0.192,
        costMonthly: 138.24,
        currentCpuPct: 52.1,
        currentMemPct: 61.4,
        currentRequestsPerSec: 320,
        potentialSavingMonthly: 0,
        hasAnomaly: false,
        hasRecommendation: false,
        tags: { Role: 'Worker', Dept: 'Engineering' },
        createdAt: '2026-01-20T10:00:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'vm-westeurope-stage-portal',
        provider: 'azure',
        accountId: this.accountId,
        service: 'Azure VM',
        serviceCategory: 'compute',
        resourceType: 'Standard_D4s_v5',
        name: 'vm-westeurope-stage-portal',
        region: 'westeurope',
        status: 'idle',
        environment: 'staging',
        cpuCores: 4,
        memoryGb: 16,
        costHourly: 0.192,
        costMonthly: 138.24,
        currentCpuPct: 2.1,
        currentMemPct: 15.0,
        currentRequestsPerSec: 0,
        potentialSavingMonthly: 94.00,
        hasAnomaly: true,
        hasRecommendation: true,
        tags: { Env: 'Staging', Project: 'CustomerPortal' },
        createdAt: '2026-02-12T16:00:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'func-app-payment-webhooks',
        provider: 'azure',
        accountId: this.accountId,
        service: 'Azure Functions',
        serviceCategory: 'serverless',
        resourceType: 'Consumption Plan',
        name: 'func-app-payment-webhooks',
        region: 'eastus',
        status: 'running',
        environment: 'production',
        cpuCores: 1,
        memoryGb: 1.5,
        costHourly: 0.088,
        costMonthly: 63.36,
        currentCpuPct: 28.0,
        currentMemPct: 42.0,
        currentRequestsPerSec: 410,
        potentialSavingMonthly: 0,
        hasAnomaly: false,
        hasRecommendation: false,
        tags: { Tier: 'FinTech', Compliance: 'PCI' },
        createdAt: '2026-01-10T11:22:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'blob-enterprise-backups-cold',
        provider: 'azure',
        accountId: this.accountId,
        service: 'Blob Storage',
        serviceCategory: 'storage',
        resourceType: 'Hot Tier (4.2 TB)',
        name: 'blob-enterprise-backups-cold',
        region: 'eastus',
        status: 'running',
        environment: 'production',
        cpuCores: 0,
        memoryGb: 4200,
        costHourly: 0.105,
        costMonthly: 75.60,
        currentCpuPct: 0,
        currentMemPct: 0,
        currentRequestsPerSec: 5,
        potentialSavingMonthly: 58.80,
        hasAnomaly: false,
        hasRecommendation: true,
        tags: { Retention: '7Year', DataClass: 'Archive' },
        createdAt: '2025-10-01T00:00:00Z',
        updatedAt: new Date().toISOString()
      }
    ];

    this.recommendations = [
      {
        id: 'rec-azure-vm-schedule-01',
        resourceId: 'vm-westeurope-stage-portal',
        resourceName: 'vm-westeurope-stage-portal',
        provider: 'azure',
        service: 'Azure VM',
        serviceCategory: 'compute',
        type: 'SCHEDULE_SHUTDOWN',
        title: 'Schedule off-hours auto-shutdown for Staging Portal VM',
        reason: 'Zero user activity observed between 19:00 UTC and 07:00 UTC and throughout weekends. Automating stop/start schedule cuts 68% of monthly runtime.',
        actionDescription: 'Configure Azure Automation Schedule to run instance only Monday-Friday 08:00 to 18:00 UTC.',
        currentCostMonthly: 138.24,
        estimatedOptimizedCostMonthly: 44.24,
        estimatedMonthlySavings: 94.00,
        confidencePct: 95,
        riskLevel: 'LOW',
        status: 'PENDING',
        rollbackAvailable: true,
        expectedDowntimeSeconds: 0,
        createdAt: '2026-03-02T10:00:00Z'
      },
      {
        id: 'rec-azure-blob-archive-02',
        resourceId: 'blob-enterprise-backups-cold',
        resourceName: 'blob-enterprise-backups-cold',
        provider: 'azure',
        service: 'Blob Storage',
        serviceCategory: 'storage',
        type: 'STORAGE_TIER',
        title: 'Transition unaccessed backups to Azure Archive Tier',
        reason: '4.2 TB backup container has not received read requests in 90 days. Moving objects from Hot to Archive tier reduces gigabyte-month rate by 78%.',
        actionDescription: 'Apply lifecycle policy rule: Prefix "backups/" transition to Archive tier after 30 days of inactivity.',
        currentCostMonthly: 75.60,
        estimatedOptimizedCostMonthly: 16.80,
        estimatedMonthlySavings: 58.80,
        confidencePct: 99,
        riskLevel: 'LOW',
        status: 'PENDING',
        rollbackAvailable: true,
        expectedDowntimeSeconds: 0,
        createdAt: '2026-03-03T08:15:00Z'
      }
    ];
  }

  async testConnection(): Promise<ProviderConnectionTestResult> {
    return {
      connected: true,
      provider: 'azure',
      accountId: this.accountId,
      permissions: [
        'Microsoft.Compute/virtualMachines/read',
        'Microsoft.Compute/virtualMachines/write',
        'Microsoft.CostManagement/query',
        'Microsoft.Storage/storageAccounts/read'
      ],
      availableServices: ['Azure VM', 'Azure Functions', 'Blob Storage', 'Azure SQL'],
      latencyMs: 168
    };
  }

  async getResources(): Promise<CloudResource[]> {
    return [...this.resources];
  }

  async getResourceMetrics(resourceId: string, hours: number = 72): Promise<ResourceMetricPoint[]> {
    const res = this.resources.find(r => r.id === resourceId) || this.resources[0];
    return generateHistoricalMetrics(res, hours);
  }

  async getCostData(filter?: CostDataFilter): Promise<NormalizedCostRecord[]> {
    let records = generateDailyCostRecords('azure', this.resources, 30);
    if (filter?.service) {
      records = records.filter(r => r.service.toLowerCase() === filter.service?.toLowerCase());
    }
    if (filter?.region) {
      records = records.filter(r => r.region === filter.region);
    }
    return records;
  }

  async getServices(): Promise<string[]> {
    return ['Azure VM', 'Azure Functions', 'Blob Storage', 'Azure SQL'];
  }

  async getRegions(): Promise<string[]> {
    return ['eastus', 'westeurope', 'southeastasia'];
  }

  async getOptimizationCandidates(): Promise<OptimizationRecommendation[]> {
    return [...this.recommendations];
  }

  async applyOptimization(recommendationId: string, actionType: string): Promise<OptimizationApplyResult> {
    const rec = this.recommendations.find(r => r.id === recommendationId);
    if (!rec) {
      throw new Error(`Recommendation ${recommendationId} not found in Azure provider`);
    }

    const res = this.resources.find(r => r.id === rec.resourceId);
    const previousConfig = {
      resourceType: res?.resourceType,
      costMonthly: res?.costMonthly,
      status: res?.status
    };

    if (res) {
      if (rec.type === 'SCHEDULE_SHUTDOWN') {
        res.costMonthly = 44.24;
        res.costHourly = 0.061;
        res.potentialSavingMonthly = 0;
        res.hasRecommendation = false;
        res.status = 'optimized';
      } else if (rec.type === 'STORAGE_TIER') {
        res.resourceType = 'Archive Tier (4.2 TB)';
        res.costMonthly = 16.80;
        res.costHourly = 0.023;
        res.potentialSavingMonthly = 0;
        res.hasRecommendation = false;
        res.status = 'optimized';
      }
    }

    rec.status = 'EXECUTED';
    rec.executedAt = new Date().toISOString();

    return {
      success: true,
      resourceId: rec.resourceId,
      action: actionType,
      previousConfig,
      newConfig: {
        resourceType: res?.resourceType,
        costMonthly: res?.costMonthly,
        status: res?.status
      },
      estimatedSavingsMonthly: rec.estimatedMonthlySavings,
      message: `Successfully executed ${rec.title} on Azure resource ${rec.resourceName}.`
    };
  }

  async rollbackOptimization(recommendationId: string): Promise<OptimizationApplyResult> {
    const rec = this.recommendations.find(r => r.id === recommendationId);
    if (!rec) throw new Error(`Recommendation ${recommendationId} not found`);
    this.initResources();
    rec.status = 'ROLLED_BACK';
    rec.rolledBackAt = new Date().toISOString();

    return {
      success: true,
      resourceId: rec.resourceId,
      action: 'ROLLBACK',
      previousConfig: {},
      newConfig: {},
      estimatedSavingsMonthly: 0,
      message: `Rolled back optimization for ${rec.resourceName}.`
    };
  }
}

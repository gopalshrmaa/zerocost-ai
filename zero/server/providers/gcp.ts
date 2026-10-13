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

export class GCPProvider implements ICloudProvider {
  readonly providerId = 'gcp' as const;
  readonly accountId: string;
  readonly name: string;
  private resources: CloudResource[] = [];
  private recommendations: OptimizationRecommendation[] = [];

  constructor(accountId: string = 'zerocost-prod-infra-7102', name: string = 'GCP Core (us-central1)') {
    this.accountId = accountId;
    this.name = name;
    this.initResources();
  }

  private initResources() {
    this.resources = [
      {
        id: 'gce-prod-ml-inference-01',
        provider: 'gcp',
        accountId: this.accountId,
        service: 'Compute Engine',
        serviceCategory: 'compute',
        resourceType: 'n2-standard-4',
        name: 'gce-prod-ml-inference-01',
        region: 'us-central1',
        status: 'running',
        environment: 'production',
        cpuCores: 4,
        memoryGb: 16,
        costHourly: 0.194,
        costMonthly: 139.68,
        currentCpuPct: 68.2,
        currentMemPct: 74.0,
        currentRequestsPerSec: 540,
        potentialSavingMonthly: 0,
        hasAnomaly: false,
        hasRecommendation: false,
        tags: { Tier: 'ML', App: 'Inference' },
        createdAt: '2026-01-08T09:00:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'gce-analytics-worker-legacy',
        provider: 'gcp',
        accountId: this.accountId,
        service: 'Compute Engine',
        serviceCategory: 'compute',
        resourceType: 'e2-standard-4',
        name: 'gce-analytics-worker-legacy',
        region: 'us-central1',
        status: 'idle',
        environment: 'development',
        cpuCores: 4,
        memoryGb: 16,
        costHourly: 0.134,
        costMonthly: 96.48,
        currentCpuPct: 0.8,
        currentMemPct: 8.5,
        currentRequestsPerSec: 0,
        potentialSavingMonthly: 96.48,
        hasAnomaly: true,
        hasRecommendation: true,
        tags: { Deprecated: 'true', CreatedBy: 'analytics-team' },
        createdAt: '2026-01-28T14:10:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'gcf-pubsub-event-router',
        provider: 'gcp',
        accountId: this.accountId,
        service: 'Cloud Functions',
        serviceCategory: 'serverless',
        resourceType: 'Gen 2 (512MB)',
        name: 'gcf-pubsub-event-router',
        region: 'us-central1',
        status: 'running',
        environment: 'production',
        cpuCores: 1,
        memoryGb: 0.512,
        costHourly: 0.075,
        costMonthly: 54.00,
        currentCpuPct: 41.5,
        currentMemPct: 36.0,
        currentRequestsPerSec: 720,
        potentialSavingMonthly: 0,
        hasAnomaly: false,
        hasRecommendation: false,
        tags: { Pipeline: 'Telemetry', Trigger: 'PubSub' },
        createdAt: '2026-01-18T10:00:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'gcs-analytics-raw-bucket',
        provider: 'gcp',
        accountId: this.accountId,
        service: 'Cloud Storage',
        serviceCategory: 'storage',
        resourceType: 'Standard Storage (3.5 TB)',
        name: 'gcs-analytics-raw-bucket',
        region: 'us-central1',
        status: 'running',
        environment: 'production',
        cpuCores: 0,
        memoryGb: 3500,
        costHourly: 0.097,
        costMonthly: 70.00,
        currentCpuPct: 0,
        currentMemPct: 0,
        currentRequestsPerSec: 25,
        potentialSavingMonthly: 42.00,
        hasAnomaly: false,
        hasRecommendation: true,
        tags: { Category: 'BigData', Ingestion: 'Stream' },
        createdAt: '2025-12-10T00:00:00Z',
        updatedAt: new Date().toISOString()
      }
    ];

    this.recommendations = [
      {
        id: 'rec-gcp-stop-idle-01',
        resourceId: 'gce-analytics-worker-legacy',
        resourceName: 'gce-analytics-worker-legacy',
        provider: 'gcp',
        service: 'Compute Engine',
        serviceCategory: 'compute',
        type: 'STOP_IDLE',
        title: 'Stop idle legacy analytics Compute Engine instance',
        reason: 'Instance has sustained zero inbound requests and <1% CPU utilization for over 25 days. Stopping the instance halts all compute charges immediately.',
        actionDescription: 'Issue gcloud compute instances stop command. Disks remain safely retained.',
        currentCostMonthly: 96.48,
        estimatedOptimizedCostMonthly: 0,
        estimatedMonthlySavings: 96.48,
        confidencePct: 98,
        riskLevel: 'LOW',
        status: 'PENDING',
        rollbackAvailable: true,
        expectedDowntimeSeconds: 15,
        createdAt: '2026-03-02T14:40:00Z'
      },
      {
        id: 'rec-gcp-storage-nearline-02',
        resourceId: 'gcs-analytics-raw-bucket',
        resourceName: 'gcs-analytics-raw-bucket',
        provider: 'gcp',
        service: 'Cloud Storage',
        serviceCategory: 'storage',
        type: 'STORAGE_TIER',
        title: 'Apply Autoclass / Nearline lifecycle policy to 3.5TB raw bucket',
        reason: 'Objects older than 30 days are accessed less than once per month. Moving historical raw objects to Nearline cuts storage costs by 60%.',
        actionDescription: 'Set bucket lifecycle condition: Age > 30 days => SetStorageClass: NEARLINE.',
        currentCostMonthly: 70.00,
        estimatedOptimizedCostMonthly: 28.00,
        estimatedMonthlySavings: 42.00,
        confidencePct: 96,
        riskLevel: 'LOW',
        status: 'PENDING',
        rollbackAvailable: true,
        expectedDowntimeSeconds: 0,
        createdAt: '2026-03-03T11:00:00Z'
      }
    ];
  }

  async testConnection(): Promise<ProviderConnectionTestResult> {
    return {
      connected: true,
      provider: 'gcp',
      accountId: this.accountId,
      permissions: [
        'compute.instances.get',
        'compute.instances.stop',
        'storage.buckets.get',
        'storage.buckets.update',
        'cloudfunctions.functions.get',
        'monitoring.timeSeries.list'
      ],
      availableServices: ['Compute Engine', 'Cloud Functions', 'Cloud Storage', 'Cloud SQL', 'BigQuery'],
      latencyMs: 128
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
    let records = generateDailyCostRecords('gcp', this.resources, 30);
    if (filter?.service) {
      records = records.filter(r => r.service.toLowerCase() === filter.service?.toLowerCase());
    }
    if (filter?.region) {
      records = records.filter(r => r.region === filter.region);
    }
    return records;
  }

  async getServices(): Promise<string[]> {
    return ['Compute Engine', 'Cloud Functions', 'Cloud Storage', 'Cloud SQL'];
  }

  async getRegions(): Promise<string[]> {
    return ['us-central1', 'europe-west1', 'asia-east1'];
  }

  async getOptimizationCandidates(): Promise<OptimizationRecommendation[]> {
    return [...this.recommendations];
  }

  async applyOptimization(recommendationId: string, actionType: string): Promise<OptimizationApplyResult> {
    const rec = this.recommendations.find(r => r.id === recommendationId);
    if (!rec) {
      throw new Error(`Recommendation ${recommendationId} not found in GCP provider`);
    }

    const res = this.resources.find(r => r.id === rec.resourceId);
    const previousConfig = {
      resourceType: res?.resourceType,
      costMonthly: res?.costMonthly,
      status: res?.status
    };

    if (res) {
      if (rec.type === 'STOP_IDLE') {
        res.status = 'stopped';
        res.costHourly = 0;
        res.costMonthly = 0;
        res.potentialSavingMonthly = 0;
        res.hasRecommendation = false;
      } else if (rec.type === 'STORAGE_TIER') {
        res.resourceType = 'Nearline Storage (3.5 TB)';
        res.costMonthly = 28.00;
        res.costHourly = 0.038;
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
      message: `Successfully executed ${rec.title} on GCP resource ${rec.resourceName}.`
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
      message: `Rolled back optimization for GCP ${rec.resourceName}.`
    };
  }
}

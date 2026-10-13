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

export class AWSProvider implements ICloudProvider {
  readonly providerId = 'aws' as const;
  readonly accountId: string;
  readonly name: string;
  private resources: CloudResource[] = [];
  private recommendations: OptimizationRecommendation[] = [];

  constructor(accountId: string = '124982301982', name: string = 'Production AWS (us-east-1)') {
    this.accountId = accountId;
    this.name = name;
    this.initResources();
  }

  private initResources() {
    this.resources = [
      {
        id: 'i-0a8b9c1d2e3f4001',
        provider: 'aws',
        accountId: this.accountId,
        service: 'EC2',
        serviceCategory: 'compute',
        resourceType: 'c5.2xlarge',
        name: 'prod-api-worker-cluster-01',
        region: 'us-east-1',
        status: 'running',
        environment: 'production',
        cpuCores: 8,
        memoryGb: 16,
        costHourly: 0.34,
        costMonthly: 244.80,
        currentCpuPct: 8.4,
        currentMemPct: 18.2,
        currentRequestsPerSec: 140,
        potentialSavingMonthly: 122.40,
        hasAnomaly: false,
        hasRecommendation: true,
        tags: { Service: 'API', Env: 'Production', Owner: 'FinOps' },
        createdAt: '2026-01-15T08:00:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'i-099c2d3e4f5a6002',
        provider: 'aws',
        accountId: this.accountId,
        service: 'EC2',
        serviceCategory: 'compute',
        resourceType: 'm5.large',
        name: 'staging-auth-gateway',
        region: 'us-west-2',
        status: 'idle',
        environment: 'staging',
        cpuCores: 2,
        memoryGb: 8,
        costHourly: 0.096,
        costMonthly: 69.12,
        currentCpuPct: 1.8,
        currentMemPct: 12.0,
        currentRequestsPerSec: 2,
        potentialSavingMonthly: 48.38,
        hasAnomaly: true,
        hasRecommendation: true,
        tags: { Service: 'Auth', Env: 'Staging' },
        createdAt: '2026-02-10T14:30:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'arn:aws:lambda:us-east-1:124982301982:function:data-sync-pipeline',
        provider: 'aws',
        accountId: this.accountId,
        service: 'Lambda',
        serviceCategory: 'serverless',
        resourceType: 'Serverless (2048MB)',
        name: 'data-sync-pipeline',
        region: 'us-east-1',
        status: 'running',
        environment: 'production',
        cpuCores: 2,
        memoryGb: 2.048,
        costHourly: 0.28,
        costMonthly: 201.60,
        currentCpuPct: 35.0,
        currentMemPct: 14.5, // Overprovisioned memory!
        currentRequestsPerSec: 850,
        potentialSavingMonthly: 114.20,
        hasAnomaly: false,
        hasRecommendation: true,
        tags: { Pipeline: 'ETL', Tier: 'Core' },
        createdAt: '2026-01-05T10:12:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'rds-pg-prod-primary-01',
        provider: 'aws',
        accountId: this.accountId,
        service: 'RDS',
        serviceCategory: 'database',
        resourceType: 'db.r5.xlarge',
        name: 'rds-core-postgres-primary',
        region: 'us-east-1',
        status: 'running',
        environment: 'production',
        cpuCores: 4,
        memoryGb: 32,
        costHourly: 0.58,
        costMonthly: 417.60,
        currentCpuPct: 44.5,
        currentMemPct: 62.0,
        currentRequestsPerSec: 1200,
        potentialSavingMonthly: 0,
        hasAnomaly: false,
        hasRecommendation: false,
        tags: { Database: 'PostgreSQL', Tier: 'Primary' },
        createdAt: '2025-11-20T00:00:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'vol-0f8a92bc71901a88b',
        provider: 'aws',
        accountId: this.accountId,
        service: 'EBS',
        serviceCategory: 'storage',
        resourceType: 'gp3 (500GB Unattached)',
        name: 'unattached-analytics-snapshot-vol',
        region: 'us-east-1',
        status: 'idle',
        environment: 'development',
        cpuCores: 0,
        memoryGb: 500,
        costHourly: 0.055,
        costMonthly: 40.00,
        currentCpuPct: 0,
        currentMemPct: 0,
        currentRequestsPerSec: 0,
        potentialSavingMonthly: 40.00,
        hasAnomaly: true,
        hasRecommendation: true,
        tags: { Status: 'Unattached', CreatedBy: 'ci-runner' },
        createdAt: '2026-02-01T11:00:00Z',
        updatedAt: new Date().toISOString()
      }
    ];

    this.recommendations = [
      {
        id: 'rec-aws-ec2-rightsize-01',
        resourceId: 'i-0a8b9c1d2e3f4001',
        resourceName: 'prod-api-worker-cluster-01',
        provider: 'aws',
        service: 'EC2',
        serviceCategory: 'compute',
        type: 'RIGHTSIZE',
        title: 'Right-size EC2 instance c5.2xlarge to c5.large',
        reason: 'Sustained 7-day CPU average is 8.4% and peak memory usage is 2.9GB out of 16GB. Downgrading to c5.large safely satisfies current throughput with 55% headroom.',
        actionDescription: 'Modify EC2 instance type from c5.2xlarge (8 vCPU / 16GB) to c5.large (2 vCPU / 4GB).',
        currentCostMonthly: 244.80,
        estimatedOptimizedCostMonthly: 122.40,
        estimatedMonthlySavings: 122.40,
        confidencePct: 96,
        riskLevel: 'LOW',
        status: 'PENDING',
        rollbackAvailable: true,
        expectedDowntimeSeconds: 45,
        createdAt: '2026-03-01T12:00:00Z'
      },
      {
        id: 'rec-aws-lambda-mem-02',
        resourceId: 'arn:aws:lambda:us-east-1:124982301982:function:data-sync-pipeline',
        resourceName: 'data-sync-pipeline',
        provider: 'aws',
        service: 'Lambda',
        serviceCategory: 'serverless',
        type: 'SERVERLESS_MEMORY',
        title: 'Optimize Lambda allocated memory from 2048MB to 256MB',
        reason: 'Execution telemetry over 4.2M invocations demonstrates max memory consumption capped at 142MB. 2048MB allocation results in unnecessary GB-second charges.',
        actionDescription: 'Update function memory size to 256MB with zero impact on duration.',
        currentCostMonthly: 201.60,
        estimatedOptimizedCostMonthly: 87.40,
        estimatedMonthlySavings: 114.20,
        confidencePct: 98,
        riskLevel: 'LOW',
        status: 'PENDING',
        rollbackAvailable: true,
        expectedDowntimeSeconds: 0,
        createdAt: '2026-03-02T09:30:00Z'
      },
      {
        id: 'rec-aws-ebs-delete-03',
        resourceId: 'vol-0f8a92bc71901a88b',
        resourceName: 'unattached-analytics-snapshot-vol',
        provider: 'aws',
        service: 'EBS',
        serviceCategory: 'storage',
        type: 'STORAGE_TIER',
        title: 'Create snapshot and delete unattached 500GB EBS volume',
        reason: 'EBS volume vol-0f8a92bc71901a88b has been detached for 38 consecutive days, accruing $40/month in idle block storage costs.',
        actionDescription: 'Create safety EBS snapshot, verify integrity, and terminate volume.',
        currentCostMonthly: 40.00,
        estimatedOptimizedCostMonthly: 0,
        estimatedMonthlySavings: 40.00,
        confidencePct: 100,
        riskLevel: 'LOW',
        status: 'PENDING',
        rollbackAvailable: true,
        expectedDowntimeSeconds: 0,
        createdAt: '2026-03-03T15:20:00Z'
      }
    ];
  }

  async testConnection(): Promise<ProviderConnectionTestResult> {
    return {
      connected: true,
      provider: 'aws',
      accountId: this.accountId,
      permissions: [
        'ec2:DescribeInstances',
        'ec2:ModifyInstanceAttribute',
        'lambda:GetFunctionConfiguration',
        'lambda:UpdateFunctionConfiguration',
        'ce:GetCostAndUsage',
        'cloudwatch:GetMetricData'
      ],
      availableServices: ['EC2', 'Lambda', 'RDS', 'S3', 'EBS', 'CloudWatch', 'CostExplorer'],
      latencyMs: 142
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
    let records = generateDailyCostRecords('aws', this.resources, 30);
    if (filter?.service) {
      records = records.filter(r => r.service.toLowerCase() === filter.service?.toLowerCase());
    }
    if (filter?.region) {
      records = records.filter(r => r.region === filter.region);
    }
    return records;
  }

  async getServices(): Promise<string[]> {
    return ['EC2', 'Lambda', 'RDS', 'S3', 'EBS'];
  }

  async getRegions(): Promise<string[]> {
    return ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
  }

  async getOptimizationCandidates(): Promise<OptimizationRecommendation[]> {
    return [...this.recommendations];
  }

  async applyOptimization(recommendationId: string, actionType: string): Promise<OptimizationApplyResult> {
    const rec = this.recommendations.find(r => r.id === recommendationId);
    if (!rec) {
      throw new Error(`Recommendation ${recommendationId} not found in AWS provider`);
    }

    const res = this.resources.find(r => r.id === rec.resourceId);
    const previousConfig = {
      resourceType: res?.resourceType,
      costMonthly: res?.costMonthly,
      status: res?.status
    };

    if (res) {
      if (rec.type === 'RIGHTSIZE') {
        res.resourceType = 'c5.large';
        res.cpuCores = 2;
        res.memoryGb = 4;
        res.costHourly = 0.17;
        res.costMonthly = 122.40;
        res.potentialSavingMonthly = 0;
        res.hasRecommendation = false;
        res.status = 'optimized';
      } else if (rec.type === 'SERVERLESS_MEMORY') {
        res.resourceType = 'Serverless (256MB)';
        res.memoryGb = 0.256;
        res.costHourly = 0.12;
        res.costMonthly = 87.40;
        res.potentialSavingMonthly = 0;
        res.hasRecommendation = false;
        res.status = 'optimized';
      } else if (rec.type === 'STORAGE_TIER') {
        res.status = 'stopped';
        res.costHourly = 0;
        res.costMonthly = 0;
        res.potentialSavingMonthly = 0;
        res.hasRecommendation = false;
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
      message: `Successfully executed ${rec.title} on AWS ${rec.resourceName}. Configuration updated.`
    };
  }

  async rollbackOptimization(recommendationId: string): Promise<OptimizationApplyResult> {
    const rec = this.recommendations.find(r => r.id === recommendationId);
    if (!rec) {
      throw new Error(`Recommendation ${recommendationId} not found`);
    }
    const res = this.resources.find(r => r.id === rec.resourceId);
    if (res) {
      this.initResources(); // Restore initial baseline
    }
    rec.status = 'ROLLED_BACK';
    rec.rolledBackAt = new Date().toISOString();

    return {
      success: true,
      resourceId: rec.resourceId,
      action: 'ROLLBACK',
      previousConfig: {},
      newConfig: {},
      estimatedSavingsMonthly: 0,
      message: `Rolled back optimization for ${rec.resourceName}. Previous state restored.`
    };
  }
}

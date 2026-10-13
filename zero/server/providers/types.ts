import { 
  CloudProviderId, 
  CloudResource, 
  NormalizedCostRecord, 
  ResourceMetricPoint, 
  OptimizationRecommendation 
} from '../types.ts';

export interface ProviderConnectionTestResult {
  connected: boolean;
  provider: CloudProviderId;
  accountId: string;
  permissions: string[];
  availableServices: string[];
  latencyMs: number;
  error?: string;
}

export interface CostDataFilter {
  startDate?: string;
  endDate?: string;
  service?: string;
  region?: string;
  environment?: string;
}

export interface OptimizationApplyResult {
  success: boolean;
  resourceId: string;
  action: string;
  previousConfig: Record<string, any>;
  newConfig: Record<string, any>;
  estimatedSavingsMonthly: number;
  message: string;
}

export interface ICloudProvider {
  readonly providerId: CloudProviderId;
  readonly accountId: string;
  readonly name: string;

  testConnection(): Promise<ProviderConnectionTestResult>;
  getResources(): Promise<CloudResource[]>;
  getResourceMetrics(resourceId: string, hours?: number): Promise<ResourceMetricPoint[]>;
  getCostData(filter?: CostDataFilter): Promise<NormalizedCostRecord[]>;
  getServices(): Promise<string[]>;
  getRegions(): Promise<string[]>;
  getOptimizationCandidates(): Promise<OptimizationRecommendation[]>;
  applyOptimization(recommendationId: string, actionType: string): Promise<OptimizationApplyResult>;
  rollbackOptimization(recommendationId: string): Promise<OptimizationApplyResult>;
}

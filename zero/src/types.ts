export type CloudProviderId = 'aws' | 'azure' | 'gcp';
export type Environment = 'production' | 'staging' | 'development';
export type ResourceStatus = 'running' | 'idle' | 'stopped' | 'terminating' | 'optimized';
export type ServiceCategory = 'compute' | 'serverless' | 'database' | 'storage' | 'networking';

export interface CloudAccount {
  id: string;
  provider: CloudProviderId;
  name: string;
  accountId: string;
  arnOrPrincipal: string;
  environment: Environment;
  status: 'connected' | 'error' | 'syncing';
  lastSyncedAt: string;
  resourceCount: number;
  monthlySpend: number;
  createdAt: string;
}

export interface CloudResource {
  id: string;
  provider: CloudProviderId;
  accountId: string;
  service: string;
  serviceCategory: ServiceCategory;
  resourceType: string;
  name: string;
  region: string;
  status: ResourceStatus;
  environment: Environment;
  cpuCores: number;
  memoryGb: number;
  costHourly: number;
  costMonthly: number;
  currentCpuPct: number;
  currentMemPct: number;
  currentRequestsPerSec: number;
  potentialSavingMonthly: number;
  hasAnomaly: boolean;
  hasRecommendation: boolean;
  tags: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceMetricPoint {
  timestamp: string;
  cpuPct: number;
  memPct: number;
  networkInMb: number;
  networkOutMb: number;
  requestCount: number;
  latencyMs: number;
  cost: number;
}

export interface NormalizedCostRecord {
  id: string;
  provider: CloudProviderId;
  accountId: string;
  service: string;
  serviceCategory: ServiceCategory;
  resourceId: string;
  resourceName: string;
  region: string;
  timestamp: string;
  usageQuantity: number;
  usageUnit: string;
  cost: number;
  currency: string;
  environment: Environment;
  tags: Record<string, string>;
}

export type RecommendationType = 
  | 'RIGHTSIZE' 
  | 'STOP_IDLE' 
  | 'SCHEDULE_SHUTDOWN' 
  | 'SERVERLESS_MEMORY' 
  | 'STORAGE_TIER' 
  | 'RESERVED_SAVINGS';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type OptimizationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'EXECUTED' | 'ROLLING_BACK' | 'ROLLED_BACK';

export interface OptimizationRecommendation {
  id: string;
  resourceId: string;
  resourceName: string;
  provider: CloudProviderId;
  service: string;
  serviceCategory: ServiceCategory;
  type: RecommendationType;
  title: string;
  reason: string;
  actionDescription: string;
  currentCostMonthly: number;
  estimatedOptimizedCostMonthly: number;
  estimatedMonthlySavings: number;
  confidencePct: number;
  riskLevel: RiskLevel;
  status: OptimizationStatus;
  rollbackAvailable: boolean;
  expectedDowntimeSeconds: number;
  approvedBy?: string;
  approvedAt?: string;
  executedAt?: string;
  rolledBackAt?: string;
  createdAt: string;
}

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Anomaly {
  id: string;
  detectedAt: string;
  provider: CloudProviderId;
  service: string;
  resourceId: string;
  resourceName: string;
  severity: AnomalySeverity;
  metricType: 'COST_SPIKE' | 'CPU_SURGE' | 'INVOCATION_BURST' | 'IDLE_SPEND' | 'STORAGE_EXPLOSION';
  currentValue: number;
  expectedValue: number;
  deviationPct: number;
  estimatedCostImpactMonthly: number;
  recommendedAction: string;
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
}

export interface DailyForecastPoint {
  date: string;
  actualCost?: number;
  forecastedCost: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface CostForecast {
  horizon: '24h' | '7d' | '30d' | 'end_of_month';
  currentRunRateMonthly: number;
  forecastedMonthlySpend: number;
  forecastedMonthEndSpend: number;
  projectedOverrun: number;
  confidenceScorePct: number;
  growthRatePct: number;
  dailyPoints: DailyForecastPoint[];
  serviceBreakdown: { service: string; forecastedSpend: number; currentSpend: number; growthPct: number }[];
  aiFinOpsSummary: string;
}

export interface Budget {
  id: string;
  name: string;
  scope: 'TOTAL' | 'PROVIDER' | 'SERVICE' | 'ENVIRONMENT';
  scopeValue: string;
  monthlyBudget: number;
  actualSpend: number;
  forecastedSpend: number;
  alertThresholdPct: number;
  status: 'HEALTHY' | 'WARNING' | 'EXCEEDED';
  updatedAt: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'COST_SPIKE' | 'BUDGET_OVERRUN' | 'ANOMALY' | 'OPTIMIZATION_OPPORTUNITY' | 'ACCOUNT_SYNC_FAILURE';
  title: string;
  message: string;
  resourceId?: string;
  provider?: CloudProviderId;
  read: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  provider: CloudProviderId;
  resourceId: string;
  resourceName: string;
  previousState: string;
  newState: string;
  estimatedSavingMonthly: number;
  result: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  details: string;
}

export interface DashboardSummary {
  currentMonthlySpend: number;
  todaySpend: number;
  projectedMonthlySpend: number;
  potentialMonthlySavings: number;
  activeOptimizationsCount: number;
  activeAnomaliesCount: number;
  totalResourcesCount: number;
  idleResourcesCount: number;
  avgCpuUtilizationPct: number;
  avgMemoryUtilizationPct: number;
  totalRequestsToday: number;
  totalInvocationsToday: number;
  providerSpend: {
    provider: CloudProviderId;
    monthlySpend: number;
    resourceCount: number;
    percentage: number;
  }[];
  budgetHealth: {
    totalBudget: number;
    actualSpend: number;
    forecastedSpend: number;
    remainingBudget: number;
    isOverBudget: boolean;
    overrunAmount: number;
    usagePercent: number;
  };
}

export interface SimulationRequest {
  provider: CloudProviderId;
  serviceCategory: ServiceCategory;
  instanceType: string;
  instanceCount: number;
  region: string;
  hoursPerMonth: number;
  pricingModel: 'on_demand' | 'savings_plan_1yr' | 'savings_plan_3yr' | 'spot';
  cpuCores: number;
  memoryGb: number;
  storageGb: number;
  storageType: 'gp3' | 'io2' | 'standard_ssd' | 'premium_ssd' | 'standard_hdd';
  serverlessRequestsMillions?: number;
  serverlessMemoryMb?: number;
  serverlessAvgDurationMs?: number;
}

export interface SimulationResult {
  currentCostMonthly: number;
  newCostMonthly: number;
  monthlyDifference: number;
  yearlyDifference: number;
  percentageSavings: number;
  costBreakdown: {
    computeCost: number;
    storageCost: number;
    serverlessCost: number;
    discountApplied: number;
  };
  recommendationNote: string;
}

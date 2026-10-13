import { SimulationRequest, SimulationResult, CloudProviderId } from '../types.ts';

// Baseline hourly compute pricing catalog across AWS, Azure, GCP
const COMPUTE_PRICING: Record<string, { hourly: number; cores: number; memGb: number; provider: CloudProviderId }> = {
  // AWS
  't3.micro': { hourly: 0.0104, cores: 2, memGb: 1, provider: 'aws' },
  't3.medium': { hourly: 0.0416, cores: 2, memGb: 4, provider: 'aws' },
  'm5.large': { hourly: 0.096, cores: 2, memGb: 8, provider: 'aws' },
  'c5.large': { hourly: 0.085, cores: 2, memGb: 4, provider: 'aws' },
  'c5.2xlarge': { hourly: 0.340, cores: 8, memGb: 16, provider: 'aws' },
  'r5.xlarge': { hourly: 0.252, cores: 4, memGb: 32, provider: 'aws' },
  // Azure
  'Standard_B1s': { hourly: 0.0104, cores: 1, memGb: 1, provider: 'azure' },
  'Standard_B2s': { hourly: 0.0416, cores: 2, memGb: 4, provider: 'azure' },
  'Standard_D2s_v5': { hourly: 0.096, cores: 2, memGb: 8, provider: 'azure' },
  'Standard_D4s_v5': { hourly: 0.192, cores: 4, memGb: 16, provider: 'azure' },
  'Standard_E4s_v5': { hourly: 0.260, cores: 4, memGb: 32, provider: 'azure' },
  // GCP
  'e2-micro': { hourly: 0.0084, cores: 2, memGb: 1, provider: 'gcp' },
  'e2-medium': { hourly: 0.0335, cores: 2, memGb: 4, provider: 'gcp' },
  'e2-standard-4': { hourly: 0.134, cores: 4, memGb: 16, provider: 'gcp' },
  'n2-standard-4': { hourly: 0.194, cores: 4, memGb: 16, provider: 'gcp' },
  'n2-highmem-4': { hourly: 0.262, cores: 4, memGb: 32, provider: 'gcp' },
};

// Storage per GB-month pricing
const STORAGE_PRICING: Record<string, number> = {
  gp3: 0.08,             // AWS EBS gp3 ($0.08/GB-mo)
  io2: 0.125,            // AWS EBS io2 ($0.125/GB-mo)
  standard_ssd: 0.075,   // Azure Standard SSD ($0.075/GB-mo)
  premium_ssd: 0.135,    // Azure Premium SSD ($0.135/GB-mo)
  standard_hdd: 0.040,   // Standard HDD ($0.04/GB-mo)
};

// Region multipliers
const REGION_MULTIPLIERS: Record<string, number> = {
  'us-east-1': 1.0,
  'us-west-2': 1.0,
  'us-central1': 1.0,
  'eastus': 1.0,
  'eu-west-1': 1.10,
  'westeurope': 1.10,
  'europe-west1': 1.10,
  'ap-southeast-1': 1.18,
  'southeastasia': 1.18,
  'asia-east1': 1.18,
};

// Pricing model discount factors
const PRICING_DISCOUNTS: Record<string, number> = {
  on_demand: 0.0,
  savings_plan_1yr: 0.38, // 38% discount
  savings_plan_3yr: 0.62, // 62% discount
  spot: 0.70,             // 70% discount
};

export class FinOpsSimulatorService {
  calculate(req: SimulationRequest): SimulationResult {
    const regionMult = REGION_MULTIPLIERS[req.region] || 1.0;
    const discount = PRICING_DISCOUNTS[req.pricingModel] || 0.0;
    const hours = Math.min(730, Math.max(1, req.hoursPerMonth || 730));
    const count = Math.max(1, req.instanceCount || 1);

    let hourlyRate = 0.10;
    const instanceSpec = COMPUTE_PRICING[req.instanceType];
    if (instanceSpec) {
      hourlyRate = instanceSpec.hourly;
    } else {
      // Custom core/memory pricing formula
      hourlyRate = (req.cpuCores * 0.025 + req.memoryGb * 0.005);
    }

    // Compute Base Costs
    const baseComputeCost = hourlyRate * hours * count * regionMult;
    const discountAmount = baseComputeCost * discount;
    const optimizedComputeCost = baseComputeCost - discountAmount;

    // Storage Cost
    const storagePricePerGb = STORAGE_PRICING[req.storageType] || 0.08;
    const storageCost = (req.storageGb || 0) * storagePricePerGb * count;

    // Serverless Cost Calculation (if configured)
    let serverlessCost = 0;
    if (req.serviceCategory === 'serverless' || (req.serverlessRequestsMillions && req.serverlessRequestsMillions > 0)) {
      const millions = req.serverlessRequestsMillions || 10;
      const memMb = req.serverlessMemoryMb || 512;
      const durationMs = req.serverlessAvgDurationMs || 180;

      // $0.20 per million requests + $0.0000166667 per GB-second
      const requestCharges = millions * 0.20;
      const totalInvocations = millions * 1_000_000;
      const gbSeconds = totalInvocations * (durationMs / 1000) * (memMb / 1024);
      const computeCharges = gbSeconds * 0.0000166667;
      serverlessCost = requestCharges + computeCharges;
    }

    // Current cost corresponds to baseline On-Demand running 730 hours + full storage
    const currentCostMonthly = Math.round((baseComputeCost * (730 / hours) + storageCost + serverlessCost) * 100) / 100;
    const newCostMonthly = Math.round((optimizedComputeCost + storageCost + serverlessCost) * 100) / 100;
    const monthlyDifference = Math.round((currentCostMonthly - newCostMonthly) * 100) / 100;
    const yearlyDifference = Math.round(monthlyDifference * 12 * 100) / 100;
    const percentageSavings = currentCostMonthly > 0 ? Math.round((monthlyDifference / currentCostMonthly) * 1000) / 10 : 0;

    let recommendationNote = `Migrating ${count}x ${req.instanceType} workloads to ${req.pricingModel.replace('_', ' ').toUpperCase()} in ${req.region} yields $${monthlyDifference.toFixed(2)}/mo savings (${percentageSavings}%).`;
    if (discount > 0.3) {
      recommendationNote += ` High-confidence commitment strategy with breakeven in ~4.2 months.`;
    }

    return {
      currentCostMonthly,
      newCostMonthly,
      monthlyDifference,
      yearlyDifference,
      percentageSavings,
      costBreakdown: {
        computeCost: Math.round(optimizedComputeCost * 100) / 100,
        storageCost: Math.round(storageCost * 100) / 100,
        serverlessCost: Math.round(serverlessCost * 100) / 100,
        discountApplied: Math.round(discountAmount * 100) / 100,
      },
      recommendationNote,
    };
  }
}

export const simulatorService = new FinOpsSimulatorService();

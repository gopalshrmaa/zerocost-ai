import { FinOpsData } from '../types/finops.ts';

export const mockFinopsData: FinOpsData = {
  currentCost: 1284,
  predictedCost: 1417,
  potentialSavings: 326,
  efficiencyScore: 78,

  // 1. Monthly Cost Trend (Last 6 Months: Actual vs Predicted)
  monthlyTrend: [
    { month: 'May', actual: 1040, predicted: 1060 },
    { month: 'Jun', actual: 1110, predicted: 1090 },
    { month: 'Jul', actual: 1180, predicted: 1170 },
    { month: 'Aug', actual: 1210, predicted: 1240 },
    { month: 'Sep', actual: 1245, predicted: 1260 },
    { month: 'Oct', actual: 1284, predicted: 1295 }
  ],

  // 2. Cloud Provider Comparison
  providerCosts: [
    { provider: 'AWS', cost: 520, usage: 'High', recommendation: 'Good' },
    { provider: 'Azure', cost: 430, usage: 'Medium', recommendation: 'Best Value' },
    { provider: 'Google Cloud', cost: 334, usage: 'Medium', recommendation: 'Cheapest' }
  ],

  // 3. Cost Breakdown by Category
  costBreakdown: [
    { service: 'Compute', cost: 642, percentage: 50 },
    { service: 'Storage', cost: 256, percentage: 20 },
    { service: 'Database', cost: 256, percentage: 20 },
    { service: 'Network', cost: 130, percentage: 10 }
  ],

  // 4. 30-Day Cost Forecast
  costForecast: [
    { day: 'Day 1', cost: 42.1 },
    { day: 'Day 5', cost: 43.4 },
    { day: 'Day 10', cost: 44.8 },
    { day: 'Day 15', cost: 46.2 },
    { day: 'Day 20', cost: 47.9 },
    { day: 'Day 25', cost: 49.3 },
    { day: 'Day 30', cost: 51.0 }
  ],

  // 5. 4 Actionable AI Cost Recommendations
  recommendations: [
    {
      id: 'rec-1',
      title: 'Reduce Idle Compute',
      saving: 84,
      reason: 'Some compute resources have very low utilization (under 10% CPU for 28 consecutive days).',
      action: 'Consider reducing or stopping unused resources during off-peak hours.'
    },
    {
      id: 'rec-2',
      title: 'Optimize Storage',
      saving: 52,
      reason: 'Some storage resources are underutilized with unattached disk volumes and cold data.',
      action: 'Delete detached volumes and enable auto-tiering to archive cold files.'
    },
    {
      id: 'rec-3',
      title: 'Use Serverless',
      saving: 71,
      reason: 'Some workloads have intermittent usage and may benefit from serverless architecture.',
      action: 'Migrate sporadic scheduled jobs from 24/7 VMs to pay-per-execution functions.'
    },
    {
      id: 'rec-4',
      title: 'Right-Size Resources',
      saving: 119,
      reason: 'Several resources are larger than their current workload requires.',
      action: 'Downgrade overprovisioned memory and CPU instances to match true demand.'
    }
  ]
};

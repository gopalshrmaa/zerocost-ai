export interface MonthlyCostPoint {
  month: string;
  actual: number;
  predicted: number;
}

export interface ProviderCost {
  provider: 'AWS' | 'Azure' | 'Google Cloud';
  cost: number;
  usage: 'High' | 'Medium' | 'Low';
  recommendation: 'Good' | 'Best Value' | 'Cheapest';
}

export interface ServiceCost {
  service: string;
  cost: number;
  percentage: number;
}

export interface ForecastPoint {
  day: string;
  cost: number;
}

export interface RecommendationItem {
  id: string;
  title: string;
  saving: number;
  reason: string;
  action: string;
}

export interface FinOpsData {
  currentCost: number;
  predictedCost: number;
  potentialSavings: number;
  efficiencyScore: number;
  monthlyTrend: MonthlyCostPoint[];
  providerCosts: ProviderCost[];
  costBreakdown: ServiceCost[];
  costForecast: ForecastPoint[];
  recommendations: RecommendationItem[];
}

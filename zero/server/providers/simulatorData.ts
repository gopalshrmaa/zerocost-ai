import { CloudResource, ResourceMetricPoint, NormalizedCostRecord, CloudProviderId } from '../types.ts';

// Deterministic diurnal curve generator based on hour and day-of-week
export function getDeterministicLoad(timestampMs: number, basePct: number, variance: number): number {
  const date = new Date(timestampMs);
  const hour = date.getUTCHours();
  const day = date.getUTCDay(); // 0 is Sunday, 6 is Saturday
  
  // Business hours peak (08:00 to 18:00 UTC)
  const isWeekend = day === 0 || day === 6;
  const weekendFactor = isWeekend ? 0.45 : 1.0;
  
  // Sine curve with peak around 14:00 UTC
  const diurnal = Math.sin(((hour - 6) / 24) * 2 * Math.PI);
  const normalizedDiurnal = (diurnal + 1) / 2; // 0 to 1
  
  const value = (basePct + normalizedDiurnal * variance) * weekendFactor;
  return Math.min(99.5, Math.max(1.0, Math.round(value * 10) / 10));
}

export function generateHistoricalMetrics(
  resource: CloudResource,
  hours: number = 72
): ResourceMetricPoint[] {
  const points: ResourceMetricPoint[] = [];
  const now = Date.now();
  const stepMs = 3600 * 1000; // 1-hour increments
  
  for (let i = hours; i >= 0; i--) {
    const timeMs = now - (i * stepMs);
    const dateStr = new Date(timeMs).toISOString();
    
    let cpuPct: number;
    let memPct: number;
    let netIn: number;
    let netOut: number;
    let reqs: number;
    let latency: number;

    if (resource.status === 'idle') {
      cpuPct = getDeterministicLoad(timeMs, 1.8, 1.2);
      memPct = 12.0 + Math.sin(timeMs / 10000000) * 1.5;
      netIn = 0.4;
      netOut = 0.2;
      reqs = 3;
      latency = 12;
    } else if (resource.serviceCategory === 'serverless') {
      const load = getDeterministicLoad(timeMs, 25, 45);
      cpuPct = load;
      memPct = 38 + (load / 100) * 20;
      netIn = (load * 1.4);
      netOut = (load * 3.8);
      reqs = Math.round(load * 180);
      latency = 45 + (100 - load) * 0.2;
    } else if (resource.id.includes('c5-2xlarge') || resource.resourceType.includes('c5.2xlarge')) {
      // Underutilized oversized workload
      cpuPct = getDeterministicLoad(timeMs, 6.0, 3.5);
      memPct = 18.5 + Math.sin(timeMs / 8000000) * 2.0;
      netIn = 5.2;
      netOut = 8.1;
      reqs = Math.round(cpuPct * 40);
      latency = 18;
    } else {
      // Normal production workload
      cpuPct = getDeterministicLoad(timeMs, 42.0, 32.0);
      memPct = 58.0 + (cpuPct / 100) * 15;
      netIn = 42 + cpuPct * 1.2;
      netOut = 75 + cpuPct * 2.4;
      reqs = Math.round(cpuPct * 120);
      latency = 32 + (cpuPct > 70 ? 25 : 0);
    }

    const hourlyCost = resource.costHourly;

    points.push({
      timestamp: dateStr,
      cpuPct: Math.round(cpuPct * 10) / 10,
      memPct: Math.round(memPct * 10) / 10,
      networkInMb: Math.round(netIn * 10) / 10,
      networkOutMb: Math.round(netOut * 10) / 10,
      requestCount: reqs,
      latencyMs: Math.round(latency),
      cost: Math.round(hourlyCost * 100) / 100,
    });
  }

  return points;
}

export function generateDailyCostRecords(
  provider: CloudProviderId,
  resources: CloudResource[],
  days: number = 30
): NormalizedCostRecord[] {
  const records: NormalizedCostRecord[] = [];
  const now = Date.now();
  const dayMs = 86400 * 1000;

  for (let d = days; d >= 0; d--) {
    const timeMs = now - (d * dayMs);
    const date = new Date(timeMs);
    date.setUTCHours(0, 0, 0, 0);
    const dateStr = date.toISOString();
    const dayOfWeek = date.getUTCDay();
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.75 : 1.0;

    for (const res of resources) {
      // Daily cost based on 24 hours of hourly cost modulated by day usage
      const baseDailyCost = res.costHourly * 24;
      const dailyCost = Math.round(baseDailyCost * weekendMultiplier * 100) / 100;

      records.push({
        id: `cost_${provider}_${res.id}_${dateStr.slice(0, 10)}`,
        provider,
        accountId: res.accountId,
        service: res.service,
        serviceCategory: res.serviceCategory,
        resourceId: res.id,
        resourceName: res.name,
        region: res.region,
        timestamp: dateStr,
        usageQuantity: 24,
        usageUnit: 'Hours',
        cost: dailyCost,
        currency: 'USD',
        environment: res.environment,
        tags: res.tags,
      });
    }
  }

  return records;
}

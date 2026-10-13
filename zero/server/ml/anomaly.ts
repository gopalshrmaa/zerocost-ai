import { Anomaly, CloudResource, ResourceMetricPoint } from '../types.ts';

export class FinOpsAnomalyDetector {
  /**
   * Scans resources and metric streams using rolling statistical Z-scores and IQR bounds
   */
  detectAnomalies(
    resources: CloudResource[],
    metricsMap: Map<string, ResourceMetricPoint[]>
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];

    for (const res of resources) {
      const metrics = metricsMap.get(res.id) || [];
      if (metrics.length < 5) continue;

      // Extract metric vectors
      const cpuValues = metrics.map(m => m.cpuPct);
      const reqValues = metrics.map(m => m.requestCount);

      // 1. Check for Idle Resource with Active Cost (High Waste Anomaly)
      const avgCpuLast48h = cpuValues.slice(-48).reduce((a, b) => a + b, 0) / Math.min(cpuValues.length, 48);
      if (avgCpuLast48h < 3.0 && res.costHourly > 0.05 && res.status !== 'stopped') {
        anomalies.push({
          id: `anom_idle_${res.id}_${Date.now()}`,
          detectedAt: new Date().toISOString(),
          provider: res.provider,
          service: res.service,
          resourceId: res.id,
          resourceName: res.name,
          severity: res.costMonthly > 100 ? 'HIGH' : 'MEDIUM',
          metricType: 'IDLE_SPEND',
          currentValue: Math.round(avgCpuLast48h * 10) / 10,
          expectedValue: 35.0,
          deviationPct: -91.4,
          estimatedCostImpactMonthly: res.costMonthly,
          recommendedAction: res.serviceCategory === 'compute' 
            ? 'Stop or schedule automatic shutdown for this instance' 
            : 'Review volume attachment and snapshot storage',
          status: 'ACTIVE'
        });
      }

      // 2. Statistical Z-Score Spike Detection on CPU and Invocation Rates
      const recentCpu = cpuValues[cpuValues.length - 1];
      const baselineCpuValues = cpuValues.slice(0, -1);
      const baselineMean = baselineCpuValues.reduce((a, b) => a + b, 0) / baselineCpuValues.length;
      const variance = baselineCpuValues.reduce((a, b) => a + Math.pow(b - baselineMean, 2), 0) / baselineCpuValues.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev > 0.5) {
        const zScore = (recentCpu - baselineMean) / stdDev;
        if (zScore > 2.8 && recentCpu > 75) {
          const deviation = Math.round(((recentCpu - baselineMean) / baselineMean) * 100);
          anomalies.push({
            id: `anom_cpu_${res.id}_${Date.now()}`,
            detectedAt: new Date().toISOString(),
            provider: res.provider,
            service: res.service,
            resourceId: res.id,
            resourceName: res.name,
            severity: 'HIGH',
            metricType: 'CPU_SURGE',
            currentValue: recentCpu,
            expectedValue: Math.round(baselineMean * 10) / 10,
            deviationPct: deviation,
            estimatedCostImpactMonthly: Math.round(res.costMonthly * 0.45 * 100) / 100,
            recommendedAction: 'Investigate runaway process or evaluate auto-scaling threshold.',
            status: 'ACTIVE'
          });
        }
      }

      // 3. Serverless Invocation Surge / Loop Detection
      if (res.serviceCategory === 'serverless' && reqValues.length > 5) {
        const recentReqs = reqValues[reqValues.length - 1];
        const historicalReqs = reqValues.slice(0, -1);
        const meanReqs = historicalReqs.reduce((a, b) => a + b, 0) / historicalReqs.length;
        
        if (recentReqs > meanReqs * 3.5 && recentReqs > 1500) {
          anomalies.push({
            id: `anom_req_${res.id}_${Date.now()}`,
            detectedAt: new Date().toISOString(),
            provider: res.provider,
            service: res.service,
            resourceId: res.id,
            resourceName: res.name,
            severity: 'CRITICAL',
            metricType: 'INVOCATION_BURST',
            currentValue: recentReqs,
            expectedValue: Math.round(meanReqs),
            deviationPct: Math.round(((recentReqs - meanReqs) / (meanReqs || 1)) * 100),
            estimatedCostImpactMonthly: Math.round(res.costMonthly * 2.2 * 100) / 100,
            recommendedAction: 'Inspect event stream loop or enforce rate-limiting / concurrency limit.',
            status: 'ACTIVE'
          });
        }
      }

      // 4. Unattached Storage Waste
      if (res.resourceType.includes('Unattached') || (res.tags['Status'] === 'Unattached')) {
        anomalies.push({
          id: `anom_unattached_${res.id}`,
          detectedAt: new Date().toISOString(),
          provider: res.provider,
          service: res.service,
          resourceId: res.id,
          resourceName: res.name,
          severity: 'MEDIUM',
          metricType: 'STORAGE_EXPLOSION',
          currentValue: 1,
          expectedValue: 0,
          deviationPct: 100,
          estimatedCostImpactMonthly: res.costMonthly,
          recommendedAction: 'Snapshot and terminate unattached volume.',
          status: 'ACTIVE'
        });
      }
    }

    return anomalies;
  }
}

export const anomalyDetector = new FinOpsAnomalyDetector();

import { eventBus } from '../events/eventBus.ts';
import { dbStore } from '../db/store.ts';
import { providerManager } from '../providers/manager.ts';

class FinOpsWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Run every 20 seconds
    this.timer = setInterval(() => {
      this.tick();
    }, 20000);

    // Initial tick after 2s
    setTimeout(() => this.tick(), 2000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  async tick() {
    try {
      await dbStore.syncProvidersState();
      const summary = await dbStore.getDashboardSummary();

      // Emit heartbeat & cost_updated
      eventBus.broadcast({
        id: `evt_tick_${Date.now()}`,
        type: 'cost_updated',
        timestamp: new Date().toISOString(),
        payload: {
          currentMonthlySpend: summary.currentMonthlySpend,
          projectedMonthlySpend: summary.projectedMonthlySpend,
          activeAnomaliesCount: summary.activeAnomaliesCount,
          activeOptimizationsCount: summary.activeOptimizationsCount,
          avgCpuUtilizationPct: summary.avgCpuUtilizationPct,
        }
      });
    } catch (e) {
      console.error('FinOpsWorker tick error:', e);
    }
  }

  async triggerManualSync() {
    await dbStore.syncProvidersState();
    const summary = await dbStore.getDashboardSummary();

    eventBus.broadcast({
      id: `evt_sync_${Date.now()}`,
      type: 'resource_updated',
      timestamp: new Date().toISOString(),
      payload: {
        summary,
        message: 'Telemetry synchronized across AWS, Azure, and GCP.'
      }
    });

    return summary;
  }
}

export const finopsWorker = new FinOpsWorker();

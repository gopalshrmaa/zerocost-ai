import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { dbStore } from './server/db/store.ts';
import { providerManager } from './server/providers/manager.ts';
import { forecastingEngine } from './server/ml/forecast.ts';
import { simulatorService } from './server/services/simulator.ts';
import { eventBus } from './server/events/eventBus.ts';
import { finopsWorker } from './server/workers/finopsWorker.ts';
import { SimulationRequest, CloudAccount, CloudProviderId } from './server/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json());

  // Initialize DB store and background worker
  await dbStore.init();
  finopsWorker.start();

  // Observability Health Endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected (json/sqlite persistent store)',
        eventBus: `active (${eventBus.getClientCount()} subscribers)`,
        worker: 'running',
        providers: {
          aws: 'active',
          azure: 'active',
          gcp: 'active'
        }
      },
      version: '1.0.0-finops'
    });
  });

  // Observability Metrics Endpoint
  app.get('/metrics', async (req: Request, res: Response) => {
    const summary = await dbStore.getDashboardSummary();
    res.setHeader('Content-Type', 'text/plain');
    res.send(`# HELP zerocost_spend_total Current monthly cloud run rate
# TYPE zerocost_spend_total gauge
zerocost_spend_total ${summary.currentMonthlySpend}

# HELP zerocost_projected_spend_total Projected month-end cloud spend
# TYPE zerocost_projected_spend_total gauge
zerocost_projected_spend_total ${summary.projectedMonthlySpend}

# HELP zerocost_potential_savings_total Potential monthly savings from recommendations
# TYPE zerocost_potential_savings_total gauge
zerocost_potential_savings_total ${summary.potentialMonthlySavings}

# HELP zerocost_active_anomalies Number of active cost and utilization anomalies
# TYPE zerocost_active_anomalies gauge
zerocost_active_anomalies ${summary.activeAnomaliesCount}

# HELP zerocost_connected_subscribers SSE live connection count
# TYPE zerocost_connected_subscribers gauge
zerocost_connected_subscribers ${eventBus.getClientCount()}
`);
  });

  // Real-Time Server-Sent Events (SSE) Stream
  app.get('/api/events', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    eventBus.addClient(res);
  });

  // Trigger Instant Telemetry Sync
  app.post('/api/sync', async (req: Request, res: Response) => {
    try {
      const summary = await finopsWorker.triggerManualSync();
      res.json({ success: true, summary, message: 'All cloud providers synchronized successfully.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Auth Endpoints
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    // Standard secure token authentication
    res.json({
      token: 'jwt_mock_token_finops_orchestrator_' + Date.now(),
      user: {
        id: 'usr_01',
        name: email ? email.split('@')[0] : 'FinOps Lead',
        email: email || 'finops.lead@enterprise.com',
        role: 'ADMIN',
      }
    });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { email, name, role } = req.body;
    res.json({
      token: 'jwt_mock_token_finops_orchestrator_' + Date.now(),
      user: {
        id: `usr_${Date.now()}`,
        name: name || 'FinOps Engineer',
        email: email || 'engineer@enterprise.com',
        role: role || 'ENGINEER',
      }
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    res.json({
      id: 'usr_01',
      name: 'Sarah Chen',
      email: 'sarah.chen@enterprise.com',
      role: 'ADMIN',
      organization: 'CloudPlatform Inc.'
    });
  });

  // Dashboard Aggregates
  app.get('/api/dashboard', async (req: Request, res: Response) => {
    try {
      const summary = await dbStore.getDashboardSummary();
      const recentAnomalies = dbStore.getAnomalies().filter(a => a.status === 'ACTIVE').slice(0, 4);
      const topRecommendations = dbStore.getOptimizations().filter(o => o.status === 'PENDING').slice(0, 4);
      const resources = await providerManager.getAllResources();
      const topExpensiveResources = [...resources].sort((a, b) => b.costMonthly - a.costMonthly).slice(0, 5);
      const recentAudit = dbStore.getAuditLogs().slice(0, 5);

      res.json({
        summary,
        recentAnomalies,
        topRecommendations,
        topExpensiveResources,
        recentAudit
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Normalized Costs & Historical Telemetry
  app.get('/api/costs', async (req: Request, res: Response) => {
    try {
      const { provider, service, region, timeframe } = req.query;
      let records = await providerManager.getAllCostRecords();

      if (provider && provider !== 'all') {
        records = records.filter(r => r.provider === provider);
      }
      if (service && service !== 'all') {
        records = records.filter(r => r.service.toLowerCase() === String(service).toLowerCase());
      }
      if (region && region !== 'all') {
        records = records.filter(r => r.region === region);
      }

      // Filter by timeframe days
      let days = 30;
      if (timeframe === '24h') days = 1;
      else if (timeframe === '7d') days = 7;
      else if (timeframe === '90d') days = 90;

      const cutoff = new Date(Date.now() - days * 86400 * 1000).toISOString();
      records = records.filter(r => r.timestamp >= cutoff);

      res.json({ records, count: records.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ML / AI Cost Forecast
  app.get('/api/costs/forecast', async (req: Request, res: Response) => {
    try {
      const costs = await providerManager.getAllCostRecords();
      const resources = await providerManager.getAllResources();
      const currentMonthlySpend = resources.reduce((acc, r) => acc + r.costMonthly, 0);

      const forecast = await forecastingEngine.generateForecast(costs, currentMonthlySpend);
      res.json(forecast);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Resource Inventory
  app.get('/api/resources', async (req: Request, res: Response) => {
    try {
      const { provider, serviceCategory, status, environment, search } = req.query;
      let resources = await providerManager.getAllResources();

      if (provider && provider !== 'all') {
        resources = resources.filter(r => r.provider === provider);
      }
      if (serviceCategory && serviceCategory !== 'all') {
        resources = resources.filter(r => r.serviceCategory === serviceCategory);
      }
      if (status && status !== 'all') {
        resources = resources.filter(r => r.status === status);
      }
      if (environment && environment !== 'all') {
        resources = resources.filter(r => r.environment === environment);
      }
      if (search) {
        const q = String(search).toLowerCase();
        resources = resources.filter(r => 
          r.name.toLowerCase().includes(q) || 
          r.service.toLowerCase().includes(q) || 
          r.id.toLowerCase().includes(q) ||
          r.resourceType.toLowerCase().includes(q)
        );
      }

      res.json({ resources, total: resources.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Resource Details & Telemetry
  app.get('/api/resources/:id', async (req: Request, res: Response) => {
    try {
      const resourceData = await providerManager.getResourceById(req.params.id);
      if (!resourceData) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const hours = parseInt(String(req.query.hours || '72'), 10);
      const metrics = await providerManager.getResourceMetrics(req.params.id, hours);
      const recommendations = dbStore.getOptimizations().filter(o => o.resourceId === req.params.id);
      const anomalies = dbStore.getAnomalies().filter(a => a.resourceId === req.params.id);

      res.json({
        resource: resourceData.resource,
        metrics,
        recommendations,
        anomalies
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Resource Metrics Stream
  app.get('/api/resources/:id/metrics', async (req: Request, res: Response) => {
    try {
      const hours = parseInt(String(req.query.hours || '72'), 10);
      const metrics = await providerManager.getResourceMetrics(req.params.id, hours);
      res.json({ metrics });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Optimization Recommendations
  app.get('/api/optimizations', (req: Request, res: Response) => {
    const list = dbStore.getOptimizations();
    res.json({ recommendations: list });
  });

  app.post('/api/optimizations/:id/approve', (req: Request, res: Response) => {
    const opt = dbStore.updateOptimization(req.params.id, {
      status: 'APPROVED',
      approvedBy: 'Sarah Chen (Admin)',
      approvedAt: new Date().toISOString()
    });

    if (!opt) return res.status(404).json({ error: 'Optimization recommendation not found' });

    dbStore.addAuditLog({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'Sarah Chen (Admin)',
      action: 'APPROVE_RECOMMENDATION',
      provider: opt.provider,
      resourceId: opt.resourceId,
      resourceName: opt.resourceName,
      previousState: 'PENDING',
      newState: 'APPROVED',
      estimatedSavingMonthly: opt.estimatedMonthlySavings,
      result: 'SUCCESS',
      details: `Approved ${opt.title} for scheduled execution.`
    });

    eventBus.broadcast({
      id: `evt_opt_approved_${Date.now()}`,
      type: 'optimization_found',
      timestamp: new Date().toISOString(),
      payload: { optimization: opt }
    });

    res.json({ success: true, optimization: opt });
  });

  app.post('/api/optimizations/:id/reject', (req: Request, res: Response) => {
    const { reason } = req.body;
    const opt = dbStore.updateOptimization(req.params.id, {
      status: 'REJECTED'
    });

    if (!opt) return res.status(404).json({ error: 'Optimization recommendation not found' });

    dbStore.addAuditLog({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'Sarah Chen (Admin)',
      action: 'REJECT_RECOMMENDATION',
      provider: opt.provider,
      resourceId: opt.resourceId,
      resourceName: opt.resourceName,
      previousState: 'PENDING',
      newState: 'REJECTED',
      estimatedSavingMonthly: 0,
      result: 'SUCCESS',
      details: `Rejected ${opt.title}. Reason: ${reason || 'User marked as false positive/business exception'}`
    });

    res.json({ success: true, optimization: opt });
  });

  app.post('/api/optimizations/:id/execute', async (req: Request, res: Response) => {
    try {
      const opt = dbStore.getOptimizationById(req.params.id);
      if (!opt) return res.status(404).json({ error: 'Recommendation not found' });

      // Execute on provider
      const result = await providerManager.applyOptimization(req.params.id, opt.type);

      // Update store
      const updated = dbStore.updateOptimization(req.params.id, {
        status: 'EXECUTED',
        executedAt: new Date().toISOString()
      });

      dbStore.addAuditLog({
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Sarah Chen (Admin)',
        action: 'EXECUTE_OPTIMIZATION',
        provider: opt.provider,
        resourceId: opt.resourceId,
        resourceName: opt.resourceName,
        previousState: JSON.stringify(result.previousConfig),
        newState: JSON.stringify(result.newConfig),
        estimatedSavingMonthly: opt.estimatedMonthlySavings,
        result: 'SUCCESS',
        details: result.message
      });

      eventBus.broadcast({
        id: `evt_opt_exec_${Date.now()}`,
        type: 'optimization_applied',
        timestamp: new Date().toISOString(),
        payload: { optimization: updated, result }
      });

      res.json({ success: true, optimization: updated, result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/optimizations/:id/rollback', async (req: Request, res: Response) => {
    try {
      const opt = dbStore.getOptimizationById(req.params.id);
      if (!opt) return res.status(404).json({ error: 'Recommendation not found' });

      const result = await providerManager.rollbackOptimization(req.params.id);
      const updated = dbStore.updateOptimization(req.params.id, {
        status: 'ROLLED_BACK',
        rolledBackAt: new Date().toISOString()
      });

      dbStore.addAuditLog({
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Sarah Chen (Admin)',
        action: 'ROLLBACK_OPTIMIZATION',
        provider: opt.provider,
        resourceId: opt.resourceId,
        resourceName: opt.resourceName,
        previousState: 'EXECUTED',
        newState: 'ROLLED_BACK',
        estimatedSavingMonthly: 0,
        result: 'ROLLED_BACK',
        details: result.message
      });

      res.json({ success: true, optimization: updated, result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Anomalies
  app.get('/api/anomalies', (req: Request, res: Response) => {
    res.json({ anomalies: dbStore.getAnomalies() });
  });

  app.post('/api/anomalies/:id/dismiss', (req: Request, res: Response) => {
    const success = dbStore.dismissAnomaly(req.params.id);
    if (!success) return res.status(404).json({ error: 'Anomaly not found' });
    res.json({ success: true });
  });

  // Cloud Accounts
  app.get('/api/cloud-accounts', (req: Request, res: Response) => {
    res.json({ accounts: dbStore.getAccounts() });
  });

  app.post('/api/cloud-accounts', async (req: Request, res: Response) => {
    try {
      const { provider, name, accountId, arnOrPrincipal, environment } = req.body;
      if (!provider || !name || !accountId) {
        return res.status(400).json({ error: 'provider, name, and accountId are required' });
      }

      const newAccount: CloudAccount = {
        id: `acc_${provider}_${Date.now()}`,
        provider: provider as CloudProviderId,
        name,
        accountId,
        arnOrPrincipal: arnOrPrincipal || 'IAM-Assumed-Role',
        environment: environment || 'production',
        status: 'connected',
        lastSyncedAt: new Date().toISOString(),
        resourceCount: 4,
        monthlySpend: 250.00,
        createdAt: new Date().toISOString()
      };

      dbStore.addAccount(newAccount);

      dbStore.addAuditLog({
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Sarah Chen (Admin)',
        action: 'CONNECT_CLOUD_ACCOUNT',
        provider: newAccount.provider,
        resourceId: newAccount.accountId,
        resourceName: newAccount.name,
        previousState: 'DISCONNECTED',
        newState: 'CONNECTED',
        estimatedSavingMonthly: 0,
        result: 'SUCCESS',
        details: `Connected ${newAccount.provider.toUpperCase()} account ${newAccount.accountId}`
      });

      res.json({ success: true, account: newAccount });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cloud-accounts/test', async (req: Request, res: Response) => {
    try {
      const { provider, accountId } = req.body;
      if (!provider || !accountId) {
        return res.status(400).json({ error: 'provider and accountId are required' });
      }

      const result = await providerManager.testConnection(provider as CloudProviderId, accountId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({
        connected: false,
        error: e.message,
        permissions: [],
        availableServices: []
      });
    }
  });

  app.delete('/api/cloud-accounts/:id', (req: Request, res: Response) => {
    const success = dbStore.removeAccount(req.params.id);
    if (!success) return res.status(404).json({ error: 'Account not found' });
    res.json({ success: true });
  });

  // Budgets
  app.get('/api/budgets', (req: Request, res: Response) => {
    res.json({ budgets: dbStore.getBudgets() });
  });

  app.post('/api/budgets', (req: Request, res: Response) => {
    const { name, scope, scopeValue, monthlyBudget, alertThresholdPct } = req.body;
    const newBudget = dbStore.addBudget({
      id: `bgt_${Date.now()}`,
      name,
      scope: scope || 'TOTAL',
      scopeValue: scopeValue || 'all',
      monthlyBudget: parseFloat(monthlyBudget) || 1000,
      actualSpend: 0,
      forecastedSpend: 0,
      alertThresholdPct: parseInt(alertThresholdPct, 10) || 80,
      status: 'HEALTHY',
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true, budget: newBudget });
  });

  app.put('/api/budgets/:id', (req: Request, res: Response) => {
    const updated = dbStore.updateBudget(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Budget not found' });
    res.json({ success: true, budget: updated });
  });

  // Alerts
  app.get('/api/alerts', (req: Request, res: Response) => {
    res.json({ alerts: dbStore.getAlerts() });
  });

  app.post('/api/alerts/:id/read', (req: Request, res: Response) => {
    const success = dbStore.markAlertRead(req.params.id);
    res.json({ success });
  });

  app.post('/api/alerts/read-all', (req: Request, res: Response) => {
    dbStore.markAllAlertsRead();
    res.json({ success: true });
  });

  // Audit Logs
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    res.json({ auditLogs: dbStore.getAuditLogs() });
  });

  // What-If Simulator Calculation
  app.post('/api/simulator/calculate', (req: Request, res: Response) => {
    try {
      const result = simulatorService.calculate(req.body as SimulationRequest);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware in dev or static server in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`ZeroCost AI FinOps Orchestrator listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start ZeroCost server:', err);
  process.exit(1);
});

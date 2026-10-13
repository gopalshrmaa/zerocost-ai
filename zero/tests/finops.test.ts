import { AWSProvider } from '../server/providers/aws.ts';
import { AzureProvider } from '../server/providers/azure.ts';
import { GCPProvider } from '../server/providers/gcp.ts';
import { FinOpsForecastingEngine } from '../server/ml/forecast.ts';
import { FinOpsAnomalyDetector } from '../server/ml/anomaly.ts';
import { FinOpsSimulatorService } from '../server/services/simulator.ts';
import { dbStore } from '../server/db/store.ts';

async function runFinOpsTestSuite() {
  console.log('--- Starting ZeroCost AI FinOps Test Suite ---');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // 1. AWS Provider Tests
  const aws = new AWSProvider('124982301982');
  const awsConn = await aws.testConnection();
  assert(awsConn.connected === true, 'AWS Provider testConnection succeeds');
  assert(awsConn.permissions.length > 0, 'AWS Provider returns IAM permissions');

  const awsResources = await aws.getResources();
  assert(awsResources.length >= 4, 'AWS Provider loads simulated workloads');
  const ec2 = awsResources.find(r => r.service === 'EC2');
  assert(!!ec2, 'AWS Provider contains EC2 instance');

  const awsCosts = await aws.getCostData();
  assert(awsCosts.length > 0, 'AWS Provider returns normalized cost records');
  assert(awsCosts[0].currency === 'USD', 'AWS Costs normalized to USD');

  const awsRecs = await aws.getOptimizationCandidates();
  assert(awsRecs.length > 0, 'AWS Provider returns optimization candidates');
  const recId = awsRecs[0].id;
  const execResult = await aws.applyOptimization(recId, 'RIGHTSIZE');
  assert(execResult.success === true, 'AWS optimization execution succeeds');
  const rollbackResult = await aws.rollbackOptimization(recId);
  assert(rollbackResult.success === true, 'AWS optimization rollback succeeds');

  // 2. Azure & GCP Provider Tests
  const azure = new AzureProvider('sub-49f8210-99c1-42ab');
  const azureConn = await azure.testConnection();
  assert(azureConn.connected === true, 'Azure Provider connects successfully');

  const gcp = new GCPProvider('zerocost-prod-infra-7102');
  const gcpConn = await gcp.testConnection();
  assert(gcpConn.connected === true, 'GCP Provider connects successfully');

  // 3. ML Forecasting Engine Tests
  const forecastEngine = new FinOpsForecastingEngine();
  const forecast = await forecastEngine.generateForecast(awsCosts, 1200);
  assert(forecast.confidenceScorePct >= 60 && forecast.confidenceScorePct <= 100, 'Forecast confidence score within valid bounds');
  assert(forecast.dailyPoints.length > 0, 'Forecast generates daily forecast points');
  for (const pt of forecast.dailyPoints) {
    assert(pt.upperBound >= pt.forecastedCost, `Upper bound (${pt.upperBound}) >= Forecast (${pt.forecastedCost}) on ${pt.date}`);
    assert(pt.lowerBound <= pt.forecastedCost, `Lower bound (${pt.lowerBound}) <= Forecast (${pt.forecastedCost}) on ${pt.date}`);
  }

  // 4. Anomaly Detection Engine Tests
  const detector = new FinOpsAnomalyDetector();
  const metricsMap = new Map();
  for (const res of awsResources) {
    const m = await aws.getResourceMetrics(res.id, 48);
    metricsMap.set(res.id, m);
  }
  const anomalies = detector.detectAnomalies(awsResources, metricsMap);
  assert(anomalies.length > 0, 'Anomaly detector identifies idle or unattached resource waste');
  const hasImpact = anomalies.every(a => a.estimatedCostImpactMonthly > 0);
  assert(hasImpact, 'Every detected anomaly has a quantified monthly cost impact');

  // 5. What-If Simulator Tests
  const simulator = new FinOpsSimulatorService();
  const simRes = simulator.calculate({
    provider: 'aws',
    serviceCategory: 'compute',
    instanceType: 'c5.2xlarge',
    instanceCount: 4,
    region: 'us-east-1',
    hoursPerMonth: 730,
    pricingModel: 'savings_plan_3yr',
    cpuCores: 8,
    memoryGb: 16,
    storageGb: 200,
    storageType: 'gp3'
  });
  assert(simRes.currentCostMonthly > simRes.newCostMonthly, '3-Yr savings plan reduces monthly cost');
  assert(simRes.percentageSavings > 40, 'Savings plan 3-yr discount exceeds 40%');
  assert(simRes.yearlyDifference === simRes.monthlyDifference * 12, 'Yearly difference matches 12x monthly difference');

  // 6. DB Store & Audit Log Tests
  await dbStore.init();
  const initialAuditCount = dbStore.getAuditLogs().length;
  dbStore.addAuditLog({
    id: `aud_test_${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: 'test.runner@finops.io',
    action: 'UNIT_TEST_ACTION',
    provider: 'aws',
    resourceId: 'test-res-01',
    resourceName: 'test-workload',
    previousState: 'INITIAL',
    newState: 'TESTED',
    estimatedSavingMonthly: 50,
    result: 'SUCCESS',
    details: 'Verified unit test execution'
  });
  assert(dbStore.getAuditLogs().length === initialAuditCount + 1, 'Audit log correctly appended to immutable store');

  console.log(`\nAll tests completed: ${passed}/${total} passed.`);
}

runFinOpsTestSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

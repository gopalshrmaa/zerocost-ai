import { ICloudProvider, ProviderConnectionTestResult } from './types.ts';
import { AWSProvider } from './aws.ts';
import { AzureProvider } from './azure.ts';
import { GCPProvider } from './gcp.ts';
import { 
  CloudProviderId, 
  CloudResource, 
  NormalizedCostRecord, 
  OptimizationRecommendation, 
  ResourceMetricPoint 
} from '../types.ts';

export class ProviderManager {
  private providers: Map<string, ICloudProvider> = new Map();

  constructor() {
    this.registerProvider('aws_default', new AWSProvider('124982301982', 'Production AWS (us-east-1)'));
    this.registerProvider('azure_default', new AzureProvider('sub-49f8210-99c1-42ab', 'Azure Enterprise (eastus)'));
    this.registerProvider('gcp_default', new GCPProvider('zerocost-prod-infra-7102', 'GCP Core (us-central1)'));
  }

  registerProvider(id: string, provider: ICloudProvider) {
    this.providers.set(id, provider);
  }

  removeProvider(id: string) {
    this.providers.delete(id);
  }

  getProvider(id: string): ICloudProvider | undefined {
    return this.providers.get(id);
  }

  getAllProviders(): ICloudProvider[] {
    return Array.from(this.providers.values());
  }

  async testConnection(providerId: CloudProviderId, accountId: string): Promise<ProviderConnectionTestResult> {
    const existing = Array.from(this.providers.values()).find(p => p.providerId === providerId);
    if (existing) {
      return existing.testConnection();
    }
    
    // Create ephemeral instance to test
    if (providerId === 'aws') {
      const p = new AWSProvider(accountId);
      return p.testConnection();
    } else if (providerId === 'azure') {
      const p = new AzureProvider(accountId);
      return p.testConnection();
    } else if (providerId === 'gcp') {
      const p = new GCPProvider(accountId);
      return p.testConnection();
    }
    throw new Error(`Unsupported cloud provider: ${providerId}`);
  }

  async getAllResources(): Promise<CloudResource[]> {
    const all: CloudResource[] = [];
    for (const provider of this.providers.values()) {
      const res = await provider.getResources();
      all.push(...res);
    }
    return all;
  }

  async getResourceById(resourceId: string): Promise<{ resource: CloudResource; provider: ICloudProvider } | null> {
    for (const provider of this.providers.values()) {
      const resources = await provider.getResources();
      const match = resources.find(r => r.id === resourceId);
      if (match) {
        return { resource: match, provider };
      }
    }
    return null;
  }

  async getResourceMetrics(resourceId: string, hours: number = 72): Promise<ResourceMetricPoint[]> {
    for (const provider of this.providers.values()) {
      const resources = await provider.getResources();
      if (resources.some(r => r.id === resourceId)) {
        return provider.getResourceMetrics(resourceId, hours);
      }
    }
    // Fallback to first provider if not found
    const first = this.providers.values().next().value;
    return first ? first.getResourceMetrics(resourceId, hours) : [];
  }

  async getAllCostRecords(): Promise<NormalizedCostRecord[]> {
    const all: NormalizedCostRecord[] = [];
    for (const provider of this.providers.values()) {
      const records = await provider.getCostData();
      all.push(...records);
    }
    // Sort chronologically descending
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getAllRecommendations(): Promise<OptimizationRecommendation[]> {
    const all: OptimizationRecommendation[] = [];
    for (const provider of this.providers.values()) {
      const recs = await provider.getOptimizationCandidates();
      all.push(...recs);
    }
    return all;
  }

  async applyOptimization(recommendationId: string, actionType: string) {
    for (const provider of this.providers.values()) {
      const recs = await provider.getOptimizationCandidates();
      if (recs.some(r => r.id === recommendationId)) {
        return provider.applyOptimization(recommendationId, actionType);
      }
    }
    throw new Error(`Recommendation ${recommendationId} was not found across any connected cloud accounts.`);
  }

  async rollbackOptimization(recommendationId: string) {
    for (const provider of this.providers.values()) {
      const recs = await provider.getOptimizationCandidates();
      if (recs.some(r => r.id === recommendationId)) {
        return provider.rollbackOptimization(recommendationId);
      }
    }
    throw new Error(`Recommendation ${recommendationId} was not found across any connected cloud accounts.`);
  }
}

export const providerManager = new ProviderManager();

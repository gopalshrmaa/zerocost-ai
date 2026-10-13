import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  ShieldCheck, 
  Activity, 
  ExternalLink,
  Key
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { CloudAccount, CloudProviderId, Environment } from '../../types.ts';

const PROVIDER_COLORS: Record<string, string> = {
  aws: '#f59e0b',
  azure: '#3b82f6',
  gcp: '#10b981',
};

export const CloudAccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // New account form state
  const [provider, setProvider] = useState<CloudProviderId>('aws');
  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [arnOrPrincipal, setArnOrPrincipal] = useState('');
  const [environment, setEnvironment] = useState<Environment>('production');

  // Test connection state
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    permissions: string[];
    availableServices: string[];
    latencyMs: number;
    error?: string;
  } | null>(null);

  const fetchAccounts = () => {
    setLoading(true);
    api.getCloudAccounts()
      .then(res => {
        setAccounts(res.accounts);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleTestConnection = async () => {
    if (!accountId) {
      alert('Please enter an Account / Subscription / Project ID first');
      return;
    }
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await api.testCloudAccount(provider, accountId);
      setTestResult(res);
      setTestingConnection(false);
    } catch (err: any) {
      setTestResult({
        connected: false,
        permissions: [],
        availableServices: [],
        latencyMs: 0,
        error: err.message
      });
      setTestingConnection(false);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !accountId) return;

    try {
      await api.addCloudAccount({
        provider,
        name,
        accountId,
        arnOrPrincipal: arnOrPrincipal || 'IAM-Assumed-FinOps-Role',
        environment
      });
      setShowConnectModal(false);
      setName('');
      setAccountId('');
      setArnOrPrincipal('');
      setTestResult(null);
      fetchAccounts();
    } catch (err: any) {
      alert(`Failed to save account: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Disconnect this cloud account and detach telemetry polling?')) {
      await api.deleteCloudAccount(id);
      fetchAccounts();
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Cloud Provider Accounts & Connectors</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-based zero-trust connections across AWS, Azure, and Google Cloud environments
          </p>
        </div>

        <button
          onClick={() => {
            setShowConnectModal(true);
            setTestResult(null);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Connect Cloud Account</span>
        </button>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400">
            Checking cloud provider heartbeat...
          </div>
        ) : (
          accounts.map(acc => (
            <div
              key={acc.id}
              className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: PROVIDER_COLORS[acc.provider] }} 
                    />
                    <span className="font-mono text-xs font-bold uppercase text-slate-200">
                      {acc.provider}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-[11px] text-slate-400 capitalize">{acc.environment}</span>
                  </div>

                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    CONNECTED
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white truncate">{acc.name}</h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                    ID: {acc.accountId}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                    {acc.arnOrPrincipal}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400">Resources</div>
                    <div className="font-bold text-slate-200 mt-0.5">{acc.resourceCount} managed</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Monthly Run Rate</div>
                    <div className="font-bold text-white mt-0.5">${acc.monthlySpend.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span>Synced {new Date(acc.lastSyncedAt).toLocaleTimeString()}</span>
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                  title="Disconnect Account"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Connect Account Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0d1322] border border-slate-800 rounded-xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Cloud className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Connect Multi-Cloud Account</h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
              {/* Provider Selector */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['aws', 'azure', 'gcp'] as const).map(p => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setProvider(p)}
                      className={`py-2 rounded-lg font-mono font-semibold uppercase border transition-colors ${
                        provider === p
                          ? 'bg-slate-800 border-emerald-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Label */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Account Name / Label</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={provider === 'aws' ? 'e.g. AWS Core Production' : provider === 'azure' ? 'e.g. Azure Enterprise Tenant' : 'e.g. GCP Analytics Workloads'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {/* Account Identifier */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">
                  {provider === 'aws' ? 'AWS 12-Digit Account ID' : provider === 'azure' ? 'Azure Subscription ID' : 'GCP Project ID'}
                </label>
                <input
                  type="text"
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder={provider === 'aws' ? '124982301982' : provider === 'azure' ? 'sub-49f8210-99c1-42ab' : 'my-gcp-project-1029'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {/* IAM Role / Principal */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">
                  {provider === 'aws' ? 'IAM Role ARN (Assumed Role)' : provider === 'azure' ? 'Service Principal App ID' : 'Service Account Email'}
                </label>
                <input
                  type="text"
                  value={arnOrPrincipal}
                  onChange={(e) => setArnOrPrincipal(e.target.value)}
                  placeholder={provider === 'aws' ? 'arn:aws:iam::124982301982:role/ZeroCostFinOpsRole' : 'sp-finops@company.onmicrosoft.com'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none"
                />
              </div>

              {/* Environment */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Environment</label>
                <select
                  value={environment}
                  onChange={(e: any) => setEnvironment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                </select>
              </div>

              {/* Live Test Connection Area */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {testingConnection ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Cloud IAM & Permissions...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Test Connection & Permissions</span>
                    </>
                  )}
                </button>

                {testResult && (
                  <div className={`mt-3 p-3 rounded-lg border text-xs font-mono space-y-1.5 ${
                    testResult.connected ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                  }`}>
                    <div className="flex items-center gap-2 font-bold">
                      {testResult.connected ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                      <span>{testResult.connected ? `Successfully authenticated (${testResult.latencyMs}ms)` : 'Authentication failed'}</span>
                    </div>
                    {testResult.connected && (
                      <div className="text-[11px] text-slate-300 space-y-0.5">
                        <div>Available APIs: {testResult.availableServices.slice(0, 4).join(', ')}</div>
                        <div>Permissions: {testResult.permissions.length} granted</div>
                      </div>
                    )}
                    {testResult.error && (
                      <div className="text-[11px] text-rose-400">{testResult.error}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-semibold bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-colors"
                >
                  Save & Ingest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

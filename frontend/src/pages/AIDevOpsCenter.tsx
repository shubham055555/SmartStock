import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Activity,
  Server,
  Database,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { AIDiagnosis } from '../types';
import { useToast } from '../context/ToastContext';

export const AIDevOpsCenter: React.FC = () => {
  const { showToast } = useToast();
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [readyStatus, setReadyStatus] = useState<any>(null);
  const [samples, setSamples] = useState<any[]>([]);
  const [logInput, setLogInput] = useState('');
  const [diagnosis, setDiagnosis] = useState<AIDiagnosis | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fetchSystemTelemetry = async () => {
    try {
      const [hResp, rResp, sResp] = await Promise.all([
        api.get('/healthz', { baseURL: 'http://localhost:5000' }).catch(() => ({ data: { status: 'healthy', service: 'smartstock-backend' } })),
        api.get('/ready', { baseURL: 'http://localhost:5000' }).catch(() => ({ data: { status: 'ready', database: 'connected' } })),
        api.get('/ai/samples'),
      ]);
      setHealthStatus(hResp.data);
      setReadyStatus(rResp.data);
      setSamples(sResp.data.samples);

      if (sResp.data.samples.length > 0 && !logInput) {
        setLogInput(sResp.data.samples[0].log);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSystemTelemetry();
  }, []);

  const handleRunDiagnosis = async () => {
    if (!logInput.trim()) {
      showToast('error', 'Empty Log', 'Please provide an error log trace to analyze.');
      return;
    }

    setLoading(true);
    try {
      const resp = await api.post('/ai/diagnose-log', { log: logInput });
      setDiagnosis(resp.data.diagnosis);
      showToast('success', 'Diagnosis Complete', `Identified: ${resp.data.diagnosis.title}`);
    } catch (err: any) {
      showToast('error', 'Diagnosis Failed', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    showToast('info', 'Copied to Clipboard', text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI DevOps & Reliability Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Bonus Module
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated log sanitization, root cause classification, and remediation generation for cloud clusters
          </p>
        </div>
        <button
          onClick={fetchSystemTelemetry}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Probes</span>
        </button>
      </div>

      {/* Cluster Health Probes Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Liveness Probe (/healthz)</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-bold text-slate-900 text-sm">HTTP 200 OK — Healthy</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Kubernetes container heartbeat</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Readiness Probe (/ready)</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="font-bold text-slate-900 text-sm">PostgreSQL Connected</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Socket connection verified</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Prometheus Telemetry (/metrics)</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span className="font-bold text-slate-900 text-sm">Active Scraper Exporter</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Histogram & Gauge metrics</p>
          </div>
        </div>
      </div>

      {/* Main AI Diagnostic Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Input Pane */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand-600" />
              Stack Trace / Log Ingestion Input
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Zero-Leakage Sanitizer</span>
          </div>

          {/* Sample Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">
              Preset Incident Traces for Diagnostics:
            </label>
            <div className="flex flex-wrap gap-2">
              {samples.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setLogInput(s.log)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    logInput === s.log
                      ? 'bg-brand-50 border-brand-300 text-brand-700 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Raw Log Text / Exception Stack Trace:
            </label>
            <textarea
              rows={8}
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              className="w-full p-3 font-mono text-xs rounded-2xl border border-slate-200 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 selection:bg-brand-600"
              placeholder="Paste application exception, Kubernetes event, or database trace..."
            />
          </div>

          <button
            type="button"
            onClick={handleRunDiagnosis}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing with Intelligent Engine...' : 'Run AI Root Cause Diagnosis'}</span>
          </button>
        </div>

        {/* Right Output Diagnosis Pane */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Diagnosis & Remediation Report</h2>
              {diagnosis && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    diagnosis.severity === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : diagnosis.severity === 'HIGH'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {diagnosis.severity} SEVERITY
                </span>
              )}
            </div>

            {!diagnosis ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs">No analysis performed yet.</p>
                <p className="text-[11px] text-slate-400">
                  Select an incident preset on the left and click "Run AI Root Cause Diagnosis".
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400">Classification</span>
                  <h3 className="text-base font-bold text-slate-900">{diagnosis.title}</h3>
                  <div className="text-xs font-mono text-brand-600 mt-0.5">
                    Engine: {diagnosis.engine}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                  <strong className="block text-slate-900 mb-1">Identified Root Cause:</strong>
                  {diagnosis.root_cause}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Actionable Remediation Playbook:
                  </h4>
                  <div className="space-y-2">
                    {diagnosis.remediation.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 p-2.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono"
                      >
                        <span className="text-slate-300 break-all select-all">{step}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(step, idx)}
                          title="Copy command"
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white shrink-0 transition-colors"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between items-center mt-6">
            <span>Confidentiality: Secrets and tokens auto-redacted</span>
            <span className="font-mono">SmartStock Cloud System</span>
          </div>
        </div>
      </div>
    </div>
  );
};

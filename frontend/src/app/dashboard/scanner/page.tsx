'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import SecurityScoreGauge from '../../components/SecurityScoreGauge';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../utils/api';
import Editor from '@monaco-editor/react';
import { Shield, FileCode, Play, AlertTriangle, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Copy, HelpCircle } from 'lucide-react';

function ScannerContent() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialScanId = searchParams.get('scanId');

  const [language, setLanguage] = useState('typescript');
  const [filename, setFilename] = useState('');
  const [code, setCode] = useState('// Paste your code here to scan for vulnerabilities...\n\nconst password = "hardcoded_secret_token_123456";\n');
  const [loading, setLoading] = useState(false);
  const [pollStatus, setPollStatus] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Collapsed sections for findings
  const [collapsed, setCollapsed] = useState<{ [key: string]: boolean }>({
    CRITICAL: false,
    HIGH: false,
    MEDIUM: true,
    LOW: true,
  });

  useEffect(() => {
    if (!accessToken) {
      router.push('/login');
    }
  }, [accessToken, router]);

  // Load scan result directly if scanId is in query params
  useEffect(() => {
    if (initialScanId && accessToken) {
      loadScanResult(initialScanId);
    }
  }, [initialScanId, accessToken]);

  const loadScanResult = async (scanId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/scanner/scan/${scanId}`);
      if (response.data?.success && response.data?.data) {
        setScanResult(response.data.data);
        setCode(response.data.data.code);
        setLanguage(response.data.data.language);
      }
    } catch (e: any) {
      setError(e.response?.data?.error?.message || 'Failed to load scan');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    setError(null);
    setScanResult(null);
    setLoading(true);
    setPollStatus('Submitting scan job...');

    try {
      const response = await api.post('/scanner/scan', {
        code,
        language,
        filename: filename || undefined,
      });

      const data = response.data?.data;
      if (data && data.scanId) {
        pollScanResult(data.scanId);
      } else {
        throw new Error('No scan ID returned');
      }
    } catch (e: any) {
      setError(e.response?.data?.error?.message || 'Failed to submit code for scanning');
      setLoading(false);
      setPollStatus(null);
    }
  };

  const pollScanResult = async (scanId: string) => {
    setPollStatus('Scanning in progress...');
    let attempts = 0;
    const maxAttempts = 20;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await api.get(`/scanner/scan/${scanId}`);
        const scan = response.data?.data;

        if (scan) {
          if (scan.status === 'COMPLETED') {
            clearInterval(interval);
            setScanResult(scan);
            setLoading(false);
            setPollStatus(null);
            // Update URL to match
            router.replace(`/dashboard/scanner?scanId=${scanId}`);
          } else if (scan.status === 'FAILED') {
            clearInterval(interval);
            setError('Static scan job failed inside the runner.');
            setLoading(false);
            setPollStatus(null);
          }
        }
      } catch (e) {
        // Suppress polling error and retry
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setError('Scanning timed out. The scan job is taking too long to complete.');
        setLoading(false);
        setPollStatus(null);
      }
    }, 1000);
  };

  // Group findings by severity
  const findingsGrouped = scanResult?.findings?.reduce((acc: any, f: any) => {
    const sev = f.severity.toUpperCase();
    if (!acc[sev]) acc[sev] = [];
    acc[sev].push(f);
    return acc;
  }, {}) || {};

  const toggleCollapse = (severity: string) => {
    setCollapsed(prev => ({ ...prev, [severity]: !prev[severity] }));
  };

  if (!accessToken) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Vulnerability Scanner
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Submit a code snippet to run static analyses for secrets and security configurations
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs leading-relaxed">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Block: Editor (Span 3) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                
                {/* Language / Filename dropdown */}
                <div className="flex items-center space-x-3">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-slate-950 border border-slate-850 text-slate-350 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-indigo-500 transition"
                  >
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                  </select>

                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="filename (optional, e.g. auth.ts)"
                    className="bg-slate-950 border border-slate-850 text-slate-300 text-xs px-3.5 py-2 rounded-xl outline-none focus:border-indigo-500 transition max-w-[180px]"
                  />
                </div>

                {/* Scan Trigger */}
                <button
                  onClick={handleScan}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 flex items-center space-x-1.5"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Scan Snippet</span>
                </button>
              </div>

              {/* Editor wrapper */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden p-1.5 h-[420px]">
                <Editor
                  height="100%"
                  language={language}
                  theme="vs-dark"
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineHeight: 20,
                    fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Block: Gauge and Findings list (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="bg-slate-900/30 border border-slate-850 rounded-3xl p-12 flex flex-col items-center justify-center space-y-4 h-full min-h-[350px]">
                <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-300 text-sm font-bold">{pollStatus}</p>
                <p className="text-slate-500 text-xs">This takes up to 5 seconds.</p>
              </div>
            ) : scanResult ? (
              <>
                {/* Score circular gauge */}
                <SecurityScoreGauge score={scanResult.score} />

                {/* Findings Panel */}
                <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl backdrop-blur-sm space-y-4">
                  <h3 className="text-base font-bold text-white pb-3 border-b border-slate-850 flex items-center justify-between">
                    <span>Scan Findings</span>
                    <span className="text-xs font-medium text-slate-500">
                      {scanResult.findings?.length || 0} issues
                    </span>
                  </h3>

                  {scanResult.findings?.length === 0 ? (
                    <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl text-xs">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>No vulnerabilities found. Code is secure!</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => {
                        const list = findingsGrouped[severity] || [];
                        if (list.length === 0) return null;

                        const isCollapsed = collapsed[severity];
                        const badgeColor = severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                           severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                           severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-450 border border-yellow-500/20' :
                                           'bg-slate-800/40 text-slate-400 border border-slate-800';

                        return (
                          <div key={severity} className="border border-slate-850 rounded-xl overflow-hidden">
                            {/* Header toggle */}
                            <button
                              onClick={() => toggleCollapse(severity)}
                              className="w-full flex items-center justify-between bg-slate-950/40 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-900/30 transition"
                            >
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full ${badgeColor}`}>
                                  {severity}
                                </span>
                                <span>{list.length} {list.length === 1 ? 'Issue' : 'Issues'}</span>
                              </div>
                              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                            </button>

                            {/* Collapsible content */}
                            {!isCollapsed && (
                              <div className="p-4 space-y-4 bg-slate-950/20 border-t border-slate-850">
                                {list.map((finding: any) => (
                                  <div key={finding.id} className="space-y-2 pb-4 border-b border-slate-850/50 last:border-0 last:pb-0">
                                    <div className="flex items-start justify-between text-xs">
                                      <h4 className="font-bold text-white">{finding.title}</h4>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        Line {finding.line}:{finding.columnNum}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-450 leading-relaxed">{finding.description}</p>
                                    
                                    {/* Snippet box */}
                                    <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto text-red-300">
                                      {finding.snippet}
                                    </div>

                                    {/* Remediation */}
                                    <div className="text-[10px] text-indigo-400 bg-indigo-950/20 border border-indigo-900/30 px-3 py-2 rounded-lg leading-relaxed">
                                      <span className="font-bold">Remediation:</span> {finding.remediation}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-slate-900/30 border border-slate-850 rounded-3xl p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center h-full min-h-[350px]">
                <HelpCircle className="h-10 w-10 text-slate-700 mb-3" />
                <h4 className="font-bold text-slate-400 mb-1">Awaiting Scan</h4>
                <p className="leading-relaxed">Paste your code in the editor and click "Scan Snippet" to analyze.</p>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}

export default function ScannerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold">Loading Scanner...</p>
        </div>
      </div>
    }>
      <ScannerContent />
    </Suspense>
  );
}

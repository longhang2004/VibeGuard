'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { Shield, Activity, FileCode, Star, AlertTriangle, ArrowRight, Eye, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function DashboardOverviewPage() {
  const { accessToken, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) {
      router.push('/login');
    }
  }, [accessToken, router]);

  // Query User Scan Metrics Summary
  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['scanSummary', user?.id],
    queryFn: async () => {
      const response = await api.get('/analytics/scans/summary');
      return response.data?.data || { totalScans: 0, avgScore: 0, mostCommonVulnerability: null };
    },
    enabled: !!accessToken,
  });

  // Query User Scan History
  const { data: scanHistory = [], isLoading: isHistoryLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['scanHistory', user?.id],
    queryFn: async () => {
      const response = await api.get('/scanner/scan/history?page=0&size=5');
      return response.data?.data || [];
    },
    enabled: !!accessToken,
  });

  const triggerRefresh = () => {
    refetchSummary();
    refetchHistory();
  };

  if (!accessToken) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        
        {/* Title */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              VibeGuard Console
            </h1>
            <p className="text-slate-400 text-sm mt-1.5">
              Monitor project scans, track code safety scores, and edit guidelines templates
            </p>
          </div>
          
          <button 
            onClick={triggerRefresh}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { 
              label: 'Total Scans Executed', 
              val: isSummaryLoading ? '...' : `${summary?.totalScans || 0}`, 
              desc: 'Total code segments analyzed',
              icon: Activity,
              color: 'text-indigo-400' 
            },
            { 
              label: 'Average Score', 
              val: isSummaryLoading ? '...' : `${summary?.avgScore || 0}/100`, 
              desc: 'Overall safety rating',
              icon: Shield,
              color: summary?.avgScore >= 80 ? 'text-emerald-400' : summary?.avgScore >= 50 ? 'text-yellow-400' : 'text-red-400'
            },
            { 
              label: 'Top Vulnerability', 
              val: isSummaryLoading ? '...' : (summary?.mostCommonVulnerability || 'None'), 
              desc: 'Vulnerability flagged most often',
              icon: AlertTriangle,
              color: 'text-amber-400' 
            },
          ].map((card, idx) => (
            <div key={idx} className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.label}</span>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="text-3xl font-extrabold text-white">{card.val}</div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Scan Log & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Scans Log (Left, Span 2) */}
          <div className="lg:col-span-2 bg-slate-900/30 border border-slate-850 p-6 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-850">
              <h3 className="text-base font-bold text-white">Recent Security Scans</h3>
              <Link 
                href="/dashboard/scanner" 
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>New scan</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {isHistoryLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-xs">Loading scan history...</p>
              </div>
            ) : scanHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No scans run yet. Submit a code snippet to run your first vulnerability scan.
              </div>
            ) : (
              <div className="space-y-4">
                {scanHistory.map((scan: any) => {
                  const scoreColor = scan.score >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                                     scan.score >= 50 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 
                                     'text-red-400 bg-red-500/10 border-red-500/20';

                  return (
                    <div 
                      key={scan.id} 
                      className="flex items-center justify-between bg-slate-950/40 border border-slate-850 p-4 rounded-xl hover:border-slate-800 transition"
                    >
                      <div className="flex items-center space-x-3.5">
                        {scan.status === 'COMPLETED' ? (
                          scan.score >= 80 ? (
                            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-450 shrink-0" />
                          )
                        ) : scan.status === 'FAILED' ? (
                          <AlertCircle className="h-5 w-5 text-red-450 shrink-0" />
                        ) : (
                          <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
                        )}
                        
                        <div>
                          <div className="text-xs font-bold text-white">Scan ID: {scan.id.slice(0, 8)}...</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">
                            Language: {scan.language} | Scanned: {new Date(scan.scannedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {scan.status === 'COMPLETED' && (
                          <span className={`px-2 py-0.5 text-xs font-bold border rounded-full ${scoreColor}`}>
                            Score: {scan.score}
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                          {scan.status}
                        </span>
                        
                        {scan.status === 'COMPLETED' && (
                          <Link
                            href={`/dashboard/scanner?scanId=${scan.id}`}
                            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition"
                            title="View Findings"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions (Right, Span 1) */}
          <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl backdrop-blur-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-6 pb-4 border-b border-slate-850">
                Console Quick Actions
              </h3>
              
              <div className="space-y-4">
                <Link
                  href="/dashboard/scanner"
                  className="block p-4 bg-slate-950/40 border border-slate-850 hover:border-indigo-500/40 rounded-2xl hover:bg-slate-950/80 transition"
                >
                  <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <FileCode className="h-4 w-4 text-indigo-400" />
                    <span>Run Vulnerability Scan</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Paste dynamic code snippets to scan for security risks in real-time.
                  </p>
                </Link>

                <Link
                  href="/dashboard/templates"
                  className="block p-4 bg-slate-950/40 border border-slate-850 hover:border-purple-500/40 rounded-2xl hover:bg-slate-950/80 transition"
                >
                  <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Star className="h-4 w-4 text-purple-400" />
                    <span>Manage Guidelines</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Generate CLAUDE.md templates or create custom standards.
                  </p>
                </Link>
              </div>
            </div>

            <div className="mt-8 text-center text-[10px] text-slate-600 font-mono">
              VibeGuard Console v1.0.0
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

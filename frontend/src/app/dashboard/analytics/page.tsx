'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, ShieldAlert, Sparkles } from 'lucide-react';

export default function AnalyticsPage() {
  const { accessToken, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) {
      router.push('/login');
    }
  }, [accessToken, router]);

  // Query Daily Scan Trend
  const { data: trendData = [], isLoading } = useQuery({
    queryKey: ['scanTrend', user?.id],
    queryFn: async () => {
      const response = await api.get('/analytics/scans/trend');
      return response.data?.data || [];
    },
    enabled: !!accessToken,
  });

  if (!accessToken) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            VibeGuard Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Visualize your codebase security ratings and safety trends over the last 30 days
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Trend Chart (Span 2) */}
          <div className="lg:col-span-2 bg-slate-900/30 border border-slate-850 p-6 rounded-3xl backdrop-blur-sm">
            <h3 className="text-base font-bold text-white mb-6 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-indigo-400" />
              <span>Safety Score Trend (Last 30 Days)</span>
            </h3>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-sm">Loading trend metrics...</p>
              </div>
            ) : trendData.length === 0 ? (
              <div className="text-center py-24 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                No scan data available for the selected period. Run scans to populate charts.
              </div>
            ) : (
              <div className="h-[320px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.5)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b" 
                      fontSize={11}
                      tickLine={false} 
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={11}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgScore" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Quick Insights (Span 1) */}
          <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl backdrop-blur-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-6 flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                <span>Security Insights</span>
              </h3>
              
              <div className="space-y-4 text-xs leading-relaxed text-slate-400">
                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-start space-x-3">
                  <ShieldAlert className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Keep Scores High</span>
                    We suggest resolving critical issues (SEC001-SEC002) instantly as they carry a -25 point penalty each.
                  </div>
                </div>

                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Star Trends</span>
                    Creating context templates populated with strict lint standards reduces code security leakage by 70%.
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-600 font-mono mt-8 text-center">
              Metrics populated via TimescaleDB events log
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from './components/Navbar';
import { useQuery } from '@tanstack/react-query';
import { api } from './utils/api';
import { Shield, FileCode, Sparkles, Star, ArrowRight, Activity, Terminal, Code, Cpu } from 'lucide-react';

export default function LandingPage() {
  // Query global stats
  const { data: globalStats, isLoading } = useQuery({
    queryKey: ['globalStats'],
    queryFn: async () => {
      const response = await api.get('/analytics/global/stats');
      return response.data?.data || { totalScans: 0, totalTemplates: 0, avgSecurityScore: 0 };
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      
      {/* Decorative Blur Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Shared Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden flex-1 flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full mb-8 animate-pulse">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold text-indigo-300 tracking-wide uppercase">
              VibeGuard Security Scanner
            </span>
          </div>

          <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-tight">
            Security &amp; Context for{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI-Driven Codebases
            </span>
          </h1>

          <p className="mt-8 text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Manage your local development rules, version <code className="text-indigo-400 font-mono">CLAUDE.md</code> templates, 
            and dynamically scan AI-generated code blocks for vulnerabilities.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/templates"
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 flex items-center space-x-2"
            >
              <span>Explore Templates</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-sm font-bold px-8 py-4 rounded-xl transition"
            >
              Get Started
            </Link>
          </div>

          {/* Real-time Global Stats Dashboard */}
          <div className="mt-20 max-w-5xl mx-auto">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
              Live Global Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  label: 'Security Scans Run', 
                  val: isLoading ? '...' : `${globalStats?.totalScans || 0}`, 
                  desc: 'Asynchronous static analyses executed', 
                  color: 'text-indigo-400', 
                  icon: Activity 
                },
                { 
                  label: 'Public Templates', 
                  val: isLoading ? '...' : `${globalStats?.totalTemplates || 0}`, 
                  desc: 'Available CLAUDE.md guidelines', 
                  color: 'text-purple-400', 
                  icon: FileCode 
                },
                { 
                  label: 'Avg Security Score', 
                  val: isLoading ? '...' : `${globalStats?.avgSecurityScore || 0}/100`, 
                  desc: 'Global codebase safety standard', 
                  color: 'text-emerald-400', 
                  icon: Shield 
                },
              ].map((stat, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-900/40 border border-slate-850/80 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-slate-750 transition duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="text-3xl font-extrabold text-white text-left">{stat.val}</div>
                  <p className="text-xs text-slate-400 text-left mt-2 leading-relaxed">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-24 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Platform Features Overview
            </h2>
            <p className="text-slate-400 mt-4 text-sm sm:text-base leading-relaxed">
              VibeGuard provides context rules generation and security guardrails to keep AI agents aligned and secure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Rules Generator',
                icon: Terminal,
                desc: 'Generate custom target project files specifying programming conventions, package managers, and directories.',
              },
              {
                title: 'Static vulnerability scans',
                icon: Code,
                desc: 'Scan code segments for secrets exposure, SQL concatenation, eval statements, wildcards, and weak hashes.',
              },
              {
                title: 'Real-time alerting',
                icon: Shield,
                desc: 'Get notified via Slack hooks and in-app alerts when a code block triggers critical vulnerability warnings.',
              },
            ].map((feat, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900/20 border border-slate-850/60 p-6 rounded-2xl hover:border-slate-800 transition duration-300"
              >
                <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-5 border border-indigo-500/15">
                  <feat.icon className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{feat.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 py-8 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-indigo-500" />
            <span>&copy; {new Date().getFullYear()} VibeGuard Monorepo. All rights reserved.</span>
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0 font-medium">
            <span>Next.js 15</span>
            <span>&bull;</span>
            <span>NestJS 10</span>
            <span>&bull;</span>
            <span>Spring Boot 3</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

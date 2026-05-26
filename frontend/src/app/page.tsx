import React from "react";
import { 
  Shield, 
  FileCode, 
  Terminal, 
  Activity, 
  Layers, 
  Cpu, 
  GitBranch, 
  Sparkles, 
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  BookOpen,
  ArrowRight
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                VibeGuard
              </span>
              <span className="ml-1.5 px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full uppercase tracking-wider">
                Phase 0
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-xs bg-slate-900 border border-slate-800 rounded-full px-3.5 py-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400 font-medium">Gateway: 3000</span>
            </div>
            <a 
              href="#setup" 
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 flex items-center space-x-1.5"
            >
              <span>Setup Guide</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 border-b border-slate-900/60 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="text-xs font-semibold text-indigo-300">AI-Agent Workflows Optimized</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            The Context &amp; Security Layer for{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI-Assisted Engineering
            </span>
          </h1>
          
          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Manage your agent context rules, auto-generate strict <code className="text-indigo-400">CLAUDE.md</code> files, and perform AST-based security analysis on AI-generated code.
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-12 sm:mt-16">
            {[
              { label: "Microservices", val: "5 Active", icon: Layers, color: "text-blue-400" },
              { label: "Target Port", val: "4000 (UI)", icon: Activity, color: "text-emerald-400" },
              { label: "Token Savings", val: "Up to 90%", icon: Cpu, color: "text-purple-400" },
              { label: "Build Tools", val: "pnpm + Maven", icon: Terminal, color: "text-amber-400" },
            ].map((stat, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition duration-300">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent transform -translate-x-full group-hover:translate-x-full transition duration-1000" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="text-xl font-bold text-white mt-1">{stat.val}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Scaffolding Status */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full" id="setup">
        <h2 className="text-2xl font-bold mb-8 flex items-center space-x-2">
          <Layers className="h-5 w-5 text-indigo-400" />
          <span>Microservices Infrastructure (Phase 0)</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Service Cards */}
          {[
            { 
              name: "api-gateway", 
              port: 3000, 
              tech: "NestJS / Redis / TypeORM", 
              status: "Scaffolded", 
              desc: "Authentication proxy, rate limiter, and central routing node." 
            },
            { 
              name: "context-service", 
              port: 3001, 
              tech: "NestJS / PostgreSQL", 
              status: "Scaffolded", 
              desc: "Manages and versions rules files (CLAUDE.md, .cursorrules)." 
            },
            { 
              name: "security-scanner", 
              port: 8080, 
              tech: "Java Spring Boot / Kafka", 
              status: "Scaffolded", 
              desc: "Runs multi-rule regex security analysis on submitted code blocks." 
            },
            { 
              name: "analytics-service", 
              port: 3002, 
              tech: "NestJS / TimescaleDB", 
              status: "Scaffolded", 
              desc: "Ingests Kafka events to trace usage trends and star rates." 
            },
            { 
              name: "notification-service", 
              port: 3003, 
              tech: "NestJS / PostgreSQL", 
              status: "Scaffolded", 
              desc: "Listens for critical scans and triggers email/Slack alerts." 
            },
            { 
              name: "frontend-dashboard", 
              port: 4000, 
              tech: "Next.js 15 / Zustand / Query", 
              status: "Active", 
              desc: "Dynamic layout showcasing real-time scan charts and templates." 
            }
          ].map((service, idx) => (
            <div key={idx} className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between hover:bg-slate-900/50 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-slate-200">{service.name}</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                    {service.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono mb-2">Port: {service.port} | {service.tech}</div>
                <p className="text-sm text-slate-400 leading-relaxed mt-2">{service.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center text-xs">
                <span className="text-slate-500">Health Endpoint:</span>
                <span className="font-mono text-indigo-400 bg-indigo-950/40 px-2 py-1 rounded">/health</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Agent Support features */}
      <section className="py-12 bg-slate-900/20 border-t border-slate-900 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-gradient-to-b from-indigo-950/20 to-purple-950/20 border border-indigo-500/10 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[80px]" />
          
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            Built-in AI Agent Workflow Optimization
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-3xl mb-8 leading-relaxed">
            We integrated configurations, rules, and scripts from five agentic support platforms. AI agents (like Claude Code, Cursor, and Antigravity) running in this workspace will automatically consume these structures to minimize exploration, decrease token consumption, and execute tasks with surgical precision.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { 
                title: "Andrej Karpathy Behavioral Rules", 
                repo: "andrej-karpathy-skills",
                desc: "Integrated inside CLAUDE.md. Guides agents to state assumptions, write code concisely, and run testing loops before completion." 
              },
              { 
                title: "Antigravity Workspace Skills", 
                repo: "antigravity-awesome-skills",
                desc: "Playbooks placed in .agent/skills/ detailing bootstrap procedures, docker actions, and health testing guidelines." 
              },
              { 
                title: "Claude-Mem Session Logs", 
                repo: "claude-mem",
                desc: "Saves context in .agent/memory/decisions.md (Architectural Decisions) and session-log.jsonl to prevent agent context loss." 
              },
              { 
                title: "RTK Command Token Killer", 
                repo: "rtk",
                desc: "Provides scripts/rtk-compress.sh. Intercepts command line responses, stripping whitespace, comments, and logs to cut token usage by 60-90%." 
              }
            ].map((tool, idx) => (
              <div key={idx} className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl hover:border-slate-700 transition">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-200 text-sm flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>{tool.title}</span>
                  </h3>
                  <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900/60 font-mono">
                    {tool.repo}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900/80 py-8 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-indigo-500" />
            <span>&copy; {new Date().getFullYear()} VibeGuard Monorepo. All rights reserved.</span>
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0 font-medium">
            <span className="hover:text-slate-400 transition">NestJS 10</span>
            <span>&bull;</span>
            <span className="hover:text-slate-400 transition">Spring Boot 3</span>
            <span>&bull;</span>
            <span className="hover:text-slate-400 transition">Next.js 15</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

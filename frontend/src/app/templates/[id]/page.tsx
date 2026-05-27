'use client';

import React, { use } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { ArrowLeft, BookOpen, Layers, Calendar, User, Code, FileText } from 'lucide-react';

interface Params {
  id: string;
}

export default function TemplateDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = use(params);

  // Fetch template detail
  const { data: template, isLoading } = useQuery({
    queryKey: ['templateDetail', id],
    queryFn: async () => {
      const response = await api.get(`/context/templates/${id}`);
      return response.data?.data;
    },
  });

  // Fetch versions
  const { data: versions = [] } = useQuery({
    queryKey: ['templateVersions', id],
    queryFn: async () => {
      const response = await api.get(`/context/templates/${id}/versions`);
      return response.data?.data || [];
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        
        {/* Back navigation */}
        <Link 
          href="/templates" 
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-white transition text-xs font-bold mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Browser</span>
        </Link>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Loading template details...</p>
          </div>
        ) : !template ? (
          <div className="text-center py-20 bg-slate-900/10 border border-slate-800 rounded-3xl">
            <h3 className="text-lg font-bold text-slate-400">Template Not Found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Column: Template Information */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl backdrop-blur-sm">
                <span className="px-2.5 py-0.5 text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full uppercase tracking-wider">
                  {template.projectType.replace('_', ' ')}
                </span>
                
                <h2 className="text-xl font-bold text-white mt-4 leading-snug">{template.name}</h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{template.description}</p>
                
                <div className="mt-6 pt-6 border-t border-slate-800/40 space-y-4 text-xs text-slate-400">
                  <div className="flex items-center space-x-2.5">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span>Starred: {template.starCount} times</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Version History List */}
              <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl backdrop-blur-sm">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  <span>Version History</span>
                </h3>
                
                <div className="space-y-3.5">
                  {versions.map((ver: any) => (
                    <div key={ver.id} className="border-l-2 border-slate-800 hover:border-indigo-500 pl-4 py-1 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">v{ver.version}</span>
                        <span className="text-[9px] text-slate-500">{new Date(ver.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 italic">{ver.changelog}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Markdown guidelines view */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-slate-900/30 border border-slate-850 p-8 rounded-3xl backdrop-blur-sm relative">
                <div className="absolute top-6 right-6 text-xs text-slate-500 flex items-center space-x-1">
                  <Code className="h-3.5 w-3.5" />
                  <span>markdown format</span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-850 pb-4 flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  <span>CLAUDE.md guidelines</span>
                </h3>
                
                {/* Preformatted text with line numbers / code layout */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 overflow-auto max-h-[600px]">
                  <pre className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                    {template.content}
                  </pre>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

// Custom star icon import fix
import { Star } from 'lucide-react';

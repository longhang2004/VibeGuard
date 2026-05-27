'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { Star, StarOff, Layers, ExternalLink, Search, Cpu, ArrowRight } from 'lucide-react';

export default function TemplatesBrowserPage() {
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Query templates list
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['publicTemplates', filterType],
    queryFn: async () => {
      const url = filterType === 'ALL' 
        ? '/context/templates' 
        : `/context/templates?projectType=${filterType}`;
      
      const response = await api.get(url);
      return response.data?.data || [];
    },
  });

  // Starring Mutation
  const starMutation = useMutation({
    mutationFn: async ({ id, isStarred }: { id: string; isStarred: boolean }) => {
      if (isStarred) {
        return api.delete(`/context/templates/${id}/star`);
      } else {
        return api.post(`/context/templates/${id}/star`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicTemplates'] });
    },
  });

  const projectTypes = [
    { key: 'ALL', label: 'All Frameworks' },
    { key: 'NESTJS_MONOLITH', label: 'NestJS Monolith' },
    { key: 'JAVA_SPRING', label: 'Java Spring' },
    { key: 'NEXTJS_FRONTEND', label: 'Next.js Frontend' },
    { key: 'FULLSTACK', label: 'Fullstack' },
    { key: 'MICROSERVICES', label: 'Microservices' },
    { key: 'OTHER', label: 'Other' },
  ];

  // Client-side filtering by name/desc search term
  const filteredTemplates = templates.filter((t: any) => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Context Templates
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Browse public guidelines to boot up your AI agents with structured code standards
            </p>
          </div>
          
          <div className="relative mt-4 md:mt-0 max-w-xs w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 transition text-sm outline-none placeholder:text-slate-650"
            />
          </div>
        </div>

        {/* Framework Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-900 pb-6">
          {projectTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => setFilterType(type.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                filterType === type.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-850'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Loading templates browser...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/10 border border-dashed border-slate-800/80 rounded-3xl">
            <Layers className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-400">No Templates Found</h3>
            <p className="text-slate-500 text-xs mt-1.5">Create your first custom context standard to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredTemplates.map((template: any) => {
              // Simple heuristic to check if starred (we don't have user's star relationship list easily, 
              // but we can mock or check local storage stars, or let starCount toggle).
              const isStarred = false; // Toggle placeholder

              return (
                <div 
                  key={template.id} 
                  className="bg-slate-900/30 border border-slate-850/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between hover:bg-slate-900/50 transition duration-300 relative group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2.5 py-0.5 text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full uppercase tracking-wider">
                        {template.projectType.replace('_', ' ')}
                      </span>
                      
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                        <span>{template.starCount}</span>
                        <button
                          onClick={() => {
                            if (!accessToken) {
                              alert('Please log in to star templates!');
                              return;
                            }
                            starMutation.mutate({ id: template.id, isStarred });
                          }}
                          className="hover:scale-110 active:scale-95 transition"
                        >
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">{template.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">{template.description}</p>
                    
                    {/* Tech stack pills */}
                    <div className="flex flex-wrap gap-1 mb-6">
                      {template.techStack?.slice(0, 4).map((tech: string) => (
                        <span key={tech} className="px-2 py-0.5 text-[10px] font-medium bg-slate-950 border border-slate-850 rounded text-slate-400">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/templates/${template.id}`}
                    className="mt-4 pt-4 border-t border-slate-800/40 flex items-center justify-between text-xs font-bold text-indigo-400 hover:text-indigo-300 group-hover:translate-x-0.5 transition"
                  >
                    <span>View guidelines</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}

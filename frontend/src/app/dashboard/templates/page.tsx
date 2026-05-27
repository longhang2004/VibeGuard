'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useAuthStore } from '../../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { Layers, Star, Plus, Trash2, ArrowLeft, ArrowRight, Save, Eye, FileText, Check } from 'lucide-react';

export default function MyTemplatesPage() {
  const { accessToken, user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Wizard States
  const [inWizard, setInWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('NESTJS_MONOLITH');
  const [techStackInput, setTechStackInput] = useState('');
  const [conventionsInput, setConventionsInput] = useState('');
  const [generatedMarkdown, setGeneratedMarkdown] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      router.push('/login');
    }
  }, [accessToken, router]);

  // Query templates list (with headers: we automatically pass X-User-Id proxied from gateway token)
  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ['myTemplates', user?.id],
    queryFn: async () => {
      // Find all templates (findAll returns items with isOwner derived check)
      const response = await api.get('/context/templates');
      const items = response.data?.data || [];
      // Filter templates where isOwner is true
      return items.filter((item: any) => item.isOwner);
    },
    enabled: !!accessToken,
  });

  // Soft Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/context/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTemplates'] });
    },
  });

  // Generate Template Mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const techStack = techStackInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
      const response = await api.post('/context/templates/generate', {
        projectName,
        projectType,
        techStack,
        conventions: conventionsInput ? conventionsInput : undefined,
      });
      return response.data?.data?.content || '';
    },
    onSuccess: (data) => {
      setGeneratedMarkdown(data);
      setWizardStep(3); // Go to Preview & Save step
    },
  });

  const handleSaveTemplate = async () => {
    if (!generatedMarkdown) return;
    setSaveLoading(true);
    try {
      const techStack = techStackInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
      const response = await api.post('/context/templates', {
        name: `${projectName} CLAUDE.md`,
        description: `Context standard guidelines for project ${projectName}`,
        techStack,
        projectType,
        content: generatedMarkdown,
        isPublic,
      });

      if (response.data?.success) {
        queryClient.invalidateQueries({ queryKey: ['myTemplates'] });
        resetWizard();
      }
    } catch (e) {
      alert('Failed to save template');
    } finally {
      setSaveLoading(false);
    }
  };

  const resetWizard = () => {
    setInWizard(false);
    setWizardStep(1);
    setProjectName('');
    setProjectType('NESTJS_MONOLITH');
    setTechStackInput('');
    setConventionsInput('');
    setGeneratedMarkdown('');
  };

  if (!accessToken) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        
        {inWizard ? (
          /* ==============================================================================
             WIZARD CREATE FLOW
             ============================================================================== */
          <div className="max-w-4xl mx-auto">
            
            {/* Wizard Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-900">
              <button 
                onClick={resetWizard}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Cancel Wizard</span>
              </button>
              
              <div className="flex items-center space-x-6 text-xs font-bold text-slate-500">
                <span className={wizardStep === 1 ? 'text-indigo-400' : ''}>1. Project Config</span>
                <span>&rarr;</span>
                <span className={wizardStep === 2 ? 'text-indigo-400' : ''}>2. Conventions</span>
                <span>&rarr;</span>
                <span className={wizardStep === 3 ? 'text-indigo-400' : ''}>3. Preview &amp; Save</span>
              </div>
            </div>

            {/* Step 1: Project Details */}
            {wizardStep === 1 && (
              <div className="bg-slate-900/30 border border-slate-850 p-8 rounded-3xl backdrop-blur-sm space-y-6">
                <h3 className="text-lg font-bold text-white mb-2">Step 1: Project Setup</h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. VibeGuard"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl outline-none focus:border-indigo-500 transition text-sm text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Framework Style</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl outline-none focus:border-indigo-500 transition text-sm text-slate-450"
                  >
                    <option value="NESTJS_MONOLITH">NestJS Monolith</option>
                    <option value="JAVA_SPRING">Java Spring Boot</option>
                    <option value="NEXTJS_FRONTEND">Next.js Frontend</option>
                    <option value="FULLSTACK">Fullstack Monorepo</option>
                    <option value="MICROSERVICES">Microservices Cluster</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tech Stack (comma-separated)</label>
                  <input
                    type="text"
                    value={techStackInput}
                    onChange={(e) => setTechStackInput(e.target.value)}
                    placeholder="e.g. NestJS, PostgreSQL, Redis, Kafka"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl outline-none focus:border-indigo-500 transition text-sm text-slate-200"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    disabled={!projectName || !techStackInput}
                    onClick={() => setWizardStep(2)}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 active:scale-95 text-white text-xs font-bold px-6 py-3 rounded-xl transition flex items-center space-x-1.5"
                  >
                    <span>Next step</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Conventions */}
            {wizardStep === 2 && (
              <div className="bg-slate-900/30 border border-slate-850 p-8 rounded-3xl backdrop-blur-sm space-y-6">
                <h3 className="text-lg font-bold text-white mb-2">Step 2: Add Custom Coding Conventions</h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Conventions Rules (markdown or plain text)
                  </label>
                  <textarea
                    rows={8}
                    value={conventionsInput}
                    onChange={(e) => setConventionsInput(e.target.value)}
                    placeholder="e.g.&#10;- Always write interface names in PascalCase.&#10;- Columns must be defined in snake_case.&#10;- Keep functions under 40 lines."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl outline-none focus:border-indigo-500 transition text-xs text-slate-250 font-mono"
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="bg-slate-905 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold px-6 py-3 rounded-xl transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold px-6 py-3 rounded-xl transition flex items-center space-x-1.5"
                  >
                    {generateMutation.isPending ? 'Generating...' : 'Generate guidelines'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Preview & Save */}
            {wizardStep === 3 && (
              <div className="bg-slate-900/30 border border-slate-850 p-8 rounded-3xl backdrop-blur-sm space-y-6">
                <h3 className="text-lg font-bold text-white mb-2">Step 3: Preview &amp; Save</h3>
                
                <div className="flex items-center space-x-6 text-xs text-slate-400">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="rounded border-slate-850 text-indigo-650 bg-slate-950 focus:ring-0"
                    />
                    <span>Publish template publicly to library</span>
                  </label>
                </div>

                {/* Markdown box */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 overflow-auto max-h-[350px]">
                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{generatedMarkdown}</pre>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="bg-slate-905 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold px-6 py-3 rounded-xl transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={saveLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold px-6 py-3 rounded-xl transition flex items-center space-x-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saveLoading ? 'Saving...' : 'Save Template'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* ==============================================================================
             TEMPLATES LIST
             ============================================================================== */
          <div>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  My Templates
                </h1>
                <p className="text-slate-400 text-sm mt-1.5">
                  Manage and edit context templates that define guidelines for your project folders
                </p>
              </div>

              <button
                onClick={() => setInWizard(true)}
                className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 flex items-center space-x-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Create Template</span>
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-sm">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/10 border border-dashed border-slate-850 rounded-3xl">
                <Layers className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-400">No Custom Templates</h3>
                <p className="text-slate-500 text-xs mt-1.5">Click "Create Template" to boot the generator wizard.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates.map((template: any) => (
                  <div 
                    key={template.id} 
                    className="bg-slate-900/30 border border-slate-850 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between hover:bg-slate-900/50 transition duration-300 relative group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2.5 py-0.5 text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full uppercase tracking-wider">
                          {template.projectType.replace('_', ' ')}
                        </span>
                        
                        <button
                          onClick={() => deleteMutation.mutate(template.id)}
                          className="text-slate-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition"
                          title="Delete template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2 leading-snug">{template.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">{template.description}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/40 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Public: {template.isPublic ? 'Yes' : 'No'}</span>
                      <Link
                        href={`/templates/${template.id}`}
                        className="font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View guidelines</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

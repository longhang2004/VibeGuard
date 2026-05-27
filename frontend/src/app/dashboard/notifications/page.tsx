'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useAuthStore } from '../../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { 
  Bell, 
  Check, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Trash2, 
  Clock, 
  ExternalLink,
  ShieldAlert,
  Inbox,
  Sparkles
} from 'lucide-react';

export default function NotificationsPage() {
  const { accessToken, user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) {
      router.push('/login');
    }
  }, [accessToken, router]);

  // Query unread notifications
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data?.data || [];
    },
    enabled: !!accessToken,
  });

  // Mutation to mark a single notification as read
  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Mutation to mark all notifications as read
  const readAllMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch('/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  if (!accessToken) return null;

  // Helper to get styling based on notification type
  const getTypeConfig = (type: string) => {
    switch (type.toUpperCase()) {
      case 'ALERT':
        return {
          icon: ShieldAlert,
          bgClass: 'bg-red-500/10 border-red-500/20 text-red-400',
          badgeText: 'Critical Alert',
          ringColor: 'ring-red-500/30',
        };
      case 'WARNING':
        return {
          icon: AlertTriangle,
          bgClass: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-455',
          badgeText: 'Warning',
          ringColor: 'ring-yellow-500/30',
        };
      case 'INFO':
      default:
        return {
          icon: Info,
          bgClass: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
          badgeText: 'Info',
          ringColor: 'ring-indigo-500/30',
        };
    }
  };

  // Helper to extract scan UUID or template UUID if they exist in the message
  const getActionLink = (notification: any) => {
    // Try to extract a UUID which is usually 36 chars
    const uuidMatch = notification.message.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
    if (!uuidMatch) return null;
    
    const uuid = uuidMatch[0];
    const msgLower = notification.message.toLowerCase();
    
    if (msgLower.includes('scan')) {
      return {
        label: 'View Scan Report',
        href: `/dashboard/scanner?scanId=${uuid}`,
      };
    } else if (msgLower.includes('template')) {
      return {
        label: 'View Template',
        href: `/templates/${uuid}`,
      };
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10 pb-6 border-b border-slate-900">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Security Alerts Feed
            </h1>
            <p className="text-slate-400 text-sm mt-1.5">
              Review and manage critical codebase alerts and starred template events
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {notifications.length > 0 && (
              <button
                onClick={() => readAllMutation.mutate()}
                disabled={readAllMutation.isPending}
                className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 hover:border-indigo-500/30 px-4 py-2.5 rounded-xl transition duration-200 active:scale-95 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-slate-900/10 border border-slate-900 rounded-3xl">
            <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Loading security feed...</p>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-850 rounded-3xl backdrop-blur-sm max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 inline-flex mb-6 relative">
              <Inbox className="h-10 w-10 text-slate-500" />
              <div className="absolute -top-1 -right-1 bg-emerald-500 w-3 h-3 rounded-full border border-slate-900 animate-ping" />
              <div className="absolute -top-1 -right-1 bg-emerald-500 w-3 h-3 rounded-full border border-slate-900" />
            </div>

            <h3 className="text-lg font-bold text-slate-350">Alert Feed Empty</h3>
            <p className="text-slate-500 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
              No new critical vulnerabilities or starred notifications to show. Keep scanning your code to protect your workspace!
            </p>
          </div>
        ) : (
          /* Notifications List */
          <div className="space-y-4">
            {notifications.map((notif: any) => {
              const config = getTypeConfig(notif.type);
              const IconComponent = config.icon;
              const action = getActionLink(notif);

              return (
                <div 
                  key={notif.id}
                  className="bg-slate-900/30 border border-slate-850 hover:border-slate-800 p-5 rounded-2xl backdrop-blur-sm transition duration-300 flex items-start justify-between gap-4 group"
                >
                  <div className="flex items-start space-x-4">
                    {/* Icon Column */}
                    <div className={`p-3 rounded-xl border shrink-0 ${config.bgClass}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>

                    {/* Content Column */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {notif.title}
                        </h4>
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full border uppercase tracking-wider ${config.bgClass}`}>
                          {config.badgeText}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                        {notif.message}
                      </p>

                      <div className="flex items-center space-x-4 pt-1.5 text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(notif.createdAt).toLocaleString()}</span>
                        </span>
                        
                        {action && (
                          <Link 
                            href={action.href}
                            className="flex items-center space-x-0.5 text-indigo-400 hover:text-indigo-300 font-bold transition"
                          >
                            <span>{action.label}</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action: Mark Read Button */}
                  <button
                    onClick={() => readMutation.mutate(notif.id)}
                    disabled={readMutation.isPending}
                    className="p-2 text-slate-500 hover:text-white bg-slate-950/60 border border-slate-850 hover:border-slate-700 rounded-xl transition duration-200 shrink-0 self-center opacity-70 group-hover:opacity-100"
                    title="Mark as Read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}

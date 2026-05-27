'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { Shield, Bell, LogOut, LogIn, User, LayoutDashboard, FileCode, Star, BarChart3, Inbox } from 'lucide-react';

export default function Navbar() {
  const { user, accessToken, clearAuth } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const [prevNotifCount, setPrevNotifCount] = useState<number | null>(null);

  const isAuthenticated = !!accessToken;

  // Poll for unread notifications every 30 seconds
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data?.data || [];
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // 30s polling
  });

  const unreadCount = notificationsData?.length || 0;

  // Handle real-time Toast alerts for new critical scan findings
  useEffect(() => {
    if (notificationsData && prevNotifCount !== null && notificationsData.length > prevNotifCount) {
      // Find the new notification
      const newNotif = notificationsData[0];
      if (newNotif && (newNotif.type === 'ALERT' || newNotif.type === 'WARNING')) {
        setToast({ title: newNotif.title, message: newNotif.message });
        setTimeout(() => setToast(null), 60000); // Auto-hide after 6s
      }
    }
    if (notificationsData) {
      setPrevNotifCount(notificationsData.length);
    }
  }, [notificationsData, prevNotifCount]);

  const handleLogout = async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (e) {
      // Ignore logout errors
    } finally {
      clearAuth();
      router.push('/');
    }
  };

  const navLinks = [
    { href: '/templates', label: 'Templates', icon: Star },
    ...(isAuthenticated
      ? [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/dashboard/scanner', label: 'Scanner', icon: FileCode },
          { href: '/dashboard/templates', label: 'My Templates', icon: Star },
          { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
        ]
      : []),
  ];

  return (
    <>
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                VibeGuard
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User controls / Auth */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications Bell */}
                <Link
                  href="/dashboard/notifications"
                  className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800/40 rounded-lg transition"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-slate-900">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown / Info */}
                <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                  <User className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-medium max-w-[120px] truncate">{user?.email}</span>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-slate-300 hover:text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center space-x-1"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/register"
                  className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-md shadow-indigo-600/10"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Real-time Toast banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 border border-red-500/30 rounded-2xl p-4 shadow-2xl shadow-red-950/20 animate-bounce">
          <div className="flex items-start space-x-3">
            <div className="bg-red-500/10 p-2 rounded-lg border border-red-500/20 text-red-400">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white">{toast.title}</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-500 hover:text-slate-300 text-xs font-bold"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/api';
import { Shield, ArrowLeft, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', { email, password });
      const result = response.data;

      if (result.success && result.data) {
        setAuth(
          result.data.user,
          result.data.accessToken,
          result.data.refreshToken
        );
        router.push('/dashboard');
      } else {
        setError(result.error?.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 
        err.response?.data?.message || 
        'Registration failed. Email might already be registered.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans px-4 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Back button */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center space-x-2 text-slate-400 hover:text-white transition text-sm font-semibold"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-md relative z-10">
        
        {/* Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-purple-500 to-indigo-600 p-3 rounded-2xl shadow-xl shadow-purple-500/15 mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="text-slate-500 text-xs mt-1.5">
            Register to join the VibeGuard context engine
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs leading-relaxed">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@vibeguard.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm outline-none text-slate-100 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm outline-none text-slate-100 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type password"
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm outline-none text-slate-100 placeholder:text-slate-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-purple-600 hover:bg-purple-500 active:scale-[0.98] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm shadow-lg shadow-purple-600/10 hover:shadow-purple-500/20"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500 border-t border-slate-800/60 pt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

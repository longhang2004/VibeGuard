'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[VibeGuard Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center backdrop-blur-sm">
        <div className="h-12 w-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="h-6 w-6 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/10"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}

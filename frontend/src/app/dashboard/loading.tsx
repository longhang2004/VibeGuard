export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="h-10 w-10 border-4 border-indigo-500/30 rounded-full" />
          <div className="absolute inset-0 h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-slate-400 text-sm font-semibold">Loading Dashboard…</p>
      </div>
    </div>
  );
}

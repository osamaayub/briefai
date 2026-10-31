export function UsageCard({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="card">
      <p className="text-sm text-slate-400">Used today</p>
      <p className="mt-1 text-2xl font-bold">{used} / {limit}</p>
      <div className="mt-3 h-2 rounded-full bg-line" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit} aria-label="Free briefs used today">
        <div className="h-2 rounded-full bg-gradient-to-r from-brand to-brand-2" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

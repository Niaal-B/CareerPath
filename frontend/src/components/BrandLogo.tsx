export function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-white/80 p-3 shadow-lg shadow-brand/20">
        <span className="font-display text-xl font-semibold text-brand">CR</span>
      </div>
      <div>
        <p className="font-display text-lg font-semibold text-ink">Career Recommendation</p>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Guidance Studio</p>
      </div>
    </div>
  )
}

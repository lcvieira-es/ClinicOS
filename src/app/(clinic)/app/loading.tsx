export default function ClinicLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="h-7 w-52 rounded bg-slate-200" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 rounded-card border border-line bg-white shadow-card"
          />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="h-80 rounded-card border border-line bg-white shadow-card" />
        <div className="h-80 rounded-card border border-line bg-white shadow-card" />
      </div>
    </div>
  );
}

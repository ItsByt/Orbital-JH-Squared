const LEGEND_ITEMS = [
  { label: "Chosen Path", colorClass: "bg-[#E8A753]", borderClass: "border-[#cf9043]" },
  { label: "Unbranched Options", colorClass: "bg-[#719E8E]", borderClass: "border-[#5d8275]" },
] as const;

export const Legend = () => (
  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium font-sans text-muted-foreground">
    <span className="text-foreground font-bold tracking-wider text-sm normal-case mr-1">
      Legend:
    </span>
    {LEGEND_ITEMS.map(({ label, colorClass, borderClass }) => (
      <div key={label} className="flex items-center gap-2">
        <div className={`w-3.5 h-3.5 ${colorClass} ${borderClass} border rounded-sm shadow-xs`} />
        <span>{label}</span>
      </div>
    ))}
  </div>
);
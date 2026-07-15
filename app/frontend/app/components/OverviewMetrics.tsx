import type { ReactNode } from "react";
import type { OverviewMetric } from "@/lib/types";

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="max-w-6xl mx-auto px-6 py-14">
      <p className="font-mono-num text-xs tracking-[0.2em] text-[var(--accent)] uppercase mb-2">
        {eyebrow}
      </p>
      <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">
        {title}
      </h2>
      {description && (
        <p className="text-[var(--muted)] max-w-2xl mb-8 leading-relaxed">
          {description}
        </p>
      )}
      {!description && <div className="mb-8" />}
      {children}
    </section>
  );
}

export default function OverviewMetrics({
  metrics,
}: {
  metrics: OverviewMetric[];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div key={m.label} className="panel px-5 py-4">
          <div className="font-mono-num text-2xl font-semibold text-[var(--ink)]">
            {m.value}
          </div>
          <div className="text-sm text-[var(--ink)] mt-1">{m.label}</div>
          <div className="text-xs text-[var(--muted)]">{m.sub}</div>
        </div>
      ))}
    </div>
  );
}

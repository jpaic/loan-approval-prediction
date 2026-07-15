import type { ClassBalanceItem, ModelComparisonRow } from "@/lib/types";

function Donut({ approvedPct }: { approvedPct: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const approved = Math.max(0, Math.min(1, approvedPct));
  const dash = c * approved;

  return (
    <svg viewBox="0 0 120 120" className="w-24 h-24">
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="var(--reject-soft)"
        strokeWidth="12"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="var(--approve)"
        strokeWidth="12"
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="65"
        textAnchor="middle"
        className="font-mono-num"
        fill="var(--ink)"
        fontSize="20"
        fontWeight={600}
      >
        {(approved * 100).toFixed(0)}%
      </text>
    </svg>
  );
}

export default function Hero({
  classBalance,
  bestModel,
  repository,
}: {
  classBalance: ClassBalanceItem[];
  bestModel: ModelComparisonRow | undefined;
  repository: string;
}) {
  const approved = classBalance.find((c) => c.label === "Approved");

  return (
    <header className="relative overflow-hidden dot-grid border-b border-[var(--panel-border)]">
      <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
        <div className="max-w-2xl">
          <p className="font-mono-num text-xs tracking-[0.2em] text-[var(--accent)] uppercase mb-4">
            Binary Classification · Credit Risk
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">
            Loan Approval Prediction
          </h1>
          <p className="text-[var(--muted)] text-base md:text-lg leading-relaxed">
            Logistic Regression, Random Forest, and XGBoost trained on 5,000
            loan applications to predict approval from financial,
            demographic, and professional features.
          </p>
          <div className="flex gap-3 mt-6">
            <a
              href={repository}
              className="px-4 py-2 rounded-lg border border-[var(--panel-border)] text-sm font-medium hover:border-[var(--accent)] transition-colors"
            >
              View source
            </a>
            <a
              href="#model"
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[#04101f] text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Jump to results
            </a>
          </div>
        </div>

        <div className="panel px-6 py-5 flex items-center gap-6 shrink-0">
          <Donut approvedPct={approved?.pct ?? 0} />
          <div className="flex flex-col gap-2 font-mono-num">
            <div>
              <div className="text-xs text-[var(--muted)]">Best model</div>
              <div className="text-base">{bestModel?.model ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--muted)]">F1-score</div>
              <div className="text-lg">
                {bestModel ? bestModel.f1.toFixed(3) : "-"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

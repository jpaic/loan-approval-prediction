import type {
  ApprovalRateItem,
  BoxplotGroup,
  CorrelationMatrix,
  NumericByClass,
} from "@/lib/types";
import { EmptyState } from "./DataTables";

const W = 300;
const H = 220;
const PAD = { top: 12, right: 12, bottom: 26, left: 12 };

export function BoxplotByClassChart({ feature, groups }: NumericByClass) {
  if (groups.length === 0) {
    return (
      <EmptyState label={`${feature} distribution will appear once dashboard-data.json is generated.`} />
    );
  }

  const allValues = groups.flatMap((g) => [g.min, g.max]);
  const yMin = Math.min(...allValues);
  const yMax = Math.max(...allValues);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const groupW = innerW / groups.length;
  const sy = (y: number) =>
    PAD.top + innerH - ((y - yMin) / (yMax - yMin || 1)) * innerH;

  const colorFor = (label: string) =>
    label === "Approved" ? "var(--approve)" : "var(--reject)";
  const softFor = (label: string) =>
    label === "Approved" ? "var(--approve-soft)" : "var(--reject-soft)";

  return (
    <div className="panel px-4 py-4">
      <div className="text-sm text-[var(--ink)] mb-2 font-medium">{feature}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {groups.map((g: BoxplotGroup, i) => {
          const cx = PAD.left + groupW * i + groupW / 2;
          const boxW = Math.min(groupW * 0.45, 40);
          return (
            <g key={g.label}>
              <line
                x1={cx}
                x2={cx}
                y1={sy(g.min)}
                y2={sy(g.max)}
                stroke="var(--muted)"
              />
              <rect
                x={cx - boxW / 2}
                y={sy(g.q3)}
                width={boxW}
                height={Math.max(sy(g.q1) - sy(g.q3), 1)}
                fill={softFor(g.label)}
                stroke={colorFor(g.label)}
              />
              <line
                x1={cx - boxW / 2}
                x2={cx + boxW / 2}
                y1={sy(g.median)}
                y2={sy(g.median)}
                stroke={colorFor(g.label)}
                strokeWidth={2}
              />
              <text
                x={cx}
                y={H - 8}
                fontSize="10"
                textAnchor="middle"
                fill="var(--muted)"
              >
                {g.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function CorrelationHeatmap({
  matrix,
  emptyLabel,
}: {
  matrix: CorrelationMatrix;
  emptyLabel: string;
}) {
  if (matrix.columns.length === 0) return <EmptyState label={emptyLabel} />;

  const n = matrix.columns.length;
  const size = 320;
  const cell = size / n;

  const colorFor = (v: number) => {
    const t = (v + 1) / 2;
    const r = Math.round(248 - t * (248 - 52));
    const g = Math.round(113 + t * (211 - 113));
    const b = Math.round(113 + t * (153 - 113));
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div className="panel px-4 py-4 overflow-x-auto">
      <svg
        viewBox={`0 0 ${size + 130} ${size + 40}`}
        className="w-full h-auto"
        style={{ maxWidth: 480 }}
      >
        {matrix.values.map((row, i) =>
          row.map((v, j) => (
            <rect
              key={`${i}-${j}`}
              x={110 + j * cell}
              y={i * cell}
              width={cell}
              height={cell}
              fill={colorFor(v)}
            />
          ))
        )}
        {matrix.columns.map((c, i) => (
          <text
            key={`row-${c}`}
            x={106}
            y={i * cell + cell / 2 + 4}
            fontSize="10"
            textAnchor="end"
            fill="var(--muted)"
          >
            {c}
          </text>
        ))}
        {matrix.columns.map((c, j) => (
          <text
            key={`col-${c}`}
            x={110 + j * cell + cell / 2}
            y={size + 16}
            fontSize="10"
            textAnchor="middle"
            fill="var(--muted)"
          >
            {c}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function ApprovalRateBarChart({
  items,
  title,
}: {
  items: ApprovalRateItem[];
  title: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState label={`Approval rate by ${title} will appear once dashboard-data.json is generated.`} />
    );
  }

  const rowH = 28;
  const chartW = 460;
  const chartH = items.length * rowH + 12;
  const max = Math.max(...items.map((i) => i.rate), 0.01);

  return (
    <div className="panel px-4 py-4">
      <div className="text-sm text-[var(--ink)] mb-2 font-medium">{title}</div>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto">
        {items.map((it, i) => {
          const barW = (it.rate / max) * (chartW - 170);
          return (
            <g key={it.category} transform={`translate(0, ${i * rowH + 6})`}>
              <text x={0} y={14} fontSize="11" fill="var(--ink)">
                {it.category}
              </text>
              <rect
                x={130}
                y={2}
                width={Math.max(barW, 1)}
                height={16}
                fill="var(--accent)"
                opacity={0.85}
                rx={3}
              />
              <text
                x={130 + barW + 6}
                y={14}
                fontSize="10"
                fill="var(--muted)"
                className="font-mono-num"
              >
                {(it.rate * 100).toFixed(1)}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

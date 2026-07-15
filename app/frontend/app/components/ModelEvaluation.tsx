import type {
  ConfusionMatrixData,
  FeatureImportance,
  ModelComparisonRow,
  RocPoint,
} from "@/lib/types";
import { EmptyState } from "./DataTables";

const W = 640;
const H = 300;
const PAD = { top: 16, right: 16, bottom: 32, left: 40 };
const MODEL_COLORS = ["var(--accent)", "var(--approve)", "var(--reject)"];

export function ModelComparisonChart({ rows }: { rows: ModelComparisonRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState label="Model comparison will appear once dashboard-data.json is generated." />
    );
  }

  const metrics: { key: keyof ModelComparisonRow; label: string }[] = [
    { key: "accuracy", label: "Accuracy" },
    { key: "precision", label: "Precision" },
    { key: "recall", label: "Recall" },
    { key: "f1", label: "F1" },
    { key: "rocAuc", label: "ROC-AUC" },
  ];

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const groupW = innerW / metrics.length;

  return (
    <div className="panel px-4 py-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + innerH * (1 - f)}
            y2={PAD.top + innerH * (1 - f)}
            stroke="var(--panel-border)"
            strokeDasharray="3 3"
          />
        ))}
        {metrics.map((m, mi) => {
          const barW = (groupW * 0.7) / rows.length;
          return (
            <g key={m.key}>
              {rows.map((row, ri) => {
                const value = row[m.key] as number;
                const barH = value * innerH;
                const x =
                  PAD.left +
                  groupW * mi +
                  groupW * 0.15 +
                  ri * barW;
                return (
                  <rect
                    key={row.model}
                    x={x}
                    y={PAD.top + innerH - barH}
                    width={barW - 2}
                    height={barH}
                    fill={MODEL_COLORS[ri % MODEL_COLORS.length]}
                    opacity={0.9}
                  />
                );
              })}
              <text
                x={PAD.left + groupW * mi + groupW / 2}
                y={H - 8}
                fontSize="10"
                textAnchor="middle"
                fill="var(--muted)"
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 mt-3 flex-wrap">
        {rows.map((row, i) => (
          <div key={row.model} className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span
              className="w-2.5 h-2.5 rounded-sm inline-block"
              style={{ background: MODEL_COLORS[i % MODEL_COLORS.length] }}
            />
            {row.model}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RocCurveChart({
  curves,
}: {
  curves: Record<string, RocPoint[]>;
}) {
  const names = Object.keys(curves);
  if (names.length === 0) {
    return (
      <EmptyState label="ROC curves will appear once dashboard-data.json is generated." />
    );
  }

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const sx = (v: number) => PAD.left + v * innerW;
  const sy = (v: number) => PAD.top + innerH - v * innerH;

  return (
    <div className="panel px-4 py-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <line
          x1={sx(0)}
          y1={sy(0)}
          x2={sx(1)}
          y2={sy(1)}
          stroke="var(--muted)"
          strokeDasharray="4 4"
        />
        {names.map((name, i) => {
          const points = curves[name];
          const path = points
            .map((p, j) => `${j === 0 ? "M" : "L"} ${sx(p.fpr)} ${sy(p.tpr)}`)
            .join(" ");
          return (
            <path
              key={name}
              d={path}
              fill="none"
              stroke={MODEL_COLORS[i % MODEL_COLORS.length]}
              strokeWidth={2}
            />
          );
        })}
        <text x={PAD.left} y={H - 8} fontSize="10" fill="var(--muted)">
          False Positive Rate →
        </text>
      </svg>
      <div className="flex gap-4 mt-3 flex-wrap">
        {names.map((name, i) => (
          <div key={name} className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span
              className="w-2.5 h-2.5 rounded-sm inline-block"
              style={{ background: MODEL_COLORS[i % MODEL_COLORS.length] }}
            />
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConfusionMatrixChart({ data }: { data: ConfusionMatrixData }) {
  const { matrix, labels, model } = data;
  const empty = matrix.flat().every((v) => v === 0);
  if (empty) {
    return (
      <EmptyState label="Confusion matrix will appear once dashboard-data.json is generated." />
    );
  }

  const total = matrix.flat().reduce((a, b) => a + b, 0) || 1;
  const cellSize = 100;

  return (
    <div className="panel px-4 py-4">
      <div className="text-sm text-[var(--muted)] mb-3">Best model: {model}</div>
      <svg viewBox={`0 0 ${cellSize * 2 + 80} ${cellSize * 2 + 60}`} className="w-full max-w-xs mx-auto h-auto">
        {matrix.map((row, i) =>
          row.map((value, j) => {
            const intensity = value / total;
            const isCorrect = i === j;
            const color = isCorrect ? "var(--approve)" : "var(--reject)";
            return (
              <g key={`${i}-${j}`}>
                <rect
                  x={70 + j * cellSize}
                  y={10 + i * cellSize}
                  width={cellSize - 6}
                  height={cellSize - 6}
                  fill={color}
                  opacity={0.15 + intensity * 0.7}
                  rx={8}
                />
                <text
                  x={70 + j * cellSize + (cellSize - 6) / 2}
                  y={10 + i * cellSize + (cellSize - 6) / 2 + 6}
                  textAnchor="middle"
                  fontSize="20"
                  fontWeight={600}
                  fill="var(--ink)"
                  className="font-mono-num"
                >
                  {value}
                </text>
              </g>
            );
          })
        )}
        {labels.map((label, i) => (
          <text
            key={`pred-${label}`}
            x={70 + i * cellSize + (cellSize - 6) / 2}
            y={cellSize * 2 + 20}
            textAnchor="middle"
            fontSize="10"
            fill="var(--muted)"
          >
            Pred: {label}
          </text>
        ))}
        {labels.map((label, i) => (
          <text
            key={`actual-${label}`}
            x={60}
            y={10 + i * cellSize + (cellSize - 6) / 2 + 4}
            textAnchor="end"
            fontSize="10"
            fill="var(--muted)"
          >
            Actual: {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function FeatureImportanceChart({ items }: { items: FeatureImportance[] }) {
  if (items.length === 0) {
    return (
      <EmptyState label="Feature importance will appear once dashboard-data.json is generated." />
    );
  }

  const sorted = [...items].sort((a, b) => b.importance - a.importance);
  const max = Math.max(...sorted.map((i) => Math.abs(i.importance)), 0.0001);
  const rowH = 28;
  const chartH = sorted.length * rowH + 20;

  return (
    <div className="panel px-4 py-4">
      <svg viewBox={`0 0 ${W} ${chartH}`} className="w-full h-auto">
        {sorted.map((it, i) => {
          const barW = (Math.abs(it.importance) / max) * (W - 180);
          return (
            <g key={it.feature} transform={`translate(0, ${i * rowH + 8})`}>
              <text x={0} y={14} fontSize="11" fill="var(--ink)">
                {it.feature}
              </text>
              <rect
                x={140}
                y={2}
                width={Math.max(barW, 1)}
                height={16}
                fill="var(--accent)"
                opacity={0.85}
                rx={3}
              />
              <text
                x={140 + barW + 6}
                y={14}
                fontSize="10"
                fill="var(--muted)"
                className="font-mono-num"
              >
                {it.importance.toFixed(4)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

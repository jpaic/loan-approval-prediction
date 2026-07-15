import type { DataPreviewRow } from "@/lib/types";

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="panel px-5 py-10 text-center text-sm text-[var(--muted)]">
      {label}
    </div>
  );
}

export function DataPreviewTable({ rows }: { rows: DataPreviewRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState label="Sample rows will appear once dashboard-data.json is generated." />
    );
  }
  const columns = Object.keys(rows[0]) as (keyof DataPreviewRow)[];
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--panel-border)]">
            {columns.map((c) => (
              <th
                key={c}
                className="text-left px-4 py-3 text-[var(--muted)] font-medium whitespace-nowrap"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[var(--panel-border)] last:border-0"
            >
              {columns.map((c) => {
                const value = row[c];
                let display: string;
                if (value === null || value === undefined) {
                  display = "—";
                } else if (c === "LoanApproved") {
                  display = value === 1 ? "Approved" : "Rejected";
                } else {
                  display = String(value);
                }
                return (
                  <td
                    key={c}
                    className="px-4 py-2.5 font-mono-num whitespace-nowrap"
                  >
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

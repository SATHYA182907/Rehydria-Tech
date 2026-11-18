import { Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { LIST_LIMIT, type AdminRow } from "@/services/admin/data";
import { formatPaise } from "@/shared/money";

export interface Column {
  key: string;
  label: string;
  render?: (row: AdminRow) => ReactNode;
  className?: string;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
export const fmtDate = (v: unknown) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? dateFmt.format(new Date(v)) : "-");
export const fmtMoney = (v: unknown) => (typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? formatPaise(v) : "-");

const TONE: Record<string, "success" | "warning" | "danger" | "info" | "mint" | "neutral"> = {
  published: "success", active: "success", paid: "success", valid: "success", approved: "success", completed: "info",
  draft: "neutral", pending_payment: "warning", pending: "warning", created: "warning", attempted: "warning", new: "info",
  archived: "neutral", abandoned: "neutral", failed: "danger", revoked: "danger", refunded: "danger", rejected: "danger",
};

export function StatusBadge({ value }: { value: unknown }) {
  const v = String(value ?? "-");
  return <Badge variant={TONE[v] ?? "neutral"}>{v.replace(/_/g, " ")}</Badge>;
}

interface DataTableProps {
  rows: AdminRow[];
  columns: Column[];
  /** Current query string values. */
  q?: string;
  status?: string;
  statusOptions?: string[];
  basePath: string;
  searchPlaceholder?: string;
  emptyTitle: string;
  emptyDescription?: string;
}

/** Server-rendered admin table with GET-based search and status filter chips. */
export function DataTable({ rows, columns, q = "", status = "", statusOptions, basePath, searchPlaceholder = "Search…", emptyTitle, emptyDescription }: DataTableProps) {
  const link = (s: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (s) p.set("status", s);
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form method="get" action={basePath} className="relative w-full md:max-w-sm">
          {status && <input type="hidden" name="status" value={status} />}
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-soft" />
          <Input type="search" name="q" defaultValue={q} placeholder={searchPlaceholder} aria-label="Search" className="pl-10" />
        </form>
        {statusOptions && (
          <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5">
            {["", ...statusOptions].map((s) => (
              <Link
                key={s || "all"}
                href={link(s)}
                aria-current={status === s ? "true" : undefined}
                className={cn(
                  "rounded-pill border px-3 py-1 text-sm capitalize transition-colors",
                  status === s ? "border-forest bg-forest text-on-forest" : "border-line-strong text-ink-soft hover:border-forest hover:text-ink",
                )}
              >
                {s ? s.replace(/_/g, " ") : "All"}
              </Link>
            ))}
          </nav>
        )}
      </div>
      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-surface">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-canvas-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} scope="col" className={cn("px-4 py-3 font-normal", c.className)}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-canvas">
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3 align-top", c.className)}>
                      {c.render ? c.render(row) : String(row[c.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-ink-soft">
        {rows.length} {rows.length === 1 ? "record" : "records"}
        {rows.length >= LIST_LIMIT ? ` (showing the first ${LIST_LIMIT}; refine your search)` : ""}
      </p>
    </div>
  );
}

/** Case-insensitive search across the given fields. */
export function searchRows(rows: AdminRow[], q: string, keys: string[]): AdminRow[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((r) => keys.some((k) => String(r[k] ?? "").toLowerCase().includes(needle)));
}

export function param(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.slice(0, 100) : "";
}

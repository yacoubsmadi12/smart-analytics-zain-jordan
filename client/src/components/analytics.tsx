import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Info,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { formatJod, formatNumber } from "@/lib/formatters";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type SemanticStatus = "critical" | "warning" | "healthy" | "info" | "neutral";

export function Abbreviation({ term, meaning }: { term: string; meaning: string }) {
  return <abbr className="analytics-abbreviation" title={meaning} aria-label={`${term}: ${meaning}`}>{term}</abbr>;
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const normalized = status.toLowerCase();
  const tone: SemanticStatus = /^(critical|urgent|failed|error|blocked|severe)$/.test(normalized)
    ? "critical"
    : /^(warning|high|major|needs attention|degraded|watch)$/.test(normalized)
      ? "warning"
      : /^(healthy|stable|resolved|success|active|connected|granted|complete)$/.test(normalized)
        ? "healthy"
        : /^(info|pending|review|medium|in progress|in_progress|investigating)$/.test(normalized)
          ? "info"
          : "neutral";
  const Icon = tone === "critical" ? AlertCircle : tone === "warning" ? TriangleAlert : tone === "healthy" ? CheckCircle2 : tone === "info" ? Info : CircleHelp;
  return <span className={`analytics-status analytics-status-${tone}`}><Icon size={13} aria-hidden="true" /><span>{label ?? status}</span></span>;
}

export function PageHeader({ eyebrow, title, description, actions, status }: {
  eyebrow?: string; title: string; description?: string; actions?: ReactNode; status?: { value: string; label?: string };
}) {
  return <header className="analytics-page-header">
    <div className="analytics-page-heading-copy">
      {eyebrow && <span className="analytics-eyebrow">{eyebrow}</span>}
      <div className="analytics-title-row"><h1>{title}</h1>{status && <StatusBadge status={status.value} label={status.label} />}</div>
      {description && <p>{description}</p>}
    </div>
    {actions && <div className="analytics-page-actions">{actions}</div>}
  </header>;
}

export function KpiCard({ label, value, note, delta, status = "neutral", icon }: {
  label: string; value: string; note?: string; delta?: string | null; status?: SemanticStatus; icon?: ReactNode;
}) {
  return <article className={`analytics-kpi-card analytics-kpi-${status}`}>
    <div className="analytics-kpi-top"><span>{label}</span>{icon && <span className="analytics-kpi-icon" aria-hidden="true">{icon}</span>}</div>
    <strong className="analytics-kpi-value">{value}</strong>
    <div className="analytics-kpi-foot">{note && <span>{note}</span>}{delta && <span className="analytics-kpi-delta">{delta}</span>}</div>
  </article>;
}

export function AsyncState({ state, title, description, onRetry }: {
  state: "loading" | "error" | "empty" | "forbidden"; title?: string; description?: string; onRetry?: () => void;
}) {
  const defaults = {
    loading: ["Loading validated data", "The dashboard is retrieving the latest available source records."],
    error: ["Data could not be loaded", "The source returned an error. Retry after checking the connection."],
    empty: ["No data available", "Connect an approved source or adjust the current filters."],
    forbidden: ["Access not granted", "Your current role does not have permission to view this information."],
  } as const;
  const [fallbackTitle, fallbackDescription] = defaults[state];
  const Icon = state === "error" ? AlertCircle : state === "forbidden" ? TriangleAlert : state === "empty" ? CircleHelp : RefreshCw;
  return <div className={`analytics-state analytics-state-${state}`} role={state === "error" ? "alert" : "status"} aria-live="polite">
    {state === "loading" ? <div className="analytics-skeleton-stack" aria-hidden="true"><i /><i /><i /></div> : <Icon size={20} aria-hidden="true" />}
    <div><strong>{title ?? fallbackTitle}</strong><p>{description ?? fallbackDescription}</p></div>
    {state === "error" && onRetry && <button type="button" onClick={onRetry} className="analytics-retry-button"><RefreshCw size={14} /> Retry</button>}
  </div>;
}

export function FilterBar({ children, actions, label = "Filters" }: { children: ReactNode; actions?: ReactNode; label?: string }) {
  return <section className="analytics-filter-bar" aria-label={label}><div className="analytics-filter-controls">{children}</div>{actions && <div className="analytics-filter-actions">{actions}</div>}</section>;
}

export function ChartFrame({ title, description, children, state, onRetry, actions, unit }: {
  title: string; description?: string; children?: ReactNode; state?: "loading" | "error" | "empty"; onRetry?: () => void; actions?: ReactNode; unit?: string;
}) {
  return <section className="analytics-chart-frame">
    <header className="analytics-chart-header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div><div className="analytics-chart-meta">{unit && <span>{unit}</span>}{actions}</div></header>
    <div className="analytics-chart-content">{state ? <AsyncState state={state} onRetry={onRetry} /> : children}</div>
  </section>;
}

export type DataColumn<T extends object> = {
  key: keyof T; label: string; render?: (row: T) => ReactNode; sortable?: boolean; align?: "start" | "end";
};

export function DataTable<T extends object>({ rows, columns, rowKey, pageSize = 10, emptyText = "No records match the current view." }: {
  rows: T[]; columns: DataColumn<T>[]; rowKey: keyof T; pageSize?: number; emptyText?: string;
}) {
  const [sort, setSort] = useState<{ key: keyof T; direction: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const size = Math.min(50, Math.max(1, pageSize));
  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const left = a[sort.key]; const right = b[sort.key];
      const result = typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true, sensitivity: "base" });
      return sort.direction === "asc" ? result : -result;
    });
    return copy;
  }, [rows, sort]);
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / size));
  const safePage = Math.min(page, pageCount - 1);
  const visibleRows = sortedRows.slice(safePage * size, (safePage + 1) * size);
  return <div className={`analytics-table-shell ${dense ? "is-dense" : ""}`}>
    <div className="analytics-table-toolbar"><span>{formatNumber(rows.length)} records</span><button type="button" aria-pressed={dense} onClick={() => setDense(value => !value)}>{dense ? "Comfortable rows" : "Compact rows"}</button></div>
    {rows.length === 0 ? <div className="analytics-table-empty">{emptyText}</div> : <div className="analytics-table-scroll"><table className="analytics-data-table"><thead><tr>{columns.map(column => <th key={String(column.key)} scope="col" className={column.align === "end" ? "is-numeric" : ""} aria-sort={sort?.key === column.key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>{column.sortable === false ? column.label : <button type="button" onClick={() => setSort(current => current?.key === column.key ? { key: column.key, direction: current.direction === "asc" ? "desc" : "asc" } : { key: column.key, direction: "asc" })}>{column.label}{sort?.key === column.key && (sort.direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button>}</th>)}</tr></thead>
      <tbody>{visibleRows.map((row, index) => <tr key={String(row[rowKey] ?? `${safePage}-${index}`)}>{columns.map(column => <td key={String(column.key)} data-label={column.label} className={column.align === "end" ? "is-numeric" : ""}>{column.render ? column.render(row) : String(row[column.key] ?? "—")}</td>)}</tr>)}</tbody></table></div>}
    <div className="analytics-table-pagination"><span>Page {safePage + 1} of {pageCount}</span><div><button type="button" aria-label="Previous page" disabled={safePage === 0} onClick={() => setPage(value => Math.max(0, value - 1))}><ChevronLeft size={16} /></button><button type="button" aria-label="Next page" disabled={safePage >= pageCount - 1} onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))}><ChevronRight size={16} /></button></div></div>
  </div>;
}

export function DetailDrawer({ open, onOpenChange, title, description, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode;
}) {
  const [side, setSide] = useState<"left" | "right">(() => typeof document !== "undefined" && document.documentElement.dir === "rtl" ? "left" : "right");
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setSide(root.dir === "rtl" ? "left" : "right");
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["dir"] });
    sync();
    return () => observer.disconnect();
  }, []);
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side={side} className="analytics-detail-drawer"><SheetHeader><SheetTitle>{title}</SheetTitle>{description && <SheetDescription>{description}</SheetDescription>}</SheetHeader><div className="analytics-detail-body">{children}</div></SheetContent></Sheet>;
}

export function DecisionCard({ rank, title, region, severity, rationale, recommendation, affectedCustomers, revenueRisk, salesPipeline, complaintCount, onOpen }: {
  rank: number; title: string; region: string; severity: string; rationale?: string; recommendation?: string; affectedCustomers?: number; revenueRisk?: number; salesPipeline?: number; complaintCount?: number; onOpen?: () => void;
}) {
  return (
    <article className="analytics-decision-card">
      <div className="analytics-decision-rank" aria-label={`Priority ${rank}`}>{String(rank).padStart(2, "0")}</div>
      <div className="analytics-decision-main">
        <div className="analytics-decision-heading"><div><span className="analytics-decision-region">{region}</span><h3>{title}</h3></div><StatusBadge status={severity} /></div>
        {rationale && <p>{rationale}</p>}
        {recommendation && <div className="analytics-recommendation"><b>Recommended</b><span>{recommendation}</span></div>}
        {(affectedCustomers !== undefined || revenueRisk !== undefined || salesPipeline !== undefined || complaintCount !== undefined) && (
          <div className="analytics-decision-metrics">
            <span><small>Affected customers</small><b>{formatNumber(affectedCustomers)}</b></span>
            <span><small>Open complaints</small><b>{formatNumber(complaintCount)}</b></span>
            <span><small>Revenue at risk</small><b>{formatJod(revenueRisk)}</b></span>
            <span><small>Sales pipeline</small><b>{formatJod(salesPipeline)}</b></span>
          </div>
        )}
      </div>
      {onOpen && <button className="analytics-decision-open" type="button" onClick={onOpen}>Review</button>}
    </article>
  );
}

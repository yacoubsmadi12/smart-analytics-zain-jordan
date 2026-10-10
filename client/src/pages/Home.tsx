import { useLocation } from "wouter";
import { ArrowUpRight, Building2, MapPin, MessageSquareWarning, Network, Signal, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCompact, formatDateTime, formatJod, formatNumber, formatPercent } from "@/lib/formatters";
import { AsyncState, ChartFrame, DecisionCard, KpiCard, PageHeader, StatusBadge } from "@/components/analytics";
import "./Home.css";

function trendLabel(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return undefined;
  return `${value > 0 ? "+" : ""}${formatPercent(value)} vs previous period`;
}

export default function Home() {
  const [, navigate] = useLocation();
  const permissionQuery = trpc.auth.permissions.useQuery();
  const canViewDashboard = permissionQuery.data?.grants.includes("dashboard.view") ?? false;
  const canViewCustomers = permissionQuery.data?.grants.includes("customers.view") ?? false;
  const canViewMap = permissionQuery.data?.grants.includes("map.view") ?? false;
  const summaryQuery = trpc.dashboard.summary.useQuery(undefined, { enabled: canViewDashboard, refetchOnWindowFocus: false });
  const prioritiesQuery = trpc.dashboard.priorities.useQuery({ limit: 3 }, { enabled: canViewDashboard, refetchOnWindowFocus: false });
  const cxQuery = trpc.customerExperience.operations.useQuery(undefined, { enabled: canViewDashboard && canViewCustomers, refetchOnWindowFocus: false });

  const summary = summaryQuery.data;
  const sourceNote = summary?.source === "synthetic" ? "Demo dataset" : summary?.source === "persisted" ? "Imported source data" : "Awaiting validated data";
  const priorities = prioritiesQuery.data ?? [];
  const regions = (cxQuery.data?.areas ?? []).slice(0, 4);
  const leadingArea = regions[0];
  const maxRisk = Math.max(1, ...regions.map(area => area.cxRisk));

  if (permissionQuery.data && !canViewDashboard) {
    return <div className="analytics-page"><PageHeader eyebrow="COMMAND CENTER" title="Executive Overview" description="A source-backed view of network, customer and business signals." /><AsyncState state="forbidden" /></div>;
  }

  return <div className="analytics-page executive-overview-page">
    <PageHeader
      eyebrow="COMMAND CENTER"
      title="Executive Overview"
      description="A concise, traceable view from operational signals to customer and revenue impact."
      status={summary ? { value: summary.source === "synthetic" ? "demo" : "connected", label: summary.source === "synthetic" ? "Demo data" : "Imported data" } : undefined}
      actions={<>
        <button type="button" className="executive-action-button" onClick={() => navigate("/decision-support")}><ArrowUpRight size={15} /> Review decisions</button>
        {canViewMap && <button type="button" className="executive-action-button secondary" onClick={() => navigate("/map")}><MapPin size={15} /> Open map</button>}
      </>}
    />

    {permissionQuery.isError && <AsyncState state="error" title="Permissions could not be checked" description="Dashboard data is paused until access can be verified." onRetry={() => void permissionQuery.refetch()} />}
    {permissionQuery.isLoading && <AsyncState state="loading" title="Checking workspace access" />}
    {permissionQuery.data && summaryQuery.isError && <AsyncState state="error" title="Dashboard metrics could not be loaded" description="No fallback figures are shown. Retry the source query or review Data Management." onRetry={() => void summaryQuery.refetch()} />}

    <section className="analytics-kpi-grid" aria-label="Executive key performance indicators">
      <KpiCard label="Network health" value={formatPercent(summary?.networkHealth)} note={sourceNote} delta={trendLabel(summary?.trend.networkHealth)} status={summary ? (summary.networkHealth < 85 ? "critical" : summary.networkHealth < 95 ? "warning" : "healthy") : "neutral"} icon={<Signal size={17} />} />
      <KpiCard label="Network sites" value={formatNumber(summary?.sites)} note={sourceNote} status="neutral" icon={<Network size={17} />} />
      <KpiCard label="Active customers" value={formatCompact(summary?.customers, 2)} note={sourceNote} status="neutral" icon={<Users size={17} />} />
      <KpiCard label="Open complaints" value={formatNumber(summary?.openComplaints)} note="Unresolved records" delta={trendLabel(summary?.trend.openComplaints)} status={summary && summary.openComplaints > 0 ? "warning" : "neutral"} icon={<MessageSquareWarning size={17} />} />
      <KpiCard label="Revenue at risk" value={formatJod(summary?.revenueAtRisk)} note="JOD · source-backed exposure" delta={trendLabel(summary?.trend.revenueAtRisk)} status={summary && summary.revenueAtRisk > 0 ? "warning" : "neutral"} icon={<Building2 size={17} />} />
    </section>

    {summary?.updatedAt && <div className="executive-data-meta"><span><StatusBadge status={summary.source === "synthetic" ? "demo" : "connected"} label={sourceNote} /></span><span>Updated {formatDateTime(summary.updatedAt)} · Asia/Amman</span></div>}

    <section className="executive-overview-main" aria-label="Regional customer impact and operational insight">
      <ChartFrame title="Regional impact" description="Customer-experience risk by service area; sourced from the shared CX metrics service." unit="Risk / 100"
        state={permissionQuery.data && !canViewCustomers ? undefined : cxQuery.isLoading ? "loading" : cxQuery.isError ? "error" : regions.length ? undefined : "empty"}
        onRetry={() => void cxQuery.refetch()}>
        {permissionQuery.data && !canViewCustomers ? <AsyncState state="forbidden" title="Regional CX signals are restricted" description="Your role does not include customers.view." /> : regions.length > 0 && <div className="executive-region-chart" role="list" aria-label="Top four regions by customer experience risk">
          {regions.map(area => <div className="executive-region-row" role="listitem" key={area.id}>
            <div className="executive-region-label"><span title={area.region}>{area.region}</span><StatusBadge status={area.severity} label={area.severity === "watch" ? "Watch" : area.severity} /></div>
            <div className="executive-region-track" role="meter" aria-label={`${area.region} CX risk`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={area.cxRisk}><i className={`risk-${area.severity}`} style={{ width: `${Math.min(100, Math.max(3, area.cxRisk / maxRisk * 100))}%` }} /></div>
            <div className="executive-region-metrics"><b>{formatNumber(area.cxRisk)}</b><span>{formatNumber(area.complaints)} open complaints</span><span>{formatCompact(area.impactedCustomers, 1)} impacted customers</span></div>
          </div>)}
        </div>}
      </ChartFrame>

      <aside className="executive-insight-panel" aria-labelledby="executive-insight-title">
        <div className="executive-insight-heading"><span>OPERATIONAL INSIGHT</span><StatusBadge status={cxQuery.data?.source === "synthetic" ? "demo" : "info"} label={cxQuery.data?.source === "synthetic" ? "Demo data" : "Metric-derived"} /></div>
        {permissionQuery.data && !canViewCustomers ? <AsyncState state="forbidden" title="Customer insight is restricted" description="No customer-area metrics were requested for this role." /> : cxQuery.isLoading ? <AsyncState state="loading" title="Preparing source-backed insight" /> : cxQuery.isError ? <AsyncState state="error" title="Insight unavailable" onRetry={() => void cxQuery.refetch()} /> : leadingArea ? <>
          <h2 id="executive-insight-title">{leadingArea.primaryIssue}</h2>
          <p>{leadingArea.region}: {formatNumber(leadingArea.impactedCustomers)} customers are estimated to be impacted; risk is {formatNumber(leadingArea.cxRisk)} / 100.</p>
          <div className="executive-insight-action"><span>Next step</span><b>Review the ranked decision queue and validate the affected service area.</b><button type="button" onClick={() => navigate("/decision-support")}>Open decisions <ArrowUpRight size={14} /></button></div>
        </> : <AsyncState state="empty" title="No CX insight available" description="No source-backed service-area signals are available for the current dataset." />}
      </aside>
    </section>

    <section className="executive-decisions-section" aria-labelledby="executive-decisions-title">
      <div className="executive-section-title"><div><span className="analytics-eyebrow">DECISION QUEUE</span><h2 id="executive-decisions-title">Top 3 recommended actions</h2><p>Ranked using the configured impact score. Each card retains its source rationale and impact measures.</p></div><button type="button" className="executive-text-link" onClick={() => navigate("/decision-support")}>View queue <ArrowUpRight size={14} /></button></div>
      {prioritiesQuery.isLoading ? <AsyncState state="loading" title="Loading ranked decisions" /> : prioritiesQuery.isError ? <AsyncState state="error" title="Decision queue is unavailable" onRetry={() => void prioritiesQuery.refetch()} /> : priorities.length ? <div className="analytics-decision-list">{priorities.map(item => <DecisionCard key={item.id} rank={item.rank} title={item.issue} region={item.region} severity={item.severity} rationale={item.rationale} recommendation={item.action} affectedCustomers={item.affectedCustomers} revenueRisk={item.revenueRisk} salesPipeline={item.salesPipeline} complaintCount={item.complaintCount} onOpen={() => navigate("/decision-support")} />)}</div> : <AsyncState state="empty" title="No ranked decisions" description="The current dataset does not contain actionable priority records." />}
    </section>
  </div>;
}

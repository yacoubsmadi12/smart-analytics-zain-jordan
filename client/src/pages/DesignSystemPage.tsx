import { useMemo, useState } from "react";
import { Check, Database, Eye, MessageSquareWarning, Network, Signal, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatCompact, formatDateTime, formatJod, formatNumber, formatPercent } from "@/lib/formatters";
import {
  Abbreviation, AsyncState, ChartFrame, DataTable, DecisionCard, DetailDrawer,
  FilterBar, KpiCard, PageHeader, StatusBadge, type DataColumn,
} from "@/components/analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import "./DesignSystemPage.css";

const palette = [
  ["Background", "--color-bg"], ["Surface 1", "--surface-1"], ["Surface 2", "--surface-2"], ["Surface 3", "--surface-3"],
  ["Teal accent", "--accent"], ["Healthy", "--status-healthy"], ["Warning", "--status-warning"], ["Critical", "--status-critical"], ["Information", "--status-info"],
  ["Primary text", "--text-primary"], ["Secondary text", "--text-secondary"], ["Muted text", "--text-muted"], ["Border", "--border-default"],
] as const;
const typeScale = [["Page title", "--text-page-title"], ["Section title", "--text-section-title"], ["Card title", "--text-card-title"], ["Body", "--text-body"], ["Caption", "--text-caption"]] as const;
const spacingScale = ["space-1", "space-2", "space-3", "space-4", "space-5", "space-6"] as const;
function tokenValue(name: string) { return typeof window === "undefined" ? "CSS token" : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || `var(${name})`; }
function chartPoints(values: number[]) {
  if (values.length < 2) return "";
  return values.map((value, index) => `${(index / (values.length - 1)) * 100},${90 - (value / 100) * 72}`).join(" ");
}

type SitePreview = { id: string; name: string; region: string; availability?: number; status: string; customers?: number; complaints?: number };

export default function DesignSystemPage() {
  const permissions = trpc.auth.permissions.useQuery();
  const grants = permissions.data?.grants ?? [];
  const canViewDashboard = grants.includes("dashboard.view");
  const canViewNetwork = grants.includes("network.view");
  const canViewMap = grants.includes("map.view");
  const summaryQuery = trpc.dashboard.summary.useQuery(undefined, { enabled: canViewDashboard, refetchOnWindowFocus: false });
  const priorityQuery = trpc.dashboard.priorities.useQuery({ limit: 1 }, { enabled: canViewDashboard, refetchOnWindowFocus: false });
  const networkQuery = trpc.network.operations.useQuery(undefined, { enabled: canViewDashboard && canViewNetwork, refetchOnWindowFocus: false });
  const sitesQuery = trpc.map.sites.useQuery(undefined, { enabled: canViewDashboard && canViewMap, refetchOnWindowFocus: false });
  const rows = useMemo(() => ((sitesQuery.data ?? []) as unknown as SitePreview[]).slice(0, 50), [sitesQuery.data]);
  const [tab, setTab] = useState("overview");
  const [region, setRegion] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const summary = summaryQuery.data;
  const visibleRows = useMemo(() => rows.filter(row => (region === "all" || row.region === region) && (!search || `${row.name} ${row.id} ${row.region}`.toLowerCase().includes(search.trim().toLowerCase()))), [rows, region, search]);
  const regionOptions = Array.from(new Set(rows.map(row => row.region).filter(Boolean))).sort();
  const selectedSite = rows.find(row => row.id === selectedId);
  const trends = networkQuery.data?.trends ?? [];
  const availabilityPoints = trends.map(point => point.availability);
  const siteColumns: DataColumn<SitePreview>[] = [
    { key: "name", label: "Site", render: row => <span title={`${row.name} · ${row.id}`} className="design-site-name"><b>{row.name}</b><small className="data-code">{row.id}</small></span> },
    { key: "region", label: "Region" },
    { key: "availability", label: "Availability", align: "end", render: row => formatPercent(row.availability) },
    { key: "status", label: "Status", render: row => <StatusBadge status={row.status} /> },
    { key: "id", label: "Details", sortable: false, render: row => <button type="button" className="design-row-action" aria-label={`Open details for ${row.name}`} onClick={() => setSelectedId(row.id)}><Eye size={14} /> View</button> },
  ];

  if (permissions.data && !canViewDashboard) return <div className="design-system-page analytics-page"><PageHeader eyebrow="FOUNDATIONS · COMPONENTS · ACCESSIBILITY" title="Design System" description="Shared component reference for the workspace." /><AsyncState state="forbidden" title="Design system access restricted" /></div>;

  return <div className="design-system-page analytics-page">
    <PageHeader eyebrow="FOUNDATIONS · COMPONENTS · ACCESSIBILITY" title="Design System" description="The shared visual language and live component library used across analytics, workflow and administration." status={{ value: "info", label: "Component reference" }} actions={<button type="button" className="design-action-button" onClick={() => toast.success("Design-system preview is current.")}><Check size={15} /> Test toast</button>} />

    {permissions.isError && <AsyncState state="error" title="Workspace access could not be verified" description="No protected data is requested until your grants can be checked." onRetry={() => void permissions.refetch()} />}
    {permissions.data && summaryQuery.isError && <AsyncState state="error" title="Source-backed component values are unavailable" description="The showcase will not replace failed queries with invented metrics." onRetry={() => void summaryQuery.refetch()} />}

    <section className="design-token-section" aria-labelledby="design-tokens-title">
      <div className="design-section-heading"><div><span className="analytics-eyebrow">01 · FOUNDATIONS</span><h2 id="design-tokens-title">Tokens</h2><p>Color, type, spacing and surface values resolve from <code>design-tokens.css</code>.</p></div></div>
      <div className="design-color-grid">{palette.map(([name, token]) => <div className="design-color-card" key={token}><span className="design-swatch" style={{ background: `var(${token})` }} /><div><b>{name}</b><small>{token}</small><code>{tokenValue(token)}</code></div></div>)}</div>
      <div className="design-foundation-grid">
        <div className="design-foundation-card"><h3>Typography</h3><p>One sans family for interface text; monospace is reserved for identifiers and numeric codes.</p><div className="design-type-list">{typeScale.map(([label, token]) => <div key={token}><span>{label}<small>{tokenValue(token)}</small></span><b style={{ fontSize: `var(${token})` }}>{label === "Page title" ? "Network intelligence" : "Operational data"}</b></div>)}</div><p className="design-abbreviation-note">Technical terms: <Abbreviation term="PRB" meaning="Physical Resource Block" />, <Abbreviation term="E-RAB" meaning="E-UTRAN Radio Access Bearer" />, <Abbreviation term="RF" meaning="Radio Frequency" />, <Abbreviation term="CX" meaning="Customer Experience" />.</p></div>
        <div className="design-foundation-card"><h3>Spacing & shape</h3><p>Four-point spacing scale, three radius sizes and two shadow elevations.</p><div className="design-space-list">{spacingScale.map(name => <div key={name}><span>{name.replace("space-", "space ")}</span><i style={{ width: `var(--${name})` }} /><small>{tokenValue(`--${name}`)}</small></div>)}</div><div className="design-radius-list"><span>8 · compact</span><span>12 · card</span><span>16 · section</span></div></div>
      </div>
    </section>

    <Tabs value={tab} onValueChange={setTab} className="design-showcase-tabs">
      <TabsList aria-label="Design component examples"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="explorer">Explorer & table</TabsTrigger><TabsTrigger value="states">States & actions</TabsTrigger></TabsList>
      <TabsContent value="overview" className="design-tab-content">
        <section className="design-demo-section"><div className="design-section-heading"><div><span className="analytics-eyebrow">02 · KPI COMPONENT</span><h2>Source-backed metric cards</h2><p>Displayed values come directly from the same platform metrics endpoint used by the dashboard.</p></div>{summary && <span className="design-source-stamp"><StatusBadge status={summary.source === "synthetic" ? "demo" : "connected"} label={summary.source === "synthetic" ? "Demo data" : "Imported data"} /> Updated {formatDateTime(summary.updatedAt)}</span>}</div>
          {summaryQuery.isLoading ? <AsyncState state="loading" title="Loading component values" /> : <div className="analytics-kpi-grid design-kpi-grid"><KpiCard label="Network health" value={formatPercent(summary?.networkHealth)} note="Shared metric service" status={summary ? (summary.networkHealth < 85 ? "critical" : summary.networkHealth < 95 ? "warning" : "healthy") : "neutral"} icon={<Signal size={17} />} /><KpiCard label="Open complaints" value={formatNumber(summary?.openComplaints)} note="Unresolved records" status={summary ? (summary.openComplaints > 0 ? "warning" : "healthy") : "neutral"} icon={<MessageSquareWarning size={17} />} /><KpiCard label="Revenue at risk" value={formatJod(summary?.revenueAtRisk)} note="JOD · shared metric service" status={summary ? (summary.revenueAtRisk > 0 ? "warning" : "healthy") : "neutral"} icon={<Network size={17} />} /><KpiCard label="Active customers" value={formatCompact(summary?.customers, 2)} note="Validated source total" status="neutral" icon={<Users size={17} />} /></div>}
        </section>
        <section className="design-demo-section"><div className="design-section-heading"><div><span className="analytics-eyebrow">03 · CHART WRAPPER</span><h2>Chart, legend, axes and tooltip</h2><p>Source trend: network availability. Point labels expose values on hover and to assistive technology.</p></div></div>
          {!canViewNetwork ? <ChartFrame title="Network availability trend" description="A consistent container for one primary visualization." unit="Availability %"><AsyncState state="forbidden" /></ChartFrame> : <ChartFrame title="Network availability trend" description={`Source: ${networkQuery.data?.source ?? "network operations"}.`} unit="Availability %" state={networkQuery.isLoading ? "loading" : networkQuery.isError ? "error" : trends.length ? undefined : "empty"} onRetry={() => void networkQuery.refetch()}>
            {trends.length > 0 && <div className="design-chart-demo"><div className="design-chart-axis-labels"><span>100%</span><span>50%</span><span>0%</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Network availability trend from the shared network operations source"><line x1="0" y1="10" x2="100" y2="10" /><line x1="0" y1="50" x2="100" y2="50" /><line x1="0" y1="90" x2="100" y2="90" /><polyline points={chartPoints(availabilityPoints)} />{trends.map((point, index) => <circle key={point.label} cx={(index / Math.max(1, trends.length - 1)) * 100} cy={90 - (point.availability / 100) * 72} r="1.7"><title>{`${point.label}: ${formatPercent(point.availability)}`}</title></circle>)}</svg><div className="design-chart-labels">{trends.map(point => <span key={point.label}>{point.label}</span>)}</div><div className="design-chart-legend"><i /> Availability · {trends.length} source periods</div></div>}
          </ChartFrame>}
        </section>
        <section className="design-demo-section"><div className="design-section-heading"><div><span className="analytics-eyebrow">04 · DECISION CARD</span><h2>Ranked action component</h2><p>Full region, rationale, recommendation, severity and four impact metrics.</p></div></div>
          {priorityQuery.isLoading ? <AsyncState state="loading" title="Loading a source-backed decision" /> : priorityQuery.isError ? <AsyncState state="error" title="Decision sample unavailable" onRetry={() => void priorityQuery.refetch()} /> : priorityQuery.data?.[0] ? <DecisionCard rank={priorityQuery.data[0].rank} title={priorityQuery.data[0].issue} region={priorityQuery.data[0].region} severity={priorityQuery.data[0].severity} rationale={priorityQuery.data[0].rationale} recommendation={priorityQuery.data[0].action} affectedCustomers={priorityQuery.data[0].affectedCustomers} complaintCount={priorityQuery.data[0].complaintCount} revenueRisk={priorityQuery.data[0].revenueRisk} salesPipeline={priorityQuery.data[0].salesPipeline} onOpen={() => setTab("explorer")} /> : <AsyncState state="empty" title="No source-backed decision is available" />}
        </section>
      </TabsContent>

      <TabsContent value="explorer" className="design-tab-content">
        <section className="design-demo-section"><div className="design-section-heading"><div><span className="analytics-eyebrow">05 · FILTER BAR & DATA TABLE</span><h2>Operational site records</h2><p>Sortable, sticky-header table; page size is bounded and every action is keyboard accessible.</p></div></div>
          {!canViewMap ? <AsyncState state="forbidden" title="Map sites are outside this role’s scope" /> : <>
            <FilterBar label="Site data filters" actions={<button type="button" className="design-action-button secondary" onClick={() => { setSearch(""); setRegion("all"); }}>Clear filters</button>}>
              <label>Region<select value={region} onChange={event => setRegion(event.target.value)}><option value="all">All regions</option>{regionOptions.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
              <label>Search site<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name or ID" /></label>
            </FilterBar>
            {sitesQuery.isLoading ? <AsyncState state="loading" title="Loading source site records" /> : sitesQuery.isError ? <AsyncState state="error" title="Sites could not be loaded" onRetry={() => void sitesQuery.refetch()} /> : <DataTable rows={visibleRows} columns={siteColumns} rowKey="id" pageSize={8} emptyText="No site rows match this filter." />}
          </>}
        </section>
      </TabsContent>

      <TabsContent value="states" className="design-tab-content">
        <section className="design-demo-section"><div className="design-section-heading"><div><span className="analytics-eyebrow">06 · FEEDBACK & ACCESSIBILITY</span><h2>Loading, empty, error and access states</h2><p>Color is never the only signal; text, icon, retry and focus handling remain consistent.</p></div></div>
          <div className="design-state-grid"><AsyncState state="loading" title="Loading validated data" description="Skeleton indicators keep the layout stable." /><AsyncState state="empty" title="No records for this filter" description="Change the filter or connect an approved source." /><AsyncState state="error" title="Source unavailable" description="No metric fallback or stale value is shown." onRetry={() => void sitesQuery.refetch()} /><AsyncState state="forbidden" title="Restricted workspace" description="The route and data request remain protected by the viewer’s grants." /></div>
          <div className="design-controls-row"><StatusBadge status="healthy" label="Healthy" /><StatusBadge status="watch" label="Watch" /><StatusBadge status="critical" label="Critical" /><StatusBadge status="pending" label="Pending review" /><StatusBadge status="demo" label="Demo data" /><button type="button" className="design-action-button secondary" onClick={() => setConfirmOpen(true)}>Open confirmation modal</button><button type="button" className="design-action-button" onClick={() => toast.success("Toast component is working.")}>Show toast</button></div>
        </section>
      </TabsContent>
    </Tabs>

    <footer className="design-system-footer"><Database size={14} /> This reference page uses shared metrics and site queries; no operational figures are fabricated. Source requests are enabled only after grants are confirmed.</footer>

    <DetailDrawer open={Boolean(selectedSite)} onOpenChange={open => { if (!open) setSelectedId(null); }} title={selectedSite?.name ?? "Site details"} description={selectedSite ? `${selectedSite.id} · ${selectedSite.region}` : "Source-backed site detail"}>
      {selectedSite ? <div className="design-drawer-details"><StatusBadge status={selectedSite.status} /><div><span>Availability</span><b>{formatPercent(selectedSite.availability)}</b></div><div><span>Customers</span><b>{formatNumber(selectedSite.customers)}</b></div><div><span>Complaints</span><b>{formatNumber(selectedSite.complaints)}</b></div></div> : <AsyncState state="empty" title="No site selected" />}
    </DetailDrawer>

    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent className="design-confirm-modal"><DialogHeader><DialogTitle>Confirmation dialog</DialogTitle><DialogDescription>This example demonstrates the confirmation pattern. It does not change users, settings or source records.</DialogDescription></DialogHeader><DialogFooter><button type="button" className="design-action-button secondary" onClick={() => setConfirmOpen(false)}>Cancel</button><button type="button" className="design-action-button" onClick={() => { setConfirmOpen(false); toast.success("Confirmation pattern previewed; no records changed."); }}>Confirm preview</button></DialogFooter></DialogContent></Dialog>
  </div>;
}

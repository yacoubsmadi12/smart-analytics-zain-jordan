import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Check, ShieldCheck } from "lucide-react";
import NetworkPage from "./NetworkPage";
import RFPerformancePage from "./RFPerformancePage";
import CustomerExperiencePage from "./CustomerExperiencePage";
import CustomersPage from "./CustomersPage";
import ComplaintsPage from "./ComplaintsPage";
import InfrastructureFiberPage from "./InfrastructureFiberPage";
import SalesPage from "./SalesPage";
import MarketingPage from "./MarketingPage";
import BusinessRevenuePage from "./BusinessRevenuePage";
import PrioritiesPage from "./PrioritiesPage";
import AIAssistantPage from "./AIAssistantPage";
import ModulePage from "./ModulePage";
import { trpc } from "@/lib/trpc";

const workspaces = {
  network: { path: "/network", title: "Network Intelligence", tabs: [["overview", "Overview"], ["performance", "Performance"], ["bottlenecks", "Bottlenecks"], ["sites", "Sites"]] },
  customers: { path: "/customers-experience", title: "Customers & Experience", tabs: [["overview", "Overview"], ["complaints", "Complaints"], ["segments", "Segments"]] },
  business: { path: "/business", title: "Business Intelligence", tabs: [["overview", "Revenue"], ["sales", "Sales"], ["marketing", "Marketing"]] },
  decisions: { path: "/decision-support", title: "Decision Support", tabs: [["priorities", "Priority Queue"], ["assistant", "AI Copilot"]] },
  access: { path: "/users-access", title: "Users & Access", tabs: [["users", "Users"], ["roles", "Roles & Permissions"]] },
} as const;
type WorkspaceKey = keyof typeof workspaces;

function RolePermissionsPanel() {
  const query = trpc.auth.permissions.useQuery();
  const grants = query.data?.grants ?? [];
  const groups = [
    ["Command Center", ["dashboard.view"]], ["Network", ["network.view", "map.view"]], ["Customers", ["customers.view", "complaints.view"]],
    ["Business", ["sales.view", "marketing.view", "revenue.view"]], ["Operations", ["infrastructure.view", "ai.ask", "ai.export"]],
    ["Administration", ["data.view", "data.import", "users.manage", "roles.manage", "settings.manage", "audit.view"]],
  ] as const;
  if (query.isLoading) return <div className="auth-loading">Loading effective role permissions…</div>;
  return <main className="standalone-module"><section className="module-page-hero"><div><div className="module-kicker"><ShieldCheck size={13}/> ACCESS GOVERNANCE</div><h1>Roles & Permissions</h1><p>Effective permissions for the signed-in role. Role policy editing is reserved for the secured access-control phase.</p></div></section><section className="role-permissions-panel"><div className="role-permissions-heading"><span>ACTIVE ROLE</span><b>{query.data?.role ?? "Unknown"}</b></div>{groups.map(([name, keys]) => <div className="role-permission-group" key={name}><h2>{name}</h2><div>{keys.map(key => <span className={grants.includes(key) ? "granted" : "not-granted"} key={key}><i>{grants.includes(key) ? <Check size={11}/> : null}</i>{key}</span>)}</div></div>)}</section></main>;
}

export default function WorkspacePage({ workspace }: { workspace: WorkspaceKey }) {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const config = workspaces[workspace];
  const params = new URLSearchParams(search);
  const view = params.get("view") ?? config.tabs[0][0];
  const activeTab = config.tabs.find(([key]) => key === view)?.[0] ?? config.tabs[0][0];
  const changeTab = (key: string) => setLocation(key === config.tabs[0][0] ? config.path : `${config.path}?view=${key}`);
  useEffect(() => {
    if (workspace === "network" && activeTab === "bottlenecks") {
      const timer = window.setTimeout(() => document.querySelector(".network-worst-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
      return () => window.clearTimeout(timer);
    }
  }, [workspace, activeTab]);
  let page: React.ReactNode;
  if (workspace === "network") page = activeTab === "performance" ? <RFPerformancePage/> : activeTab === "sites" ? <ModulePage slug="sites"/> : <NetworkPage/>;
  else if (workspace === "customers") page = activeTab === "complaints" ? <ComplaintsPage/> : activeTab === "segments" ? <CustomersPage/> : <CustomerExperiencePage/>;
  else if (workspace === "business") page = activeTab === "sales" ? <SalesPage/> : activeTab === "marketing" ? <MarketingPage/> : <BusinessRevenuePage/>;
  else if (workspace === "decisions") page = activeTab === "assistant" ? <AIAssistantPage/> : <PrioritiesPage/>;
  else page = activeTab === "roles" ? <RolePermissionsPanel/> : <ModulePage slug="user-management"/>;
  return <section className="consolidated-workspace"><header className="consolidated-workspace-heading"><span className="section-kicker">SMART ANALYTICS WORKSPACE</span><h1>{config.title}</h1></header><nav className="platform-page-tabs" aria-label={`${config.title} views`}>{config.tabs.map(([key, label]) => <button key={key} className={activeTab === key ? "active" : ""} aria-current={activeTab === key ? "page" : undefined} onClick={() => changeTab(key)}>{label}</button>)}</nav><div className="platform-tab-content">{page}</div></section>;
}

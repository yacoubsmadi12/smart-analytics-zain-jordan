import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Activity, Bell, Bot, BriefcaseBusiness, Building2, ChevronDown, ChevronRight, Database, Gauge, Languages, LayoutDashboard, LogOut, Map as MapIcon, Menu, Network, Search, Settings2, ShieldCheck, Users, Workflow } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import "./PlatformShell.css";

type Item = { label: string; path: string; grant: string; icon: typeof Gauge };
const mainItems: Item[] = [
  { label: "Executive Overview", path: "/", grant: "dashboard.view", icon: LayoutDashboard },
  { label: "Network Intelligence", path: "/network", grant: "network.view", icon: Network },
  { label: "Map", path: "/map", grant: "map.view", icon: MapIcon },
  { label: "Customers & Experience", path: "/customers-experience", grant: "customers.view", icon: Users },
  { label: "Business Intelligence", path: "/business", grant: "revenue.view", icon: BriefcaseBusiness },
  { label: "Infrastructure", path: "/infrastructure", grant: "infrastructure.view", icon: Building2 },
  { label: "Decision Support", path: "/decision-support", grant: "dashboard.view", icon: Workflow },
  { label: "Reports", path: "/reports", grant: "dashboard.view", icon: Activity },
];
const adminItems: Item[] = [
  { label: "Data Management", path: "/data-management", grant: "data.view", icon: Database },
  { label: "Users & Access", path: "/users-access", grant: "users.manage", icon: Users },
  { label: "System Settings", path: "/system-settings", grant: "settings.manage", icon: Settings2 },
  { label: "Audit Logs", path: "/audit-logs", grant: "audit.view", icon: ShieldCheck },
];
const titleMap = new Map([...mainItems, ...adminItems].map(item => [item.path, item.label]));
titleMap.set("/design-system", "Design System");

export default function PlatformShell({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const permissions = trpc.auth.permissions.useQuery();
  const [adminOpen, setAdminOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<"ltr" | "rtl">(() => typeof window !== "undefined" && localStorage.getItem("smart-analytics.direction") === "rtl" ? "rtl" : "ltr");
  const grants = useMemo(() => new Set(permissions.data?.grants ?? []), [permissions.data?.grants]);
  const visibleMain = mainItems.filter(item => grants.has(item.grant));
  const visibleAdmin = adminItems.filter(item => grants.has(item.grant));
  const primaryTitle = location === "/" ? "Executive Overview" : titleMap.get(location.split("?")[0]) ?? "Workspace";
  useEffect(() => setMobileOpen(false), [location]);
  useEffect(() => { document.documentElement.dir = direction; localStorage.setItem("smart-analytics.direction", direction); }, [direction]);
  const go = (path: string) => navigate(path);

  return <div className="platform-shell">
    <aside className={`platform-sidebar ${mobileOpen ? "is-open" : ""}`}>
      <div className="platform-brand"><span className="platform-brand-mark"><i /><i /><i /></span><div><b>Smart<span>Analytics</span></b><small>TELECOM INTELLIGENCE</small></div><span className="platform-brand-zain" title="Zain Jordan"><img src="/brand/zain-black-logo.svg" alt="Zain Jordan" width="43" height="12" /></span></div>
      <div className="platform-tenant"><span className="tenant-pulse" /><div><b>Zain Jordan</b><small>Enterprise workspace</small></div><span>DEMO</span></div>
      <nav className="platform-nav" aria-label="Main navigation">
        <div className="platform-nav-caption">WORKSPACES</div>
        {visibleMain.map(item => <button key={item.path} title={item.label} className={`platform-nav-item ${location.split("?")[0] === item.path ? "active" : ""}`} onClick={() => go(item.path)}><item.icon size={16} /><span>{item.label}</span></button>)}
        {visibleAdmin.length > 0 && <><button className="platform-nav-section" onClick={() => setAdminOpen(value => !value)} aria-expanded={adminOpen}><span>ADMINISTRATION</span>{adminOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</button>{adminOpen && visibleAdmin.map(item => <button key={item.path} title={item.label} className={`platform-nav-item platform-nav-admin ${location.split("?")[0] === item.path ? "active" : ""}`} onClick={() => go(item.path)}><item.icon size={15} /><span>{item.label}</span></button>)}</>}
      </nav>
      <div className="platform-sidebar-footer"><span className="platform-online-dot" /> Demo environment · no production writes</div>
    </aside>
    {mobileOpen && <button className="platform-mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <div className="platform-shell-body">
      <header className="platform-topbar">
        <button className="platform-mobile-trigger" onClick={() => setMobileOpen(value => !value)} aria-label="Toggle navigation"><Menu size={18} /></button>
        <div className="platform-breadcrumb"><span>Smart Analytics</span><ChevronRight size={13} /><b>{primaryTitle}</b></div>
        <div className="platform-top-actions">
          <form className="platform-search" onSubmit={event => { event.preventDefault(); if (search.trim()) go(`/network?view=sites&q=${encodeURIComponent(search.trim())}`); }}><Search size={14} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search across the workspace" aria-label="Search across the workspace" /></form>
          <button className="platform-icon-button" onClick={() => go("/decision-support?view=assistant")} aria-label="Open AI Copilot"><Bot size={17} /><span>Copilot</span></button>
          <button className="platform-icon-button platform-direction-toggle" onClick={() => setDirection(value => value === "ltr" ? "rtl" : "ltr")} aria-label={`Switch to ${direction === "ltr" ? "right-to-left" : "left-to-right"} layout`} title="Toggle right-to-left layout"><Languages size={16}/><span>{direction === "ltr" ? "RTL" : "LTR"}</span></button>
          <button className="platform-icon-button platform-bell" onClick={() => go("/alerts")} aria-label="Open notifications"><Bell size={17} /></button>
          <div className="platform-account-wrap"><button className="platform-account" onClick={() => setAccountOpen(value => !value)} aria-expanded={accountOpen} aria-haspopup="menu"><span className="platform-avatar">{(user?.name || "U").slice(0, 1).toUpperCase()}</span><span className="platform-account-copy"><b>{user?.name || "User"}</b><small>{user?.role === "admin" ? "Administrator" : "Authorized user"}</small></span><ChevronDown size={13} /></button>{accountOpen && <div className="platform-account-menu" role="menu"><button role="menuitem" onClick={() => { setAccountOpen(false); go("/account/profile"); }}>Edit profile</button><button role="menuitem" onClick={() => { setAccountOpen(false); go("/account/settings"); }}>Account settings</button>{grants.has("settings.manage") && <button role="menuitem" onClick={() => { setAccountOpen(false); go("/design-system"); }}>Design system</button>}<button className="platform-signout" role="menuitem" onClick={() => void logout()}><LogOut size={14} /> Sign out</button></div>}</div>
        </div>
      </header>
      <main className="platform-shell-content">{children}</main>
    </div>
  </div>;
}

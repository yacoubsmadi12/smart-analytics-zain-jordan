import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, useRoute } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import PlatformShell from "./components/PlatformShell";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ModulePage from "@/pages/ModulePage";
import IntelligenceMapPage from "@/pages/IntelligenceMapPage";
import InfrastructureFiberPage from "./pages/InfrastructureFiberPage";
import ReportsPage from "./pages/ReportsPage";
import AlertsPage from "./pages/AlertsPage";
import SystemSettingsPage from "./pages/SystemSettingsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import AccountPage from "./pages/AccountPage";
import WorkspacePage from "./pages/WorkspacePage";
import DesignSystemPage from "./pages/DesignSystemPage";
import { useAuth } from "@/_core/hooks/useAuth";

function LegacyRedirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => setLocation(to), [setLocation, to]);
  return <div className="auth-loading">Opening the consolidated workspace…</div>;
}
function ProtectedPage({ children }: { children: ReactNode }) { return <PlatformShell>{children}</PlatformShell>; }

function ModuleRoute() {
  const [, params] = useRoute("/:module");
  const slug = params?.module || "network";
  const legacy: Record<string, string> = {
    "executive-overview": "/", "decision-queue": "/decision-support", "rf-performance": "/network?view=performance",
    "sites": "/network?view=sites", "intelligence-map": "/map", "network-overview": "/network",
    "customer-experience": "/customers-experience", "customers": "/customers-experience?view=segments", "complaints": "/customers-experience?view=complaints",
    "infrastructure-fiber": "/infrastructure", "sales": "/business?view=sales", "marketing": "/business?view=marketing", "business-revenue": "/business",
    "priorities": "/decision-support", "ai-assistant": "/decision-support?view=assistant", "user-management": "/users-access", "roles-permissions": "/users-access?view=roles",
    "business-intelligence": "/business", "customers-intelligence": "/customers-experience", "administration": "/data-management",
  };
  if (legacy[slug]) return <LegacyRedirect to={legacy[slug]} />;
  if (slug === "design-system") return <ProtectedPage><DesignSystemPage/></ProtectedPage>;
  if (slug === "network") return <ProtectedPage><WorkspacePage workspace="network"/></ProtectedPage>;
  if (slug === "map") return <ProtectedPage><IntelligenceMapPage/></ProtectedPage>;
  if (slug === "customers-experience") return <ProtectedPage><WorkspacePage workspace="customers"/></ProtectedPage>;
  if (slug === "business") return <ProtectedPage><WorkspacePage workspace="business"/></ProtectedPage>;
  if (slug === "decision-support") return <ProtectedPage><WorkspacePage workspace="decisions"/></ProtectedPage>;
  if (slug === "users-access") return <ProtectedPage><WorkspacePage workspace="access"/></ProtectedPage>;
  if (slug === "infrastructure") return <ProtectedPage><InfrastructureFiberPage/></ProtectedPage>;
  if (slug === "reports") return <ProtectedPage><ReportsPage/></ProtectedPage>;
  if (slug === "alerts") return <ProtectedPage><AlertsPage/></ProtectedPage>;
  if (slug === "data-management") return <ProtectedPage><ModulePage slug="data-management"/></ProtectedPage>;
  if (slug === "system-settings") return <ProtectedPage><SystemSettingsPage/></ProtectedPage>;
  if (slug === "audit-logs") return <ProtectedPage><AuditLogsPage/></ProtectedPage>;
  return <ProtectedPage><ModulePage slug={slug}/></ProtectedPage>;
}

function Router() {
  const [isLoginRoute] = useRoute("/login");
  const { user, loading } = useAuth();
  if (isLoginRoute) return <Login/>;
  if (loading) return <div className="auth-loading"><div className="brand-mark"><span/><span/><span/></div><span>Loading secure workspace…</span></div>;
  return <Switch>
    <Route path="/login" component={Login}/>
    {user ? <>
      <Route path="/" component={() => <ProtectedPage><Home/></ProtectedPage>}/>
      <Route path="/account/profile" component={() => <ProtectedPage><AccountPage mode="profile"/></ProtectedPage>}/>
      <Route path="/account/settings" component={() => <ProtectedPage><AccountPage mode="settings"/></ProtectedPage>}/>
      <Route path="/:module" component={ModuleRoute}/>
    </> : <>
      <Route path="/" component={Login}/>
      <Route path="/:module" component={Login}/>
    </>}
    <Route path="/404" component={NotFound}/>
    <Route component={NotFound}/>
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster theme="dark"/><Router/></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

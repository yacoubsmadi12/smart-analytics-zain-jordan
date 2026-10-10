import { useState } from "react";
import { ArrowRight, BrainCircuit, LockKeyhole, RadioTower, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

function SmartMark({ large = false }: { large?: boolean }) {
  return <span className={`smart-mark ${large ? "smart-mark-large" : ""}`} aria-hidden="true"><span className="smart-core" /><i className="smart-orbit orbit-one" /><i className="smart-orbit orbit-two" /><i className="smart-node node-one" /><i className="smart-node node-two" /><i className="smart-node node-three" /></span>;
}

const networkDomains = [
  ["Network performance", "Radio, core and availability"],
  ["Customer experience", "Signals, service and care"],
  ["Business intelligence", "Revenue, trends and risk"],
  ["Decision support", "Evidence to next action"],
];

export default function Login() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = trpc.auth.localLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/");
    },
  });

  return <main className="network-login">
    <section className="network-login-visual" aria-label="SmartAnalytics telecom intelligence">
      <div className="network-login-grid" aria-hidden="true" />
      <header className="network-login-header">
        <div className="network-login-brand"><span className="network-login-zain-logo"><img src="/brand/zain-black-logo.svg" alt="Zain Jordan" width="66" height="18" /></span><div><strong>Smart<span>Analytics</span></strong><small>TELECOM INTELLIGENCE</small></div></div>
        <div className="network-login-roles" aria-label="Platform capabilities"><span>Network Ops</span><i /><span>AI Director</span><i /><span>BI Manager</span><i /><span>Data Engineering</span></div>
      </header>

      <div className="network-login-copy">
        <span className="network-login-eyebrow"><i /> ZAIN JORDAN · COMMAND CENTER</span>
        <h1>Every signal<br /><em>tells a story.</em></h1>
        <p>Connect network performance, customer experience and business impact in one decision-ready workspace.</p>
      </div>

      <div className="network-login-diagram" aria-hidden="true">
        <svg viewBox="0 0 720 520" role="presentation">
          <defs>
            <linearGradient id="network-line" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--chart-1)" stopOpacity=".08" /><stop offset=".5" stopColor="var(--chart-3)" stopOpacity=".82" /><stop offset="1" stopColor="var(--chart-2)" stopOpacity=".35" /></linearGradient>
            <radialGradient id="network-core"><stop stopColor="#fff" /><stop offset=".2" stopColor="var(--chart-1)" /><stop offset="1" stopColor="var(--chart-3)" stopOpacity=".06" /></radialGradient>
            <filter id="network-glow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          <g className="network-login-links" fill="none" stroke="url(#network-line)">
            <path d="M102 312 190 230 287 274 368 141 470 184 588 82" /><path d="m190 230 25-128 153 39 102 43 61 135" /><path d="m102 312 81 103 104-141 87 105 97-195 119 96" /><path d="m215 102 72 172 81 131 102-221" /><path d="m368 141 118 229 102-96" /><path d="m287 274 189-90 112-102" />
          </g>
          <g className="network-login-nodes" filter="url(#network-glow)">
            <circle cx="102" cy="312" r="7" /><circle cx="190" cy="230" r="6" /><circle cx="287" cy="274" r="8" /><circle cx="368" cy="141" r="7" /><circle cx="470" cy="184" r="6" /><circle cx="588" cy="82" r="5" /><circle cx="215" cy="102" r="5" /><circle cx="183" cy="415" r="5" /><circle cx="287" cy="274" r="23" className="network-login-core" /><circle cx="470" cy="370" r="6" /><circle cx="572" cy="274" r="7" />
          </g>
        </svg>
        <div className="network-login-orbit network-login-orbit-one" /><div className="network-login-orbit network-login-orbit-two" />
        <span className="network-login-diagram-tag"><RadioTower size={13} /> Connected network</span>
      </div>

      <div className="network-login-domains" aria-label="Workspace domains">
        {networkDomains.map(([title, description], index) => <div className="network-login-domain" key={title}><span className={`network-login-domain-icon domain-${index}`}><i /></span><span><b>{title}</b><small>{description}</small></span><ArrowRight size={14} /></div>)}
      </div>
      <footer className="network-login-footer"><span>AI-POWERED · VERIFIED · ACTIONABLE</span><span>JORDAN NETWORK INTELLIGENCE</span></footer>
    </section>

    <section className="network-login-access">
      <div className="network-login-card">
        <div className="network-login-card-top"><div className="network-login-card-logo"><SmartMark /><span>SMARTANALYTICS / ZAIN JORDAN</span></div><span className="network-login-secure"><ShieldCheck size={13} /> SECURE ACCESS</span></div>
        <div className="network-login-welcome"><span className="network-login-eyebrow">WELCOME TO THE COMMAND CENTER</span><h2>Welcome back</h2><p>Sign in to continue to your telecom intelligence workspace.</p></div>
        <form onSubmit={event => { event.preventDefault(); if (username.trim() && password) login.mutate({ username, password }); }}>
          <label><span>Username</span><div className="network-login-input"><UserRound size={16} /><input autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="Enter username" /></div></label>
          <label><span>Password</span><div className="network-login-input"><LockKeyhole size={16} /><input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter password" /></div></label>
          {login.error && <div className="network-login-error" role="alert">Unable to sign in. Check your username and password.</div>}
          <Button className="network-login-submit" type="submit" disabled={login.isPending || !username.trim() || !password}>{login.isPending ? "Opening workspace…" : <>Enter command center <ArrowRight size={16} /></>}</Button>
        </form>
        <div className="network-login-security"><ShieldCheck size={14} /><span>Protected local session · RBAC enforced</span></div>
        <div className="network-login-privacy"><BrainCircuit size={15} /><span>Your access is governed by your assigned role and workspace permissions.</span></div>
      </div>
      <small className="network-login-legal">SmartAnalytics · Telecom intelligence for Zain Jordan</small>
    </section>
  </main>;
}

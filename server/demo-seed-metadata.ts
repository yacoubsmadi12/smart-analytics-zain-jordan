import { scryptSync } from "node:crypto";

export const DEMO_ROLE_SEEDS = [
  { name: "Admin", username: "admin", displayName: "Demo Administrator" },
  { name: "Executive", username: "executive.demo", displayName: "Jordan Executive" },
  { name: "Network Engineer", username: "network.demo", displayName: "Network Engineer" },
  { name: "CX Analyst", username: "cx.demo", displayName: "Customer Experience Analyst" },
  { name: "Business Analyst", username: "business.demo", displayName: "Business Analyst" },
  { name: "Viewer", username: "viewer.demo", displayName: "Read-only Viewer" },
] as const;
const DEMO_SEED_SALT = "smart-analytics-demo-seed-v1";
const demoHash = (username: string) => scryptSync(`demo-only:${username}`, `${DEMO_SEED_SALT}:${username}`, 64).toString("hex");

export function generateDemoSeedMetadata(generatedAt = "2026-08-26T08:00:00.000Z") {
  const users = DEMO_ROLE_SEEDS.map((role, index) => ({ username: role.username, displayName: role.displayName, role: role.name, passwordHash: demoHash(role.username), isActive: true, regionScope: index === 0 || index === 1 ? "all" : ["Amman", "Irbid"][index % 2], isDemo: true }));
  const actions = ["auth.login", "settings.update", "data.import.validate", "decision.assign", "task.create", "report.export", "alert.acknowledge", "user.update", "data.source.test", "decision.defer"];
  const resources = ["session", "priorityWeights", "complaints", "decision JO-AMD-014", "task Fiber review", "Executive report", "alert INC-024", "user network.demo", "source KPI_API", "decision CX-IRB-009"];
  const actors = DEMO_ROLE_SEEDS.map(role => role.username);
  const auditEvents = Array.from({ length: 40 }, (_, index) => ({ occurredAt: new Date(Date.parse(generatedAt) - (39 - index) * 3_600_000).toISOString(), username: actors[index % actors.length], action: actions[index % actions.length], resource: resources[index % resources.length], before: index % 3 === 0 ? { status: "open" } : null, after: { status: index % 3 === 0 ? "in_progress" : "success" }, result: index % 13 === 0 ? "warning" : "success", isDemo: true }));
  return { roles: DEMO_ROLE_SEEDS.map(({ name, displayName }) => ({ name, description: `${displayName} demo role`, isSystem: true })), users, auditEvents };
}

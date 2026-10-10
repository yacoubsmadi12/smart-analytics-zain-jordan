import { describe, expect, it } from "vitest";
import { buildSafeAuditEvent, recordAuditEvent } from "./audit-service";
import { generateDemoSeedMetadata } from "./demo-seed-metadata";

describe("audit event safety", () => {
  it("omits credential and token fields recursively from before/after snapshots", () => {
    const event = buildSafeAuditEvent({ action: "user.update", before: { name: "Analyst", passwordHash: "never-log", nested: { apiKey: "never-log", role: "viewer" } }, after: { role: "admin", accessToken: "never-log" } });
    expect(event.beforeJson).toContain("Analyst");
    expect(event.beforeJson).toContain("viewer");
    expect(event.beforeJson).not.toContain("never-log");
    expect(event.afterJson).toContain("admin");
    expect(event.afterJson).not.toContain("accessToken");
  });
  it("passes only the sanitized payload to the persistence boundary", async () => {
    let written: unknown;
    const event = await recordAuditEvent({ action: "data.import", after: { secret: "hidden", rowCount: 4 } }, async safe => { written = safe; });
    expect(written).toEqual(event);
    expect(event.afterJson).toBe('{"rowCount":4}');
  });
  it("seeds the requested demo roles and 30-50 demo events using password hashes", () => {
    const seed = generateDemoSeedMetadata();
    expect(seed.roles.map(role => role.name)).toEqual(["Admin", "Executive", "Network Engineer", "CX Analyst", "Business Analyst", "Viewer"]);
    expect(seed.users).toHaveLength(6);
    expect(seed.users.every(user => /^[a-f0-9]{128}$/.test(user.passwordHash))).toBe(true);
    expect(seed.auditEvents.length).toBeGreaterThanOrEqual(30);
    expect(seed.auditEvents.length).toBeLessThanOrEqual(50);
    expect(seed.auditEvents.every(event => event.isDemo)).toBe(true);
  });
});

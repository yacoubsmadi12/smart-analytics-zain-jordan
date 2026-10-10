export type AuditEventInput = {
  occurredAt?: Date;
  userId?: number | null;
  action: string;
  resource?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  result?: "success" | "failure" | "warning";
  isDemo?: boolean;
};
export type SafeAuditEvent = Omit<AuditEventInput, "before" | "after"> & { beforeJson: string | null; afterJson: string | null };

const SENSITIVE_KEY = /(password|secret|token|authorization|cookie|credential|private.?key|api.?key)/i;
function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !SENSITIVE_KEY.test(key)).map(([key, nested]) => [key, sanitize(nested)]));
}
function safeJson(value: unknown) {
  if (value === undefined || value === null) return null;
  return JSON.stringify(sanitize(value)).slice(0, 32_000);
}

/** Central audit event boundary: redact secrets, normalize time/result and serialize snapshots. */
export function buildSafeAuditEvent(input: AuditEventInput): SafeAuditEvent {
  if (!input.action.trim()) throw new Error("Audit action is required");
  return {
    occurredAt: input.occurredAt ?? new Date(),
    userId: input.userId ?? null,
    action: input.action.trim().slice(0, 120),
    resource: input.resource?.slice(0, 160) ?? null,
    beforeJson: safeJson(input.before),
    afterJson: safeJson(input.after),
    ipAddress: input.ipAddress?.slice(0, 64) ?? null,
    result: input.result ?? "success",
    isDemo: input.isDemo ?? false,
  };
}

export async function recordAuditEvent(input: AuditEventInput, persist: (event: SafeAuditEvent) => Promise<void>) {
  const event = buildSafeAuditEvent(input);
  await persist(event);
  return event;
}

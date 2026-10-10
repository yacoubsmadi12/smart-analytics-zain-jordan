export type SystemConfig = {
  thresholds: { congestionPct: number; availabilityPct: number; churnRiskPct: number; complaintGrowthPct: number };
  priorityWeights: { network: number; customer: number; revenue: number };
  refreshIntervalSeconds: number;
  timezone: string;
  currency: "JOD";
  language: "en" | "ar";
};

export const DEFAULT_SYSTEM_CONFIG: Readonly<SystemConfig> = Object.freeze({
  thresholds: { congestionPct: 85, availabilityPct: 97, churnRiskPct: 7, complaintGrowthPct: 20 },
  priorityWeights: { network: 0.45, customer: 0.25, revenue: 0.3 },
  refreshIntervalSeconds: 300,
  timezone: "Asia/Amman",
  currency: "JOD",
  language: "en",
});

let activeConfig: SystemConfig = structuredClone(DEFAULT_SYSTEM_CONFIG);
export function getSystemConfig(): SystemConfig { return structuredClone(activeConfig); }
export function updateSystemConfig(patch: Partial<SystemConfig>): SystemConfig {
  activeConfig = { ...activeConfig, ...patch, thresholds: { ...activeConfig.thresholds, ...(patch.thresholds ?? {}) }, priorityWeights: normalizeWeights(patch.priorityWeights ?? activeConfig.priorityWeights) };
  return getSystemConfig();
}
export function resetSystemConfig() { activeConfig = structuredClone(DEFAULT_SYSTEM_CONFIG); }

export function normalizeWeights(weights: SystemConfig["priorityWeights"]): SystemConfig["priorityWeights"] {
  const values = [weights.network, weights.customer, weights.revenue];
  if (values.some(value => !Number.isFinite(value) || value < 0)) throw new Error("Priority weights must be finite non-negative numbers");
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) throw new Error("At least one priority weight must be greater than zero");
  const network = weights.network / total;
  const customer = weights.customer / total;
  return { network, customer, revenue: 1 - network - customer };
}

export function scoreDecision(input: { network: number; customer: number; revenue: number }, config: SystemConfig = DEFAULT_SYSTEM_CONFIG) {
  const weights = normalizeWeights(config.priorityWeights);
  const bounded = (value: number) => Math.max(0, Math.min(100, value));
  return Number((bounded(input.network) * weights.network + bounded(input.customer) * weights.customer + bounded(input.revenue) * weights.revenue).toFixed(2));
}

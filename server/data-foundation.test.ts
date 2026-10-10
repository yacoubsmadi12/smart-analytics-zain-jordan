import { describe, expect, it } from "vitest";
import { csvTemplate, validateRows } from "./data-contract";
import { calculateMetrics, formatDateAmman, formatJod, formatPercent, generateDemoDataset, METRIC_DEFINITIONS } from "./metrics-service";
import { DEFAULT_SYSTEM_CONFIG, normalizeWeights, scoreDecision } from "./system-config";
import { buildSyntheticBusinessRevenue, buildSyntheticComplaints, buildSyntheticCustomers, buildSyntheticNetworkOperations, buildSyntheticSales, syntheticMapSites } from "./synthetic-operations";
import { rankPriorities, type PriorityInput } from "./priorities-analytics";

describe("canonical demo data and metrics", () => {
  it("reconciles every governorate subtotal to its platform total", () => {
    const dataset = generateDemoDataset({ siteCount: 120 });
    const metrics = calculateMetrics(dataset);
    expect(metrics.regions.reduce((sum, region) => sum + region.sites, 0)).toBe(metrics.sites);
    expect(metrics.regions.reduce((sum, region) => sum + region.customers, 0)).toBe(metrics.customers);
    expect(metrics.regions.reduce((sum, region) => sum + region.complaintsOpen, 0)).toBe(metrics.complaintsOpen);
    expect(metrics.regions.reduce((sum, region) => sum + region.revenueAtRiskJod, 0)).toBe(metrics.revenueAtRiskJod);
    expect(metrics.regions.reduce((sum, region) => sum + region.weightedPipelineJod, 0)).toBe(metrics.weightedPipelineJod);
    expect(metrics.regions).toHaveLength(12);
  });
  it("is deterministic for the same seed and uses plausible Jordan coordinates", () => {
    const a = generateDemoDataset({ seed: 42, siteCount: 48 });
    const b = generateDemoDataset({ seed: 42, siteCount: 48 });
    expect(a.sites).toEqual(b.sites);
    expect(a.kpiTimeseries).toHaveLength(48 * 7);
    expect(a.sites.every(site => site.latitude >= 29 && site.latitude <= 34 && site.longitude >= 34 && site.longitude <= 40)).toBe(true);
    expect(new Set(a.sites.map(site => `${site.availabilityPct}:${site.congestionPct}`)).size).toBeGreaterThan(20);
  });
  it("defines a single formula and source table for each canonical KPI", () => {
    expect(new Set(METRIC_DEFINITIONS.map(metric => metric.key)).size).toBe(METRIC_DEFINITIONS.length);
    expect(METRIC_DEFINITIONS.every(metric => metric.formula.length > 0 && metric.sourceTable.length > 0)).toBe(true);
    const metrics = calculateMetrics(generateDemoDataset());
    expect(metrics).toMatchObject({ sites: 5250, customers: 126000, complaintsOpen: 8400, revenueAtRiskJod: 1510000, weightedPipelineJod: 2650000 });
  });
  it("feeds existing demo modules from the same reconciled top-line metrics", () => {
    const metrics = calculateMetrics();
    expect(buildSyntheticNetworkOperations().summary.availability).toBe(metrics.networkHealthPct);
    expect(buildSyntheticCustomers().summary.totalCustomers).toBe(metrics.customers);
    expect(buildSyntheticComplaints().summary.openComplaints).toBe(metrics.complaintsOpen);
    expect(buildSyntheticComplaints().summary.totalComplaints).toBe(metrics.complaintsTotal);
    expect(buildSyntheticBusinessRevenue().summary.revenueAtRisk).toBe(metrics.revenueAtRiskJod);
    expect(buildSyntheticSales().summary.pipelineValue).toBe(metrics.weightedPipelineJod);
    expect(buildSyntheticSales().summary.weightedPipeline).toBe(metrics.weightedPipelineJod);
  });
  it("keeps governorate names on map-site records", () => {
    const governorates = new Set(generateDemoDataset({ siteCount: 120 }).regions.map(region => region.governorate));
    const mapSites = syntheticMapSites(120);
    expect(mapSites.every(site => governorates.has(site.region))).toBe(true);
    expect(new Set(mapSites.map(site => site.region)).size).toBe(12);
  });
  it("normalizes priority weights and changes scores when weights change", () => {
    expect(Object.values(normalizeWeights({ network: 4, customer: 3, revenue: 3 })).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    const signal = { network: 95, customer: 30, revenue: 40 };
    const networkHeavy = { ...DEFAULT_SYSTEM_CONFIG, priorityWeights: { network: 0.8, customer: 0.1, revenue: 0.1 } };
    const revenueHeavy = { ...DEFAULT_SYSTEM_CONFIG, priorityWeights: { network: 0.1, customer: 0.1, revenue: 0.8 } };
    expect(scoreDecision(signal, networkHeavy)).toBeGreaterThan(scoreDecision(signal, revenueHeavy));
    const items: PriorityInput[] = [
      { id: "network", region: "Amman", issue: "Network", category: "network", score: 90, severity: "high", affectedCustomers: 900, revenueRisk: 20_000, salesPipeline: 0, complaintCount: 20, networkHealth: 5, action: "Fix", rationale: "Network impact" },
      { id: "revenue", region: "Irbid", issue: "Revenue", category: "commercial", score: 90, severity: "high", affectedCustomers: 100, revenueRisk: 900_000, salesPipeline: 0, complaintCount: 1, networkHealth: 90, action: "Review", rationale: "Revenue impact" },
    ];
    expect(rankPriorities(items, 2, networkHeavy)[0]?.id).toBe("network");
    expect(rankPriorities(items, 2, revenueHeavy)[0]?.id).toBe("revenue");
  });
  it("formats percentages, JOD and dates without floating-point artifacts", () => {
    expect(formatPercent(8.399999999999999)).toBe("8.4%");
    expect(formatJod(33000)).toBe("33,000 JOD");
    expect(formatDateAmman("2026-10-07T06:00:00.000Z")).toContain("09:00");
  });
});

describe("dataset import contract validation", () => {
  it("reports missing, mistyped, duplicate, and invalid coordinate fields with spreadsheet row numbers", () => {
    const report = validateRows("sites", [
      { siteCode: "JO-1", name: "Amman site", governorate: "Amman", latitude: 31.9, longitude: 36.0 },
      { siteCode: "JO-1", name: "Duplicate", governorate: "Amman", latitude: 95, longitude: "east" },
      { siteCode: "", name: "Missing identity", governorate: "Amman", latitude: 31, longitude: 36 },
    ]);
    expect(report.rows).toBe(3);
    expect(report.invalidRows).toBe(2);
    expect(report.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 3, code: "duplicate", field: "siteCode" }),
      expect.objectContaining({ row: 3, code: "coordinate", field: "latitude" }),
      expect.objectContaining({ row: 3, code: "type", field: "longitude" }),
      expect.objectContaining({ row: 4, code: "required", field: "siteCode" }),
    ]));
  });
  it("provides CSV templates from the canonical contract", () => {
    expect(csvTemplate("sites")).toContain("siteCode,name,governorate");
    expect(csvTemplate("kpiTimeseries")).toContain("recordedAt");
  });
});

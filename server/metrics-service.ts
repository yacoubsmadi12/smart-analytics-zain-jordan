import { getSystemConfig, type SystemConfig, scoreDecision } from "./system-config";

export const JORDAN_GOVERNORATES = [
  { name: "Amman", districts: ["Qasabat Amman", "Sahab", "Marka"], neighborhoods: ["Abdali", "Jabal Amman", "Khalda", "Sahab", "Marka"] },
  { name: "Irbid", districts: ["Qasabat Irbid", "Bani Obeid", "Ramtha"], neighborhoods: ["Irbid City", "Al Husn", "Ramtha", "Aydoun", "Bani Kinana"] },
  { name: "Zarqa", districts: ["Qasabat Zarqa", "Ruseifa", "Azraq"], neighborhoods: ["New Zarqa", "Ruseifa", "Hashemiyah", "Azraq", "Jabal Tareq"] },
  { name: "Balqa", districts: ["Salt", "Deir Alla", "Mahis and Fuheis"], neighborhoods: ["As-Salt", "Fuheis", "Mahis", "Deir Alla", "Ain Al-Basha"] },
  { name: "Aqaba", districts: ["Qasabat Aqaba", "Wadi Araba"], neighborhoods: ["Aqaba City", "Al-Hafayer", "Quwayra", "Wadi Rum", "Disi"] },
  { name: "Mafraq", districts: ["Qasabat Mafraq", "Badia Shmaliyah", "Ruwaished"], neighborhoods: ["Mafraq City", "Rehab", "Balama", "Ruwaished", "North Badia"] },
  { name: "Madaba", districts: ["Qasabat Madaba", "Dhiban"], neighborhoods: ["Madaba City", "Dhiban", "Maal", "Jabal Bani Hamida", "Lib"] },
  { name: "Karak", districts: ["Qasabat Karak", "Mazar Janubi", "Qasr"], neighborhoods: ["Karak City", "Mazar", "Qasr", "Ayy", "Ghor Al-Safi"] },
  { name: "Jerash", districts: ["Qasabat Jerash", "Northern Jordan Valley"], neighborhoods: ["Jerash City", "Souf", "Sakib", "Burma", "Dibbin"] },
  { name: "Ajloun", districts: ["Qasabat Ajloun", "Kufranjah"], neighborhoods: ["Ajloun City", "Kufranjah", "Anjara", "Sakhra", "Rasoun"] },
  { name: "Tafilah", districts: ["Qasabat Tafilah", "Bussaira"], neighborhoods: ["Tafilah City", "Bussaira", "Aima", "Hasa", "Qadisiyah"] },
  { name: "Ma'an", districts: ["Qasabat Ma'an", "Petra", "Shobak"], neighborhoods: ["Ma'an City", "Wadi Musa", "Shobak", "Jafr", "Husseiniya"] },
] as const;

export type DemoSite = { siteCode: string; name: string; governorate: string; district: string; neighborhood: string; latitude: number; longitude: number; availabilityPct: number; congestionPct: number; throughputMbps: number; status: "healthy" | "warning" | "critical" };
export type DemoRegionMetrics = { governorate: string; districts: string[]; neighborhoods: string[]; sites: number; customers: number; complaintsTotal: number; complaintsOpen: number; revenueAtRiskJod: number; weightedPipelineJod: number; networkHealthPct: number; churnRiskPct: number };
export type DemoDataset = { seed: number; generatedAt: string; regions: DemoRegionMetrics[]; sites: DemoSite[]; kpiTimeseries: Array<{ siteCode: string; recordedAt: string; availabilityPct: number; congestionPct: number; throughputMbps: number }> };

const seed = 20261007;
function rng(seedValue: number) {
  let state = seedValue >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 0x100000000; };
}
const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));
const generatedAt = "2026-08-26T08:00:00.000Z";
const customerTotals = [31500, 16500, 14200, 9600, 7600, 6200, 5900, 7200, 4100, 3400, 2900, 16900];
const complaintTotals = [2450, 1200, 950, 640, 500, 410, 390, 460, 270, 210, 180, 740];
const atRiskTotals = [410000, 185000, 156000, 96000, 88000, 67000, 62000, 73000, 40000, 31000, 27000, 275000];
const pipelineTotals = [575000, 245000, 220000, 170000, 165000, 145000, 130000, 170000, 115000, 100000, 90000, 525000];

export function generateDemoDataset(options: { seed?: number; siteCount?: number; generatedAt?: string } = {}): DemoDataset {
  const random = rng(options.seed ?? seed);
  const siteCount = Math.max(12, Math.min(5250, Math.floor(options.siteCount ?? 5250)));
  const siteBuckets = Array.from({ length: JORDAN_GOVERNORATES.length }, () => 0);
  for (let i = 0; i < siteCount; i++) siteBuckets[i % siteBuckets.length]++;
  const sites: DemoSite[] = Array.from({ length: siteCount }, (_, i) => {
    const regionIndex = i % JORDAN_GOVERNORATES.length;
    const geo = JORDAN_GOVERNORATES[regionIndex];
    const neighborhoodIndex = Math.floor(random() * geo.neighborhoods.length);
    const baseCongestion = 49 + random() * 33 + (i % 37 === 0 ? 23 : 0);
    const congestionPct = round(Math.min(99.5, baseCongestion));
    const availabilityPct = round(Math.max(87, 99.65 - random() * 3.8 - (congestionPct > 88 ? 1.4 : 0)));
    const status = availabilityPct < 94 || congestionPct >= 94 ? "critical" : availabilityPct < 97 || congestionPct >= 85 ? "warning" : "healthy";
    const centers = [ [31.9539,35.9106], [32.5568,35.8469], [32.0728,36.088], [32.0392,35.7272], [29.5321,35.0063], [32.3429,36.208], [31.7167,35.7938], [31.1853,35.7048], [32.2808,35.8993], [32.3333,35.7528], [30.8375,35.6044], [30.1927,35.7367] ] as const;
    const [lat, lon] = centers[regionIndex];
    return { siteCode: `JO-${String(i + 1).padStart(5, "0")}`, name: `${geo.name} ${geo.neighborhoods[neighborhoodIndex]} ${String(1 + (i % 18)).padStart(2, "0")}`, governorate: geo.name, district: geo.districts[i % geo.districts.length], neighborhood: geo.neighborhoods[neighborhoodIndex], latitude: round(lat + (random() - 0.5) * 0.08, 6), longitude: round(lon + (random() - 0.5) * 0.08, 6), availabilityPct, congestionPct, throughputMbps: round(Math.max(6, 112 - congestionPct * 0.88 + random() * 14), 1), status };
  });
  const kpiTimeseries = sites.flatMap(site => Array.from({ length: 7 }, (_, day) => {
    const drift = (random() - 0.5) * 1.8;
    return { siteCode: site.siteCode, recordedAt: new Date(Date.parse(options.generatedAt ?? generatedAt) - (6 - day) * 86_400_000).toISOString(), availabilityPct: round(Math.max(85, Math.min(100, site.availabilityPct + drift))), congestionPct: round(Math.max(10, Math.min(100, site.congestionPct + (random() - 0.5) * 10))), throughputMbps: round(Math.max(1, site.throughputMbps + (random() - 0.5) * 9), 1) };
  }));
  const regions = JORDAN_GOVERNORATES.map((geo, i) => {
    const regionalSites = sites.filter(site => site.governorate === geo.name);
    const networkHealthPct = round(regionalSites.reduce((sum, site) => sum + site.availabilityPct, 0) / Math.max(1, regionalSites.length));
    const churnRiskPct = round(3.2 + (i % 5) * 0.57 + (i === 11 ? 1.1 : 0));
    const resolvedComplaints = Math.floor(complaintTotals[i] * 0.25) + (i === complaintTotals.length - 1 ? 3 : 0);
    return { governorate: geo.name, districts: [...geo.districts], neighborhoods: [...geo.neighborhoods], sites: siteBuckets[i], customers: customerTotals[i], complaintsTotal: complaintTotals[i] + resolvedComplaints, complaintsOpen: complaintTotals[i], revenueAtRiskJod: atRiskTotals[i], weightedPipelineJod: pipelineTotals[i], networkHealthPct, churnRiskPct };
  });
  // Total customers, open complaints and revenue are deliberate reconciled controls.
  return { seed: options.seed ?? seed, generatedAt: options.generatedAt ?? generatedAt, regions, sites, kpiTimeseries };
}

let cachedDataset: DemoDataset | undefined;
export function getDemoDataset() { return cachedDataset ??= generateDemoDataset(); }
export function clearDemoDatasetCache() { cachedDataset = undefined; }

export type MetricDefinition = { key: string; label: string; unit: "percent" | "count" | "JOD"; formula: string; sourceTable: string };
export const METRIC_DEFINITIONS: readonly MetricDefinition[] = [
  { key: "networkHealthPct", label: "Network health", unit: "percent", formula: "Arithmetic mean of latest site availabilityPct", sourceTable: "KPI_Timeseries (latest per site)" },
  { key: "sites", label: "Sites", unit: "count", formula: "Count of distinct siteCode", sourceTable: "Sites" },
  { key: "customers", label: "Customers", unit: "count", formula: "Count of customerRef", sourceTable: "Customers" },
  { key: "complaintsOpen", label: "Open complaints", unit: "count", formula: "Count of complaints where status != resolved", sourceTable: "Complaints" },
  { key: "revenueAtRiskJod", label: "Revenue at risk", unit: "JOD", formula: "Sum of monthly at-risk revenue by governorate", sourceTable: "Revenues" },
  { key: "weightedPipelineJod", label: "Weighted sales pipeline", unit: "JOD", formula: "Sum(valueJod × probabilityPct / 100)", sourceTable: "Opportunities" },
];

export function calculateMetrics(dataset: DemoDataset = getDemoDataset(), config: SystemConfig = getSystemConfig()) {
  const totalSites = dataset.regions.reduce((sum, region) => sum + region.sites, 0);
  const totalCustomers = dataset.regions.reduce((sum, region) => sum + region.customers, 0);
  const openComplaints = dataset.regions.reduce((sum, region) => sum + region.complaintsOpen, 0);
  const revenueAtRiskJod = dataset.regions.reduce((sum, region) => sum + region.revenueAtRiskJod, 0);
  const weightedPipelineJod = dataset.regions.reduce((sum, region) => sum + region.weightedPipelineJod, 0);
  const networkHealthPct = round(dataset.sites.reduce((sum, site) => sum + site.availabilityPct, 0) / Math.max(1, dataset.sites.length));
  const totalComplaints = dataset.regions.reduce((sum, region) => sum + region.complaintsTotal, 0);
  const regions = dataset.regions.map(region => ({ ...region, priorityScore: scoreDecision({ network: Math.max(0, 100 - region.networkHealthPct), customer: region.churnRiskPct * 10, revenue: region.revenueAtRiskJod / Math.max(1, revenueAtRiskJod) * 100 }, config) }));
  return { updatedAt: dataset.generatedAt, source: "demo" as const, networkHealthPct, sites: totalSites, customers: totalCustomers, complaintsOpen: openComplaints, complaintsTotal: totalComplaints, revenueAtRiskJod, weightedPipelineJod, regions };
}

export function formatPercent(value: number, decimals = 1) { return `${round(value, decimals)}%`; }
export function formatJod(value: number, compact = false) {
  const rounded = Math.round(value);
  if (compact && Math.abs(rounded) >= 1_000_000) return `${(rounded / 1_000_000).toFixed(2)}M JOD`;
  if (compact && Math.abs(rounded) >= 1_000) return `${(rounded / 1_000).toFixed(1)}K JOD`;
  return `${new Intl.NumberFormat("en-JO", { maximumFractionDigits: 0 }).format(rounded)} JOD`;
}
export function formatDateAmman(value: string | Date) { return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Amman", dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

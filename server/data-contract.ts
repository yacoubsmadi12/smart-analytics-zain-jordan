/** Canonical schema contract shared by import validation, seed generation and metrics. */
export const ENTITY_SCHEMAS = {
  regions: {
    required: ["governorate", "district", "neighborhood"],
    fields: { governorate: "string", district: "string", neighborhood: "string", code: "string" },
  },
  sites: {
    required: ["siteCode", "name", "governorate", "latitude", "longitude"],
    fields: { siteCode: "string", name: "string", governorate: "string", district: "string", neighborhood: "string", latitude: "number", longitude: "number", technology: "string", status: "string" },
  },
  cells: {
    required: ["cellCode", "siteCode", "technology"],
    fields: { cellCode: "string", siteCode: "string", technology: "string", availabilityPct: "number", congestionPct: "number", throughputMbps: "number" },
  },
  kpiTimeseries: {
    required: ["siteCode", "recordedAt"],
    fields: { siteCode: "string", recordedAt: "date", availabilityPct: "number", trafficTb: "number", congestionPct: "number", throughputMbps: "number" },
  },
  customers: {
    required: ["customerRef", "segment", "governorate"],
    fields: { customerRef: "string", segment: "string", governorate: "string", district: "string", churnRiskPct: "number", lifetimeValueJod: "number" },
  },
  complaints: {
    required: ["complaintRef", "category", "severity", "status", "createdAt"],
    fields: { complaintRef: "string", customerRef: "string", siteCode: "string", category: "string", severity: "string", status: "string", createdAt: "date", governorate: "string" },
  },
  campaigns: {
    required: ["campaignRef", "name", "governorate", "status"],
    fields: { campaignRef: "string", name: "string", governorate: "string", segment: "string", budgetJod: "number", conversionPct: "number", status: "string" },
  },
  opportunities: {
    required: ["opportunityRef", "stage", "valueJod", "probabilityPct"],
    fields: { opportunityRef: "string", customerRef: "string", siteCode: "string", governorate: "string", stage: "string", valueJod: "number", probabilityPct: "number" },
  },
  fiberNodes: {
    required: ["nodeCode", "governorate", "status"],
    fields: { nodeCode: "string", governorate: "string", latitude: "number", longitude: "number", capacityMbps: "number", availabilityPct: "number", status: "string" },
  },
} as const;

export type EntityKey = keyof typeof ENTITY_SCHEMAS;
export type FieldKind = "string" | "number" | "date";
export type ValidationIssue = { row: number; field: string; code: "required" | "type" | "duplicate" | "coordinate" | "date"; message: string };

export function validateRows(entity: EntityKey, rows: Record<string, unknown>[]) {
  const schema = ENTITY_SCHEMAS[entity];
  const issues: ValidationIssue[] = [];
  const required = new Set<string>(schema.required);
  const fields = schema.fields as Record<string, FieldKind>;
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    const rowNumber = index + 2; // spreadsheet header is row 1
    for (const field of Array.from(required)) {
      if (row[field] === undefined || row[field] === null || row[field] === "")
        issues.push({ row: rowNumber, field, code: "required", message: `Required field ${field} is missing` });
    }
    for (const [field, kind] of Object.entries(fields)) {
      const value = row[field];
      if (value === undefined || value === null || value === "") continue;
      const valid = kind === "number" ? typeof value === "number" && Number.isFinite(value) : kind === "date" ? !Number.isNaN(Date.parse(String(value))) : typeof value === "string";
      if (!valid) issues.push({ row: rowNumber, field, code: kind === "date" ? "date" : "type", message: `Expected ${kind} for ${field}` });
    }
    const identityField = Object.keys(fields).find(key => /^(siteCode|cellCode|customerRef|complaintRef|campaignRef|opportunityRef|nodeCode)$/.test(key));
    const identity = identityField ? String(row[identityField] ?? "") : "";
    if (identity && seen.has(identity)) issues.push({ row: rowNumber, field: identityField!, code: "duplicate", message: `Duplicate ${identityField}: ${identity}` });
    if (identity) seen.add(identity);
    if (typeof row.latitude === "number" && (row.latitude < -90 || row.latitude > 90)) issues.push({ row: rowNumber, field: "latitude", code: "coordinate", message: "Latitude must be between -90 and 90" });
    if (typeof row.longitude === "number" && (row.longitude < -180 || row.longitude > 180)) issues.push({ row: rowNumber, field: "longitude", code: "coordinate", message: "Longitude must be between -180 and 180" });
  });
  return { rows: rows.length, validRows: Math.max(0, rows.length - new Set(issues.map(issue => issue.row)).size), invalidRows: new Set(issues.map(issue => issue.row)).size, issues };
}

export function csvTemplate(entity: EntityKey) {
  return Object.keys(ENTITY_SCHEMAS[entity].fields).join(",") + "\n";
}

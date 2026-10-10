import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { generateDemoDataset, calculateMetrics, METRIC_DEFINITIONS } from "../server/metrics-service";
import { generateDemoSeedMetadata } from "../server/demo-seed-metadata";

const outputPath = resolve(process.argv[2] ?? "data/demo-seed.json");
const dataset = generateDemoDataset();
const metrics = calculateMetrics(dataset);
const accessAndAudit = generateDemoSeedMetadata(dataset.generatedAt);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ dataset, metrics, metricDefinitions: METRIC_DEFINITIONS, ...accessAndAudit }, null, 2)}\n`, "utf8");
console.log(`Wrote deterministic demo seed: ${outputPath}`);
console.log(`${dataset.sites.length} sites · ${metrics.customers.toLocaleString()} customers · ${metrics.complaintsOpen.toLocaleString()} open complaints`);
console.log(`${accessAndAudit.users.length} role accounts · ${accessAndAudit.auditEvents.length} demo audit events`);

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const exceptions = JSON.parse(fs.readFileSync(new URL("../docs/dependency-exceptions.json", import.meta.url), "utf8"));
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run through npm run audit:dependencies");
fs.mkdirSync("test-results", { recursive: true });
let undocumented = false;
for (const production of [false, true]) {
  let output;
  try { output = execFileSync(process.execPath, [npmCli, "audit", "--json", ...(production ? ["--omit=dev"] : [])], { encoding: "utf8" }); }
  catch (error) {
    output = error.stdout?.toString();
    if (!output) throw error;
  }
  const report = JSON.parse(output);
  if (!report.metadata || report.error) throw new Error(`Dependency audit failed: ${report.error?.summary ?? "No metadata"}`);
  fs.writeFileSync(`test-results/audit-${production ? "production" : "all"}.json`, output);
  console.log(`${production ? "Production" : "Overall"} dependency entries: ${JSON.stringify(report.metadata.vulnerabilities)}`);
  for (const [name, finding] of Object.entries(report.vulnerabilities)) {
    if (!["high", "critical"].includes(finding.severity)) continue;
    const known = exceptions[name];
    const via = finding.via.map((item) => typeof item === "string" ? item : item.url);
    const covered = known && known.range === finding.range && via.every((item) => known.via.includes(item)) &&
      known.applicability && known.remediation && known.reviewBy >= new Date().toISOString().slice(0, 10);
    console.log(`${covered ? "Reviewed" : "UNREVIEWED"}: ${name} (${finding.severity}) via ${via.join(", ")}`);
    if (!covered) undocumented = true;
  }
}
if (undocumented) process.exitCode = 1;

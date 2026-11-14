const fs = require("node:fs");
const path = require("node:path");
const { validateCatalog } = require("../src/services/wong-tai-sin-catalog");

const manifestArg = process.argv.find((argument) => argument.startsWith("--manifest="))?.slice("--manifest=".length);
const manifestName = manifestArg || "wong-tai-sin-100.json";
const dataRoot = path.resolve(__dirname, "../data/xin-xam");
const file = path.resolve(dataRoot, manifestName);
if (!file.startsWith(`${dataRoot}${path.sep}`)) throw new Error("Manifest must be inside BE/data/xin-xam.");
const catalog = JSON.parse(fs.readFileSync(file, "utf8"));
const report = validateCatalog(catalog, { systemId: catalog.systemId, versionField: catalog.datasetVersion ? "datasetVersion" : "catalogVersion" });
console.log(`Manifest: ${path.basename(file)}`);
console.log(JSON.stringify(report, null, 2));
if (!report.valid) process.exitCode = 1;

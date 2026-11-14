const fs = require("node:fs");
const path = require("node:path");
const { validateOriginalCatalog } = require("../src/services/original-xam-catalog");

const file = path.resolve(__dirname, "../data/xin-xam/tltl-original-100-v1.json");
const dataset = JSON.parse(fs.readFileSync(file, "utf8"));
const report = validateOriginalCatalog(dataset);
console.log(JSON.stringify(report, null, 2));
if (!report.valid) process.exitCode = 1;

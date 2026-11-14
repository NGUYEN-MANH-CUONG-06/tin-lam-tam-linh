const { createHash } = require("node:crypto");

const SYSTEM_ID = "TLTL_ORIGINAL_100_V1";
const GRADES = new Set(["THUẬN", "BÌNH", "CẨN TRỌNG"]);
const EXPECTED_COUNT = 100;

function normalizeText(value) {
  return String(value || "").normalize("NFC").toLocaleLowerCase("vi").replace(/[\p{P}\p{S}\s]+/gu, "").trim();
}

function fingerprint(record) {
  return createHash("sha256").update(JSON.stringify({
    id: record.id,
    systemId: record.systemId,
    contentVersion: record.contentVersion,
    title: record.title,
    poem: record.poem,
    grade: record.grade,
    centralMeaning: record.centralMeaning,
    symbols: record.symbols,
    symbolicExplanations: record.symbolicExplanations,
    topics: record.topics,
    interpretationGuidance: record.interpretationGuidance,
    cautions: record.cautions,
    practicalAdvice: record.practicalAdvice,
  })).digest("hex");
}

function validateOriginalCatalog(dataset) {
  const errors = [];
  const rows = Array.isArray(dataset?.records) ? dataset.records : [];
  if (dataset?.systemId !== SYSTEM_ID) errors.push(`systemId must be ${SYSTEM_ID}`);
  if (!dataset?.datasetVersion || dataset.datasetVersion !== "1.0.1-draft") errors.push("datasetVersion must identify the reviewed draft version");
  if (dataset?.status !== "DRAFT_NOT_APPROVED" || dataset?.authorship?.humanApproved !== false) errors.push("draft must not claim human approval");
  if (dataset?.sourcePolicy !== "ORIGINAL_EDITORIAL_CONTENT_NO_TRADITIONAL_SOURCE_CLAIM") errors.push("source policy must identify original content");
  if (rows.length !== EXPECTED_COUNT) errors.push(`expected exactly ${EXPECTED_COUNT} records`);

  const ids = new Set();
  const titles = new Set();
  const poems = new Set();
  const poemLines = new Set();
  const grades = Object.create(null);
  const topics = Object.create(null);
  const syllableCounts = Object.create(null);
  for (const [index, row] of rows.entries()) {
    const label = `records[${index}]`;
    if (!Number.isInteger(row?.id) || row.id !== index + 1) errors.push(`${label}.id must equal ${index + 1}`);
    if (ids.has(row?.id)) errors.push(`${label}.id is duplicated`);
    ids.add(row?.id);
    if (row?.systemId !== SYSTEM_ID || row?.contentVersion !== dataset.datasetVersion) errors.push(`${label} system/content version mismatch`);
    if (typeof row?.title !== "string" || !row.title.trim()) errors.push(`${label}.title is required`);
    else {
      const title = normalizeText(row.title);
      if (titles.has(title)) errors.push(`${label}.title duplicates another title`);
      titles.add(title);
    }
    if (typeof row?.poem !== "string" || !row.poem.trim()) errors.push(`${label}.poem is required`);
    else {
      const lines = row.poem.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (lines.length !== 4) errors.push(`${label}.poem must contain exactly four non-empty lines`);
      const normalizedPoem = normalizeText(row.poem);
      if (poems.has(normalizedPoem)) errors.push(`${label}.poem duplicates another poem`);
      poems.add(normalizedPoem);
      for (const line of lines) {
        const normalizedLine = normalizeText(line);
        if (poemLines.has(normalizedLine)) errors.push(`${label}.poem repeats a complete line used elsewhere`);
        poemLines.add(normalizedLine);
        const syllables = line.split(/\s+/u).filter(Boolean).length;
        syllableCounts[syllables] = (syllableCounts[syllables] || 0) + 1;
        if (syllables < 5 || syllables > 10) errors.push(`${label}.poem line has an unusual ${syllables}-word rhythm`);
      }
    }
    if (!GRADES.has(row?.grade)) errors.push(`${label}.grade is invalid`);
    else grades[row.grade] = (grades[row.grade] || 0) + 1;
    for (const field of ["centralMeaning", "interpretationGuidance"]) {
      if (typeof row?.[field] !== "string" || row[field].trim().length < 20) errors.push(`${label}.${field} is required`);
    }
    for (const field of ["symbols", "symbolicExplanations", "topics", "cautions", "practicalAdvice"]) {
      if (!Array.isArray(row?.[field]) || row[field].length === 0) errors.push(`${label}.${field} must be a non-empty array`);
    }
    for (const topic of Array.isArray(row?.topics) ? row.topics : []) topics[topic] = (topics[topic] || 0) + 1;
    if (row?.contentType !== "ORIGINAL" || row?.authoringMethod !== "AI_ASSISTED_EDITORIAL_DRAFT" || row?.reviewStatus !== "DRAFT") errors.push(`${label} must remain an original editorial draft`);
  }
  if (new Set(Object.keys(grades)).size < 3) errors.push("catalog must include thuận, bình, and caution grades");
  if (Object.values(grades).some((count) => count < 15)) errors.push("each grade must include at least 15 cards");
  return {
    valid: errors.length === 0,
    importEligible: errors.length === 0,
    systemId: dataset?.systemId,
    datasetVersion: dataset?.datasetVersion,
    recordCount: rows.length,
    coverage: `${ids.size}/${EXPECTED_COUNT}`,
    grades,
    uniqueTitles: titles.size,
    uniquePoems: poems.size,
    uniquePoemLines: poemLines.size,
    topics,
    syllableCounts,
    errors,
  };
}

function planOriginalImport(dataset, existingByNumber = new Map()) {
  const report = validateOriginalCatalog(dataset);
  if (!report.importEligible) return { ...report, actions: [] };
  const actions = [];
  for (const row of dataset.records) {
    const digest = fingerprint(row);
    const old = existingByNumber.get(row.id);
    if (old && old.fingerprint !== digest) return { ...report, importEligible: false, errors: [`conflict at stick ${row.id}`], actions: [] };
    actions.push({ operation: old ? "NOOP" : "CREATE_DRAFT", stickNumber: row.id, fingerprint: digest });
  }
  return { ...report, actions };
}

function toOriginalDraftRecord(row, dataset) {
  return {
    stick_number: row.id,
    name: row.title,
    xam_type: `${dataset.systemId}:${dataset.datasetVersion}`,
    region: "NATIONWIDE",
    category: dataset.systemId,
    fortune_level: row.grade,
    poem: row.poem,
    meaning: row.centralMeaning,
    advice: row.practicalAdvice.join(" "),
    source: null,
    editorial_status: "DRAFT",
    verified: false,
    active: false,
    editorial_metadata: {
      systemId: dataset.systemId,
      datasetVersion: dataset.datasetVersion,
      contentType: row.contentType,
      authoringMethod: row.authoringMethod,
      contentVersion: row.contentVersion,
      reviewStatus: row.reviewStatus,
      humanApproved: dataset.authorship.humanApproved,
      centralMeaning: row.centralMeaning,
      symbols: row.symbols,
      symbolicExplanations: row.symbolicExplanations,
      topics: row.topics,
      interpretationGuidance: row.interpretationGuidance,
      cautions: row.cautions,
      practicalAdvice: row.practicalAdvice,
      fingerprint: fingerprint(row),
      sourcePolicy: dataset.sourcePolicy,
    },
  };
}

module.exports = { SYSTEM_ID, GRADES, validateOriginalCatalog, planOriginalImport, toOriginalDraftRecord, fingerprint, normalizeText };

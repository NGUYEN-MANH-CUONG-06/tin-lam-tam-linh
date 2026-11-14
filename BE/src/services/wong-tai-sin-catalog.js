const GRADE_COUNTS = Object.freeze({ "上上": 3, "上吉": 10, "中吉": 29, "中平": 40, "下下": 18 });
const SYSTEM_ID = "WONG_TAI_SIN_100";

function getCatalogPolicy(catalog, options = {}) {
  const systemId = options.systemId || catalog?.systemId || SYSTEM_ID;
  const versionField = options.versionField || (catalog?.datasetVersion ? "datasetVersion" : "catalogVersion");
  const gradeCounts = options.gradeCounts === undefined
    ? (systemId === SYSTEM_ID ? GRADE_COUNTS : catalog?.expectedGradeCounts)
    : options.gradeCounts;
  return {
    systemId,
    versionField,
    version: catalog?.[versionField],
    expectedCount: options.expectedCount ?? catalog?.expectedCount ?? 100,
    gradeCounts,
    allowedRightsStatuses: options.allowedRightsStatuses || ["CLEARED", "LICENSED", "PUBLIC_DOMAIN_VERIFIED"],
  };
}

function validateCatalog(catalog, options = {}) {
  const errors = [];
  const policy = getCatalogPolicy(catalog, options);
  const records = Array.isArray(catalog?.records) ? catalog.records : [];
  if (catalog?.systemId !== policy.systemId) errors.push(`systemId must be ${policy.systemId}`);
  if (typeof policy.version !== "string" || !policy.version.trim()) errors.push(`${policy.versionField} is required`);
  if (!Number.isInteger(policy.expectedCount) || policy.expectedCount < 1) errors.push("expectedCount must be a positive integer");
  const seen = new Set();
  const grades = Object.create(null);
  for (const [index, record] of records.entries()) {
    const label = `records[${index}]`;
    if (!Number.isInteger(record?.stickNumber) || record.stickNumber < 1 || record.stickNumber > 100) errors.push(`${label}.stickNumber must be an integer from 1 to 100`);
    else if (seen.has(record.stickNumber)) errors.push(`${label}.stickNumber is duplicated`);
    else seen.add(record.stickNumber);
    if (record?.systemId !== policy.systemId || record?.[policy.versionField] !== policy.version) errors.push(`${label} system/version mismatch`);
    if (typeof record?.title !== "string" || !record.title.trim()) errors.push(`${label}.title is required`);
    if (typeof record?.poem !== "string" || !record.poem.trim()) errors.push(`${label}.poem is required`);
    if (typeof record?.fingerprint !== "string" || !/^[a-f0-9]{64}$/i.test(record.fingerprint)) errors.push(`${label}.fingerprint must be a SHA-256 hex digest`);
    if (typeof record?.grade !== "string" || !record.grade.trim()) errors.push(`${label}.grade is required`);
    else if (policy.gradeCounts && !Object.hasOwn(policy.gradeCounts, record.grade)) errors.push(`${label}.grade is unsupported`);
    else grades[record.grade] = (grades[record.grade] || 0) + 1;
    if (!record?.provenance || !Array.isArray(record.provenance.sources) || record.provenance.sources.length === 0) errors.push(`${label}.provenance.sources is required`);
    else for (const source of record.provenance.sources) {
      let url;
      try { url = new URL(source.url); } catch { errors.push(`${label} has an invalid provenance URL`); continue; }
      if (url.protocol !== "https:") errors.push(`${label} provenance must use HTTPS`);
      if (source.verified !== true) errors.push(`${label} provenance is not verified`);
    }
    if (record?.verificationStatus !== "VERIFIED") errors.push(`${label} is not verified`);
    if (!policy.allowedRightsStatuses.includes(record?.rightsStatus) || typeof record?.rightsEvidence !== "string" || !record.rightsEvidence.trim()) errors.push(`${label} has no documented rights clearance`);
  }
  const complete = records.length === policy.expectedCount && seen.size === policy.expectedCount && Array.from({ length: policy.expectedCount }, (_, i) => i + 1).every((id) => seen.has(id));
  if (!complete) errors.push(`catalog must contain each stick number 1..${policy.expectedCount} exactly once`);
  if (complete && policy.gradeCounts && Object.entries(policy.gradeCounts).some(([grade, count]) => grades[grade] !== count)) errors.push("grade distribution differs from the required independently verified distribution");
  return { valid: errors.length === 0, importEligible: errors.length === 0, systemId: policy.systemId, datasetVersion: policy.version, recordCount: records.length, coverage: `${seen.size}/${policy.expectedCount}`, grades, errors };
}

// Produces a safe plan only; persistence is deliberately delegated to an explicit test-only importer.
function planImport(catalog, existingByNumber = new Map(), options = {}) {
  const validation = validateCatalog(catalog, options);
  if (!validation.importEligible) return { ...validation, actions: [] };
  const actions = [];
  for (const record of catalog.records) {
    const old = existingByNumber.get(record.stickNumber);
    if (old && old.fingerprint !== record.fingerprint) {
      return { ...validation, importEligible: false, errors: [`conflict at stick ${record.stickNumber}`], actions: [] };
    }
    actions.push({ operation: old ? "NOOP" : "CREATE_DRAFT", stickNumber: record.stickNumber });
  }
  return { ...validation, actions };
}

function toDraftRecord(record) {
  const systemId = record.systemId || SYSTEM_ID;
  const datasetVersion = record.datasetVersion || record.catalogVersion;
  return {
    stick_number: record.stickNumber,
    name: record.title,
    xam_type: `${systemId}:${datasetVersion}`,
    region: "NATIONWIDE",
    category: systemId,
    fortune_level: record.grade,
    poem: record.poem,
    source: record.provenance.sources[0].url,
    editorial_status: "DRAFT",
    verified: false,
    active: false,
    editorial_metadata: {
      systemId,
      ...(record.editionId ? { editionId: record.editionId } : {}),
      datasetVersion,
      catalogVersion: record.catalogVersion,
      fingerprint: record.fingerprint,
      verificationStatus: record.verificationStatus,
      rightsStatus: record.rightsStatus,
      rightsEvidence: record.rightsEvidence,
      provenance: record.provenance,
    },
  };
}

module.exports = { GRADE_COUNTS, SYSTEM_ID, validateCatalog, planImport, toDraftRecord };

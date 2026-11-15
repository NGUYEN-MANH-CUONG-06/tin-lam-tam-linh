const fs = require("node:fs");
const path = require("node:path");
const {
  validateOriginalCatalog,
  fingerprint,
} = require("./original-xam-catalog");

const datasetPath = path.resolve(
  __dirname,
  "../../data/xin-xam/tltl-original-100-v1.json",
);
const dataset = require(datasetPath);
const EXPECTED_SYSTEM = "TLTL_ORIGINAL_100_V1";
const EXPECTED_VERSION = "1.0.1-draft";
const EXPECTED_DATASET_SHA256 =
  "f1dc825d3743b1f45f1be1c366b10f523df09db1ef51901e6661a005847b6497";

function stableDemoCardId(stickNumber) {
  return `00000000-0000-4000-8000-${Number(stickNumber).toString(16).padStart(12, "0")}`;
}

function buildDemoCards(source = dataset) {
  const report = validateOriginalCatalog(source);
  if (
    !report.valid ||
    report.systemId !== EXPECTED_SYSTEM ||
    report.datasetVersion !== EXPECTED_VERSION
  ) {
    const error = new Error("The Xin Xam demo catalog failed validation.");
    error.code = "DEMO_XAM_CATALOG_INVALID";
    throw error;
  }
  const records = source.records.map((row) => {
    const rowFingerprint = fingerprint(row);
    if (!/^[a-f0-9]{64}$/.test(rowFingerprint)) {
      const error = new Error(
        "The Xin Xam demo record fingerprint is invalid.",
      );
      error.code = "DEMO_XAM_CATALOG_INVALID";
      throw error;
    }
    return {
      id: stableDemoCardId(row.id),
      stick_number: row.id,
      name: row.title,
      xam_type: `${source.systemId}:${source.datasetVersion}`,
      region: "NATIONWIDE",
      category: source.systemId,
      fortune_level: row.grade,
      poem: row.poem,
      meaning: row.centralMeaning,
      advice: row.practicalAdvice.join(" "),
      source: null,
      editorial_status: "DEMO_ACTIVE",
      demo_status: "DEMO_ACTIVE",
      verified: false,
      active: true,
      editorial_metadata: {
        systemId: source.systemId,
        datasetVersion: source.datasetVersion,
        contentVersion: row.contentVersion,
        fingerprint: rowFingerprint,
        centralMeaning: row.centralMeaning,
        symbols: row.symbols,
        symbolicExplanations: row.symbolicExplanations,
        topics: row.topics,
        interpretationGuidance: row.interpretationGuidance,
        cautions: row.cautions,
        practicalAdvice: row.practicalAdvice,
        sourcePolicy: source.sourcePolicy,
      },
    };
  });
  if (
    records.length !== 100 ||
    new Set(records.map((card) => card.stick_number)).size !== 100
  ) {
    const error = new Error(
      "The Xin Xam demo catalog must contain 100 unique cards.",
    );
    error.code = "DEMO_XAM_CATALOG_INVALID";
    throw error;
  }
  return records;
}

const datasetSha256 = require("node:crypto")
  .createHash("sha256")
  .update(fs.readFileSync(datasetPath))
  .digest("hex");
if (datasetSha256 !== EXPECTED_DATASET_SHA256) {
  const error = new Error(
    "The packaged Xin Xam demo dataset fingerprint does not match the reviewed version.",
  );
  error.code = "DEMO_XAM_CATALOG_FINGERPRINT_MISMATCH";
  throw error;
}
const DEMO_CARDS = buildDemoCards();

function getDemoXamCard(stickNumber) {
  return (
    DEMO_CARDS.find((card) => card.stick_number === Number(stickNumber)) || null
  );
}

function findDemoXamCard(xamType, stickNumber) {
  if (xamType !== `${EXPECTED_SYSTEM}:${EXPECTED_VERSION}`) return null;
  return getDemoXamCard(stickNumber);
}

function toDemoXamDraw(card, drawId, resultToken, createdAt) {
  const classificationGroup =
    card.fortune_level === "THUẬN"
      ? "CAT"
      : card.fortune_level === "CẨN TRỌNG"
        ? "CAUTION"
        : "NEUTRAL";
  const rank =
    classificationGroup === "CAT"
      ? "Thượng Xăm"
      : classificationGroup === "CAUTION"
        ? "Hạ Xăm"
        : "Trung Xăm";
  return {
    id: drawId,
    drawId,
    resultToken,
    stickNumber: String(card.stick_number).padStart(2, "0"),
    fortuneType: card.fortune_level,
    classification: card.fortune_level,
    classificationGroup,
    rank,
    category: card.category,
    xamType: card.xam_type,
    region: "Toàn quốc",
    quote: card.poem,
    poem: card.poem,
    meaning: card.meaning,
    advice: card.advice,
    originalContent: {
      poem: card.poem,
      meaning: card.meaning,
      advice: card.advice,
      metadata: {
        contentKind: "demo",
        editorialStatus: "draft",
        sources: [],
        quotationVerified: false,
        editorialNote:
          "Tự động kích hoạt cho môi trường Demo – chưa được duyệt phát hành chính thức.",
      },
    },
    aiExplanation: null,
    interpretation: {
      summary: card.meaning,
      recommendation: card.advice,
      warning:
        "Kết quả Demo để trải nghiệm, chưa được duyệt phát hành chính thức.",
    },
    proverb: null,
    source: null,
    verified: false,
    active: true,
    demoStatus: "DEMO_ACTIVE",
    editorialStatus: "DEMO_ACTIVE",
    disclaimer:
      "Nội dung tự động kích hoạt riêng cho môi trường Demo; chưa được Admin duyệt phát hành chính thức.",
    date: new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(createdAt),
    createdAt: createdAt.getTime(),
    starred: false,
    aiInterpretation: null,
  };
}

module.exports = {
  EXPECTED_SYSTEM,
  EXPECTED_VERSION,
  EXPECTED_DATASET_SHA256,
  DEMO_CARDS,
  buildDemoCards,
  findDemoXamCard,
  getDemoXamCard,
  toDemoXamDraw,
};

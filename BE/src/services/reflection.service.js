const { randomUUID } = require("node:crypto");
const env = require("../config/env");
const xinXamRepository = require("../repositories/xin-xam.repository");
const wishRepository = require("../repositories/wish.repository");
const proverbRepository = require("../repositories/proverb.repository");
const ApiError = require("../utils/api-error");
const { toProverbDto } = require("./proverb.service");
const { XIN_XAM_TOPICS, selectUniformXamCard, filterCardsByTopic } = require("./xin-xam-algorithm");
const fortuneInterpretationService = require("./fortune-interpretation.service");

const {
  contentFingerprint,
  issueXamResult,
  readXamResult,
} = require("../utils/xam-result-token");

const REGION_TO_DB = {
  "Bắc Bộ": "NORTH",
  "Trung Bộ": "CENTRAL",
  "Nam Bộ": "SOUTH",
  "Toàn quốc": "NATIONWIDE",
};

const DB_TO_REGION = { NORTH: "Bắc Bộ", CENTRAL: "Trung Bộ", SOUTH: "Nam Bộ", NATIONWIDE: "Toàn quốc" };

function hasFullOriginalXamPool(cards) {
  if (!Array.isArray(cards) || cards.length !== 100) return false;
  const numbers = new Set(cards.map((card) => card.stick_number));
  return numbers.size === 100 && Array.from({ length: 100 }, (_, index) => index + 1).every((number) => numbers.has(number));
}

async function listXamCatalogForRequest(input, region, configuredCatalogType) {
  const catalogType = arguments.length >= 3 ? configuredCatalogType : env.XIN_XAM_CATALOG_TYPE;
  if (input.region === "Toàn quốc" && catalogType) {
    // A configured system pool intentionally ignores the question topic for drawing.
    const cards = await xinXamRepository.listCatalog(catalogType, region);
    if (catalogType.startsWith("TLTL_ORIGINAL_100_V1:") && !hasFullOriginalXamPool(cards)) return [];
    return cards;
  }
  if (input.region === "Toàn quốc") return xinXamRepository.listUnifiedCatalog(input.topic);
  return xinXamRepository.listCatalog(`${region}:${input.topic}`, region);
}

function fortuneGroup(level) {
  if (
    ["THUẬN", "Đại Cát", "Thượng Cát", "Trung Cát", "Tiểu Cát"]
      .includes(level)
  ) {
    return "CAT";
  }

  if (["CẨN TRỌNG", "Hung", "Đại Hung"].includes(level)) {
    return "CAUTION";
  }

  return "NEUTRAL";
}

function fortuneRank(level) {
  if (["THUẬN", "Đại Cát", "Thượng Cát"].includes(level)) {
    return "Thượng Xăm";
  }

  if (["BÌNH", "Bình", "Trung Cát", "Tiểu Cát"].includes(level)) {
    return "Trung Xăm";
  }

  return "Hạ Xăm";
}

function toXamMetadata(xam) {
  const source = typeof xam.source === "string" ? xam.source.trim() : "";
  const editorialMetadata = xam.editorial_metadata && typeof xam.editorial_metadata === "object"
    ? xam.editorial_metadata
    : {};
  const approved = xam.verified === true;
  const stickNumber = String(xam.stick_number).padStart(2, "0");
  return {
    contentKind: approved ? "editorial" : "demo",
    editorialStatus: approved ? "approved" : "draft",
    sources: source
      ? [{
        id: `xin-xam-${xam.id}-source`,
        title: typeof editorialMetadata.sourceTitle === "string" && editorialMetadata.sourceTitle.trim()
          ? editorialMetadata.sourceTitle.trim()
          : `Trang tham chiếu được khai báo cho thẻ số ${stickNumber}`,
        ...(typeof editorialMetadata.sourceAuthor === "string" && editorialMetadata.sourceAuthor.trim()
          ? { authorOrOrganization: editorialMetadata.sourceAuthor.trim(), authorLabel: "Tác giả nguyên tác" }
          : {}),
        url: source,
        locator: typeof editorialMetadata.sourceLocator === "string" && editorialMetadata.sourceLocator.trim()
          ? editorialMetadata.sourceLocator.trim()
          : `Bản ghi thẻ số ${stickNumber}`,
        ...(typeof editorialMetadata.bibliography === "string" && editorialMetadata.bibliography.trim()
          ? { bibliographicReference: editorialMetadata.bibliography.trim() }
          : {}),
      }]
      : [],
    quotationVerified:
      approved &&
      Boolean(xam.poem) &&
      editorialMetadata.contentType !== "ORIGINAL",
    ...(approved && xam.reviewMetadata?.reviewedBy ? { reviewedBy: xam.reviewMetadata.reviewedBy } : {}),
    ...(approved && xam.reviewMetadata?.reviewedOn ? { reviewedOn: xam.reviewMetadata.reviewedOn } : {}),
    editorialNote: approved
      ? xam.reviewMetadata?.reviewNote || "Trạng thái duyệt áp dụng cho nội dung quẻ và nguồn đã khai báo."
      : "Nội dung này chưa được duyệt để phát hành.",
  };
}

function toXamItem(draw) {
  const xam = draw.xin_xam;
  const classification = draw.xin_xam.fortune_level || "Bình";
  const warning = fortuneGroup(classification) === "CAUTION"
    ? "Đây là lời nhắc thận trọng, không phải dự báo tai họa. Không đưa ra quyết định sức khỏe, pháp lý, tài chính hoặc an toàn chỉ dựa trên thẻ xăm."
    : "Hãy đối chiếu lời luận với hoàn cảnh thực tế và không xem kết quả là lời phán quyết.";
  const originalContentMetadata = toXamMetadata(xam);
  let storedInterpretation = null;
  try { storedInterpretation = draw.ai_explanation ? JSON.parse(draw.ai_explanation).interpretation || null : null; } catch { /* Legacy free-form AI text remains untrusted. */ }
  const aiExplanation = storedInterpretation
    ? {
      content: storedInterpretation.summary,
      metadata: {
        contentKind: "ai-generated",
        editorialStatus: "draft",
        sources: [],
        quotationVerified: false,
        editorialNote: "Lời gợi mở do AI tạo; không phải thơ gốc hoặc trích dẫn từ nguồn dân gian.",
      },
    }
    : null;
  return {
    id: draw.id,
    drawId: draw.id,
    stickNumber: String(draw.xin_xam.stick_number).padStart(2, "0"),
    fortuneType: classification,
    classification,
    rank: fortuneRank(classification),
    classificationGroup: fortuneGroup(classification),
    category: xam.category || xam.xam_type,
    xamType: xam.xam_type,
    region: DB_TO_REGION[xam.region] || xam.region,
    quote: xam.poem || xam.meaning || "",
    poem: xam.poem || null,
    meaning: xam.meaning || "",
    advice: xam.advice || "",
    originalContent: {
      poem: xam.poem || null,
      meaning: xam.meaning || "",
      advice: xam.advice || "",
      metadata: originalContentMetadata,
    },
    aiExplanation,
    aiInterpretation: storedInterpretation,
    interpretation: {
      summary: draw.xin_xam.meaning || "",
      recommendation: draw.xin_xam.advice || "",
      warning,
    },
    proverb: toProverbDto(draw.proverbs),
    source: xam.source,
    verified: xam.verified,
    active: xam.active,
    editorialStatus: xam.editorial_status,
    editorialMetadata: {
      systemId: xam.editorial_metadata?.systemId,
      contentType: xam.editorial_metadata?.contentType,
      authoringMethod: xam.editorial_metadata?.authoringMethod,
      contentVersion: xam.editorial_metadata?.contentVersion,
      reviewStatus: xam.editorial_metadata?.reviewStatus,
      humanApproved: xam.editorial_metadata?.humanApproved,
    },
    disclaimer: "Thông tin chỉ dùng để tham khảo và chiêm nghiệm văn hóa; không cổ súy mê tín, không dự đoán chắc chắn tương lai.",
    date: new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).format(draw.created_at),
    createdAt: draw.created_at.getTime(),
    starred: draw.starred,
  };
}

function toWishItem(wish) {
  return {
    id: wish.id,
    category: wish.category || "Khác",
    content: wish.content,
    date: new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).format(wish.created_at),
    createdAt: wish.created_at.getTime(),
    sealed: wish.is_sealed,
    starred: wish.starred,
  };
}

async function drawXam(userId, input) {
  const region = REGION_TO_DB[input.region];
  const cards = await listXamCatalogForRequest(input, region);

  if (cards.length === 0) {
    throw new ApiError(
      404,
      "Chưa có thẻ được phát hành cho lựa chọn này.",
    );
  }

  const candidateCards = filterCardsByTopic(cards, input.topic);
  const card = selectUniformXamCard(candidateCards.length > 0 ? candidateCards : cards);

  if (!userId) {
    const drawId = randomUUID();
    const createdAt = new Date();

    const resultToken = issueXamResult({
      drawId,
      cardId: card.id,
      xamType: card.xam_type,
      stickNumber: card.stick_number,
      proverbId: null,
      fingerprint: contentFingerprint(card, null),
      createdAt: createdAt.getTime(),
    });

    return {
      ...toXamItem({
        id: `guest:${drawId}`,
        xin_xam: card,
        proverbs: null,
        created_at: createdAt,
        starred: false,
      }),
      resultToken,
    };
  }

  const draw = await xinXamRepository.createDraw({
    user_id: userId,
    xin_xam_id: card.id,
    proverb_id: null,
    question: input.question || null,
  });

  return toXamItem(draw);
}

async function saveXamDraw(userId, input) {
  // Lượt đã được tạo khi người dùng đăng nhập.
  if (input.drawId) {
    const existing = await xinXamRepository.findDraw(
      input.drawId,
      userId,
    );

    if (!existing) {
      throw new ApiError(
        404,
        "Không tìm thấy lượt rút của tài khoản này.",
      );
    }

    const saved = await xinXamRepository.markDrawSaved(
      input.drawId,
      userId,
    );

    if (saved.count !== 1) {
      throw new ApiError(404, "Không tìm thấy lượt rút.");
    }

    return toXamItem(existing);
  }

  // Khách rút trước rồi mới đăng nhập.
  const receipt = readXamResult(input.resultToken);
  if (receipt.demo === true) {
    throw new ApiError(403, "Kết quả Xin xăm Demo chỉ được lưu trong bộ nhớ cục bộ của phiên Demo.");
  }

  // Retry cùng lượt: trả lại bản đã tạo cho tài khoản này.
  const existing = await xinXamRepository.findDraw(
    receipt.drawId,
    userId,
  );

  if (existing) {
    await xinXamRepository.markDrawSaved(
      receipt.drawId,
      userId,
    );

    return toXamItem(existing);
  }

  const card = await xinXamRepository.findCatalog(
    receipt.xamType,
    receipt.stickNumber,
  );

  if (!card || card.id !== receipt.cardId) {
    throw new ApiError(
      404,
      "Thẻ này không còn được phát hành.",
    );
  }

  let proverb = null;

  if (receipt.proverbId) {
    const availableProverbs =
      await proverbRepository.listVerified();

    proverb = availableProverbs.find(
      (item) => item.id === receipt.proverbId,
    );

    if (!proverb) {
      throw new ApiError(
        409,
        "Nội dung đi cùng thẻ đã thay đổi. Hãy nhận kết quả mới trước khi lưu.",
      );
    }
  }

  if (
    contentFingerprint(card, proverb) !==
    receipt.fingerprint
  ) {
    throw new ApiError(
      409,
      "Nội dung thẻ đã được chỉnh sửa. Hãy nhận kết quả mới trước khi lưu.",
    );
  }

  try {
    const draw = await xinXamRepository.createDraw({
      // ID do server ký: cùng lượt chỉ có một bản ghi.
      id: receipt.drawId,
      user_id: userId,
      xin_xam_id: card.id,
      proverb_id: proverb?.id || null,
      question: input.question || null,
      created_at: new Date(receipt.createdAt),
      saved_at: new Date(),
    });

    return toXamItem(draw);
  } catch (error) {
    if (error.code === "P2002") {
      const repeated = await xinXamRepository.findDraw(
        receipt.drawId,
        userId,
      );

      if (repeated) {
        return toXamItem(repeated);
      }

      throw new ApiError(
        409,
        "Lượt rút này không thể lưu vào tài khoản hiện tại. Hãy nhận kết quả mới.",
      );
    }

    throw error;
  }
}

async function listSavedXam(userId) {
  return (await xinXamRepository.listDraws(userId)).map(toXamItem);
}

async function updateXamStar(userId, id, starred) {
  const existing = await xinXamRepository.findDraw(id, userId);
  if (!existing) throw new ApiError(404, "Saved xin xam not found");
  const updated = await xinXamRepository.updateStar(id, userId, starred);
  if (updated.count !== 1) throw new ApiError(404, "Saved xin xam not found");
  return toXamItem({ ...existing, starred });
}

async function deleteXam(userId, id) {
  const deleted = await xinXamRepository.remove(id, userId);
  if (deleted.count !== 1) throw new ApiError(404, "Saved xin xam not found");
}

async function listWishes(userId) {
  return (await wishRepository.listForUser(userId)).map(toWishItem);
}

async function createWish(userId, input) {
  const content = input.content.trim();
  const category = input.category?.trim() || null;
  const requestId = input.requestId;

  const resolveExisting = (wish) => {
    if (
      wish.content !== content ||
      (wish.category || null) !== category
    ) {
      throw new ApiError(
        409,
        "Mã lưu đã được dùng cho nội dung khác. Vui lòng bắt đầu lượt lưu mới."
      );
    }

    return toWishItem(wish);
  };

  if (requestId) {
    const existing = await wishRepository.findForUser(
      requestId,
      userId
    );

    if (existing) {
      return resolveExisting(existing);
    }
  }

  try {
    const wish = await wishRepository.create({
      ...(requestId ? { id: requestId } : {}),
      user_id: userId,
      content,
      category,
    });

    return toWishItem(wish);
  } catch (error) {
    if (!requestId || error.code !== "P2002") {
      throw error;
    }

    // Hai request có thể cùng vượt qua bước kiểm tra phía trên.
    // Khóa chính trong DB bảo đảm chỉ một bản ghi được tạo.
    const existing = await wishRepository.findForUser(
      requestId,
      userId
    );

    if (existing) {
      return resolveExisting(existing);
    }

    // Không trả dữ liệu thuộc tài khoản khác.
    throw new ApiError(
      409,
      "Không thể dùng mã lưu này. Vui lòng bắt đầu lượt lưu mới."
    );
  }
}

async function updateWishStar(userId, id, starred) {
  const updated = await wishRepository.update(id, userId, { starred });
  if (updated.count !== 1) throw new ApiError(404, "Saved wish not found");
  return toWishItem(await wishRepository.findForUser(id, userId));
}

async function deleteWish(userId, id) {
  const deleted = await wishRepository.remove(id, userId);
  if (deleted.count !== 1) throw new ApiError(404, "Saved wish not found");
}

async function getXamAvailability(input) {
  const region = REGION_TO_DB[input.region];
  const cards = await listXamCatalogForRequest(input, region);

  return {
    region: input.region,
    topic: input.topic,
    count: cards.length,
    available: cards.length > 0,
  };
}

function getXamOptions() {
  return {
    topics: XIN_XAM_TOPICS,
    regions: Object.keys(REGION_TO_DB),
    defaultRegion: "Toàn quốc",
  };
}

async function interpretXam(userId, drawId, input) {
  const draw = await xinXamRepository.findDraw(drawId, userId);
  if (!draw) throw new ApiError(404, "Không tìm thấy lượt xin xăm đã xác minh.");
  try {
    return await fortuneInterpretationService.interpretFortune({
      userId,
      drawId,
      question: input.question || draw.question || "Chiêm nghiệm kết quả xăm",
      topic: input.topic,
      fortune: draw.xin_xam,
      cacheValue: async () => {
        if (!draw.ai_explanation) return null;
        try { return JSON.parse(draw.ai_explanation); } catch { return null; }
      },
      saveValue: async (value) => {
        const updated = await xinXamRepository.saveInterpretation(drawId, userId, value);
        if (updated.count !== 1) throw new ApiError(404, "Không tìm thấy lượt xin xăm.");
      },
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.code === "INVALID_INTERPRETATION_INPUT") throw new ApiError(400, error.message);
    if (error.code === "FORTUNE_NOT_VERIFIED") throw new ApiError(409, error.message);
    if (error.code === "INTERPRETATION_RATE_LIMITED") throw new ApiError(429, error.message);
    if (error.code === "AI_ENTITLEMENT_UNAVAILABLE") throw new ApiError(503, error.message);
    const providerError = error.code?.startsWith("GEMINI_") || error.code?.startsWith("GROQ_");
    if (providerError) {
      const status = error.status === 429 ? 429 : error.code.endsWith("TIMEOUT") ? 504 : 502;
      throw new ApiError(status, "Dịch vụ luận giải đang tạm thời bận. Hãy thử lại sau.", [{ code: error.code, ...(Number.isFinite(error.status) ? { providerStatus: error.status } : {}), ...(typeof error.model === "string" ? { model: error.model } : {}) }]);
    }
    throw new ApiError(502, error.message, [{ code: error.code }]);
  }
}

module.exports = {
  getXamAvailability,
  getXamOptions,
  interpretXam,
  drawXam,
  saveXamDraw,
  listSavedXam,
  updateXamStar,
  deleteXam,
  listWishes,
  createWish,
  updateWishStar,
  deleteWish,
  listXamCatalogForRequest,
  hasFullOriginalXamPool,
};

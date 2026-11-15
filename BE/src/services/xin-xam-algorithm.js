const { randomInt } = require("node:crypto");

const XIN_XAM_TOPICS = ["Bình an", "Gia đình", "Học tập", "Công việc"];

function normalizeTopic(topic) {
  return String(topic || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

const TOPIC_CATEGORY_MAP = {
  "hoc tap": ["hoc tap", "tri thuc", "dinh huong", "truong thanh", "thay doi"],
  "cong viec": ["cong viec", "tai chinh", "khoi dau", "thoi diem", "lua chon", "co hoi", "nghi luc", "trach nhiem", "giai quyet van de", "thay doi"],
  "gia dinh": ["gia dinh", "tinh cam", "quan he", "quan he xa hoi", "giao tiep"],
  "binh an": ["binh an", "an toan", "suc khoe tinh than", "can bang", "phuc hoi", "kien nhan", "hy vong", "dao duc", "mat mat", "thay doi"],
};

function filterCardsByTopic(cards, userTopic) {
  if (!Array.isArray(cards) || cards.length === 0 || !userTopic) return cards || [];
  const normalizedUserTopic = normalizeTopic(userTopic);
  const targetTopics = TOPIC_CATEGORY_MAP[normalizedUserTopic] || [normalizedUserTopic];

  const matched = cards.filter((card) => {
    // 1. Direct category or xam_type match
    const cardCategory = normalizeTopic(card.category || card.xam_type || "");
    if (targetTopics.includes(cardCategory)) return true;

    // 2. Editorial metadata topics match
    const editorialTopics = Array.isArray(card.editorial_metadata?.topics)
      ? card.editorial_metadata.topics
      : [];
    if (editorialTopics.some((t) => targetTopics.includes(normalizeTopic(t)))) return true;

    // 3. Flat topics array if present on card object
    const directTopics = Array.isArray(card.topics) ? card.topics : [];
    return directTopics.some((t) => targetTopics.includes(normalizeTopic(t)));
  });

  return matched.length > 0 ? matched : cards;
}

/** Select uniformly from the already publishable, topic-scoped catalog. */
function selectUniformXamCard(cards, chooseIndex = randomInt) {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new RangeError("Xin xam catalog must contain at least one card.");
  }

  const ids = new Set();
  for (const card of cards) {
    if (!card?.id || ids.has(card.id)) {
      throw new TypeError("Xin xam catalog contains a missing or duplicate card ID.");
    }
    ids.add(card.id);
  }

  const index = chooseIndex(cards.length);
  if (!Number.isInteger(index) || index < 0 || index >= cards.length) {
    throw new RangeError("Xin xam random index is outside the catalog.");
  }
  return cards[index];
}

module.exports = {
  XIN_XAM_TOPICS,
  selectUniformXamCard,
  filterCardsByTopic,
  normalizeTopic,
};

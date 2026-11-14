const { randomInt } = require("node:crypto");

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

module.exports = { selectUniformXamCard };

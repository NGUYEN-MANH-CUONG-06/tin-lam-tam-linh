const test = require("node:test");
const assert = require("node:assert/strict");
const { selectUniformXamCard } = require("../src/services/xin-xam-algorithm");

const cards = [
  { id: "card-1", stick_number: 1, verified: true, source: "https://source.test/1" },
  { id: "card-2", stick_number: 2, verified: true, source: "https://source.test/2" },
  { id: "card-3", stick_number: 3, verified: true, source: "https://source.test/3" },
];

test("xin xam returns each valid catalog entry for its uniform index", () => {
  for (let index = 0; index < cards.length; index += 1) {
    assert.equal(selectUniformXamCard(cards, () => index), cards[index]);
  }
});

test("xin xam rejects empty, duplicate, and invalid-index catalogs", () => {
  assert.throws(() => selectUniformXamCard([]), /at least one card/);
  assert.throws(() => selectUniformXamCard([cards[0], cards[0]]), /duplicate card ID/);
  assert.throws(() => selectUniformXamCard(cards, () => cards.length), /outside the catalog/);
});

test("xin xam sampling is close to uniform across the supplied catalog", () => {
  const counts = new Map(cards.map(({ id }) => [id, 0]));
  const sampleCount = 30_000;

  for (let index = 0; index < sampleCount; index += 1) {
    const card = selectUniformXamCard(cards);
    counts.set(card.id, counts.get(card.id) + 1);
  }

  for (const count of counts.values()) {
    assert.ok(count / sampleCount > 0.31 && count / sampleCount < 0.36);
  }
});

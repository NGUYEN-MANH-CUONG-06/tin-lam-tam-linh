const test = require("node:test");
const assert = require("node:assert/strict");
const { selectUniformXamCard, filterCardsByTopic } = require("../src/services/xin-xam-algorithm");

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

test("filterCardsByTopic properly scopes cards by user topic without hardcoding IDs", () => {
  const sampleCards = [
    { id: "c-1", stick_number: 4, name: "Ngọn đèn bàn học", editorial_metadata: { topics: ["học tập"] } },
    { id: "c-2", stick_number: 7, name: "Chiếc ví khâu chỉ", editorial_metadata: { topics: ["tài chính"] } },
    { id: "c-3", stick_number: 15, name: "Tiếng chuông cuối lớp", editorial_metadata: { topics: ["học tập"] } },
    { id: "c-4", stick_number: 22, name: "Bản đồ nét chì", editorial_metadata: { topics: ["định hướng"] } },
    { id: "c-5", stick_number: 30, name: "Bữa cơm gia đình", editorial_metadata: { topics: ["gia đình"] } },
  ];

  const hocTapCards = filterCardsByTopic(sampleCards, "Học tập");
  assert.equal(hocTapCards.length, 3);
  assert.deepEqual(hocTapCards.map((c) => c.stick_number), [4, 15, 22]);
  assert.ok(!hocTapCards.some((c) => c.stick_number === 7));

  const congViecCards = filterCardsByTopic(sampleCards, "Công việc");
  assert.equal(congViecCards.length, 1);
  assert.equal(congViecCards[0].stick_number, 7);

  const giaDinhCards = filterCardsByTopic(sampleCards, "Gia đình");
  assert.equal(giaDinhCards.length, 1);
  assert.equal(giaDinhCards[0].stick_number, 30);
});

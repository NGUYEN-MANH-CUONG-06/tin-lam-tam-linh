const test = require("node:test");
const assert = require("node:assert/strict");
const { castPieces } = require("../src/services/xin-keo-algorithm");

test("xin keo maps all independent side combinations", () => {
  const cast = (...values) => {
    let index = 0;
    return castPieces(() => values[index++]);
  };

  assert.deepEqual(cast(0, 1), { left: "am", right: "duong", result: "YES" });
  assert.deepEqual(cast(1, 0), { left: "duong", right: "am", result: "YES" });
  assert.deepEqual(cast(0, 0), { left: "am", right: "am", result: "NO" });
  assert.deepEqual(cast(1, 1), { left: "duong", right: "duong", result: "UNCLEAR" });
});

test("xin keo samples exactly two sides without retrying based on the outcome", () => {
  const values = [0, 0, 0, 1];
  let calls = 0;
  const results = [0, 1].map(() => castPieces(() => values[calls++]));

  assert.equal(calls, 4);
  assert.deepEqual(results.map(({ result }) => result), ["NO", "YES"]);
});

test("xin keo secure sampling is close to the independent fair-side distribution", () => {
  const counts = { sacred: 0, laughing: 0, negative: 0 };
  const sampleCount = 20_000;

  for (let index = 0; index < sampleCount; index += 1) {
    const { left, right } = castPieces();
    if (left !== right) counts.sacred += 1;
    else if (left === "am") counts.laughing += 1;
    else counts.negative += 1;
  }

  assert.ok(counts.sacred / sampleCount > 0.48 && counts.sacred / sampleCount < 0.52);
  assert.ok(counts.laughing / sampleCount > 0.23 && counts.laughing / sampleCount < 0.27);
  assert.ok(counts.negative / sampleCount > 0.23 && counts.negative / sampleCount < 0.27);
});

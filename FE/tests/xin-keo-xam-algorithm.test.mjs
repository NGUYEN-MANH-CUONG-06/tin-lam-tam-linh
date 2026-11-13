import test from "node:test";
import assert from "node:assert/strict";
import { castDemoKeo } from "../src/data/xinKeoAlgorithm.mjs";

test("demo xin keo resolves the four independent side combinations", () => {
  const sequence = (...bits) => {
    let index = 0;
    return () => bits[index++];
  };

  assert.deepEqual(castDemoKeo(sequence(0, 1)), {
    type: "nhat-am-nhat-duong", piece1: "am", piece2: "duong",
  });
  assert.deepEqual(castDemoKeo(sequence(1, 0)), {
    type: "nhat-am-nhat-duong", piece1: "duong", piece2: "am",
  });
  assert.deepEqual(castDemoKeo(sequence(0, 0)), {
    type: "nhi-am", piece1: "am", piece2: "am",
  });
  assert.deepEqual(castDemoKeo(sequence(1, 1)), {
    type: "nhi-duong", piece1: "duong", piece2: "duong",
  });
});

test("demo xin keo simulation follows the two-fair-side model", () => {
  const counts = { sacred: 0, laughing: 0, negative: 0 };
  const sampleCount = 20_000;

  for (let index = 0; index < sampleCount; index += 1) {
    const { piece1, piece2 } = castDemoKeo();
    if (piece1 !== piece2) counts.sacred += 1;
    else if (piece1 === "am") counts.laughing += 1;
    else counts.negative += 1;
  }

  assert.ok(counts.sacred / sampleCount > 0.48 && counts.sacred / sampleCount < 0.52);
  assert.ok(counts.laughing / sampleCount > 0.23 && counts.laughing / sampleCount < 0.27);
  assert.ok(counts.negative / sampleCount > 0.23 && counts.negative / sampleCount < 0.27);
});


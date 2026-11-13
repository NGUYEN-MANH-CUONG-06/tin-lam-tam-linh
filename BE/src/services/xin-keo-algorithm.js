const { randomInt } = require("node:crypto");

/**
 * Each cup is sampled independently. `am`/`duong` remain the persisted API
 * vocabulary; their physical mapping needs a coordinated UI/content update.
 */
function castPieces(random = () => randomInt(2)) {
  const left = random() < 0.5 ? "am" : "duong";
  const right = random() < 0.5 ? "am" : "duong";
  const result = left !== right ? "YES" : left === "duong" ? "UNCLEAR" : "NO";
  return { left, right, result };
}

module.exports = { castPieces };

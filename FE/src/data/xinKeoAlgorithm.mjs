/** Draw two independent equal-probability sides with the browser CSPRNG. */
export function castDemoKeo(randomBit = secureKeoBit) {
  const piece1 = randomBit() === 1 ? "duong" : "am";
  const piece2 = randomBit() === 1 ? "duong" : "am";
  const type = piece1 !== piece2
    ? "nhat-am-nhat-duong"
    : piece1 === "am" ? "nhi-am" : "nhi-duong";
  return { type, piece1, piece2 };
}

function secureKeoBit() {
  const value = new Uint8Array(1);
  globalThis.crypto.getRandomValues(value);
  return value[0] & 1;
}

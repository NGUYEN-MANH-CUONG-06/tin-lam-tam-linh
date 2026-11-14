export type XinKeoDemoSide = "am" | "duong";
export type XinKeoDemoType =
  | "nhat-am-nhat-duong"
  | "nhi-am"
  | "nhi-duong";

export function castDemoKeo(
  randomBit?: () => 0 | 1,
): {
  type: XinKeoDemoType;
  piece1: XinKeoDemoSide;
  piece2: XinKeoDemoSide;
};

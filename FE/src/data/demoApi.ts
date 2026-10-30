import { readDemoValue, writeDemoValue } from "./demoStorage";

/**
 * Local API boundary used while `?demo=1` is active.
 * Add endpoint handlers here as a demo journey is implemented. Until then,
 * fail clearly instead of silently reporting a successful empty response.
 */
export async function demoApiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const method = (init.method || "GET").toUpperCase();

  if (path === "/inventory" && method === "GET") {
    const owned = readDemoValue<string[]>("owned-items", ["ROYAL_LANTERN"]);
    const equipped = readDemoValue<string | null>("equipped-decoration", null);
    const catalog = [
      { code: "ROYAL_LANTERN", name: "Đèn Tâm An", kind: "PERMANENT", description: "Vật phẩm trang trí không gian 3D." },
      { code: "JADE_LOTUS", name: "Bình sen ngọc", kind: "PERMANENT", description: "Vật phẩm trang trí không gian thờ." },
      { code: "GOLDEN_LOTUS", name: "Sen vàng", kind: "PERMANENT", description: "Biểu tượng thanh tịnh trong không gian thờ." },
      { code: "INCENSE_BURNER", name: "Nén hương thành tâm", kind: "CONSUMABLE", description: "Vật phẩm dâng hương dùng thử." },
      { code: "BOILED_CHICKEN", name: "Gà luộc mâm lễ", kind: "PERMANENT", description: "Mô hình gà luộc có thể chủ động bày hoặc cất khỏi bàn thờ." },
    ];

    return {
      items: catalog
        .filter((item) => owned.includes(item.code))
        .map((item) => ({
          ...item,
          quantity: item.kind === "CONSUMABLE" ? 5 : 1,
          equipped: item.code === equipped,
        })),
    } as T;
  }

  if (path === "/inventory/decoration" && method === "POST") {
    const payload = JSON.parse(String(init.body || "{}")) as { itemCode?: string | null };
    const itemCode = payload.itemCode || null;
    const owned = readDemoValue<string[]>("owned-items", ["ROYAL_LANTERN"]);
    const decorationCodes = ["JADE_LOTUS", "GOLDEN_LOTUS", "INCENSE_BURNER", "BOILED_CHICKEN"];

    if (itemCode && (!decorationCodes.includes(itemCode) || !owned.includes(itemCode))) {
      throw new Error("Trong demo, chỉ có thể bày vật phẩm trang trí đã sở hữu.");
    }

    writeDemoValue("equipped-decoration", itemCode);
    return { itemCode } as T;
  }

  throw new Error(`Demo API chưa hỗ trợ ${method} ${path}.`);
}

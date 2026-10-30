import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../lib/api";
import { isDemoMode } from "../data/demoMode";
import { consumeDemoInventory, loadDemoCommerceState, type DemoCommerceState } from "../data/demoCommerceService";
import type {
  DecorationId,
} from "../components/createDigitalDecoration";

type ItemCode =
  | "JADE_LOTUS"
  | "GOLDEN_LOTUS"
  | "INCENSE_BURNER"
  | "BOILED_CHICKEN";

interface InventoryItem {
  code: string;
  name: string;
  quantity: number;
  equipped: boolean;
}

const sceneIds: Record<ItemCode, DecorationId> = {
  JADE_LOTUS: "jade-lotus",
  GOLDEN_LOTUS: "golden-lotus",
  INCENSE_BURNER: "incense-burner",
  BOILED_CHICKEN: "boiled-chicken",
};

function isDecorationCode(value: string): value is ItemCode {
  return Object.hasOwn(sceneIds, value);
}

// Giữ tên hook để giảm số vị trí cần đổi import.
export function useJadeDecoration(email?: string) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selected, setSelected] = useState<ItemCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [virtualChickenStock, setVirtualChickenStock] = useState(() => isDemoMode() ? loadDemoCommerceState().inventory.virtualChickens : 0);

  const versionRef = useRef(0);
  const lockRef = useRef(false);

  useEffect(() => {
    const version = ++versionRef.current;

    setItems([]);
    setSelected(null);
    setError("");
    setBusy(false);
    lockRef.current = false;
    setLoading(Boolean(email) || isDemoMode());
    if (isDemoMode()) setVirtualChickenStock(loadDemoCommerceState().inventory.virtualChickens);

    if (email || isDemoMode()) {
      void apiRequest<{ items: InventoryItem[] }>("/inventory")
        .then((result) => {
          if (version !== versionRef.current) return;

          const owned = result.items.filter(
            (item) =>
              isDecorationCode(item.code) &&
              item.quantity > 0
          );

          setItems(owned);

          const equipped = owned.find((item) => item.equipped);

          setSelected(
            equipped && isDecorationCode(equipped.code)
              ? equipped.code
              : null
          );
        })
        .catch(() => {
          if (version === versionRef.current) {
            setError("Chưa tải được vật phẩm trang trí.");
          }
        })
        .finally(() => {
          if (version === versionRef.current) {
            setLoading(false);
          }
        });
    }

    return () => {
      versionRef.current += 1;
    };
  }, [email, reload]);

  useEffect(() => {
    if (!isDemoMode()) return;
    const refreshDemoStock = () => setVirtualChickenStock(loadDemoCommerceState().inventory.virtualChickens);
    window.addEventListener("tltl-demo-inventory-change", refreshDemoStock);
    return () => window.removeEventListener("tltl-demo-inventory-change", refreshDemoStock);
  }, []);

  const change = async (itemCode: string) => {
    if ((!email && !isDemoMode()) || loading || lockRef.current) return;
    if (itemCode && !isDecorationCode(itemCode)) return;

    const version = versionRef.current;

    lockRef.current = true;
    setBusy(true);
    setError("");

    try {
      const result = await apiRequest<{
        itemCode: ItemCode | null;
      }>("/inventory/decoration", {
        method: "POST",
        body: JSON.stringify({
          itemCode: itemCode || null,
        }),
      });

      if (version === versionRef.current) {
        setSelected(result.itemCode);
      }
    } catch (cause) {
      if (version === versionRef.current) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Chưa lưu được trang trí."
        );
      }
    } finally {
      if (version === versionRef.current) {
        lockRef.current = false;
        setBusy(false);
      }
    }
  };

  const useVirtualChicken = async () => {
    if (!isDemoMode()) throw new Error("Gà ảo tiêu hao chỉ dùng trong Demo Mode.");
    if (loading || lockRef.current) return;
    if (virtualChickenStock < 1) throw new Error("Kho demo đã hết gà ảo.");
    const version = versionRef.current;
    const previousSelection = selected;
    const requestId = `altar-chicken:${crypto.randomUUID()}`;
    lockRef.current = true;
    setBusy(true);
    setError("");
    try {
      await apiRequest<{ itemCode: ItemCode | null }>("/inventory/decoration", {
        method: "POST",
        body: JSON.stringify({ itemCode: "BOILED_CHICKEN" }),
      });
      const nextState: DemoCommerceState = consumeDemoInventory("virtualChickens", 1, requestId);
      if (version === versionRef.current) {
        setSelected("BOILED_CHICKEN");
        setItems((current) => current.some((item) => item.code === "BOILED_CHICKEN")
          ? current
          : [...current, { code: "BOILED_CHICKEN", name: "Gà luộc mâm lễ", quantity: 1, equipped: true }]);
        setVirtualChickenStock(nextState.inventory.virtualChickens);
        window.dispatchEvent(new Event("tltl-demo-inventory-change"));
      }
    } catch (cause) {
      try {
        await apiRequest("/inventory/decoration", {
          method: "POST",
          body: JSON.stringify({ itemCode: previousSelection }),
        });
      } catch { /* Preserve the original operation error. */ }
      if (version === versionRef.current) {
        setError(cause instanceof Error ? cause.message : "Chưa dâng được gà ảo.");
      }
      throw cause;
    } finally {
      if (version === versionRef.current) {
        lockRef.current = false;
        setBusy(false);
      }
    }
  };

  const syncDemoCommerceState = (commerceState: DemoCommerceState) => {
    setVirtualChickenStock(commerceState.inventory.virtualChickens);
  };

  return {
    items,
    selected,
    decoration: selected ? sceneIds[selected] : null,
    loading,
    busy,
    error,
    virtualChickenStock,
    change,
    useVirtualChicken,
    syncDemoCommerceState,
    retry: () => setReload((value) => value + 1),
  };
}

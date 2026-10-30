import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../lib/api";
import { isDemoMode } from "../data/demoMode";
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

  return {
    items,
    selected,
    decoration: selected ? sceneIds[selected] : null,
    loading,
    busy,
    error,
    change,
    retry: () => setReload((value) => value + 1),
  };
}

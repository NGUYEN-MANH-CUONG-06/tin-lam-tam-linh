import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import { isDemoMode } from "../data/demoMode";
import { readDemoValue } from "../data/demoStorage";

interface Item {
  code: string;
  name: string;
  kind: "CONSUMABLE" | "PERMANENT";
  description: string;
  quantity: number;
}

export function DigitalInventory({
  email,
}: {
  email?: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    setItems([]);
    setError("");

    if (isDemoMode()) {
      const owned = readDemoValue<string[]>("owned-items", ["ROYAL_LANTERN"]);
      const demoItems: Item[] = [
        { code: "ROYAL_LANTERN", name: "Đèn Tâm An", kind: "PERMANENT", description: "Vật phẩm trang trí không gian 3D.", quantity: owned.includes("ROYAL_LANTERN") ? 1 : 0 },
        { code: "GOLDEN_LOTUS", name: "Sen vàng", kind: "PERMANENT", description: "Biểu tượng thanh tịnh trong không gian thờ.", quantity: owned.includes("GOLDEN_LOTUS") ? 1 : 0 },
        { code: "INCENSE_BURNER", name: "Nén hương thành tâm", kind: "CONSUMABLE", description: "Vật phẩm dâng hương dùng thử.", quantity: owned.includes("INCENSE_BURNER") ? 5 : 0 },
        { code: "BOILED_CHICKEN", name: "Gà luộc mâm lễ", kind: "PERMANENT", description: "Mô hình gà luộc có thể chủ động bày hoặc cất khỏi bàn thờ.", quantity: owned.includes("BOILED_CHICKEN") ? 1 : 0 },
      ];
      setItems(demoItems.filter((item) => item.quantity > 0));
      setLoading(false);
      return;
    }

    if (!email) {
      setLoading(false);
      return;
    }

    setLoading(true);

    void apiRequest<{ items: Item[] }>("/inventory")
      .then((result) => {
        if (active) setItems(result.items);
      })
      .catch(() => {
        if (active) {
          setError("Chưa tải được kho vật phẩm.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [email, reload]);

  useEffect(() => {
    if (!isDemoMode()) return;
    const refreshDemoInventory = () => setReload((value) => value + 1);
    window.addEventListener("tltl-demo-inventory-change", refreshDemoInventory);
    return () => window.removeEventListener("tltl-demo-inventory-change", refreshDemoInventory);
  }, []);

  if (!email && !isDemoMode()) return null;

  return (
    <section className="my-8 rounded-3xl border border-line bg-surface p-6">
      <h2 className="text-xl font-semibold text-ink">
        Vật phẩm của tôi
      </h2>

      {loading && (
        <p role="status" className="mt-3 text-sm text-muted">
          Đang tải vật phẩm…
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="mt-3 text-sm text-muted">
          Bạn chưa có vật phẩm.
        </p>
      )}

      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li key={item.code}>
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-sm text-muted">
              {item.kind === "PERMANENT"
                ? "Đã sở hữu"
                : `Còn ${item.quantity} lượt`}
            </p>
            <p className="text-sm text-muted">
              {item.description}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-muted">
        Dùng lượt đèn trong trải nghiệm thả hoa đăng.
        Vật phẩm trang trí có thể bật hoặc cất tại không gian thờ
        và bàn thờ gia tiên. Sau khi mua hoặc nhận quà, bấm
        tải lại kho để cập nhật.
      </p>

      <button
        type="button"
        disabled={loading}
        onClick={() => setReload((value) => value + 1)}
        className="mt-4 min-h-11 rounded-xl border border-line px-4 py-2 text-sm disabled:opacity-50"
      >
        Tải lại kho
      </button>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { ApiError, apiRequest } from "../lib/api";
import { isDemoMode } from "../data/demoMode";
import { readDemoValue, writeDemoValue } from "../data/demoStorage";
import {
  submitSePayCheckout,
  type SePayCheckoutResponse,
} from "../lib/sepayCheckout";

type ItemCode =
  | "ROYAL_LANTERN"
  | "GOLDEN_LOTUS"
  | "INCENSE_BURNER"
  | "BOILED_CHICKEN";

interface Item {
  code: ItemCode;
  name: string;
  kind: "CONSUMABLE" | "PERMANENT";
  description: string;
  price: number;
  quantity: number;
}

interface Catalog {
  checkoutAvailable: boolean;
  currency: string;
  items: Item[];
}

interface Order {
  id: string;
  status: string;
  item_code: string;
  itemName: string;
  itemKind: string;
  quantity: number;
  amount: number;
  paymentWindowExpired: boolean;
  reconciliation?: string;
  payment_review_status?: "NONE" | "OPEN" | "RESOLVED";
}

interface Attempt {
  requestId: string;
  orderId: string;
  itemCode: ItemCode;
}

const itemCodes: ItemCode[] = [
  "ROYAL_LANTERN",
  "GOLDEN_LOTUS",
  "INCENSE_BURNER",
  "BOILED_CHICKEN",
];

function readAttempt(key: string): Attempt | null {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;

  const value = JSON.parse(raw);

  if (
    typeof value?.requestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value.requestId
    )
  ) {
    throw new Error("Thông tin đơn đang lưu không hợp lệ.");
  }

  const expectedId =
    "DI" +
    value.requestId.replace(/-/g, "").toLowerCase().slice(0, 30);

  // Các yêu cầu cũ chỉ hỗ trợ đèn, chưa lưu itemCode.
  const itemCode = value.itemCode ?? "ROYAL_LANTERN";

  if (
    value.orderId !== expectedId ||
    !itemCodes.includes(itemCode)
  ) {
    throw new Error("Thông tin vật phẩm đang lưu không hợp lệ.");
  }

  return {
    requestId: value.requestId,
    orderId: expectedId,
    itemCode,
  };
}

export function DigitalShop({ email }: { email?: string }) {
  const demoMode = isDemoMode();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [ownedCodes, setOwnedCodes] = useState<string[]>([]);
  const [selectedCode, setSelectedCode] =
    useState<ItemCode>("ROYAL_LANTERN");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [acceptNew, setAcceptNew] = useState(false);
  const [canAbandon, setCanAbandon] = useState(false);
  const [reload, setReload] = useState(0);

  const attemptRef = useRef<Attempt | null>(null);
  const lockRef = useRef(false);
  const versionRef = useRef(0);

  const storageKey = email
    ? `tltl-shop-attempt:${email.trim().toLowerCase()}`
    : null;

  useEffect(() => {
    const version = ++versionRef.current;

    setLoading(true);
    setCatalog(null);
    setOrder(null);
    setOwnedCodes([]);
    setAcceptNew(false);
    setCanAbandon(false);
    setMessage("");
    attemptRef.current = null;

    const load = async () => {
      try {
        if (isDemoMode()) {
          const nextCatalog: Catalog = {
            checkoutAvailable: true,
            currency: "VND",
            items: [
              { code: "ROYAL_LANTERN", name: "Đèn Tâm An", kind: "PERMANENT", description: "Vật phẩm trang trí không gian 3D.", price: 49000, quantity: 1 },
              { code: "GOLDEN_LOTUS", name: "Sen vàng", kind: "PERMANENT", description: "Biểu tượng thanh tịnh để trang trí bàn thờ ảo.", price: 39000, quantity: 1 },
              { code: "INCENSE_BURNER", name: "Nén hương thành tâm", kind: "CONSUMABLE", description: "Vật phẩm dâng hương dùng thử trong bản demo.", price: 9000, quantity: 5 },
              { code: "BOILED_CHICKEN", name: "Gà luộc mâm lễ", kind: "PERMANENT", description: "Mô hình gà luộc; sau khi mua, bạn chủ động chọn bày trên bàn thờ.", price: 10000, quantity: 1 },
            ],
          };
          const owned = readDemoValue<string[]>("owned-items", ["ROYAL_LANTERN"]);
          setOwnedCodes(owned);
          setCatalog(nextCatalog);
          setMessage("Chế độ demo: thao tác mua chỉ lưu vật phẩm trên trình duyệt, không phát sinh thanh toán thật.");
          return;
        }
        const nextCatalog = await apiRequest<Catalog>("/shop");

        let nextOrder: Order | null = null;
        let owned: string[] = [];
        let nextMessage = "";
        let allowAbandon = false;
        const saved = storageKey ? readAttempt(storageKey) : null;

        const params = new URLSearchParams(window.location.search);
        const returned = params.get("orderId") ?? params.get("vnp_TxnRef");
        const returnedId =
          returned && /^DI[a-f0-9]{30}$/i.test(returned)
            ? returned
            : null;

        if (email) {
          const inventory = await apiRequest<{
            items: Array<{ code: string; quantity: number }>;
          }>("/inventory");

          owned = inventory.items
            .filter((item) => item.quantity > 0)
            .map((item) => item.code);

          const orderId = saved?.orderId ?? returnedId;

          if (orderId) {
            try {
              nextOrder = await apiRequest<Order>(
                `/payments/sepay/orders/${encodeURIComponent(orderId)}/reconcile`,
                { method: "POST" }
              );
            } catch (error) {
              if (
                error instanceof ApiError &&
                error.status === 404 &&
                saved !== null &&
                saved.orderId === orderId
              ) {
                nextMessage =
                  "Đơn chưa được tạo. Bạn có thể thử lại bằng cùng mã yêu cầu.";
                allowAbandon = true;
              } else {
                throw error;
              }
            }

            // Đối soát có thể vừa cấp vật phẩm, nên tải kho lại.
            if (nextOrder?.status === "PAID") {
              const updated = await apiRequest<{
                items: Array<{ code: string; quantity: number }>;
              }>("/inventory");

              owned = updated.items
                .filter((item) => item.quantity > 0)
                .map((item) => item.code);
            }
          }
        }

        if (version !== versionRef.current) return;

        let activeAttempt = saved;

        if (
          storageKey &&
          nextOrder &&
          saved?.orderId === nextOrder.id &&
          ["PAID", "FAILED", "CANCELLED", "ABANDONED", "EXPIRED"].includes(nextOrder.status)
        ) {
          sessionStorage.removeItem(storageKey);
          activeAttempt = null;
        }

        attemptRef.current = activeAttempt;

        if (activeAttempt) {
          setSelectedCode(activeAttempt.itemCode);
        }

        setOwnedCodes(owned);
        setOrder(nextOrder);
        setCatalog(nextCatalog);
        setMessage(nextMessage);
        setCanAbandon(allowAbandon);
      } catch (error) {
        if (version !== versionRef.current) return;

        setCatalog(null);
        setMessage(
          error instanceof Error
            ? error.message
            : "Chưa kiểm tra được cửa hàng."
        );
      } finally {
        if (version === versionRef.current) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      versionRef.current += 1;
    };
  }, [email, storageKey, reload]);

  useEffect(() => {
    if (!isDemoMode()) return;
    const refreshDemoShop = () => setReload((value) => value + 1);
    window.addEventListener("tltl-demo-inventory-change", refreshDemoShop);
    return () => window.removeEventListener("tltl-demo-inventory-change", refreshDemoShop);
  }, []);

  const selected = catalog?.items.find(
    (item) => item.code === selectedCode
  );

  const selectedOwned =
    selected?.kind === "PERMANENT" &&
    ownedCodes.includes(selected.code);

  const unresolvedOrder =
    order && !["PAID", "FAILED", "CANCELLED", "ABANDONED", "EXPIRED"].includes(order.status);

  // Đơn hết hạn phải được đóng qua BE trước khi tạo đơn khác.
  const mayReplaceExpired = false;

  const resumable =
    order?.status === "PENDING" &&
    !order.paymentWindowExpired &&
    order.reconciliation !== "PROVIDER_CANCELLED" &&
    attemptRef.current?.orderId === order.id;

  const orderBlocksPurchase =
    Boolean(unresolvedOrder) &&
    !mayReplaceExpired &&
    !resumable;

  const buy = async () => {
    if (
      lockRef.current ||
      loading ||
      (!demoMode && (!email || !storageKey)) ||
      !catalog?.checkoutAvailable ||
      !selected ||
      selectedOwned ||
      orderBlocksPurchase
    ) {
      return;
    }

    lockRef.current = true;
    setBusy(true);
    setMessage("");

    const version = versionRef.current;

    try {
      if (demoMode) {
        const owned = readDemoValue<string[]>("owned-items", ["ROYAL_LANTERN"]);
        if (!owned.includes(selected.code)) {
          const nextOwned = [...owned, selected.code];
          writeDemoValue("owned-items", nextOwned);
          setOwnedCodes(nextOwned);
          window.dispatchEvent(new Event("tltl-demo-inventory-change"));
        }
        setMessage(`Đã mô phỏng mua ${selected.name}. Vật phẩm đã vào kho demo; không có thanh toán thật.`);
        return;
      }

      if (!storageKey) {
        throw new Error("Hãy đăng nhập để mua và lưu vật phẩm vào kho tài khoản.");
      }

      let attempt = attemptRef.current;

      if (!attempt || mayReplaceExpired) {
        const requestId = crypto.randomUUID();

        attempt = {
          requestId,
          itemCode: selected.code,
          orderId:
            "DI" + requestId.replace(/-/g, "").slice(0, 30),
        };

        sessionStorage.setItem(storageKey, JSON.stringify(attempt));
        attemptRef.current = attempt;

        const url = new URL(window.location.href);

        for (const key of [...url.searchParams.keys()]) {
          if (key === "orderId" || key.startsWith("vnp_")) {
            url.searchParams.delete(key);
          }
        }

        window.history.replaceState(
          window.history.state,
          "",
          `${url.pathname}${url.search}${url.hash}`
        );
      }

      if (attempt.itemCode !== selected.code) {
        throw new Error(
          "Đang có yêu cầu mua vật phẩm khác. Hãy kiểm tra đơn cũ trước."
        );
      }

      const result = await apiRequest<SePayCheckoutResponse>(
        "/shop/checkout",
        {
          method: "POST",
          body: JSON.stringify({
            requestId: attempt.requestId,
            itemCode: attempt.itemCode,
          }),
        }
      );

      if (version !== versionRef.current) return;

      if (result.orderId !== attempt.orderId) {
        throw new Error("Mã đơn trả về không khớp.");
      }

      submitSePayCheckout(result);
    } catch (error) {
      if (version === versionRef.current) {
        setCatalog(null);
        setMessage(
          `${
            error instanceof Error
              ? error.message
              : "Chưa mở được thanh toán."
          } Bấm “Kiểm tra lại đơn” trước khi tiếp tục.`
        );
      }
    } finally {
      lockRef.current = false;

      if (version === versionRef.current) {
        setBusy(false);
      }
    }
  };

  const abandon = async () => {
    const attempt = attemptRef.current;

    if (
      lockRef.current ||
      loading ||
      !canAbandon ||
      !attempt ||
      !storageKey
    ) {
      return;
    }

    lockRef.current = true;
    setBusy(true);
    setMessage("");

    const version = versionRef.current;

    try {
      const result = await apiRequest<{
        orderId: string;
        abandoned: boolean;
      }>("/shop/attempts/abandon", {
        method: "POST",
        body: JSON.stringify({
          requestId: attempt.requestId,
          itemCode: attempt.itemCode,
        }),
      });

      if (version !== versionRef.current) return;

      if (
        result.orderId !== attempt.orderId ||
        result.abandoned !== true
      ) {
        throw new Error("Chưa xác nhận được việc bỏ yêu cầu.");
      }

      sessionStorage.removeItem(storageKey);
      attemptRef.current = null;
      setCanAbandon(false);

      const url = new URL(window.location.href);

      if (url.searchParams.get("orderId") === attempt.orderId) {
        url.searchParams.delete("orderId");
      }

      if (url.searchParams.get("vnp_TxnRef") === attempt.orderId) {
        for (const key of [...url.searchParams.keys()]) {
          if (key.startsWith("vnp_")) {
            url.searchParams.delete(key);
          }
        }
      }

      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`
      );

      setReload((value) => value + 1);
    } catch (cause) {
      if (version === versionRef.current) {
        setMessage(
          cause instanceof Error
            ? cause.message
            : "Chưa bỏ được yêu cầu. Hãy kiểm tra lại đơn."
        );
      }
    } finally {
      lockRef.current = false;

      if (version === versionRef.current) {
        setBusy(false);
      }
    }
  };

  const closeExpiredOrder = async () => {
    if (
      lockRef.current ||
      loading ||
      !acceptNew ||
      !order ||
      order.status !== "PENDING" ||
      !order.paymentWindowExpired
    ) {
      return;
    }

    const closingOrderId = order.id;
    const version = versionRef.current;

    lockRef.current = true;
    setBusy(true);
    setMessage("");

    try {
      const result = await apiRequest<Order>(
        `/shop/orders/${encodeURIComponent(closingOrderId)}/close-window`,
        {
          method: "POST",
          body: JSON.stringify({
            acceptLatePayment: true,
          }),
        }
      );

      if (version !== versionRef.current) return;

      if (
        result.id !== closingOrderId ||
        result.status !== "EXPIRED"
      ) {
        throw new Error(
          "Đơn đã thay đổi trạng thái. Hãy kiểm tra lại."
        );
      }

      if (
        storageKey &&
        attemptRef.current?.orderId === closingOrderId
      ) {
        sessionStorage.removeItem(storageKey);
        attemptRef.current = null;
      }

      setAcceptNew(false);
      setReload((value) => value + 1);
    } catch (cause) {
      if (version === versionRef.current) {
        setMessage(
          cause instanceof Error
            ? cause.message
            : "Chưa đóng được thời hạn thanh toán."
        );
      }
    } finally {
      lockRef.current = false;

      if (version === versionRef.current) {
        setBusy(false);
      }
    }
  };

  const orderMessage = !order
    ? ""
    : order.status === "PAID"
      ? order.payment_review_status === "OPEN"
        ? "Thanh toán đã được xác nhận. Đơn cần được nhóm hỗ trợ kiểm tra."
        : "Thanh toán đã được xác nhận. Bạn có thể kiểm tra vật phẩm trong kho."
      : order.status === "EXPIRED"
        ? "Đã đóng thời hạn mở thanh toán trên ứng dụng. Chưa có xác nhận hủy từ SePay. Bạn có thể tạo đơn khác hoặc tiếp tục kiểm tra đơn cũ."
      : order.status === "ABANDONED"
        ? "Yêu cầu đã được bỏ trước khi mở thanh toán. Không cấp vật phẩm."
      : order.status === "CANCELLED"
        ? "SePay đã xác nhận đơn bị hủy. Chưa cấp vật phẩm. Bạn có thể tạo đơn khác."
        : order.status === "FAILED"
          ? "Giao dịch không thành công. Đơn này không cấp vật phẩm."
          : order.reconciliation === "PROVIDER_CANCELLED"
          ? "SePay báo đơn đã hủy. Chưa cấp vật phẩm từ đơn này."
          : order.reconciliation === "NOT_FOUND_ON_PROVIDER"
            ? "Chưa tìm thấy đơn trên SePay. Chưa cấp vật phẩm."
            : order.paymentWindowExpired
              ? "Đơn hết thời hạn mở thanh toán nhưng chưa có kết quả cuối cùng."
              : "Đang chờ thanh toán hoặc xác nhận từ SePay.";

  const buttonClass =
    "min-h-11 rounded-xl border border-line px-4 py-2 text-sm disabled:opacity-50";

  return (
    <section className="my-8 rounded-3xl border border-line bg-surface p-6">
      <h2 className="text-xl font-semibold">
        Vật phẩm trang trí
      </h2>

      <p className="mt-3 text-sm text-muted">
        Đèn thường vẫn miễn phí. Vật phẩm trả phí chỉ đổi
        cách trang trí, không làm lời nguyện có hiệu lực hơn.
      </p>

      {loading && <p role="status">Đang kiểm tra cửa hàng…</p>}

      {!loading && catalog && (
        <div className="mt-4 space-y-3">
          {catalog.items.map((item) => {
            const owned =
              item.kind === "PERMANENT" &&
              ownedCodes.includes(item.code);

            return (
              <label
                key={item.code}
                className="flex items-start gap-3 rounded-xl border border-line p-4"
              >
                <input
                  type="radio"
                  name="digital-shop-item"
                  checked={selectedCode === item.code}
                  disabled={
                    busy ||
                    Boolean(attemptRef.current) ||
                    Boolean(unresolvedOrder && !mayReplaceExpired)
                  }
                  onChange={() => setSelectedCode(item.code)}
                  className="mt-1"
                />

                <span>
                  <strong>{item.name}</strong>
                  <span className="block text-sm">
                    {item.price.toLocaleString("vi-VN")}đ
                    {item.kind === "CONSUMABLE"
                      ? ` / ${item.quantity} lượt`
                      : " / sở hữu lâu dài, không tự trừ tiền"}
                  </span>
                  <span className="block text-sm text-muted">
                    {item.description}
                  </span>
                  {owned && (
                    <span className="block text-sm">Đã sở hữu</span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {catalog && !catalog.checkoutAvailable && !demoMode && (
        <p className="mt-3 text-sm text-muted">
          Cửa hàng chưa mở thanh toán.
        </p>
      )}

      {order && (
        <div className="mt-4 rounded-xl border border-line p-4">
          <p className="break-all text-xs">Mã đơn: {order.id}</p>
          <p className="mt-2 text-sm">
            {order.itemName} · {order.amount.toLocaleString("vi-VN")}đ
          </p>
          <p role="status" className="mt-2 text-sm">
            {orderMessage}
          </p>

          {order.payment_review_status === "OPEN" && (
            <p role="alert" className="mt-3 text-sm text-danger">
              Đơn đã nhận thanh toán nhưng bạn đã sở hữu vật phẩm này.
              Không cấp thêm bản sao. Hãy giữ mã đơn để nhóm hỗ trợ
              đối chiếu và xử lý khoản thanh toán thừa.
            </p>
          )}

          {order.status === "PENDING" &&
            order.paymentWindowExpired && (
              <div className="mt-3 space-y-3">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={acceptNew}
                    disabled={busy || loading}
                    onChange={(event) =>
                      setAcceptNew(event.target.checked)
                    }
                  />

                  <span>
                    Tôi đã kiểm tra đơn cũ và muốn đóng thời hạn mở
                    thanh toán trên ứng dụng để có thể tạo đơn khác.
                    Tôi hiểu đây không phải xác nhận hủy từ SePay;
                    đơn cũ vẫn có thể được xác nhận trả tiền muộn.
                    Nếu thanh toán thừa cho vật phẩm vĩnh viễn,
                    tôi cần liên hệ hỗ trợ để xử lý.
                  </span>
                </label>

                <button
                  type="button"
                  className={buttonClass}
                  disabled={busy || loading || !acceptNew}
                  onClick={() => void closeExpiredOrder()}
                >
                  Đóng thời hạn mở thanh toán đơn cũ
                </button>
              </div>
            )}
        </div>
      )}

      {!email && !demoMode && (
        <p className="mt-3 text-sm">
          Đăng nhập để mua và kiểm tra kho của tài khoản.
        </p>
      )}

      {(email || demoMode) && catalog?.checkoutAvailable && (
        <button
          type="button"
          className={`${buttonClass} mt-4`}
          disabled={
            busy ||
            loading ||
            !selected ||
            selectedOwned ||
            orderBlocksPurchase
          }
          onClick={() => void buy()}
        >
          {busy
            ? "Đang mở thanh toán…"
            : selectedOwned
              ? "Đã sở hữu vật phẩm"
            : demoMode
              ? "Mô phỏng mua (không thanh toán)"
              : resumable
                ? "Mở lại thanh toán đơn hiện tại"
                : orderBlocksPurchase
                  ? "Cần kiểm tra đơn hiện tại"
                  : "Mua vật phẩm đã chọn"}
        </button>
      )}

      {message && (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      )}

      {canAbandon && (
        <div className="mt-4 rounded-xl border border-line p-3">
          <p className="text-sm text-muted">
            Chưa tìm thấy đơn đã tạo. Bạn có thể thử lại cùng
            yêu cầu hoặc bỏ yêu cầu để chọn vật phẩm khác.
          </p>

          <button
            type="button"
            disabled={busy || loading}
            className={`${buttonClass} mt-3`}
            onClick={() => void abandon()}
          >
            Bỏ yêu cầu chưa tạo đơn
          </button>
        </div>
      )}

      <button
        type="button"
        disabled={loading || busy}
        className={`${buttonClass} mt-4`}
        onClick={() => setReload((value) => value + 1)}
      >
        Kiểm tra lại đơn
      </button>
    </section>
  );
}

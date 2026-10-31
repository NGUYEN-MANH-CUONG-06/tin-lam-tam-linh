import { useEffect, useRef, useState } from "react";
import { ApiError, apiRequest } from "../lib/api";
import { isDemoMode } from "../data/demoMode";
import {
  clearMembershipIntent,
  readMembershipIntent,
  type MembershipTerm,
} from "../data/membershipIntent";
import {
  submitSePayCheckout,
  type SePayCheckoutResponse,
} from "../lib/sepayCheckout";

interface MembershipAttempt {
  requestId: string;
  term: "monthly" | "yearly";
}

function readMembershipAttempt(
  key: string | null
): MembershipAttempt | null {
  if (!key) return null;

  const raw = sessionStorage.getItem(key);
  if (!raw) return null;

  const value = JSON.parse(raw);

  if (
    typeof value?.requestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value.requestId
    ) ||
    !["monthly", "yearly"].includes(value.term)
  ) {
    throw new Error("Thông tin đơn đang lưu không hợp lệ.");
  }

  return value;
}

export interface Status {
  price: number;
  plans: Array<{
    term: "monthly" | "yearly";
    name: string;
    price: number;
    originalPrice?: number;
    months: number;
  }>;
  currency: string;
  paymentEnvironment: "sandbox" | "production";
  aiLimits: {
    successfulReadingsPer24Hours: number;
    providerAttemptsPer24Hours: number;
  };
  salesEnabled: boolean;
  checkoutAvailable: boolean;
  subscription: {
    id: string;
    expires_at: string;
  } | null;
  benefits: Array<{ name: string; free: string; premium: string; availability: string }>;
  aiUsage: {
    windowHours: number; successfulLimit: number; providerAttemptLimit: number;
    successfulUsed: number; inProgress: number; successfulRemaining: number; attemptsUsed: number;
    attemptsRemaining: number; nextUsableAt: string | null;
  };
}

interface MembershipCheckoutProps {
  email?: string;
  onLogin: (term: MembershipTerm) => void;
  onStatusChange?: (status: Status | null) => void;
}

export function MembershipCheckout({
  email,
  onLogin,
  onStatusChange,
}: MembershipCheckoutProps) {
  const [status, setStatus] = useState<Status | null>(null);
  const [term, setTerm] = useState<MembershipTerm>("monthly");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pendingOrder, setPendingOrder] = useState(false);
  const [paymentWindowExpired, setPaymentWindowExpired] =
    useState(false);

  const [acceptNewOrder, setAcceptNewOrder] =
    useState(false);
  const [displayOrderId, setDisplayOrderId] = useState("");
  const [canResumeOrder, setCanResumeOrder] = useState(false);

  const orderBlocksCheckout =
    pendingOrder &&
    !(paymentWindowExpired && acceptNewOrder);

  const requestVersion = useRef(0);
  const checkoutLock = useRef(false);

  const attemptStorageKey = email
    ? `tltl-membership-attempt:${email.trim().toLowerCase()}`
    : null;

  const refresh = async () => {
    const version = ++requestVersion.current;

    setLoading(true);
    setError("");
    setMessage("");
    setAcceptNewOrder(false);
    setPaymentWindowExpired(false);
    setCanResumeOrder(false);

    if (isDemoMode()) {
      const demoStatus: Status = {
        price: 49000,
        plans: [
          { term: "monthly", name: "1 tháng", price: 49000, originalPrice: 49000, months: 1 },
          { term: "yearly", name: "1 năm (12 tháng)", price: 499000, originalPrice: 588000, months: 12 },
        ],
        currency: "VND",
        paymentEnvironment: "sandbox",
        aiLimits: { successfulReadingsPer24Hours: 3, providerAttemptsPer24Hours: 5 },
        salesEnabled: false,
        checkoutAvailable: false,
        subscription: {
          id: "demo-member-active",
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
        benefits: [
          { name: "Thành viên Tâm An", free: "Chưa đăng ký", premium: "Đang hoạt động trong demo", availability: "Đã kích hoạt · dữ liệu giả lập" },
          { name: "Đèn hoa đăng hoàng gia", free: "Không có lượt", premium: "1 lượt dùng", availability: "Có 1 lượt demo trong kho" },
          { name: "Thư viện hội viên", free: "Bài đọc mở", premium: "Bài đọc hội viên", availability: "Đang hoạt động trong demo" },
        ],
        aiUsage: { windowHours: 24, successfulLimit: 3, providerAttemptLimit: 5, successfulUsed: 1, inProgress: 0, successfulRemaining: 2, attemptsUsed: 1, attemptsRemaining: 4, nextUsableAt: null },
      };
      setStatus(demoStatus);
      onStatusChange?.(demoStatus);
      setMessage("Trạng thái hội viên đã đăng ký đang được mô phỏng. Thanh toán đã được tắt trong chế độ demo.");
      setLoading(false);
      return;
    }

    try {
      let nextStatus = await apiRequest<Status>(
        "/membership/status",
      );

      const params = new URLSearchParams(window.location.search);

      const returnedOrderId =
        params.get("orderId") ?? params.get("vnp_TxnRef");

      const savedAttempt = readMembershipAttempt(attemptStorageKey);

      if (
        version === requestVersion.current &&
        savedAttempt
      ) {
        setTerm(savedAttempt.term);
      }

      const savedOrderId = savedAttempt
        ? savedAttempt.requestId.replace(/-/g, "").toLowerCase()
        : null;

      const validReturnedOrderId =
        returnedOrderId && /^[a-f0-9]{32}$/i.test(returnedOrderId)
          ? returnedOrderId
          : null;

      const orderId = savedOrderId ?? validReturnedOrderId;

      if (version === requestVersion.current) {
        setDisplayOrderId(email ? orderId ?? "" : "");
      }

      let nextMessage = "";
      let waitingForOrder = false;
      let windowExpired = false;

      if (email && orderId) {
        let order: {
          status: string;
          paymentWindowExpired: boolean;
          reconciliation?:
            | "NOT_FOUND_ON_PROVIDER"
            | "PROVIDER_CANCELLED"
            | "AWAITING_PAYMENT"
            | "CONFIRMED";
        };

        try {
          order = await apiRequest(
            `/payments/sepay/orders/${encodeURIComponent(orderId)}/reconcile`,
            {
              method: "POST",
            }
          );
        } catch (error) {
          if (
            error instanceof ApiError &&
            error.status === 404 &&
            savedOrderId !== null &&
            savedOrderId === orderId
          ) {
            // BE chưa tạo được đơn: lần thử tiếp vẫn dùng cùng UUID.
            order = {
              status: "NOT_CREATED",
              paymentWindowExpired: false,
            };
          } else {
            throw error;
          }
        }

        if (version !== requestVersion.current) return;

        if (
          attemptStorageKey &&
          savedOrderId === orderId &&
          ["PAID", "FAILED", "CANCELLED"].includes(order.status)
        ) {
          sessionStorage.removeItem(attemptStorageKey);
        }

        if (order.status === "PAID") {
          nextMessage = "Thanh toán đã được xác nhận.";

          nextStatus = await apiRequest<Status>(
            "/membership/status",
          );
        } else if (order.status === "CANCELLED") {
          nextMessage =
            "SePay đã xác nhận đơn bị hủy. Đơn này chưa cấp hội viên. " +
            "Bạn có thể tạo đơn khác. Nếu đã bị trừ tiền, hãy giữ mã đơn để đối soát.";
        } else if (order.status === "FAILED") {
          nextMessage =
            "Thanh toán chưa thành công. Bạn chưa được cấp hội viên từ giao dịch này.";
        } else if (order.status === "PENDING") {
          waitingForOrder = true;
          windowExpired = order.paymentWindowExpired;

          if (order.reconciliation === "PROVIDER_CANCELLED") {
            nextMessage =
              "SePay báo đơn đã hủy. Đơn này chưa cấp hội viên. " +
              "Nếu đã bị trừ tiền, hãy giữ mã đơn và liên hệ hỗ trợ.";

            if (windowExpired) {
              nextMessage +=
                " Bạn có thể xác nhận kiểm tra đơn cũ bên dưới để tạo đơn khác.";
            }
          } else if (
            order.reconciliation === "NOT_FOUND_ON_PROVIDER"
          ) {
            nextMessage =
              "Đơn đã được tạo trên ứng dụng nhưng chưa tìm thấy trên SePay. " +
              "Bạn chưa được cấp hội viên từ đơn này.";
          } else if (
            order.reconciliation === "AWAITING_PAYMENT"
          ) {
            nextMessage = windowExpired
              ? "Đơn đã hết thời hạn mở thanh toán và chưa được xác nhận trả tiền. " +
                "Hãy kiểm tra giao dịch cũ trước khi tạo đơn khác."
              : "Đơn đang chờ thanh toán hoặc xác nhận cuối cùng từ SePay. " +
                "Chưa cấp hội viên từ đơn này.";
          } else {
            nextMessage = windowExpired
              ? "Đơn đã hết thời hạn mở thanh toán nhưng chưa có kết quả cuối cùng. " +
                "Nếu đã bị trừ tiền, hãy tiếp tục kiểm tra trạng thái."
              : "Đang chờ xác nhận thanh toán. Hãy kiểm tra lại trước khi tạo đơn khác.";
          }
        } else if (order.status === "NOT_CREATED") {
          nextMessage =
            "Đơn chưa được tạo. Bạn có thể thử lại bằng cùng mã yêu cầu.";
        } else {
          waitingForOrder = true;

          nextMessage =
            "Trạng thái giao dịch chưa được ứng dụng hỗ trợ. Chưa thể tạo đơn mới từ màn hình này.";
        }
      }

      if (version !== requestVersion.current) return;

      const attempt = readMembershipAttempt(attemptStorageKey);

      setCanResumeOrder(
        Boolean(
          waitingForOrder &&
          !windowExpired &&
          attempt &&
          attempt.requestId.replace(/-/g, "").toLowerCase() === orderId
        )
      );

      setStatus(nextStatus);
      setTerm((currentTerm) =>
        nextStatus.plans.some((plan) => plan.term === currentTerm)
          ? currentTerm
          : nextStatus.plans[0]?.term ?? "monthly",
      );
      onStatusChange?.(nextStatus);
      setPendingOrder(waitingForOrder);
      setPaymentWindowExpired(windowExpired);
      setMessage(nextMessage);
    } catch {
      if (version !== requestVersion.current) return;

      setStatus(null);
      onStatusChange?.(null);

      setError(
        "Chưa kiểm tra được trạng thái hội viên. Bạn hãy kiểm tra kết nối rồi thử lại.",
      );
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const intendedTerm = readMembershipIntent();
    if (intendedTerm) setTerm(intendedTerm);
    clearMembershipIntent();
  }, []);

  useEffect(() => {
    setStatus(null);
    setPendingOrder(false);

    void refresh();

    return () => {
      requestVersion.current += 1;
    };
  }, [email]);

  const checkout = async () => {
    if (
      checkoutLock.current ||
      loading ||
      !status?.checkoutAvailable ||
      !status.plans.some((plan) => plan.term === term) ||
      (orderBlocksCheckout && !canResumeOrder)
    ) {
      return;
    }

    if (!email) {
      onLogin(term);
      return;
    }

    checkoutLock.current = true;
    setBusy(true);
    setError("");

    try {
      const version = requestVersion.current;

      if (!attemptStorageKey) {
        throw new Error("Cần đăng nhập để thanh toán.");
      }

      let attempt = readMembershipAttempt(attemptStorageKey);

      if (
        !attempt ||
        (pendingOrder && paymentWindowExpired && acceptNewOrder)
      ) {
        attempt = {
          requestId: crypto.randomUUID(),
          term,
        };

        // Lưu trước khi gửi để khôi phục được khi request timeout.
        sessionStorage.setItem(
          attemptStorageKey,
          JSON.stringify(attempt)
        );
      }

      if (attempt.term !== term) {
        throw new Error(
          "Bạn có yêu cầu tạo đơn cho gói khác. Hãy chọn lại gói cũ và kiểm tra trạng thái trước."
        );
      }

      const order = await apiRequest<SePayCheckoutResponse>(
        "/membership/checkout",
        {
          method: "POST",
          body: JSON.stringify({
            term: attempt.term,
            requestId: attempt.requestId,
          }),
        }
      );

      const expectedOrderId = attempt.requestId
        .replace(/-/g, "")
        .toLowerCase();

      if (order.orderId !== expectedOrderId) {
        throw new Error("Mã đơn trả về không khớp.");
      }

      if (version !== requestVersion.current) {
        checkoutLock.current = false;
        setBusy(false);
        return;
      }

      submitSePayCheckout(order);
    } catch (error) {
      checkoutLock.current = false;
      setBusy(false);

      setError(
        `${
          error instanceof Error
            ? error.message
            : "Chưa mở được thanh toán."
        } Hãy bấm “Kiểm tra lại trạng thái” trước khi tiếp tục.`
      );
    }
  };

  const selectedPlan = status?.plans.find(
    (plan) => plan.term === term
  );

  const formattedPrice = selectedPlan
    ? new Intl.NumberFormat("vi-VN").format(
        selectedPlan.price
      )
    : "";

  return (
    <section
      className="my-6 rounded-3xl border-2 border-amber-500/35 bg-surface p-5 shadow-xs sm:p-6"
      aria-labelledby="membership-checkout-title"
    >
      <h2
        id="membership-checkout-title"
        className="text-xl font-semibold text-ink sm:text-2xl"
      >
        Gói Hội viên Tâm An
      </h2>
      <p className="mt-1 text-sm text-muted">
        Chọn thời hạn phù hợp. Giá và trạng thái thanh toán được cập nhật từ máy chủ.
      </p>

      {loading && (
        <p role="status" className="mt-3 text-sm text-muted">
          Đang kiểm tra trạng thái hội viên…
        </p>
      )}

      {!loading && status && (
        <>
          {status.paymentEnvironment === "sandbox" && (
            <p
              role="status"
              className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
            >
              Môi trường thử nghiệm: giao dịch giả lập, không chuyển
              tiền thật. Hội viên và vật phẩm được cấp ở đây chỉ dùng
              để kiểm tra chức năng.
            </p>
          )}

          {status.subscription && (
            <p className="mt-3 text-sm text-ink">
              Hội viên đang hoạt động đến{" "}
              {new Date(
                status.subscription.expires_at,
              ).toLocaleDateString("vi-VN")}
              .
            </p>
          )}

          {!status.checkoutAvailable && (
            <p className="mt-3 text-sm text-muted">
              {status.salesEnabled
                ? "Đăng ký và gia hạn đang tạm thời không khả dụng."
                : "Gói hội viên chưa mở bán. Bạn vẫn có thể sử dụng các tính năng miễn phí hiện có."}
            </p>
          )}

          {status.plans.length > 0 && (
            <>
              <fieldset
                disabled={busy || loading || orderBlocksCheckout || !status.checkoutAvailable}
                className="mt-4 flex flex-wrap gap-3"
              >
                <legend className="mb-2 text-sm font-semibold text-ink">
                  Chọn thời hạn
                </legend>

                {status.plans.map((plan) => {
                  const isYearly = plan.term === "yearly";
                  const originalPrice = isYearly ? (plan.originalPrice || 588000) : undefined;
                  const discountAmount = originalPrice ? originalPrice - plan.price : 0;
                  const isSelected = term === plan.term;

                  return (
                    <label
                      key={plan.term}
                      className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3.5 sm:px-4 sm:py-3.5 text-sm transition-all ${
                        isSelected
                          ? "border-amber-600/70 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/30 font-medium"
                          : "border-line bg-surface hover:bg-surface-soft text-ink"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="membership-term"
                          checked={isSelected}
                          onChange={() => setTerm(plan.term)}
                          className="accent-amber-600 h-4 w-4 shrink-0"
                        />
                        <span className="font-semibold text-ink">{plan.name}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-right">
                        {originalPrice && (
                          <span className="line-through text-stone-400 dark:text-stone-500 text-xs sm:text-sm">
                            {new Intl.NumberFormat("vi-VN").format(originalPrice)}đ
                          </span>
                        )}
                        <span className="font-bold text-accent text-sm sm:text-base">
                          {new Intl.NumberFormat("vi-VN").format(plan.price)}đ
                        </span>
                        {isYearly && discountAmount > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Tiết kiệm {new Intl.NumberFormat("vi-VN").format(discountAmount)}đ
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </fieldset>

              <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-sm">
                <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
                  <span className="font-semibold text-ink">
                    Chi phí:
                  </span>
                  {term === "yearly" && (
                    <span className="line-through text-stone-400 dark:text-stone-500 text-sm">
                      588.000đ
                    </span>
                  )}
                  <span className="font-bold text-accent text-base">
                    {formattedPrice}đ/{term === "yearly" ? "1 năm (12 tháng)" : "tháng"}
                  </span>
                  {term === "yearly" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      Ưu đãi khuyến mãi · Tiết kiệm 89.000đ
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Gia hạn thủ công, không tự động trừ tiền. Cả hai gói đều có quyền diễn giải AI theo năm và đọc bài trong thư viện hội viên. Gói 1 năm được tặng kèm một lượt đèn hoa đăng trang trí và quyền sở hữu bình sen ngọc.
                </p>
              </div>

              {status.checkoutAvailable && (
                <>
                  <p className="mt-2 text-sm text-muted">
                    Giới hạn AI: tối đa{" "}
                    {status.aiLimits.successfulReadingsPer24Hours} bản
                    diễn giải trong 24 giờ; tối đa{" "}
                    {status.aiLimits.providerAttemptsPer24Hours} lượt gọi
                    dịch vụ trong 24 giờ, gồm cả lượt thất bại.
                    Diễn giải dùng để tự suy ngẫm, không tính lá số hoặc
                    dự báo chắc chắn tương lai.
                  </p>

                  {pendingOrder && paymentWindowExpired && (
                    <label className="mt-4 flex items-start gap-3 rounded-xl border border-line p-4">
                      <input
                        type="checkbox"
                        checked={acceptNewOrder}
                        disabled={busy || loading}
                        onChange={(event) =>
                          setAcceptNewOrder(event.target.checked)
                        }
                        className="mt-1 h-4 w-4 shrink-0 accent-accent"
                      />

                      <span className="text-sm leading-relaxed text-muted">
                        Tôi đã kiểm tra giao dịch cũ và muốn tạo đơn khác.
                        Tôi hiểu đơn cũ vẫn có thể được xác nhận muộn;
                        nếu cả hai đơn thanh toán thành công, cả hai sẽ
                        được tính vào thời hạn hội viên.
                      </span>
                    </label>
                  )}

                  <button
                    type="button"
                    disabled={busy || (orderBlocksCheckout && !canResumeOrder)}
                    onClick={() => void checkout()}
                    className="mt-4 min-h-11 rounded-xl bg-accent px-5 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {busy
                      ? "Đang mở thanh toán…"
                      : canResumeOrder
                        ? "Mở lại thanh toán đơn hiện tại"
                        : orderBlocksCheckout
                          ? "Đang chờ xác nhận giao dịch"
                          : !email
                            ? "Đăng nhập để tiếp tục"
                            : status.subscription
                              ? "Gia hạn qua SePay"
                              : "Đăng ký qua SePay"}
                  </button>
                </>
              )}
            </>
          )}
        </>
      )}

      {email && displayOrderId && (
        <div className="mt-3 rounded-xl border border-line p-3">
          <p className="break-all text-xs text-muted">
            Mã đơn: {displayOrderId}
          </p>

          <p className="mt-2 text-xs text-muted">
            Khi cần hỗ trợ, hãy cung cấp mã đơn và thời điểm
            giao dịch. Không cung cấp mật khẩu hoặc mã OTP ngân hàng.
          </p>
        </div>
      )}

      {message && (
        <p role="status" className="mt-3 text-sm text-muted">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={loading || busy}
        onClick={() => void refresh()}
        className="mt-4 rounded-xl border border-line px-4 py-3 text-sm disabled:opacity-50"
      >
        {loading ? "Đang kiểm tra…" : "Kiểm tra lại trạng thái"}
      </button>
    </section>
  );
}

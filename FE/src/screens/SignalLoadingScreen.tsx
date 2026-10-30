import { useEffect, useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
interface SignalLoadingScreenProps {
  requestNotice?: string | null;
  onFinishLoading: () => boolean | Promise<boolean>;
  onCancel: () => void;
}

export const SignalLoadingScreen = ({
  requestNotice,
  onFinishLoading,
  onCancel,
}: SignalLoadingScreenProps) => {
  const [status, setStatus] = useState<"loading" | "error">("loading");

  const finishRef = useRef(onFinishLoading);
  const errorRef = useRef<HTMLDivElement | null>(null);

  finishRef.current = onFinishLoading;

  useEffect(() => {
    let cancelled = false;

    setStatus("loading");

    const timer = window.setTimeout(async () => {
      if (cancelled) return;

      try {
        const success = await finishRef.current();

        if (!cancelled && !success) {
          setStatus("error");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (status === "error") {
      errorRef.current?.focus();
    }
  }, [status]);

  return (
    <div className="screen-shell">
      <main className="page-container max-w-3xl">
        <Card className="p-6 text-center sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            CHECK-IN CẢM XÚC
          </p>

          <h1 className="page-title mt-4">
            Một lời gợi mở dành cho bạn
          </h1>

          {status === "loading" ? (
            <div aria-busy="true" className="mt-6">
              <div
                aria-hidden="true"
                className="mx-auto h-16 w-16 rounded-full border-4 border-line border-t-accent animate-spin motion-reduce:animate-none"
              />

              <p
                role="status"
                aria-live="polite"
                className="mt-5 text-sm text-muted"
              >
                Đang mở thông điệp theo tâm trạng và hoàn cảnh bạn chọn.
              </p>

              <p className="mt-3 text-sm leading-relaxed text-muted">
                Thả lỏng vai, để hơi thở trở về nhịp tự nhiên trong lúc máy chủ xử lý yêu cầu.
              </p>
            </div>
          ) : (
            <div
              ref={errorRef}
              tabIndex={-1}
              className="mt-6 rounded-panel border border-line p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <h2 className="font-semibold text-ink">
                Chưa hoàn tất mở thông điệp
              </h2>

              <p role="alert" className="mt-3 text-sm text-muted">
                {requestNotice || "Máy chủ chưa trả về kết quả và chưa xác nhận lưu lượt check-in."}
              </p>

              <Button
                type="button"
                className="mt-4"
                onClick={onCancel}
              >
                Quay lại thử lại
              </Button>
            </div>
          )}

          <p className="mt-6 text-xs leading-relaxed text-muted">
            Gợi mở chỉ xuất hiện khi nội dung đã được phép phát hành. Tâm sự của bạn không được dùng để tạo câu trích dẫn.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={onCancel}
          >
            Quay lại chỉnh tâm sự
          </Button>
        </Card>
      </main>
    </div>
  );
};

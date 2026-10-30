import { useState } from "react";
import { enableDevicePush, disableDevicePush } from "../data/pushService";
import { isDemoMode } from "../data/demoMode";
import { readDemoValue, writeDemoValue } from "../data/demoStorage";
export function PushNotificationSettings() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const change = async (enabled: boolean) => {
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      if (isDemoMode()) {
        writeDemoValue("push-enabled", enabled);
        setMessage(enabled ? "Đã bật nhắc nhở mẫu trên trình duyệt này." : "Đã tắt nhắc nhở mẫu trên trình duyệt này.");
        return;
      }
      if (enabled) {
        await enableDevicePush();

        setMessage(
          "Máy chủ đã ghi nhận đăng ký thiết bị. Bạn cần bật tùy chọn Thông báo đẩy của tài khoản để nhận nhắc lịch. Việc hiển thị còn phụ thuộc quyền thông báo và cài đặt của thiết bị."
        );
      } else {
        await disableDevicePush();

        setMessage(
          "Đã hoàn tất thao tác ngừng nhận thông báo trên trình duyệt này cho tài khoản hiện tại."
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Chưa hoàn tất thay đổi thông báo. Bạn hãy kiểm tra kết nối rồi thử lại."
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="mt-5 border-t border-line pt-5" aria-labelledby="device-reminders-title">
      <h3 id="device-reminders-title" className="font-semibold">Nhắc giỗ trên thiết bị này</h3>
      <p className="my-2 text-sm text-muted">
        Đăng ký trình duyệt này, sau đó bật “Thông báo trên thiết bị” ở phía trên
        để nhận lời nhắc trước 3 ngày theo lịch đã lưu.
        Thông báo có thể đến khi trang web không mở; thời điểm hiển thị
        phụ thuộc kết nối và cài đặt của thiết bị.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          className="min-h-11 rounded-lg border border-line px-4 py-2 disabled:cursor-wait disabled:opacity-60"
          onClick={() => void change(true)}
        >
          {busy ? "Đang cập nhật…" : "Đăng ký trình duyệt này"}
        </button>
        <button
          type="button"
          disabled={busy}
          className="min-h-11 rounded-lg border border-line px-4 py-2 disabled:cursor-wait disabled:opacity-60"
          onClick={() => void change(false)}
        >
          {busy ? "Đang cập nhật…" : "Ngừng nhận trên thiết bị"}
        </button>
      </div>
      {isDemoMode() && <p className="mt-2 text-xs text-muted">Trạng thái demo: {readDemoValue("push-enabled", false) ? "Đang bật" : "Đang tắt"}. Không đăng ký với máy chủ.</p>}
      {message && <p role="status" aria-live="polite" className="mt-3 text-sm">{message}</p>}
    </section>
  );
}

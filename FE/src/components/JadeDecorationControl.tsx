import type {
  useJadeDecoration,
} from "../hooks/useJadeDecoration";
import { isDemoMode } from "../data/demoMode";

export function JadeDecorationControl({
  state,
}: {
  state: ReturnType<typeof useJadeDecoration>;
}) {
  return (
    <div className="my-4 rounded-2xl border border-line bg-surface/90 p-4 shadow-sm sm:p-5">
      <label className="block text-sm font-semibold tracking-wide text-ink">
        Vật phẩm bày trên bàn thờ
        <select
          className="mt-2 block min-h-12 w-full appearance-none rounded-xl border border-line bg-surface px-4 py-3 text-ink shadow-sm transition-colors hover:border-accent focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          value={state.selected ?? ""}
          disabled={
            state.loading ||
            state.busy ||
            Boolean(state.error)
          }
          onChange={(event) =>
            void state.change(event.target.value)
          }
        >
          <option value="">Cất vật phẩm khỏi bàn thờ</option>

          {state.items.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <p role="status" className="mt-2 text-sm text-muted">
        {state.loading
          ? "Đang tải vật phẩm…"
          : state.busy
            ? "Đang lưu lựa chọn…"
            : !state.items.length
              ? "Bạn chưa sở hữu vật phẩm trang trí cho cảnh này."
              : isDemoMode()
                ? "Bản demo chỉ lưu lựa chọn trên trình duyệt; gà sẽ hiện trên bàn thờ khi bạn chọn bày."
                : "Chỉ vật phẩm bạn đã sở hữu mới xuất hiện ở đây. Chọn để bày trên bàn thờ; chọn cất để đưa vật phẩm về kho."}
      </p>

      <p className="mt-2 text-xs text-muted">
        Vật phẩm chỉ thay đổi trang trí, không làm tăng
        hiệu lực của nghi thức hay lời nguyện.
      </p>

      {state.error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="button"
        disabled={state.loading || state.busy}
        onClick={state.retry}
        className="mt-3 min-h-11 rounded-lg border border-line px-3 py-2 text-sm"
      >
        Tải lại vật phẩm
      </button>
    </div>
  );
}

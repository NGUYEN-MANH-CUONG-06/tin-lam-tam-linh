import { useState } from "react";
import type { useJadeDecoration } from "../hooks/useJadeDecoration";
import { isDemoMode } from "../data/demoMode";
import { Button } from "./ui/button";
import { DemoCommercePurchaseDialog } from "./DemoCommercePurchaseDialog";
import { Sparkles, Utensils, RotateCcw } from "lucide-react";

export function JadeDecorationControl({
  state,
  allowDemoChickenOffering = false,
}: {
  state: ReturnType<typeof useJadeDecoration>;
  allowDemoChickenOffering?: boolean;
}) {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  return (
    <div className="my-5 rounded-2xl border border-line bg-surface/90 p-5 shadow-xs sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/60 pb-3">
        <label
          htmlFor="altar-offering-select"
          className="text-sm font-bold tracking-wide text-ink font-serif flex items-center gap-2"
        >
          <Utensils className="w-4 h-4 text-accent" />
          <span>Bài trí lễ phẩm bàn thờ</span>
        </label>
        <span className="text-[11px] text-muted font-medium">
          Tùy tâm biện lễ, cốt ở lòng thành
        </span>
      </div>

      <div>
        <select
          id="altar-offering-select"
          className="block min-h-12 w-full appearance-none rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-xs transition-colors hover:border-accent focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
          value={state.selected ?? ""}
          disabled={state.loading || state.busy || Boolean(state.error)}
          onChange={(event) => void state.change(event.target.value)}
        >
          <option value="">Cất lễ vật (Bàn thờ trang nghiêm thanh tịnh)</option>
          {state.items.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>

        <p role="status" className="mt-2 text-xs text-muted leading-relaxed">
          {state.loading
            ? "Đang chuẩn bị lễ phẩm…"
            : state.busy
              ? "Đang bài trí lên bàn thờ…"
              : !state.items.length
                ? "Chưa có vật phẩm mâm cúng cho không gian này."
                : "Chọn vật phẩm để kính cẩn bày lên bàn thờ gia tiên; chọn cất để thu dọn mâm lễ về kho gia đình."}
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-xs text-danger">
          {state.error}
        </p>
      )}

      {isDemoMode() && allowDemoChickenOffering && (
        <div className="rounded-xl border border-amber-600/25 bg-amber-500/[0.04] p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif font-bold text-sm text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span>Mâm cỗ mặn truyền thống (Gà luộc hoa hồng)</span>
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30">
              Có sẵn: {state.virtualChickenStock} mâm
            </span>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Mâm cỗ mặn dâng kính gia tiên trong ngày sóc vọng, giỗ chạp hoặc dịp trọng đại để tỏ lòng hiếu kính, cầu chúc gia đạo bình an và phúc lộc vững bền.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={state.busy || state.loading || state.virtualChickenStock < 1}
              onClick={() => void state.useVirtualChicken().catch(() => {})}
              className="h-10 px-4 rounded-xl font-semibold text-xs bg-action hover:bg-action/90 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Kính dâng 1 mâm lễ lên bàn thờ</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={state.busy || state.loading}
              onClick={() => setPurchaseOpen(true)}
              className="h-10 px-4 rounded-xl font-semibold text-xs border-amber-600/30 text-accent hover:bg-accent/5 cursor-pointer flex items-center gap-1.5"
            >
              <span>Thỉnh thêm mâm cỗ</span>
            </Button>
            <button
              type="button"
              disabled={state.loading || state.busy}
              onClick={state.retry}
              className="h-10 px-3 rounded-xl border border-line text-xs text-muted hover:text-ink hover:bg-surface-soft transition-colors cursor-pointer flex items-center gap-1"
              title="Làm mới bài trí"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      )}

      {purchaseOpen && isDemoMode() && (
        <DemoCommercePurchaseDialog
          sku="VIRTUAL_CHICKEN"
          onClose={() => setPurchaseOpen(false)}
          onPurchaseComplete={state.syncDemoCommerceState}
        />
      )}
    </div>
  );
}

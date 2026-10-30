import React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { isDemoMode } from "../data/demoMode";
import { DemoAstrologyScreen } from "./DemoAstrologyScreen";

interface AstrologyHubScreenProps {
  onBackToExperience: () => void;
  onGoToHoroscope: () => void;
}

export const AstrologyHubScreen: React.FC<AstrologyHubScreenProps> = ({
  onBackToExperience,
}) => {

  if (isDemoMode()) return <DemoAstrologyScreen onBackToExperience={onBackToExperience} />;

  return (
    <div className="screen-shell">
      <main className="page-container max-w-5xl">
        {/* Top Breadcrumb Nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 text-xs text-stone-600 dark:text-stone-400">
          <button
            type="button"
            onClick={onBackToExperience}
            className="inline-flex items-center gap-1.5 hover:text-amber-800 dark:hover:text-amber-300 font-medium cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Quay lại Khám phá Trải nghiệm</span>
          </button>

          <Badge
            variant="outline"
            className="text-xs px-3 py-0.5 border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-500/10 font-medium self-start sm:self-auto"
          >
            ✦ THỜI KHẮC CỔ TRUYỀN · TỰ SOI CHIẾU NỘI TÂM
          </Badge>
        </div>

        {/* Hero Magazine Header */}
        <section className="mb-8 p-6 sm:p-10 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-surface via-surface to-amber-500/[0.04] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 to-transparent pointer-events-none rounded-bl-full" />

          <div className="relative z-10 space-y-3.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-300">
                NGHIÊN CỨU BIỂU TƯỢNG NGÀY SINH
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs text-stone-500">Đối Thoại Cùng Bản Thể</span>
            </div>

            <h1 className="page-title font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-ink leading-tight">
              Luận giải ngày sinh chưa phát hành
            </h1>

            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed max-w-2xl">
              Mục này chỉ mở sau khi phương pháp được thẩm định. Ứng dụng không dùng ngày sinh hoặc diện mạo để kết luận tính cách hay dự đoán tương lai.
            </p>

          </div>
        </section>

        <Card className="mb-8 border-line bg-surface p-6 sm:p-8">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Chưa cung cấp tính năng luận giải</span>
          </div>
          <h2 className="mb-2 font-display text-xl font-bold text-ink">Không tính lá số hoặc đọc tướng</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted">
            Các màn hình lá số 12 cung và nhân tướng chưa có phương pháp và quy trình kiểm định phù hợp để phát hành. Ứng dụng sẽ không tạo kết quả minh họa như thể đó là luận giải thật.
          </p>
        </Card>
        {/* Ethical Standards Footer */}
        <section className="mt-8 p-6 rounded-3xl bg-surface border border-line shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Nguyên tắc ứng xử văn hóa của Tin Lắm Tâm Linh</span>
          </div>

          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mb-3">
            Nội dung liên quan chỉ được mở khi có quy trình biên tập và giới hạn sử dụng rõ ràng. Chúng tôi cam kết:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-surface-soft border border-line">
              <strong className="text-ink block mb-0.5">Không mê tín dị đoan</strong>
              <span className="text-stone-500 text-[11px]">Không gieo rắc sợ hãi hay định đoạt số phận bi quan.</span>
            </div>
            <div className="p-3 rounded-2xl bg-surface-soft border border-line">
              <strong className="text-ink block mb-0.5">Không kinh doanh bùa ngải</strong>
              <span className="text-stone-500 text-[11px]">Không bán vật phẩm cầu may, hóa giải tai ương vụ lợi.</span>
            </div>
            <div className="p-3 rounded-2xl bg-surface-soft border border-line">
              <strong className="text-ink block mb-0.5">Tôn trọng quyền riêng tư</strong>
              <span className="text-stone-500 text-[11px]">Không lưu trữ hay truyền tải ngày sinh và hình ảnh của bạn.</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

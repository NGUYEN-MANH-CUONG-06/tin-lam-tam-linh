import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  Clock3,
  Flower2,
  Sparkles,
} from "lucide-react";

import type { SignalData } from "../data/demoSignals";

interface CompletionScreenProps {
  signal: SignalData;
  isActionDone: boolean;
  isLoggedIn: boolean;
  isSaved: boolean;
  onGoToHome: () => void;
  onGoToAccount: () => void;
  onViewSignal: () => void;
  onSaveToAccount: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  signal,
  isActionDone,
  isLoggedIn,
  isSaved,
  onGoToHome,
  onGoToAccount,
  onViewSignal,
  onSaveToAccount,
}) => {
  return (
    <div className="screen-shell relative overflow-x-clip">
      {/* Vầng sáng nền cổ phong ấm áp */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[36rem] sm:w-[48rem] h-[22rem] rounded-full bg-gradient-to-b from-accent/8 via-gold/4 to-transparent blur-3xl"
        aria-hidden="true"
      />

      <main className="page-container max-w-3xl relative z-10 py-6 sm:py-10">
        {/* ========================================================= */}
        {/* 1. HEADER CHÚC MỪNG HOÀN THÀNH                          */}
        {/* ========================================================= */}
        <header className="mb-7 sm:mb-9">
          <div className="flex items-center gap-3 mb-4">
            <div
              aria-hidden="true"
              className="w-13 h-13 rounded-full bg-gradient-to-br from-accent/15 via-accent/8 to-accent/5 border border-accent/25 text-accent flex items-center justify-center shadow-xs ring-4 ring-accent/5 shrink-0"
            >
              {isActionDone ? (
                <Check className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <Flower2 className="w-6 h-6 stroke-[2]" />
              )}
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/8 border border-accent/15 text-accent font-medium text-xs tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isActionDone ? "Hành động hoàn tất" : "Lời gửi gắm trọn vẹn"}</span>
            </span>
          </div>

          <h1 className="page-title text-3xl sm:text-4xl font-display font-semibold text-ink tracking-tight mb-3">
            {isActionDone
              ? "Bạn đã dành một chút thời gian cho mình"
              : "Lời chiêm nghiệm của bạn"}
          </h1>

          <p className="text-base sm:text-lg text-muted leading-relaxed max-w-2xl m-0">
            {isActionDone
              ? "Hành động nhỏ hôm nay đã được đánh dấu hoàn thành. Bạn có thể giữ lại lời chiêm nghiệm này hoặc tiếp tục ngày mới với tâm an."
              : "Bạn có thể đọc lại lời chiêm nghiệm, thử hành động nhỏ hoặc lưu nội dung để tự soi chiếu khi cần."}
          </p>

          {/* Dải phân cách hoa văn thanh mảnh */}
          <div className="flex items-center gap-3 my-5" aria-hidden="true">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent/40" />
            <div className="w-1.5 h-1.5 rotate-45 bg-accent/60" />
            <div className="h-px w-20 bg-accent/25" />
            <div className="w-1.5 h-1.5 rotate-45 bg-accent/60" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent/40" />
          </div>
        </header>

        {/* ========================================================= */}
        {/* 2. THẺ 1: TỔNG KẾT BÀI THƠ & HÀNH ĐỘNG ĐÃ LÀM            */}
        {/* ========================================================= */}
        <section
          aria-labelledby="completion-summary-title"
          className="relative rounded-2xl border border-line/70 bg-surface/95 p-6 sm:p-8 shadow-xs backdrop-blur-xs overflow-hidden"
        >
          {/* Nẹp chỉ thanh mảnh trên đỉnh thẻ */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/35 to-transparent" />

          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Flower2 className="w-4 h-4 text-accent" />
              <h2
                id="completion-summary-title"
                className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-accent m-0"
              >
                Lời chiêm nghiệm trong lượt này
              </h2>
            </div>

            <span className="text-xs font-medium text-muted bg-surface-soft px-3 py-1 rounded-full border border-line/60">
              Tâm trạng: <strong className="text-ink font-semibold">{signal.mood}</strong>
            </span>
          </div>

          {/* Khung trích dẫn câu thơ với nền giấy điệp mờ */}
          <div className="my-5 p-5 sm:p-6 rounded-xl bg-accent/[0.03] border-l-3 border-accent/40">
            <blockquote className="font-display text-xl sm:text-2xl font-semibold text-ink leading-relaxed m-0">
              <p className="m-0">“{signal.poem.line1}</p>
              <p className="m-0 mt-1.5">{signal.poem.line2}”</p>
            </blockquote>

            {signal.poem.subtext && (
              <p className="mt-3 text-xs sm:text-sm text-muted/80 italic m-0">
                {signal.poem.subtext}
              </p>
            )}
          </div>

          {/* Thẻ hành động đã thực hiện */}
          <div className="mt-6 pt-5 border-t border-line/60">
            <div className="p-4 sm:p-5 rounded-xl bg-success/[0.05] border border-success/20 flex items-start gap-3.5">
              {isActionDone ? (
                <CheckCircle2
                  className="w-5 h-5 text-success shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              ) : (
                <Flower2
                  className="w-5 h-5 text-accent shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-success">
                    {isActionDone ? "Hành động đã hoàn thành" : "Hành động gợi ý"}
                  </span>
                  {signal.action?.duration && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                      <Clock3 className="w-3 h-3 text-accent" />
                      <span>{signal.action.duration}</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-ink m-0">
                  {signal.action.title}
                </h3>

                <p className="mt-2 text-sm text-muted leading-relaxed m-0">
                  {signal.action.description}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={onViewSignal}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-accent hover:text-accent/80 transition-colors group cursor-pointer"
            >
              <ArrowLeft
                className="w-4 h-4 transition-transform group-hover:-translate-x-1"
                aria-hidden="true"
              />
              <span>Xem lại toàn bộ kết quả & chiêm nghiệm</span>
            </button>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. THẺ 2: LƯU TRỮ VÀO SỔ TAY CÁ NHÂN                    */}
        {/* ========================================================= */}
        <section
          aria-labelledby="completion-save-title"
          className="mt-6 rounded-2xl border border-line/70 bg-surface/95 p-6 sm:p-8 shadow-xs"
        >
          <div className="flex items-center gap-2.5 mb-2.5">
            {isSaved ? (
              <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
            ) : (
              <Bookmark className="w-5 h-5 text-accent" aria-hidden="true" />
            )}

            <h2
              id="completion-save-title"
              className="font-display text-xl sm:text-2xl font-semibold text-ink m-0"
            >
              {isSaved ? "Đã lưu vào Góc của tôi" : "Lưu giữ chiêm nghiệm này"}
            </h2>
          </div>

          <p className="text-sm sm:text-base text-muted leading-relaxed m-0">
            {isSaved
              ? "Bạn có thể xem lại lời chiêm nghiệm và ghi chép bất cứ lúc nào trong Góc của tôi."
              : isLoggedIn
                ? "Lưu lời chiêm nghiệm cùng ghi chép trong lượt này vào sổ tay để tự soi chiếu khi cần."
                : "Đăng nhập để lưu lời chiêm nghiệm và ghi chép vào sổ tay cá nhân của bạn."}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={isSaved ? onGoToAccount : onSaveToAccount}
              className="guest-secondary-btn h-11 px-5 text-sm group"
            >
              <Bookmark className="w-4 h-4 text-accent transition-transform group-hover:scale-110" aria-hidden="true" />
              <span>
                {isSaved
                  ? "Mở xem trong Góc của tôi"
                  : isLoggedIn
                    ? "Lưu vào Góc của tôi"
                    : "Đăng nhập để lưu"}
              </span>
            </button>
          </div>

          <p className="mt-3.5 text-xs sm:text-sm text-muted/80 flex items-center gap-1.5 m-0">
            <Sparkles className="w-3.5 h-3.5 text-accent/70 shrink-0" />
            <span>Dữ liệu được lưu giữ an tâm trong sổ tay trên trình duyệt của bạn.</span>
          </p>
        </section>

        {/* ========================================================= */}
        {/* 4. CỤM ĐIỀU HƯỚNG CĂN GIỮA & LỜI CHÚC AN BÌNH           */}
        {/* ========================================================= */}
        <div className="mt-9 sm:mt-11 flex flex-col items-center justify-center text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onGoToHome}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-accent text-white font-medium text-sm sm:text-base shadow-sm hover:bg-accent/90 transition-all hover:shadow-md group cursor-pointer"
            >
              <span>Trở về Hôm nay</span>
              <ArrowRight
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={onGoToAccount}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-surface-soft border border-line text-ink font-medium text-sm hover:border-accent/40 hover:text-accent transition-all cursor-pointer"
            >
              <Bookmark className="w-4 h-4 text-accent" />
              <span>Góc của tôi</span>
            </button>
          </div>

          <p className="mt-5 text-xs text-muted/70 italic m-0">
            “Mỗi ngày trôi qua trong an định, tâm trí tự khắc hanh thông.”
          </p>
        </div>
      </main>
    </div>
  );
};

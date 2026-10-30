import React, { lazy, Suspense, useState } from "react";
import { UnverifiedImage } from "../components/UnverifiedImage";
import {
  ArrowLeft,
  ArrowRight,
  Flower2,
  Landmark,
  Sparkles,
  Compass,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { SceneErrorBoundary } from "../components/SceneErrorBoundary";
import { useJadeDecoration } from "../hooks/useJadeDecoration";
import { JadeDecorationControl } from "../components/JadeDecorationControl";
import { isDemoMode } from "../data/demoMode";


const SanctuaryScene = lazy(() =>
  import("../components/SanctuaryScene").then((module) => ({
    default: module.SanctuaryScene,
  }))
);

interface VirtualSanctuaryScreenProps {
  currentUserEmail?: string;
  onGoToLogin: () => void;
  onBackToExperience: () => void;
  onGoToAltar: () => void;
  onGoToZen: () => void;
}

export const VirtualSanctuaryScreen: React.FC<
  VirtualSanctuaryScreenProps
> = ({
  currentUserEmail,
  onGoToLogin,
  onBackToExperience,
  onGoToAltar,
  onGoToZen,
}) => {
  const [show3D, setShow3D] = useState(false);
  const jadeDecoration = useJadeDecoration(currentUserEmail);

  return (
    <div className="screen-shell">
      <main className="page-container max-w-6xl">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between gap-3 mb-6 text-xs text-stone-600 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToExperience}
              className="hover:text-accent cursor-pointer transition-colors"
            >
              Trải nghiệm
            </button>
            <span>/</span>
            <span className="text-accent font-semibold">Không gian của tôi</span>
          </div>
          <button
            onClick={onBackToExperience}
            className="inline-flex items-center gap-1.5 hover:text-accent cursor-pointer transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Về danh mục trải nghiệm
          </button>
        </div>

        {/* Hero Section */}
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center mb-12">
          <div>
            <Badge
              variant="terracotta"
              className="mb-4 gap-2 uppercase tracking-wider font-semibold"
            >
              <span className="w-2 h-2 rounded-full bg-action animate-pulse" />
              <span>Một khoảng riêng để trở về</span>
            </Badge>

            <h1
              tabIndex={-1}
              className="page-title mb-4 font-display text-3xl sm:text-4xl font-bold text-ink outline-none focus:outline-none focus-visible:outline-none focus:ring-0 border-0"
            >
              Không gian của tôi
            </h1>

            <p className="text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed max-w-xl mb-6">
              Nơi an trú thanh tịnh để bạn gìn giữ những điều trân quý, dâng một nén tâm hương,
              bày trí kỷ vật và dành vài phút tĩnh lặng cho tâm hồn.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={onGoToAltar}
                className="gap-2 bg-action text-white hover:bg-action/90 shadow-md cursor-pointer"
              >
                <Landmark className="w-4 h-4" />
                <span>Ghé bàn thờ gia tiên</span>
              </Button>
            </div>
          </div>

          <div className="relative min-h-64 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
            <UnverifiedImage
              src="/images/temple_bac_bo.jpg"
              alt="Mái đình trong một khoảng chiều yên"
              className="absolute inset-0 h-full w-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="relative flex min-h-64 items-end p-6">
              <p className="max-w-md font-display text-lg sm:text-xl italic text-amber-100 drop-shadow-md">
                “Giữ một khoảng lặng giữa đời thường, để nghe lòng mình nói khẽ.”
              </p>
            </div>
          </div>
        </section>

        <Card className="mb-10 border-line bg-surface p-5">
          <h2 className="font-display text-lg font-bold text-ink mb-2">Bộ sưu tập vật phẩm số</h2>
          <p className="text-sm leading-relaxed text-muted">
            Tính năng nhận, mua và đồng bộ vật phẩm số chưa được phát hành. Hiện chưa có giao dịch nào được thực hiện trong ứng dụng.
          </p>
        </Card>

        {/* 3D Sanctuary Interactive Scene Section */}
        <section aria-labelledby="sanctuary-3d-title" className="mb-14">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-surface-soft/80 border border-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="sanctuary-3d-title"
                  className="font-display text-xl font-bold text-ink"
                >
                  Không gian 3D tương tác
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
                  Mô phỏng bàn thờ mẫu 360° với lư hương trầm và các vật phẩm bạn đã bày trí
                </p>
              </div>
            </div>

            <Button
              type="button"
              aria-expanded={show3D}
              aria-controls="sanctuary-3d-panel"
              onClick={() => setShow3D((value) => !value)}
              className={`gap-2 min-h-11 px-5 font-semibold transition-all cursor-pointer shadow-md ${
                show3D
                  ? "bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-600"
                  : "bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-white"
              }`}
            >
              {show3D ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Đóng cảnh 3D</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Mở không gian 3D</span>
                </>
              )}
            </Button>
          </div>

          {(currentUserEmail || isDemoMode()) && (
            <JadeDecorationControl state={jadeDecoration} />
          )}

          <div id="sanctuary-3d-panel">
            {show3D && (
              <SceneErrorBoundary
                onClose={() => setShow3D(false)}
                onOpenAltar={onGoToAltar}
              >
                <Suspense
                  fallback={
                    <div
                      role="status"
                      className="p-12 text-center rounded-2xl bg-surface border border-line shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin mx-auto mb-3" />
                      <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                        Đang khởi tạo không gian 3D…
                      </p>
                    </div>
                  }
                >
                  <SanctuaryScene
                    decoration={jadeDecoration.decoration}
                  />
                </Suspense>
              </SceneErrorBoundary>
            )}
          </div>
        </section>

        {/* 3 Spaces Navigation */}
        <section aria-labelledby="sanctuary-spaces" className="mb-14">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400">
                BA NẾP TÂM LINH
              </span>
              <h2 id="sanctuary-spaces" className="section-title mt-1 text-2xl font-bold text-ink">
                Những không gian có thể ghé qua
              </h2>
            </div>
            <span className="hidden sm:inline text-xs text-stone-500 dark:text-stone-400">
              Mở từng nơi theo nhịp cảm xúc riêng của bạn
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <Card
              onClick={onGoToAltar}
              className="group p-6 rounded-2xl border-line border-t-4 border-t-amber-700 cursor-pointer hover:bg-surface-soft hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-400/25 flex items-center justify-center text-amber-700 dark:text-amber-400 mb-4 group-hover:scale-105 transition-transform">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-ink mb-2 group-hover:text-accent transition-colors">
                Bàn thờ gia tiên
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-5">
                Một góc giản dị để thắp nén nhang lòng và hướng về nguồn cội gia đình.
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent">
                Ghé thăm <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Card>

            <Card
              onClick={onGoToZen}
              className="group p-6 rounded-2xl border-line border-t-4 border-t-emerald-700 cursor-pointer hover:bg-surface-soft hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-400/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <Flower2 className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-ink mb-2 group-hover:text-emerald-600 transition-colors">
                Khoảng an yên
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-5">
                Một nhịp thở chậm, 3 phút tĩnh tại giữa những ngày bận rộn nhiều âu lo.
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Dành vài phút <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Card>
          </div>
        </section>

        {/* Privacy Note Footer Card */}
        <Card className="p-6 sm:p-7 rounded-2xl bg-surface-soft/90 border-line mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-ink mb-0.5">
                  Không gian riêng tư thuộc về bạn
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
                  Mọi kỷ vật, ghi chú và bài trí đều được bảo lưu an toàn trong trình duyệt trên thiết bị này.
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap self-start sm:self-auto">
              Riêng tư · Nhẹ nhàng · Tự nguyện
            </span>
          </div>
        </Card>
      </main>
    </div>
  );
};

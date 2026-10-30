import React, { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, ShieldCheck } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import type { CultureRegionSlug } from "./CulturalMapScreen";
import { loadCultureArticles, type RemoteContentItem } from "../data/contentService";

interface RegionCultureScreenProps {
  region: CultureRegionSlug;
  onBack: () => void;
  onSelectArticle: (articleId: string) => void;
  onGoToExperience: () => void;
  onGoToRegionalExperience?: (kind: "chau-van" | "sea-prayer" | "southern-culture") => void;
}

const REGION_LABELS: Record<CultureRegionSlug, string> = {
  north: "Bắc Bộ",
  central: "Trung Bộ",
  south: "Nam Bộ",
};

const REGION_EXPERIENCES: Record<CultureRegionSlug, { kind: "chau-van" | "sea-prayer" | "southern-culture"; label: string }> = {
  north: { kind: "chau-van", label: "Mở trải nghiệm Chầu Văn" },
  central: { kind: "sea-prayer", label: "Mở trải nghiệm tín ngưỡng thờ Cá Ông" },
  south: { kind: "southern-culture", label: "Mở trải nghiệm văn hóa Nam Bộ" },
};

export const RegionCultureScreen: React.FC<RegionCultureScreenProps> = ({
  region,
  onBack,
  onSelectArticle,
  onGoToExperience,
  onGoToRegionalExperience,
}) => {
  const [articles, setArticles] = useState<RemoteContentItem[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  useEffect(() => {
    let active = true;
    void loadCultureArticles()
      .then((items) => { if (active) setArticles(items.filter((item) => item.verified === true)); })
      .catch(() => { if (active) setArticles([]); })
      .finally(() => { if (active) setLoadingArticles(false); });
    return () => { active = false; };
  }, []);

  const regionArticles = articles.filter((item) => item.region === REGION_LABELS[region]);

  return (
  <div className="screen-shell">
    <main className="page-container max-w-4xl">
      <Button type="button" variant="outline" onClick={onBack} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Về bản đồ văn hóa
      </Button>
      <Card className="border-line bg-surface p-6 sm:p-10">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
          <BookOpen className="h-4 w-4" />
          <span>Tư liệu {REGION_LABELS[region]}</span>
        </div>
        <h1 className="mb-3 font-display text-2xl font-bold text-ink">Khám phá {REGION_LABELS[region]}</h1>
        <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted">
          Chọn một trải nghiệm văn hóa bên dưới. Bài viết và địa điểm sẽ xuất hiện tại đây sau khi nội dung, quyền sử dụng và thông tin vùng miền được kiểm tra.
        </p>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            onClick={() => onGoToRegionalExperience?.(REGION_EXPERIENCES[region].kind)}
            className="min-h-11"
          >
            {REGION_EXPERIENCES[region].label}
          </Button>
          <Button type="button" variant="outline" onClick={onGoToExperience} className="min-h-11">
            Mở không gian trải nghiệm
          </Button>
        </div>
        <section className="mb-5" aria-labelledby="region-demo-articles">
          <h2 id="region-demo-articles" className="mb-3 font-semibold text-ink">Bài viết nổi bật · {REGION_LABELS[region]}</h2>
          {loadingArticles ? <p role="status" className="text-sm text-muted">Đang tải bài viết…</p> : regionArticles.length ? <div className="grid gap-3 sm:grid-cols-2">{regionArticles.map((item) => <button key={item.id} type="button" onClick={() => onSelectArticle(item.id)} className="rounded-xl border border-line bg-surface-soft p-4 text-left transition hover:border-accent"><span className="font-semibold text-ink">{item.title}</span>{typeof item.excerpt === "string" && <span className="mt-2 block text-sm text-muted">{item.excerpt}</span>}</button>)}</div> : <p className="text-sm text-muted">Chưa có bài viết đã xác minh cho vùng này trong dữ liệu demo.</p>}
        </section>
        <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-soft p-4 text-sm text-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p>Không dùng hình minh họa hoặc mô tả biên soạn thay cho thông tin di sản đã xác minh.</p>
        </div>
      </Card>
    </main>
  </div>
  );
};

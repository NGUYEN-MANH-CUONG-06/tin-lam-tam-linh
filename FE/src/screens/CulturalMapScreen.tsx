import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { getMapProvinceName, HERITAGE_SITES } from "../data/heritageSites";
import {
  VIETNAM_CENTRAL_PATHS,
  VIETNAM_NORTH_PATHS,
  VIETNAM_SOUTH_PATHS,
} from "../data/vietnamMapData";

export type CultureRegionSlug = "north" | "central" | "south";

interface CulturalMapScreenProps {
  onBackToCulture: () => void;
  onSelectRegion: (region: CultureRegionSlug) => void;
}

interface ProvincePosition {
  x: number;
  y: number;
}

const REGIONS: Record<
  CultureRegionSlug,
  {
    title: string;
    subtitle: string;
    image: string;
    description: string;
    color: string;
    paths: typeof VIETNAM_NORTH_PATHS;
  }
> = {
  north: {
    title: "Bắc Bộ",
    subtitle: "Di sản và thực hành văn hóa miền Bắc",
    image: "/images/temple_bac_bo.jpg",
    description:
      "Các di sản và thực hành văn hóa tiêu biểu của miền Bắc, được sắp xếp theo địa phương.",
    color: "#991b1b",
    paths: VIETNAM_NORTH_PATHS,
  },
  central: {
    title: "Trung Bộ",
    subtitle: "Di sản và thực hành văn hóa miền Trung",
    image: "/images/hue_trung_bo.jpg",
    description:
      "Các di sản và thực hành văn hóa tiêu biểu của miền Trung, được sắp xếp theo địa phương.",
    color: "#d97706",
    paths: VIETNAM_CENTRAL_PATHS,
  },
  south: {
    title: "Nam Bộ",
    subtitle: "Di sản và thực hành văn hóa miền Nam",
    image: "/images/mekong_nam_bo.jpg",
    description:
      "Các di sản và thực hành văn hóa tiêu biểu của miền Nam, được sắp xếp theo địa phương.",
    color: "#348b78",
    paths: VIETNAM_SOUTH_PATHS,
  },
};

const REGION_ORDER: CultureRegionSlug[] = ["north", "central", "south"];

const GEO_REFERENCE = {
  coastLongitude: 109.5,
  coastX: 680,
  northLatitude: 23.3,
  northY: 55,
  xPerDegree: 68,
  yPerDegree: 58,
};
const toMapPoint = (latitude: number, longitude: number): ProvincePosition => ({
  x:
    GEO_REFERENCE.coastX +
    (longitude - GEO_REFERENCE.coastLongitude) * GEO_REFERENCE.xPerDegree,
  y:
    GEO_REFERENCE.northY +
    (GEO_REFERENCE.northLatitude - latitude) * GEO_REFERENCE.yPerDegree,
});

const ARCHIPELAGOS = [
  {
    name: "Quần đảo Hoàng Sa",
    administration: "Đặc khu Hoàng Sa · TP. Đà Nẵng",
    source: "Tọa độ các đảo · UBND TP. Đà Nẵng",
    url: "https://danang.gov.vn/vi/web/dng/w/ubnd-huyen-hoang-sa-i",
    administrativeSource: "Nghị quyết 1659/NQ-UBTVQH15",
    administrativeUrl:
      "https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-1659-nq-ubtvqh15-sap-xep-cac-dvhc-cap-xa-cua-thanh-pho-da-nang-nam-2025-119250616202714604.htm",
    islands: [
      { name: "Đá Bắc", lat: 17 + 6 / 60, lon: 111 + 30.8 / 60 },
      { name: "Hoàng Sa", lat: 16 + 32 / 60, lon: 111 + 36.7 / 60 },
      { name: "Hữu Nhật", lat: 16 + 30.3 / 60, lon: 111 + 35.3 / 60 },
      { name: "Duy Mộng", lat: 16 + 27.6 / 60, lon: 111 + 35.3 / 60 },
      { name: "Quang Hòa", lat: 16 + 26.9 / 60, lon: 111 + 42.7 / 60 },
      { name: "Quang Ảnh", lat: 16 + 27 / 60, lon: 111 + 30.8 / 60 },
      { name: "Bạch Quy", lat: 16 + 3.5 / 60, lon: 111 + 46.9 / 60 },
      { name: "Tri Tôn", lat: 15 + 47.2 / 60, lon: 111 + 11.8 / 60 },
      { name: "Ốc Tai Voi", lat: 15 + 44 / 60, lon: 112 + 14.1 / 60 },
      { name: "Ốc Hoa", lat: 16 + 34 / 60, lon: 111 + 40 / 60 },
      { name: "Ba Ba", lat: 16 + 33.8 / 60, lon: 111 + 41.5 / 60 },
      { name: "Lưỡi Liềm", lat: 16 + 30.5 / 60, lon: 111 + 46.2 / 60 },
      { name: "Hải Sâm", lat: 16 + 28 / 60, lon: 111 + 35.5 / 60 },
      { name: "Đá Lồi", lat: 16 + 15 / 60, lon: 111 + 41 / 60 },
      { name: "Chim Én", lat: 16 + 20.8 / 60, lon: 112 + 2.6 / 60 },
      { name: "Xà Cừ", lat: 16 + 34.9 / 60, lon: 111 + 42.9 / 60 },
      { name: "Ngự Bình", lat: 16 + 27.5 / 60, lon: 111 + 39 / 60 },
    ],
  },
  {
    name: "Quần đảo Trường Sa",
    administration: "Đặc khu Trường Sa · tỉnh Khánh Hòa",
    source: "Tọa độ đảo · Tạp chí Khoa học và Công nghệ Biển",
    url: "https://vjs.ac.vn/jmst/article/download/2582/pdf/8506",
    administrativeSource: "Nghị quyết 1667/NQ-UBTVQH15",
    administrativeUrl:
      "https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-1667-nq-ubtvqh15-sap-xep-cac-dvhc-cap-xa-cua-tinh-khanh-hoa-nam-2025-119250616200424907.htm",
    islands: [
      { name: "Song Tử Tây", lat: 11 + 26 / 60, lon: 114 + 20 / 60 },
      { name: "Đá Nam", lat: 11 + 23 / 60, lon: 114 + 18 / 60 },
      { name: "Ba Bình", lat: 10 + 23 / 60, lon: 114 + 22 / 60 },
      { name: "Sơn Ca", lat: 10 + 23 / 60, lon: 114 + 28 / 60 },
      { name: "Nam Yết", lat: 10 + 11 / 60, lon: 114 + 22 / 60 },
      { name: "Sinh Tồn", lat: 9 + 52 / 60, lon: 114 + 19 / 60 },
      { name: "Đá Tây", lat: 8 + 52 / 60, lon: 112 + 15 / 60 },
      { name: "Tốc Tan", lat: 8 + 9 / 60, lon: 114 + 6 / 60 },
      { name: "Thuyền Chài", lat: 8 + 10 / 60, lon: 113 + 18 / 60 },
      { name: "Trường Sa", lat: 8 + 38 / 60, lon: 114 + 25 / 60 },
    ],
  },
] as const;

const ARCHIPELAGO_LABELS = ARCHIPELAGOS.map((archipelago) => {
  const points = archipelago.islands.map((island) =>
    toMapPoint(island.lat, island.lon),
  );
  return {
    ...archipelago,
    points,
    center: points.reduce(
      (sum, point) => ({
        x: sum.x + point.x / points.length,
        y: sum.y + point.y / points.length,
      }),
      { x: 0, y: 0 },
    ),
  };
});
const ISLAND_OUTLINES = [
  "M-5.8-1.2 C-4.7-3.9-1.8-4.5.2-3.2 C2.1-4.7 5.3-2.5 5.7-.3 C6.2 2.4 2.9 4.4.4 3.5 C-1.5 5-5 3.7-5.8 1.8 C-6.2.8-6.2-.2-5.8-1.2Z",
  "M-5.1-.4 C-3.9-2.7-2-2.3-.7-4 C1.1-5.2 4.4-2.7 4.2-.8 C6.2.7 3.5 3.9 1.3 3.4 C-.8 4.7-4.7 2.2-5.1-.4Z",
  "M-5.7.2 C-4.1-1.2-4.2-3.4-1.6-3.1 C.2-4.4 1.4-2.2 3.8-2.5 C5.5-.6 3.1 1.1 4.2 2.6 C2.5 4.2.4 2.7-1.4 3.7 C-3.6 3.4-5.8 2.4-5.7.2Z",
  "M-4.7-1.8 C-2.2-4.1-.7-2.2 1-3.4 C3.4-3.1 5.2-1 4.1.4 C4.7 2.6 1.8 3.8-.2 2.9 C-2.1 4.3-5.4 1.2-4.7-1.8Z",
] as const;

const cleanSpiritualRelevance = (category: string, spiritual: string) => {
  if (!spiritual) return category;
  const catLower = category.toLowerCase().trim();
  const parts = spiritual.split("/").map((s) => s.trim()).filter(Boolean);
  const uniqueParts = parts.filter(
    (p) => !catLower.includes(p.toLowerCase()) && !p.toLowerCase().includes(catLower),
  );
  if (uniqueParts.length === 0) {
    return `${category} · Di sản tâm linh`;
  }
  return `${category} · ${uniqueParts.join(" · ")}`;
};

export const CulturalMapScreen: React.FC<CulturalMapScreenProps> = ({
  onBackToCulture,
  onSelectRegion,
}) => {
  const [activeRegion, setActiveRegion] =
    useState<CultureRegionSlug>("central");
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedArchipelago, setSelectedArchipelago] = useState<string | null>(
    null,
  );
  const [heritagePage, setHeritagePage] = useState(1);
  const [provincePositions, setProvincePositions] = useState<
    Record<string, ProvincePosition>
  >({});
  const mapRef = useRef<SVGSVGElement>(null);
  const current = REGIONS[activeRegion];

  useEffect(() => {
    const positions: Record<string, ProvincePosition> = {};
    mapRef.current
      ?.querySelectorAll<SVGPathElement>("[data-province]")
      .forEach((path) => {
        const box = path.getBBox();
        positions[path.dataset.province!] = {
          x: box.x + box.width / 2,
          y: box.y + box.height / 2,
        };
      });
    setProvincePositions(positions);
  }, []);

  const sitesByProvince = useMemo(
    () =>
      HERITAGE_SITES.reduce<Record<string, typeof HERITAGE_SITES>>(
        (groups, site) => {
          (groups[site.province_legacy] ??= []).push(site);
          return groups;
        },
        {},
      ),
    [],
  );
  const regionSites = HERITAGE_SITES.filter(
    (site) => site.region === current.title,
  );
  const geometryGaps = [
    ...new Set(
      regionSites
        .map((site) => site.province_legacy)
        .filter((province) => !getMapProvinceName(province)),
    ),
  ];
  const filteredHeritageSites = regionSites
    .filter(
      (site) => !selectedProvince || site.province_legacy === selectedProvince,
    )
    .sort(
      (left, right) =>
        left.province_legacy.localeCompare(right.province_legacy, "vi") ||
        left.name.localeCompare(right.name, "vi"),
    );
  const heritagePageCount = Math.max(
    1,
    Math.ceil(filteredHeritageSites.length / 3),
  );
  const visibleHeritageSites = filteredHeritageSites.slice(
    (heritagePage - 1) * 3,
    heritagePage * 3,
  );
  const selectedIslandGroup = ARCHIPELAGOS.find(
    (archipelago) => archipelago.name === selectedArchipelago,
  );

  const chooseRegion = (region: CultureRegionSlug) => {
    setActiveRegion(region);
    setSelectedProvince(null);
    setSelectedArchipelago(null);
    setHeritagePage(1);
  };
  const onRegionKeyDown = (
    event: React.KeyboardEvent<SVGGElement>,
    region: CultureRegionSlug,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      chooseRegion(region);
    }
  };

  return (
    <div className="screen-shell">
      <main className="page-container max-w-screen-2xl">
        <div className="mb-5 flex items-center justify-between gap-3 text-xs text-muted">
          <Button
            type="button"
            variant="ghost"
            onClick={onBackToCulture}
            className="min-h-11 gap-2 px-2"
          >
            <ArrowLeft className="h-4 w-4" /> Khám phá văn hóa
          </Button>
          <Badge
            variant="outline"
            className="hidden border-accent/30 text-accent sm:inline-flex"
          >
            Ba miền · Một dòng chảy
          </Badge>
        </div>

        <header className="relative mb-7 overflow-hidden rounded-[1.75rem] border border-[#e7d4c1] bg-[linear-gradient(110deg,#fffaf3_0%,#f7ecdf_58%,#f1e4d7_100%)] px-5 py-6 shadow-[0_12px_35px_rgba(87,44,29,0.08)] dark:border-[#594345] dark:bg-[linear-gradient(110deg,#21191b_0%,#2a2022_58%,#342426_100%)] sm:mb-9 sm:px-9 sm:py-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border border-[#cda35b]/25 sm:right-12 sm:-top-44 sm:h-[26rem] sm:w-[26rem]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-2 -top-14 h-56 w-56 rounded-full border border-[#cda35b]/20 sm:right-24 sm:-top-32 sm:h-[21rem] sm:w-[21rem]"
          />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#9b1c28]/15 bg-white/65 px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-[#8b1a26] dark:border-accent/30 dark:bg-[#21191b]/70 dark:text-[#ffaaa0] sm:text-xs">
                <Compass className="h-3.5 w-3.5" /> BẮC · TRUNG · NAM
              </span>
              <h1 className="page-title mb-2 mt-3 font-display text-3xl font-bold leading-tight text-[#301c19] dark:text-[#f7f0e9] sm:text-5xl">
                Một dải đất,
                <br className="sm:hidden" /> ba miền di sản
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-[#69564d] dark:text-[#d3c7be] sm:text-base">
                Theo dấu những lớp văn hóa trên bản đồ Việt Nam. Chọn một miền
                để gặp các di sản và câu chuyện văn hóa.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 self-start rounded-2xl border border-white/80 bg-white/65 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#21191b]/70 sm:self-auto">
              <span className="font-display text-3xl font-bold leading-none text-[#9b1c28] dark:text-[#ffaaa0]">
                03
              </span>
              <span className="max-w-24 text-xs font-semibold leading-snug text-[#69564d] dark:text-[#d3c7be]">
                miền văn hóa
                <br />
                trên một bản đồ
              </span>
            </div>
          </div>
        </header>

        <div
          className="mb-5 flex gap-2 overflow-x-auto pb-1"
          aria-label="Chọn miền văn hóa"
        >
          {REGION_ORDER.map((region) => (
            <Button
              key={region}
              type="button"
              variant={activeRegion === region ? "default" : "outline"}
              aria-pressed={activeRegion === region}
              onClick={() => chooseRegion(region)}
              className="min-h-11 shrink-0"
            >
              {REGIONS[region].title}
            </Button>
          ))}
        </div>

        <div className="culture-map-layout">
          <Card className="w-full min-w-0 overflow-hidden border-line bg-surface p-3 shadow-[0_16px_45px_rgba(69,37,27,0.10)] sm:p-5 lg:sticky lg:top-6 lg:self-start">
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-line pb-3">
              <div className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <Compass className="h-4 w-4 text-accent" /> Bản đồ văn hóa
              </div>
              <span className="rounded-full bg-surface-soft px-3 py-1.5 text-xs font-medium text-muted">
                Chạm vào miền để khám phá
              </span>
            </div>
            <div className="relative mx-auto aspect-[4/5] w-full max-h-[980px] overflow-hidden rounded-[1.25rem] border border-[#dac5af] bg-[radial-gradient(ellipse_at_48%_40%,#fffdf9_0%,#f5eee4_72%,#eee4d8_100%)] p-2 shadow-inner dark:border-[#554244] dark:bg-[radial-gradient(ellipse_at_48%_40%,#393032_0%,#302829_72%,#282223_100%)] sm:p-3">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(130,91,69,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(130,91,69,.07)_1px,transparent_1px)] [background-size:34px_34px] dark:opacity-25 dark:[background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)]"
              />
              <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-[#eadbc9] bg-[#fffaf1]/90 px-3 py-2 shadow-sm backdrop-blur-sm dark:border-[#594345] dark:bg-[#21191b]/90">
                <p className="text-[10px] font-bold tracking-[0.14em] text-[#927a66] dark:text-[#d3c7be]">
                  VIỆT NAM
                </p>
                <p className="mt-0.5 font-display text-sm font-bold text-[#462b23] dark:text-[#f7f0e9]">
                  Dải đất di sản
                </p>
              </div>
              <svg
                ref={mapRef}
                viewBox="190 20 1090 1080"
                className="relative z-[1] h-full w-full select-none drop-shadow-[0_8px_8px_rgba(76,43,31,0.20)]"
                role="group"
                aria-labelledby="culture-map-title culture-map-desc"
              >
                <title id="culture-map-title">
                  Bản đồ minh họa văn hóa ba miền Việt Nam
                </title>
                <desc id="culture-map-desc">
                  Chọn Bắc Bộ, Trung Bộ hoặc Nam Bộ trên bản đồ để xem các điểm
                  xem thông tin di sản.
                </desc>
                <defs>
                  <linearGradient
                    id="region-north"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#d94d56" />
                    <stop offset="100%" stopColor="#941b2a" />
                  </linearGradient>
                  <linearGradient
                    id="region-central"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                  <linearGradient
                    id="region-south"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#a5d3c3" />
                    <stop offset="100%" stopColor="#348b78" />
                  </linearGradient>
                  <filter
                    id="selected-region-glow"
                    x="-25%"
                    y="-15%"
                    width="150%"
                    height="130%"
                  >
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <text
                  x="1050"
                  y="610"
                  textAnchor="middle"
                  className="fill-[#9a8874] font-display text-[14px] font-semibold tracking-[0.2em] dark:fill-[#d3c7be]"
                >
                  BIỂN ĐÔNG
                </text>
                {REGION_ORDER.map((slug) => {
                  const region = REGIONS[slug];
                  const active = activeRegion === slug;
                  return (
                    <g
                      key={slug}
                      role="button"
                      tabIndex={0}
                      aria-label={`Chọn ${region.title}`}
                      aria-pressed={active}
                      onClick={() => chooseRegion(slug)}
                      onKeyDown={(event) => onRegionKeyDown(event, slug)}
                      className="cursor-pointer outline-none"
                      filter={active ? "url(#selected-region-glow)" : undefined}
                    >
                      {region.paths.map((province) => {
                        const count = Object.entries(sitesByProvince).reduce(
                          (total, [legacyName, sites]) =>
                            total +
                            (getMapProvinceName(legacyName) === province.name
                              ? sites.length
                              : 0),
                          0,
                        );
                        return (
                          <path
                            key={province.id}
                            data-province={province.name}
                            d={province.d}
                            fill={
                              slug === "central"
                                ? "url(#region-central)"
                                : slug === "north"
                                  ? "url(#region-north)"
                                  : "url(#region-south)"
                            }
                            fillOpacity={active ? 1 : 0.76}
                            stroke={
                              count
                                ? "#9b1c28"
                                : slug === "central"
                                  ? "#b45309"
                                  : slug === "north"
                                    ? "#6f1620"
                                    : "#246c5e"
                            }
                            strokeOpacity={count ? 0.95 : active ? 0.78 : 0.58}
                            strokeWidth={count ? 1.55 : active ? 1.15 : 0.85}
                            strokeLinejoin="round"
                            className="transition-opacity duration-200 hover:opacity-100"
                          >
                            <title>
                              {province.name}
                              {count
                                ? ` · ${count} di sản trong dữ liệu`
                                : " · chưa có mục trong dữ liệu đính kèm"}
                            </title>
                          </path>
                        );
                      })}
                    </g>
                  );
                })}
                {ARCHIPELAGO_LABELS.map((archipelago) => (
                  <g
                    key={archipelago.name}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedArchipelago === archipelago.name}
                    aria-label={`Chọn ${archipelago.name}, ${archipelago.islands.length} đảo, đá và bãi tiêu biểu; ${archipelago.administration}`}
                    onClick={() => {
                      setSelectedProvince(null);
                      setSelectedArchipelago(archipelago.name);
                      setHeritagePage(1);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedProvince(null);
                        setSelectedArchipelago(archipelago.name);
                        setHeritagePage(1);
                      }
                    }}
                    className="cursor-pointer outline-none"
                  >
                    {archipelago.points.map((point, index) => (
                      <g
                        key={`${archipelago.name}-${index}`}
                        transform={`translate(${point.x} ${point.y}) rotate(${(index * 37) % 90})`}
                      >
                        <circle r="10" fill="transparent" />
                        <path
                          d={ISLAND_OUTLINES[index % ISLAND_OUTLINES.length]}
                          fill={
                            selectedArchipelago === archipelago.name
                              ? "#1b5965"
                              : "#326d76"
                          }
                          stroke="#fffaf1"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        >
                          <title>{archipelago.islands[index].name}</title>
                        </path>
                        <path
                          d="M-2.8.2 Q0-1.8 2.6-.2"
                          fill="none"
                          stroke="#b8d2cb"
                          strokeWidth=".8"
                          strokeLinecap="round"
                        />
                      </g>
                    ))}
                    <path
                      d={`M${archipelago.center.x + 8} ${archipelago.center.y}h12`}
                      stroke="#245d67"
                      strokeWidth="1.25"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={archipelago.center.x + 23}
                      y={archipelago.center.y - 3}
                      textAnchor="start"
                      fontSize="11"
                      fontWeight="700"
                      fill="#245d67"
                      paintOrder="stroke"
                      stroke="#fffaf1"
                      strokeWidth="3"
                      strokeLinejoin="round"
                    >
                      {archipelago.name}
                    </text>
                    <text
                      x={archipelago.center.x + 23}
                      y={archipelago.center.y + 11}
                      textAnchor="start"
                      fontSize="8"
                      fontWeight="600"
                      fill="#766359"
                      paintOrder="stroke"
                      stroke="#fffaf1"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    >
                      {archipelago.administration}
                    </text>
                    <title>
                      {archipelago.name} · chọn để xem thông tin địa danh biển
                      đảo
                    </title>
                  </g>
                ))}
                {Object.entries(sitesByProvince).flatMap(
                  ([province, sites]) => {
                    const mapProvinceName = getMapProvinceName(province);
                    const position = mapProvinceName
                      ? provincePositions[mapProvinceName]
                      : undefined;
                    if (!position) return [];
                    const provinceRegion = sites[0]?.region;
                    const regionSlug = REGION_ORDER.find(
                      (slug) => REGIONS[slug].title === provinceRegion,
                    );
                    if (!regionSlug) return [];
                    return [
                      <g
                        key={province}
                        role="button"
                        tabIndex={0}
                        aria-label={`${province}, ${sites.length} di sản`}
                        onClick={() => {
                          setActiveRegion(regionSlug);
                          setSelectedProvince(province);
                          setSelectedArchipelago(null);
                          setHeritagePage(1);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setActiveRegion(regionSlug);
                            setSelectedProvince(province);
                            setSelectedArchipelago(null);
                            setHeritagePage(1);
                          }
                        }}
                        className="cursor-pointer outline-none"
                      >
                        <circle
                          cx={position.x}
                          cy={position.y}
                          r={selectedProvince === province ? Math.min(16, 9 + sites.length) : Math.min(13, 6 + sites.length)}
                          fill={selectedProvince === province ? "#c2410c" : (activeRegion === regionSlug ? "#9b1c28" : "#854d0e")}
                          fillOpacity={activeRegion === regionSlug ? 1 : 0.75}
                          stroke={
                            selectedProvince === province
                              ? "#fef08a"
                              : "#fffaf0"
                          }
                          strokeWidth={selectedProvince === province ? 3.5 : 2}
                          className="transition-all duration-200"
                        />
                        <text
                          x={position.x}
                          y={position.y + 3.5}
                          textAnchor="middle"
                          fontSize={selectedProvince === province ? "9" : "8"}
                          fontWeight="700"
                          fill="#fffaf0"
                        >
                          {sites.length}
                        </text>
                        <title>
                          {province}: {sites.length} di sản
                        </title>
                      </g>,
                    ];
                  },
                )}
              </svg>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface-soft px-3 py-2.5 text-xs">
              {REGION_ORDER.map((slug) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => chooseRegion(slug)}
                  className="inline-flex min-h-8 items-center gap-2 rounded px-1 font-medium text-ink hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span
                    className="h-3 w-3 rounded-full border border-black/15"
                    style={{ backgroundColor: REGIONS[slug].color }}
                  />
                  {REGIONS[slug].title}
                </button>
              ))}
              <span className="ml-auto inline-flex items-center gap-1.5 text-muted">
                <MapPin className="h-3.5 w-3.5 text-accent" /> Tỉnh có di sản ·
                số trong chấm là số mục
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Bản đồ mang tính ước lệ văn hóa và gợi mở không gian di sản tâm linh dân tộc, không dùng làm bản đồ đo đạc địa giới hành chính.
            </p>
          </Card>

          <Card className="w-full min-w-0 overflow-hidden border-line bg-surface shadow-[0_16px_45px_rgba(69,37,27,0.10)]">
            <div className="relative h-48 overflow-hidden bg-surface-soft sm:h-56">
              <img
                src={current.image}
                alt={`Ảnh minh họa ${current.title}`}
                className="h-full w-full object-cover"
              />
              <Badge className="absolute left-4 top-4 border-white/60 bg-black/50 text-white backdrop-blur-xs font-semibold text-xs">
                {current.title}
              </Badge>
            </div>
            <div className="space-y-4 p-5 sm:p-7">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink sm:text-[26px] leading-snug">
                  {current.subtitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  {current.description}
                </p>
              </div>
              {!selectedArchipelago && (
                <section aria-labelledby="heritage-points-heading">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-accent" />
                      <h3
                        id="heritage-points-heading"
                        className="font-display font-bold text-ink"
                      >
                        {selectedProvince ? `Di sản tại ${selectedProvince}` : "Điểm đến văn hóa"}
                      </h3>
                    </div>
                    {selectedProvince && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProvince(null);
                          setHeritagePage(1);
                        }}
                        className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer bg-accent/10 px-2.5 py-1 rounded-full transition-colors hover:bg-accent/20"
                      >
                        <span>✕ Hiện tất cả {current.title}</span>
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {filteredHeritageSites.length ? (
                      <>
                        {visibleHeritageSites.map((site) => (
                          <article
                            key={site.id}
                            className="rounded-xl border border-line bg-surface-soft p-4 transition-all duration-200 hover:border-accent/40 hover:shadow-xs"
                          >
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <div>
                                {site.province_legacy === site.province_current ? (
                                  <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-accent" />
                                    <span>Địa bàn: {site.province_current}</span>
                                  </p>
                                ) : (
                                  <>
                                    <p className="text-xs font-semibold text-muted">
                                      Hồ sơ gốc: {site.province_legacy}
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold text-ink flex items-center gap-1.5">
                                      <MapPin className="w-3.5 h-3.5 text-accent" />
                                      <span>Hiện thuộc: {site.province_current}</span>
                                    </p>
                                  </>
                                )}
                              </div>
                              <Badge variant="outline" className="border-accent/30 text-accent font-semibold text-xs">
                                Di sản
                              </Badge>
                            </div>
                            <h4 className="border-t border-line/70 pt-3 font-semibold text-ink text-base">
                              {site.name}
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed text-muted">
                              {cleanSpiritualRelevance(site.category, site.spiritual_relevance)}
                            </p>
                          </article>
                        ))}
                        {heritagePageCount > 1 && (
                          <nav
                            aria-label="Phân trang di sản"
                            className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-soft p-3"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              className="min-h-10"
                              disabled={heritagePage <= 1}
                              onClick={() =>
                                setHeritagePage((page) => Math.max(1, page - 1))
                              }
                            >
                              Trang trước
                            </Button>
                            <span className="text-sm font-medium text-muted">
                              Trang {heritagePage} / {heritagePageCount}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              className="min-h-10"
                              disabled={heritagePage >= heritagePageCount}
                              onClick={() =>
                                setHeritagePage((page) =>
                                  Math.min(heritagePageCount, page + 1),
                                )
                              }
                            >
                              Trang sau
                            </Button>
                          </nav>
                        )}
                      </>
                    ) : (
                      <p className="rounded-xl border border-line bg-surface-soft p-4 text-sm text-muted">
                        Chưa có di sản nào cho miền này trong dữ liệu đã nạp.
                      </p>
                    )}
                  </div>
                </section>
              )}
              {selectedIslandGroup && (
                <section
                  aria-labelledby="archipelago-heading"
                  className="rounded-xl border border-[#b8d0cf] bg-[#edf5f2] p-4 text-[#234c50] dark:border-[#35585b] dark:bg-[#1d3335] dark:text-[#d5e7e2]"
                >
                  <h3
                    id="archipelago-heading"
                    className="font-display font-bold"
                  >
                    {selectedIslandGroup.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#526c69] dark:text-[#b6cfca]">
                    Vị trí các đảo, đá và bãi tiêu biểu được thể hiện theo tọa
                    độ địa lý. Đây là địa danh biển đảo, không phải mục di sản
                    trong dữ liệu.
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {selectedIslandGroup.administration}
                  </p>
                </section>
              )}
              <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-soft p-4 text-sm text-muted">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p>Vị trí được trình bày theo địa danh và ranh giới địa lý.</p>
              </div>
              <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-muted">
                  Mở chuyên đề {current.title}
                </span>
                <Button
                  type="button"
                  onClick={() => onSelectRegion(activeRegion)}
                  className="min-h-11 gap-2"
                >
                  Khám phá miền này <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

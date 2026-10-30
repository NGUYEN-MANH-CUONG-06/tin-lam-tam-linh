import React, { useEffect, useState, useMemo } from "react";
import { X, ZoomIn, ZoomOut, Maximize2, MapPin, BookOpen } from "lucide-react";
import { findApprovedImage } from "../lib/approvedImage";

export interface LightboxImageInfo {
  src: string;
  alt?: string;
  title?: string;
  description?: string;
  location?: string;
  artist?: string;
  license?: string;
  sourceUrl?: string;
}

interface ImageLightboxModalProps {
  image: LightboxImageInfo | null;
  onClose: () => void;
}

export function lookupImageMeta(
  src: string
): Partial<LightboxImageInfo> {
  const record = findApprovedImage(src);

  if (!record) return {};

  return {
    title: record.context || record.description,
    description: record.description || record.context,
    location: record.location,
    artist: record.artist,
    license: record.license,
    sourceUrl: record.sourceUrl,
  };
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  image,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Tra cứu metadata phong phú từ registry nếu có
  const enrichedInfo = useMemo(() => {
    if (!image) return null;
    const meta = lookupImageMeta(image.src);
    return {
      src: image.src,
      alt: image.alt || meta.title || "Hình ảnh văn hóa",
      title: image.title || meta.title || image.alt || "Di sản văn hóa Việt Nam",
      description: image.description || meta.description,
      location: meta.location,
      artist: meta.artist,
      license: meta.license,
      sourceUrl: meta.sourceUrl,
    };
  }, [image]);

  // Đóng bằng phím Escape & reset zoom
  useEffect(() => {
    if (!image) return;
    setZoomLevel(1);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Ngăn cuộn trang phía sau modal
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [image, onClose]);

  if (!image || !enrichedInfo) return null;

  const toggleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.6 : 1));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={enrichedInfo.title}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Thanh điều khiển trên cùng */}
      <div
        className="w-full max-w-6xl flex items-center justify-between text-white/90 z-20 pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 truncate pr-4">
          <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-display font-medium text-sm sm:text-base text-amber-200 truncate">
            {enrichedInfo.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleZoom}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={zoomLevel === 1 ? "Phóng to 160%" : "Thu về kích thước vừa vặn"}
            aria-label="Phóng to thu nhỏ"
          >
            {zoomLevel === 1 ? <ZoomIn className="w-5 h-5" /> : <ZoomOut className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-rose-500/80 text-white transition-colors cursor-pointer"
            title="Đóng (phím Esc)"
            aria-label="Đóng xem ảnh"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Vùng hiển thị ảnh trọn vẹn không bị cắt (object-contain) */}
      <div
        className="relative flex-1 w-full max-w-6xl flex items-center justify-center overflow-auto my-auto p-1 sm:p-2 cursor-zoom-out"
        onClick={onClose}
      >
        <div
          className="relative max-h-full max-w-full flex items-center justify-center transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
          onClick={(e) => {
            e.stopPropagation();
            toggleZoom();
          }}
        >
          <img
            src={enrichedInfo.src}
            alt={enrichedInfo.alt}
            className="max-h-[72vh] sm:max-h-[76vh] w-auto max-w-full object-contain rounded-xl sm:rounded-2xl shadow-2xl ring-1 ring-white/15 cursor-zoom-in"
          />
        </div>
      </div>

      {/* Bảng chú thích thông tin văn hóa & bản quyền ở đáy */}
      <div
        className="w-full max-w-4xl bg-stone-900/90 border border-stone-700/60 rounded-2xl p-4 sm:p-5 text-stone-200 shadow-xl backdrop-blur-md z-20 mt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3 mb-3">
          <div>
            <h3 className="font-display font-semibold text-base sm:text-lg text-amber-200">
              {enrichedInfo.title}
            </h3>
            {enrichedInfo.description && enrichedInfo.description !== enrichedInfo.title && (
              <p className="text-xs sm:text-sm text-stone-300 mt-1 line-clamp-2 leading-relaxed">
                {enrichedInfo.description}
              </p>
            )}
          </div>

          {enrichedInfo.location && (
            <div className="flex items-center gap-1.5 text-xs text-amber-300/90 bg-amber-950/40 border border-amber-800/40 px-3 py-1.5 rounded-full shrink-0">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{enrichedInfo.location}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

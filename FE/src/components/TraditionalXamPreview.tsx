import { useState } from "react";
import {
  TRADITIONAL_XAM_COLLECTIONS,
  TRADITIONAL_XAM_STICKS,
} from "../data/traditionalXamData";
import { validateTraditionalXam } from "../data/validateTraditionalXam";
import type { TopicType } from "../data/xinXamData";

const TOPICS: TopicType[] = [
  "Bình an",
  "Học tập",
  "Công việc",
  "Gia đình",
];

export function TraditionalXamPreview() {
  const [topic, setTopic] = useState<TopicType>("Bình an");
  const [selectedStickId, setSelectedStickId] = useState(
    () => TRADITIONAL_XAM_STICKS[0]?.id ?? ""
  );

  const dataErrors = validateTraditionalXam(
    TRADITIONAL_XAM_COLLECTIONS,
    TRADITIONAL_XAM_STICKS
  );

  if (dataErrors.length > 0) {
    return (
      <div className="rounded-control border border-line bg-canvas p-4">
        <p className="font-semibold text-ink">
          Dữ liệu thẻ cần chỉnh trước khi đọc thử
        </p>

        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
          {dataErrors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  const stick =
    TRADITIONAL_XAM_STICKS.find(
      (item) => item.id === selectedStickId
    ) ?? TRADITIONAL_XAM_STICKS[0];

  if (!stick) {
    return (
      <p className="text-sm text-muted">
        Chưa có thẻ truyền thống để đọc thử.
      </p>
    );
  }

  const collection = TRADITIONAL_XAM_COLLECTIONS.find(
    (item) => item.id === stick.collectionId
  );

  const reflection = stick.reflectionByTopic[topic];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold text-accent">
          ĐỌC THỬ NỘI DUNG • CHƯA PHÁT HÀNH
        </p>

        <h3 className="font-display text-xl font-semibold text-ink">
          {collection?.title ?? "Bộ xăm chưa xác định"}
          {" — "}Thẻ số {stick.stickNumber}
        </h3>

        {collection && (
          <p className="text-sm text-muted">
            {collection.editionLabel}
          </p>
        )}

        <p className="text-sm text-muted leading-relaxed">
          Kho hiện có {TRADITIONAL_XAM_STICKS.length} thẻ đã nhập.
          Đây là khung kiểm tra nội dung, chưa thực hiện rút thẻ.
        </p>
      </header>

      <div className="space-y-2">
        <label
          htmlFor="traditional-xam-preview-stick"
          className="block text-sm font-semibold text-ink"
        >
          Chọn thẻ để kiểm tra
        </label>

        <select
          id="traditional-xam-preview-stick"
          value={stick.id}
          onChange={(event) =>
            setSelectedStickId(event.target.value)
          }
          className="min-h-11 w-full rounded-control border border-line bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {TRADITIONAL_XAM_STICKS.map((item) => (
            <option key={item.id} value={item.id}>
              Thẻ số {item.stickNumber} — {item.collectionId}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-card border border-line bg-canvas p-4">
          <h4 className="mb-3 text-sm font-semibold text-ink">
            Nguyên văn chữ Hán
          </h4>

          <div
            lang="zh-Hant"
            className="space-y-2 text-xl leading-relaxed text-ink"
          >
            {stick.originalLines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted">
            Lời chiêm nghiệm được trình bày riêng với nguyên văn.
          </p>
        </section>

        <section className="rounded-card border border-line bg-canvas p-4">
          <h4 className="mb-3 text-sm font-semibold text-ink">
            Bản dịch nghĩa — bản nháp
          </h4>

          {stick.translation ? (
            <>
              <div className="space-y-2 text-base leading-relaxed text-ink">
                {stick.translation.lines.map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>

            </>
          ) : (
            <p className="text-sm text-muted">
              Chưa bổ sung bản dịch.
            </p>
          )}
        </section>
      </div>

      {stick.culturalContext && (
        <section className="rounded-card border border-line bg-canvas p-4">
          <p className="text-xs font-semibold text-accent">
            Bối cảnh văn bản · Đọc thử
          </p>

          <h4 className="mt-2 font-semibold text-ink">
            {stick.culturalContext.title}
          </h4>

          <p className="mt-3 text-sm leading-relaxed text-ink">
            {stick.culturalContext.description}
          </p>

          <p className="mt-2 text-xs text-muted">
            Nội dung đang trong quá trình hoàn thiện biên tập.
          </p>
        </section>
      )}

      <section className="space-y-3">
        <label
          htmlFor="traditional-xam-preview-topic"
          className="block text-sm font-semibold text-ink"
        >
          Xem lời gợi mở theo chủ đề
        </label>

        <select
          id="traditional-xam-preview-topic"
          value={topic}
          onChange={(event) =>
            setTopic(event.target.value as TopicType)
          }
          className="min-h-11 w-full rounded-control border border-line bg-surface px-3 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {TOPICS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <p className="text-xs text-muted">
          Lời sản phẩm biên soạn, chưa duyệt biên tập.
          Đổi chủ đề không đổi nguyên văn thẻ.
        </p>

        <p className="text-base leading-relaxed text-ink">
          {reflection ?? "Chưa có lời gợi mở cho chủ đề này."}
        </p>
      </section>

    </div>
  );
}

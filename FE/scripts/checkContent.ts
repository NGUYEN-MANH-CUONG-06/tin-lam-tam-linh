declare const process: { exitCode?: number };
import { ALL_SIGNALS } from "../src/data/demoSignals";
import { CULTURE_ARTICLES } from "../src/data/cultureData";
import {
  TRADITIONAL_XAM_COLLECTIONS,
  TRADITIONAL_XAM_STICKS,
} from "../src/data/traditionalXamData";
import { validateTraditionalXam } from "../src/data/validateTraditionalXam";
import { getPublishableTraditionalSticks } from "../src/data/traditionalXamEligibility";
import { RITUAL_GUIDES } from "../src/data/ritualData";
import {
  getCultureMetadata,
  getRitualMetadata,
} from "../src/data/readingMetadata";
import { existsSync } from "node:fs";
import {
  CHAU_VAN_RECORDINGS,
  canPlayRecording,
} from "../src/data/chauVanAudio";
import { validateReadingMetadata } from "../src/data/validateReadingMetadata";
import { REGIONAL_TOPICS } from "../src/data/regionalTopics";

const errors = validateTraditionalXam(
  TRADITIONAL_XAM_COLLECTIONS,
  TRADITIONAL_XAM_STICKS
);

const articleIds = new Set(
  CULTURE_ARTICLES.map((article) => article.id)
);

for (const signal of ALL_SIGNALS) {
  if (!signal.metadata) {
    errors.push(`${signal.id}: thiếu metadata.`);
  }
}

for (const article of CULTURE_ARTICLES) {
  errors.push(
    ...validateReadingMetadata(
      article.id,
      getCultureMetadata(article)
    )
  );
}

for (const ritual of RITUAL_GUIDES) {
  errors.push(
    ...validateReadingMetadata(
      ritual.id,
      getRitualMetadata(ritual)
    )
  );
}

const recordingIds = new Set<string>();

for (const recording of CHAU_VAN_RECORDINGS) {
  if (
    !recording.id.trim() ||
    recordingIds.has(recording.id)
  ) {
    errors.push("Chầu văn: ID bản thu trống hoặc trùng.");
  }

  recordingIds.add(recording.id);

  errors.push(
    ...validateReadingMetadata(
      recording.id,
      recording.metadata
    )
  );

  if (
    recording.metadata.editorialStatus === "approved" &&
    !canPlayRecording(recording)
  ) {
    errors.push(
      `${recording.id}: bản thu đã duyệt nhưng thiếu thông tin hoặc quyền sử dụng.`
    );
  }

  if (canPlayRecording(recording)) {
    if (!existsSync(`public${recording.src}`)) {
      errors.push(
        `${recording.id}: không tìm thấy file audio — ${recording.src}`
      );
    }
  }
}

for (const article of CULTURE_ARTICLES) {
  const linkedIds = article.audioRecordingIds;

  if (linkedIds === undefined) continue;

  const seenIds = new Set<string>();

  for (const recordingId of linkedIds) {
    if (!recordingId.trim()) {
      errors.push(
        `${article.id}: ID bản thu liên kết bị trống.`
      );
      continue;
    }

    if (seenIds.has(recordingId)) {
      errors.push(
        `${article.id}: ID bản thu liên kết bị trùng — ${recordingId}`
      );
    }

    seenIds.add(recordingId);

    if (!recordingIds.has(recordingId)) {
      errors.push(
        `${article.id}: bản thu liên kết không tồn tại — ${recordingId}`
      );
    }
  }
}

for (const topics of Object.values(REGIONAL_TOPICS)) {
  for (const topic of topics) {
    if (
      topic.articleId &&
      !articleIds.has(topic.articleId)
    ) {
      errors.push(
        `${topic.id}: chủ đề trỏ đến bài không tồn tại — ${topic.articleId}`
      );
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Dữ liệu và liên kết nội bộ: hợp lệ.");
  for (const collectionId of [
    "quan-am",
    "quan-thanh",
  ] as const) {
    const title =
      collectionId === "quan-am"
        ? "Quan Âm"
        : "Quan Thánh";

    for (const topic of [
      "Bình an",
      "Học tập",
      "Công việc",
      "Gia đình",
    ] as const) {
      console.log(
        `${title} — ${topic}:`,
        getPublishableTraditionalSticks(
          collectionId,
          topic
        ).length,
        "thẻ đủ điều kiện"
      );
    }
  }
}

import { useId, useState } from "react";
import {
  CHAU_VAN_RECORDINGS,
  canPlayRecording,
  type ChauVanRecording,
} from "../data/chauVanAudio";
import { Button } from "./ui/button";

function RecordingPlayer({
  recording,
}: {
  recording: ChauVanRecording;
}) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  return (
    <article className="rounded-panel border border-line p-4 sm:p-5">
      <h3 className="font-display text-lg font-semibold text-ink">
        {recording.title}
      </h3>

      <p className="mt-1 text-sm text-muted">
        Trình diễn: {recording.performer}
      </p>

      <p className="mt-3 text-sm leading-relaxed text-ink">
        {recording.description}
      </p>

      <audio
        key={`${recording.id}:${attempt}`}
        controls
        preload="none"
        aria-label={`Nghe ${recording.title}, trình diễn bởi ${recording.performer}`}
        className="mt-4 w-full"
        onError={() => setFailed(true)}
        onLoadedMetadata={() => setFailed(false)}
      >
        <source
          src={recording.src}
          onError={() => setFailed(true)}
        />
        Trình duyệt chưa hỗ trợ phát âm thanh.
      </audio>

      {failed && (
        <div className="mt-3">
          <p role="alert" className="text-sm text-danger">
            Chưa tải được bản thu. Bạn hãy kiểm tra kết nối
            hoặc thử lại.
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          >
            Thử tải lại
          </Button>
        </div>
      )}

      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="font-semibold text-ink">
            Ghi công
          </dt>
          <dd className="text-muted">{recording.credit}</dd>
        </div>

        <div>
          <dt className="font-semibold text-ink">
            Quyền sử dụng
          </dt>
          <dd className="text-muted">
            {recording.usagePermission}
          </dd>
        </div>
      </dl>

    </article>
  );
}

interface ChauVanAudioLibraryProps {
  recordingIds?: readonly string[];
}

export function ChauVanAudioLibrary({
  recordingIds,
}: ChauVanAudioLibraryProps = {}) {
  const headingId = useId();

  const recordings = CHAU_VAN_RECORDINGS.filter(
    (recording) =>
      canPlayRecording(recording) &&
      (
        recordingIds === undefined ||
        recordingIds.includes(recording.id)
      )
  );

  return (
    <section
      id="chau-van-audio"
      aria-labelledby={headingId}
      className="mb-8 scroll-mt-28 rounded-card border border-line bg-surface p-5 sm:p-8"
    >
      <h2
        id={headingId}
        className="font-display text-2xl font-semibold text-ink"
      >
        Nghe chầu văn
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-muted">
        Bạn chủ động chọn phát âm thanh. Mỗi bản thu được
        trình bày cùng người trình diễn và thông tin quyền sử dụng.
      </p>

      {recordings.length === 0 ? (
        <div className="mt-5 rounded-panel bg-surface-soft p-4">
          <h3 className="font-semibold text-ink">
            Chưa có bản thu sẵn sàng
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-muted">
            Hiện chưa có bản thu Chầu Văn được cấp quyền để phát trong ứng dụng. Bạn có thể đọc phần giới thiệu và ghi lại điều muốn tìm hiểu.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {recordings.map((recording) => (
            <RecordingPlayer
              key={recording.id}
              recording={recording}
            />
          ))}
        </div>
      )}
    </section>
  );
}

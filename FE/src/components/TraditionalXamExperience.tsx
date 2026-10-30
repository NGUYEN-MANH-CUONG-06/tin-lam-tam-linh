import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Button } from "./ui/button";
import { Flower2 } from "lucide-react";
import { getPublishableTraditionalSticks } from
  "../data/traditionalXamEligibility";
import {
  TRADITIONAL_XAM_COLLECTIONS,
  type TraditionalXamCollectionId,
  type TraditionalXamStick,
} from "../data/traditionalXamData";
import type { TopicType } from "../data/xinXamData";
import {
  saveTraditionalXam,
  useSavedTraditionalXam,
  type TraditionalXamSaveRequest,
} from "../data/savedTraditionalXam";

const COLLECTION_CHOICES: {
  id: TraditionalXamCollectionId;
  title: string;
}[] = [
  { id: "quan-am", title: "Xăm Quan Âm" },
  { id: "quan-thanh", title: "Xăm Quan Thánh" },
];

const TOPICS: TopicType[] = [
  "Bình an",
  "Học tập",
  "Công việc",
  "Gia đình",
];

type TraditionalHistorySnapshot = {
  entryId: string;
  account: string;
  collectionId: TraditionalXamCollectionId;
  topic: TopicType;
  stickId: string | null;
};

function readTraditionalHistory(
  account: string
): TraditionalHistorySnapshot | null {
  const value = window.history.state?.traditionalXam;

  if (
    !value ||
    typeof value !== "object" ||
    typeof value.entryId !== "string" ||
    !value.entryId ||
    value.account !== account ||
    !COLLECTION_CHOICES.some(
      (item) => item.id === value.collectionId
    ) ||
    !TOPICS.includes(value.topic) ||
    !(
      value.stickId === null ||
      typeof value.stickId === "string"
    )
  ) {
    return null;
  }

  return {
    entryId: value.entryId,
    account: value.account,
    collectionId: value.collectionId,
    topic: value.topic,
    stickId: value.stickId,
  };
}

interface TraditionalXamExperienceProps {
  currentUserEmail?: string;
  onRequestLoginToSave: (
    request: TraditionalXamSaveRequest
  ) => void;
}

export function TraditionalXamExperience({
  currentUserEmail,
  onRequestLoginToSave,
}: TraditionalXamExperienceProps) {
  const instanceId = useId();

  const account =
    currentUserEmail?.trim().toLowerCase() || "guest";

  const [initialSnapshot] = useState(() =>
    readTraditionalHistory(account)
  );

  const entryIdRef = useRef(
    initialSnapshot?.entryId ?? crypto.randomUUID()
  );

  const [collectionId, setCollectionId] =
    useState<TraditionalXamCollectionId>(
      initialSnapshot?.collectionId ?? "quan-am"
    );

  const [topic, setTopic] = useState<TopicType>(
    initialSnapshot?.topic ?? "Bình an"
  );

  const [result, setResult] =
    useState<TraditionalXamStick | null>(() => {
      if (!initialSnapshot?.stickId) return null;

      return (
        getPublishableTraditionalSticks(
          initialSnapshot.collectionId,
          initialSnapshot.topic
        ).find(
          (item) => item.id === initialSnapshot.stickId
        ) ?? null
      );
    });

  const [notice, setNotice] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [saveError, setSaveError] = useState("");

  const {
    items: savedItems,
    readError,
  } = useSavedTraditionalXam(currentUserEmail);

  const drawLockedRef = useRef(false);

  const drawTimerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  const collection = TRADITIONAL_XAM_COLLECTIONS.find(
    (item) => item.id === collectionId
  );

  const isSaved =
    result !== null &&
    collection !== undefined &&
    savedItems.some(
      (item) =>
        item.collectionId === collectionId &&
        item.editionLabel === collection.editionLabel &&
        item.stickId === result.id &&
        item.topic === topic
    );

  const handleSave = () => {
    setSaveError("");

    if (!currentUserEmail || !result || isDrawing) return;

    const saved = saveTraditionalXam(
      currentUserEmail,
      collectionId,
      topic,
      result.id
    );

    if (!saved) {
      setSaveError(
        "Chưa lưu được thẻ. Thẻ có thể không còn đủ điều kiện hoặc trình duyệt chưa lưu được dữ liệu."
      );
    }
  };

  useEffect(() => {
    setSaveError("");
  }, [collectionId, topic, result?.id]);

  const available = getPublishableTraditionalSticks(
    collectionId,
    topic
  );

  const selectedTitle =
    COLLECTION_CHOICES.find(
      (item) => item.id === collectionId
    )?.title ?? "Bộ xăm";

  useEffect(() => {
    if (window.location.pathname !== "/xinxam") return;

    const previousState = window.history.state ?? {};
    const previousSnapshot = previousState.traditionalXam;

    // Chặn ghi nhầm sang mục lịch sử khác của cùng tài khoản.
    // Snapshot của tài khoản khác được thay bằng trạng thái
    // mới của tài khoản hiện tại.
    if (
      previousSnapshot?.account === account &&
      previousSnapshot?.entryId &&
      previousSnapshot.entryId !== entryIdRef.current
    ) {
      return;
    }

    const snapshot: TraditionalHistorySnapshot = {
      entryId: entryIdRef.current,
      account,
      collectionId,
      topic,
      stickId: result?.id ?? null,
    };

    window.history.replaceState(
      {
        ...previousState,
        traditionalXam: snapshot,
      },
      "",
      window.location.href
    );
  }, [account, collectionId, topic, result]);

  useEffect(() => {
    return () => {
      if (drawTimerRef.current !== null) {
        clearTimeout(drawTimerRef.current);
        drawTimerRef.current = null;
      }

      drawLockedRef.current = false;
    };
  }, []);

  const changeCollection = (
    next: TraditionalXamCollectionId
  ) => {
    if (drawLockedRef.current) return;

    setCollectionId(next);
    setResult(null);
    setNotice("");
  };

  const changeTopic = (next: TopicType) => {
    if (drawLockedRef.current) return;

    setTopic(next);
    setResult(null);
    setNotice("");
  };

  const handleDraw = () => {
    if (drawLockedRef.current) return;

    const eligible = getPublishableTraditionalSticks(
      collectionId,
      topic
    );

    if (eligible.length === 0) {
      setResult(null);
      setNotice(
        "Chưa có thẻ đủ điều kiện cho lựa chọn này."
      );
      return;
    }

    const chosen =
      eligible[Math.floor(Math.random() * eligible.length)];

    const finish = () => {
      // Kiểm tra lại dữ liệu ở thời điểm trả kết quả.
      const stillEligible = getPublishableTraditionalSticks(
        collectionId,
        topic
      ).find((item) => item.id === chosen.id);

      if (!stillEligible) {
        setResult(null);
        setNotice(
          "Thẻ này hiện chưa đủ điều kiện hiển thị."
        );
      } else {
        setResult(stillEligible);

        setNotice(
          eligible.length === 1
            ? "Kho hiện có một thẻ phù hợp; rút lại sẽ nhận cùng thẻ."
            : "Đã chọn một thẻ từ phần nội dung đang có trong kho."
        );
      }

      setIsDrawing(false);
      drawLockedRef.current = false;
    };

    drawLockedRef.current = true;
    setNotice("");

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      finish();
      return;
    }

    setIsDrawing(true);

    drawTimerRef.current = setTimeout(() => {
      drawTimerRef.current = null;

      const sameEntry =
        window.location.pathname === "/xinxam" &&
        window.history.state?.traditionalXam?.entryId ===
          entryIdRef.current;

      if (!sameEntry) {
        drawLockedRef.current = false;
        setIsDrawing(false);
        return;
      }

      finish();
    }, 1200);
  };

  return (
    <section
      aria-labelledby={`${instanceId}-title`}
      className="space-y-6"
    >
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-2">
          <Flower2 className="w-3.5 h-3.5" />
          <span>Kho xăm di sản cổ phong</span>
        </div>

        <h3
          id={`${instanceId}-title`}
          className="font-display text-2xl font-semibold text-ink"
        >
          Chọn bộ xăm truyền thống
        </h3>

        <p className="mt-1 text-sm leading-relaxed text-muted">
          Bộ xăm nguyên bản lưu truyền dân gian được giữ nguyên văn. Lời gợi mở theo chủ đề không làm thay đổi nguyên tác thẻ.
        </p>
      </header>

      {/* 1. Chọn bộ xăm */}
      <fieldset>
        <legend className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-accent">
          Bộ xăm khảo cứu
        </legend>

        <div className="grid gap-3 sm:grid-cols-2">
          {COLLECTION_CHOICES.map((choice) => (
            <label
              key={choice.id}
              className={`traditional-collection-pill ${
                collectionId === choice.id ? "traditional-collection-pill--active" : ""
              }`}
            >
              <input
                type="radio"
                name={`${instanceId}-collection`}
                value={choice.id}
                checked={collectionId === choice.id}
                onChange={() => changeCollection(choice.id)}
                disabled={isDrawing}
                className="sr-only"
              />

              <span className="font-semibold text-sm sm:text-base">
                {choice.title}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 2. Chọn chủ đề */}
      <fieldset>
        <legend className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-accent">
          Chủ đề chiêm nghiệm
        </legend>

        <div className="flex flex-wrap gap-2.5">
          {TOPICS.map((item) => (
            <label
              key={item}
              className={`xinxam-topic-pill ${
                topic === item ? "xinxam-topic-pill--active" : ""
              }`}
            >
              <input
                type="radio"
                name={`${instanceId}-topic`}
                value={item}
                checked={topic === item}
                onChange={() => changeTopic(item)}
                disabled={isDrawing}
                className="sr-only"
              />

              <span>{item}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Tình trạng kho thẻ */}
      <div
        id={`${instanceId}-availability`}
        role="status"
        className="rounded-xl border border-line bg-surface p-4 text-xs sm:text-sm leading-relaxed text-muted"
      >
        {!collection ? (
          <p>
            {selectedTitle} chưa có bộ dữ liệu trong bản hiện tại.
            Bạn vẫn có thể dùng trải nghiệm thẻ mẫu bên trên.
          </p>
        ) : available.length === 0 ? (
          <>
            <p className="font-semibold text-ink">
              Chưa sẵn sàng để rút thẻ
            </p>

            <p className="mt-1">
              Bộ này đã có dữ liệu nhập thử, nhưng chưa có thẻ
              đáp ứng đầy đủ điều kiện sử dụng cho chủ đề này.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-ink">
              Có {available.length} thẻ đủ điều kiện trong kho
            </p>

            <p className="mt-1">
              Bản tư liệu: <strong className="text-ink">{collection.editionLabel}</strong>. Thẻ được rút tự do theo tinh thần chiêm nghiệm.
            </p>
          </>
        )}
      </div>

      {/* Nút rút thẻ xăm cổ phong */}
      <div>
        <button
          type="button"
          onClick={handleDraw}
          disabled={isDrawing || available.length === 0}
          aria-describedby={`${instanceId}-availability`}
          className="xinxam-draw-btn w-full sm:w-auto"
        >
          <span className="xinxam-btn-sheen" />
          <span>
            {isDrawing
              ? "Đang thỉnh quẻ xăm…"
              : available.length > 0
                ? result
                  ? "Rút lại từ bộ này"
                  : "Thỉnh một quẻ xăm"
                : "Chưa có thẻ để rút"}
          </span>
        </button>
      </div>

      {isDrawing && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4"
        >
          <span
            aria-hidden="true"
            className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-line border-t-accent motion-reduce:animate-none"
          />

          <p className="text-sm text-muted">
            Đang thỉnh một quẻ xăm từ kho tư liệu cổ truyền…
          </p>
        </div>
      )}

      {notice && (
        <p role="status" className="text-xs sm:text-sm text-muted italic">
          ✦ {notice}
        </p>
      )}

      {/* Thẻ xăm kết quả cổ phong */}
      {result && !isDrawing && (
        <article className="traditional-stick-card space-y-6">
          <header className="border-b border-line/60 pb-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent bg-accent/8 px-3 py-1 rounded-full border border-accent/15 mb-2">
              <Flower2 className="w-3.5 h-3.5" />
              <span>{selectedTitle}</span>
            </span>

            <h4 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
              Thẻ số {result.stickNumber}
            </h4>

            <p className="mt-1 text-xs text-muted">
              Nội dung lưu truyền phục vụ tìm hiểu văn hóa dân gian, không quyết định thay bạn.
            </p>
          </header>

          {/* 1. Nguyên văn chữ Hán phồn thể */}
          <section>
            <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
              Nguyên văn chữ Hán
            </h5>

            <div
              lang="zh-Hant"
              className="traditional-chinese-block space-y-2 font-display text-xl leading-relaxed"
            >
              {result.originalLines.map((line, index) => (
                <p key={index} className="m-0 font-medium">{line}</p>
              ))}
            </div>
          </section>

          {/* 2. Bản dịch thơ */}
          {result.translation && (
            <section className="rounded-xl border border-line/60 bg-surface-soft/40 p-4 sm:p-5">
              <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
                Bản dịch thơ
              </h5>

              <div className="space-y-1.5 font-display text-base sm:text-lg text-ink italic leading-relaxed">
                {result.translation.lines.map((line, index) => (
                  <p key={index} className="m-0">“{line}”</p>
                ))}
              </div>

            </section>
          )}

          {/* 3. Điển tích văn hóa */}
          {result.culturalContext && (
            <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
              <h5 className="font-display font-semibold text-base sm:text-lg text-ink mb-1.5">
                {result.culturalContext.title}
              </h5>

              <p className="text-sm leading-relaxed text-ink">
                {result.culturalContext.description}
              </p>

            </section>
          )}

          {/* 4. Gợi mở chiêm nghiệm theo chủ đề */}
          <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
            <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
              Gợi mở về {topic.toLocaleLowerCase("vi-VN")}
            </h5>

            <p className="text-base text-ink leading-relaxed">
              {result.reflectionByTopic[topic]}
            </p>

            <p className="mt-2 text-xs text-muted">
              Phần gợi mở do sản phẩm biên soạn, được trình bày riêng với nguyên văn.
            </p>
          </section>

          {/* Nút lưu vào Góc của tôi */}
          <div className="border-t border-line/60 pt-4 flex flex-col sm:flex-row items-center gap-3">
            {currentUserEmail ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleSave}
                disabled={isSaved || readError}
                className="w-full sm:w-auto font-semibold"
              >
                {isSaved
                  ? "Đã lưu vào Góc của tôi ✓"
                  : "Lưu thẻ vào Góc của tôi"}
              </Button>
            ) : (
              <div className="space-y-2 w-full sm:w-auto">
                <p className="text-xs text-muted">
                  Đăng nhập để lưu thẻ đang đọc vào sổ tay của bạn.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  disabled={!collection}
                  onClick={() => {
                    if (!collection || !result || isDrawing) return;

                    onRequestLoginToSave({
                      collectionId,
                      topic,
                      stickId: result.id,
                      editionLabel: collection.editionLabel,
                    });
                  }}
                  className="w-full sm:w-auto"
                >
                  Đăng nhập để lưu thẻ
                </Button>
              </div>
            )}

            {(saveError || readError) && (
              <p role="alert" className="text-xs text-danger">
                {saveError ||
                  "Chưa đọc được kho thẻ đã lưu. Dữ liệu hiện có chưa bị ghi đè."}
              </p>
            )}
          </div>
        </article>
      )}
    </section>
  );
}

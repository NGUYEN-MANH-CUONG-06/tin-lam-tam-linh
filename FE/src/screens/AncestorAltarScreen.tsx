import React, {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Landmark,
  Music2,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Textarea } from "@/src/components/ui/textarea";
import { useJadeDecoration } from "../hooks/useJadeDecoration";
import { JadeDecorationControl } from "../components/JadeDecorationControl";
import { isDemoMode } from "../data/demoMode";

const SanctuaryScene = lazy(() =>
  import("../components/SanctuaryScene").then((module) => ({
    default: module.SanctuaryScene,
  }))
);

interface AncestorAltarScreenProps {
  currentUserEmail?: string;
  onBack: () => void;
  isLoggedIn: boolean;
  onSaveTribute: (content: string) => boolean | Promise<boolean>;
  initialContent?: string;
  onDraftChange?: (content: string | null) => void;
}

interface SubmittedPrayer {
  id: string;
  content: string;
  submittedAt: Date;
}

export const AncestorAltarScreen: React.FC<AncestorAltarScreenProps> = ({
  currentUserEmail,
  onBack,
  isLoggedIn,
  onSaveTribute,
  initialContent = "",
  onDraftChange,
}) => {
  const [tribute, setTribute] = useState(initialContent);
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicError, setMusicError] = useState("");
  const [recentPrayers, setRecentPrayers] = useState<SubmittedPrayer[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const jadeDecoration = useJadeDecoration(currentUserEmail);

  useEffect(() => {
    onDraftChange?.(submitted ? null : tribute);
  }, [tribute, submitted, onDraftChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let disposed = false;
    audio.volume = 0.2;

    const playBackgroundMusic = async () => {
      try {
        await audio.play();
        if (!disposed) {
          setMusicPlaying(true);
          setMusicError("");
        }
      } catch {
        if (!disposed) {
          setMusicPlaying(false);
          setMusicError(
            "Trình duyệt đang chặn tự phát nhạc. Chạm vào biểu tượng loa để bật nhạc nền."
          );
        }
      }
    };

    void playBackgroundMusic();

    // Browsers may block autoplay with sound. Retry on the first user gesture.
    const resumeOnGesture = (event: Event) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("[data-audio-toggle]")
      ) {
        return;
      }
      if (audio.paused) void playBackgroundMusic();
    };
    document.addEventListener("pointerdown", resumeOnGesture, { once: true });

    return () => {
      disposed = true;
      document.removeEventListener("pointerdown", resumeOnGesture);
      audio.pause();
    };
  }, []);

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      setMusicPlaying(false);
      setMusicError("");
      return;
    }

    try {
      await audio.play();
      setMusicPlaying(true);
      setMusicError("");
    } catch {
      setMusicPlaying(false);
      setMusicError("Chưa phát được nhạc nền. Bạn hãy thử bật lại.");
    }
  };

  const sendTribute = async () => {
    const cleanContent = tribute.trim();
    if (!cleanContent || submitted) return;

    setSaveError("");
    const saved = await onSaveTribute(cleanContent);

    if (saved) {
      setSubmitted(true);
      setRecentPrayers((prayers) => [
        {
          id: crypto.randomUUID(),
          content: cleanContent,
          submittedAt: new Date(),
        },
        ...prayers,
      ]);
    } else if (isLoggedIn) {
      setSaveError("Chưa lưu được lời tri ân. Bạn hãy thử lại.");
    }
  };

  return (
    <div className="screen-shell">
      <main className="page-container max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-3 text-xs text-stone-600 dark:text-stone-400">
          <button
            onClick={onBack}
            className="inline-flex cursor-pointer items-center gap-1.5 font-medium transition-colors hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Không gian của tôi</span>
          </button>
          <Badge
            variant="outline"
            className="border-amber-400/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300"
          >
            Góc riêng tâm linh
          </Badge>
        </div>

        <header className="mb-6 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400">
            NẾP NHÀ VIỆT
          </span>
          <h1
            tabIndex={-1}
            className="page-title mt-1.5 mb-2.5 border-0 font-display text-3xl font-bold text-ink outline-none focus:outline-none focus-visible:outline-none focus:ring-0 sm:text-4xl"
          >
            Bàn thờ gia tiên
          </h1>
          <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300 sm:text-base">
            Một khoảng lặng để hướng về nguồn cội, thắp nén hương lòng và gửi
            gắm điều bạn muốn nguyện cầu.
          </p>
        </header>



        <section aria-labelledby="ancestor-scene-title" className="mb-8">
          <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-line bg-surface-soft/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/15 text-amber-700 dark:text-amber-400">
                <Landmark className="h-6 w-6" />
              </div>
              <div>
                <h2
                  id="ancestor-scene-title"
                  className="font-display text-lg font-bold text-ink sm:text-xl"
                >
                  Một khoảng lặng hướng về gia tiên
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-300 sm:text-sm">
                  Gỗ sẫm phủ bóng, bài vị hoa sen, men lam và hương nến
                </p>
              </div>
            </div>

            <Button
              type="button"
              data-audio-toggle
              aria-label={musicPlaying ? "Tắt nhạc nền" : "Bật nhạc nền"}
              aria-pressed={musicPlaying}
              title={musicPlaying ? "Tắt nhạc nền" : "Bật nhạc nền"}
              onClick={toggleMusic}
              variant="outline"
              className="min-h-11 min-w-11 self-start rounded-full border-amber-700/30 px-3 text-amber-900 hover:bg-amber-500/10 dark:text-amber-200 sm:self-auto"
            >
              {musicPlaying ? (
                <Volume2 className="h-5 w-5" aria-hidden="true" />
              ) : (
                <VolumeX className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </div>

          {/* CC0 ambient track: “Somnium” by Adiutorium, OpenGameArt. */}
          <audio
            ref={audioRef}
            src="/audio/somnium.mp3"
            loop
            preload="auto"
          />

          <div className="mb-3 flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
            <Music2
              className="h-4 w-4 text-amber-700 dark:text-amber-400"
              aria-hidden="true"
            />
            <span>Nhạc nền thiền nhẹ, phát lặp khi bạn ghé thăm</span>
          </div>
          {musicError && (
            <p role="status" className="mb-3 text-xs text-stone-600 dark:text-stone-300">
              {musicError}
            </p>
          )}

          <JadeDecorationControl state={jadeDecoration} />

          <div id="ancestor-scene-panel" className="overflow-hidden rounded-2xl">
            <Suspense
              fallback={
                <div
                  role="status"
                  className="rounded-2xl border border-line bg-surface p-12 text-center shadow-sm"
                >
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                  <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                    Đang chuẩn bị bàn thờ gia tiên…
                  </p>
                </div>
              }
            >
              <SanctuaryScene decoration={jadeDecoration.decoration}>
                <section aria-label="Gửi lời cầu nguyện" className="border-t border-line bg-surface p-4 sm:p-6">
                  <div className="mb-3">
                    <h2 className="font-display text-lg font-bold text-ink">
                      Gửi lời nguyện
                    </h2>
                  </div>
        
                  <Textarea
                    value={tribute}
                    onChange={(event) => {
                      setTribute(event.target.value);
                      setSubmitted(false);
                      setSaveError("");
                    }}
                    aria-label="Lời nguyện"
                    maxLength={1000}
                    placeholder="Viết lời cầu nguyện của bạn…"
                    className="mb-3 min-h-24 rounded-xl border border-line bg-surface-soft/60 p-4 text-sm leading-relaxed text-ink placeholder:text-stone-500 focus:border-amber-500 focus:bg-surface focus:ring-2 focus:ring-amber-500/20 sm:text-base"
                  />
        
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={sendTribute}
                      disabled={!tribute.trim() || submitted}
                      className={`min-h-11 cursor-pointer gap-2 rounded-xl px-6 font-semibold shadow-md transition-all ${
                        submitted
                          ? "bg-emerald-700 text-white hover:bg-emerald-800"
                          : "bg-gradient-to-r from-red-800 via-amber-700 to-amber-900 text-white hover:from-red-700 hover:to-amber-800"
                      }`}
                    >
                      {submitted ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-white" />
                          <span>Đã gửi lời nguyện</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 text-amber-200" />
                          <span>{isLoggedIn ? "Gửi lời nguyện" : "Đăng nhập để gửi"}</span>
                        </>
                      )}
                    </Button>
                  </div>
        
                  {submitted && (
                    <div
                      role="status"
                      className="mt-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-800 animate-fadeIn dark:text-emerald-300"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>Lời cầu nguyện đã được lưu vào Điều ước &amp; Tri ân của bạn.</span>
                    </div>
                  )}
        
                  {saveError && (
                    <p role="alert" className="mt-4 text-sm font-medium text-danger">
                      {saveError}
                    </p>
                  )}
                </section>
              </SanctuaryScene>
            </Suspense>
          </div>
        </section>

        {recentPrayers.length > 0 && (
          <section aria-labelledby="recent-prayers-title" className="mb-12">
            <div className="mb-4 flex items-center gap-2.5">
              <Music2 className="h-5 w-5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              <h2
                id="recent-prayers-title"
                className="font-display text-xl font-bold text-ink"
              >
                Lời nguyện vừa gửi
              </h2>
            </div>
            <ul className="space-y-3">
              {recentPrayers.map((prayer) => (
                <li
                  key={prayer.id}
                  className="rounded-2xl border border-amber-500/20 bg-surface-soft/70 p-5"
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-ink">
                    “{prayer.content}”
                  </p>
                  <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                    Bạn · {prayer.submittedAt.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};

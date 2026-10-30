import React, {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { UnverifiedImage } from "../components/UnverifiedImage";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Compass,
  Heart,
  Play,
  Pause,
  Waves,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  Send,
  Anchor,
  ShieldCheck,
  Music,
  Share2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { Textarea } from "@/src/components/ui/textarea";
import { SceneErrorBoundary } from "../components/SceneErrorBoundary";

export type RegionalExperienceKind = "chau-van" | "sea-prayer" | "southern-culture";

const SouthernRiverScene = lazy(() =>
  import("../components/SouthernRiverScene").then((module) => ({
    default: module.SouthernRiverScene,
  }))
);
const CentralSeaScene = lazy(
  () => import("../components/CentralSeaScene")
);
const NorthernShrineScene = lazy(
  () => import("../components/NorthernShrineScene")
);

interface RegionalExperienceScreenProps {
  kind: RegionalExperienceKind;
  currentUserEmail?: string;
  onBack: () => void;
  onGoToWish: () => void;
  onNavigateRegion?: (kind: RegionalExperienceKind) => void;
}

// Danh sách các bản văn Chầu Văn kinh điển mẫu mực
interface ChauVanVerse {
  id: string;
  deity: string;
  domain: string;
  tempo: string;
  lyrics: string[];
  meaning: string;
}

const CHAU_VAN_VERSES: ChauVanVerse[] = [
  {
    id: "co-bo",
    deity: "Văn Cô Bơ Thoải Phủ",
    domain: "Đệ Tam Thoải Phủ · Ba Bông Thác Hàn",
    tempo: "Nhịp Phú Bình · Thanh thoát êm ả",
    lyrics: [
      "Thuyền rồng lướt nhẹ dòng sông Mã,",
      "Bóng Cô Bơ thoắt ẩn thoắt hiện bờ hoa.",
      "Cung thoái ba đào tay chèo bẻ lái,",
      "Cứu độ người hiền vượt ải trần gian.",
    ],
    meaning:
      "Tôn vinh lòng từ bi của Cô Bơ Thoải Phủ ngự chốn sông Hàn thác Bông, vị thánh cô độ trì cho người đi sông nước bình an, ban thuốc tiên cứu chữa bệnh tật.",
  },
  {
    id: "quan-de-tam",
    deity: "Văn Quan Lớn Đệ Tam",
    domain: "Đệ Tam Thoải Cung · Xích Tướng Đại Vương",
    tempo: "Nhịp Cờ Mở · Uy nghi dõng dạc",
    lyrics: [
      "Lệnh truyền xích tướng uy nghi,",
      "Cầm gươm thần hộ quốc uy danh ngút trời.",
      "Chốn đền Hàn sóng xô nghìn trượng,",
      "Trừ tà diệt ác độ khắp muôn dân.",
    ],
    meaning:
      "Biểu trưng cho tinh thần quả cảm, chính trực của vị tướng thủy quân hộ quốc an dân, gạt bỏ điều xấu ác, chở che công lý.",
  },
  {
    id: "chua-thac-bo",
    deity: "Văn Chúa Thác Bờ",
    domain: "Chúa Mường Hòa Bình · Sông Đà Linh Ứng",
    tempo: "Nhịp Sa Mạc · Trầm bổng ngút ngàn",
    lyrics: [
      "Núi non xanh ngát dòng Đà giang,",
      "Thác gập ghềnh Chúa ngự trên ngàn mây bay.",
      "Gạo bè buôn chuyến xuôi ngược,",
      "Nhờ ơn Chúa độ thuận buồm chở che.",
    ],
    meaning:
      "Gợi nhớ công đức hai vị nữ anh hùng dân tộc Mường giúp vua Lê Lợi dẹp loạn, bảo hộ cho bè mảng giao thương vượt ghềnh thác hiểm trở trên dòng sông Đà.",
  },
  {
    id: "co-chin",
    deity: "Văn Cô Chín Sòng Sơn",
    domain: "Thượng Ngàn Đền Sòng · Cung Kiếm Quạt Hoa",
    tempo: "Nhịp Dồn Phách · Tươi vui rộn rã",
    lyrics: [
      "Quạt hoa quẩy lẵng hái trà,",
      "Hầu Mẫu Liễu Hạnh thướt tha cõi thiêng.",
      "Lòng thành ai dâng một nén tâm hương,",
      "Cô ban tài tiếp lộc trăm đường bình yên.",
    ],
    meaning:
      "Thánh cô đệ cửu cai quản cõi thượng ngàn, thưởng phạt phân minh, ban lộc ban duyên lành cho những ai sống trọn đạo nghĩa.",
  },
];

// Các ý niệm cầu nguyện biển cả
const SEA_PRAYER_INTENTS = [
  {
    id: "distant-love",
    title: "Cầu cho người thân nơi xa",
    tagline: "Dặm trường cách trở, mong bước chân luôn vững vàng, an khang trọn vẹn.",
    icon: Heart,
  },
  {
    id: "fishermen",
    title: "Cầu cho ngư dân & người ra khơi",
    tagline: "Thuận buồm xuôi gió, biển lặng sóng êm, chuyến đi bình yên cá nặng khoang thuyền.",
    icon: Anchor,
  },
  {
    id: "inner-peace",
    title: "Cầu tâm an tĩnh tại",
    tagline: "Gửi muộn phiền theo sóng trôi xa, giữ lại trong lòng sự bao dung rộng lớn của biển trời.",
    icon: Waves,
  },
];

export const RegionalExperienceScreen: React.FC<RegionalExperienceScreenProps> = ({
  kind: initialKind,
  currentUserEmail,
  onBack,
  onGoToWish,
  onNavigateRegion,
}) => {
  const [activeKind, setActiveKind] = useState<RegionalExperienceKind>(initialKind);

  const accountId = currentUserEmail?.trim().toLowerCase() || "guest";
  const noteStorageKey = `tltl-regional-note-${accountId}-${activeKind}`;

  // State cho ghi chép
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [noteSavedSuccess, setNoteSavedSuccess] = useState(false);

  // State tương tác Chầu Văn
  const [activeVerseIndex, setActiveVerseIndex] = useState(0);
  const [isPlayingChauVanAudio, setIsPlayingChauVanAudio] = useState(false);
  const [showNorthernShrine, setShowNorthernShrine] = useState(false);
  const [hasIncenseLit, setHasIncenseLit] = useState(false);

  // State tương tác Lời cầu biển
  const [selectedSeaIntent, setSelectedSeaIntent] = useState(SEA_PRAYER_INTENTS[0].id);
  const [seaPrayerWish, setSeaPrayerWish] = useState("");
  const [hasOfferedSeaPrayer, setHasOfferedSeaPrayer] = useState(false);
  const [isPlayingSeaSound, setIsPlayingSeaSound] = useState(false);
  const [showSeaScene, setShowSeaScene] = useState(false);

  // Web Audio Context Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundIntervalRef = useRef<any>(null);

  // Khởi tạo note từ session storage khi đổi tab
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(noteStorageKey) || "";
      setNote(stored);
      setSavedNote(stored);
      setNoteSavedSuccess(false);
    } catch {
      setNote("");
      setSavedNote("");
    }
  }, [noteStorageKey, activeKind]);

  // Cleanup âm thanh khi unmount
  useEffect(() => {
    return () => {
      stopAudioSynthesizer();
    };
  }, []);

  // Web Audio Synthesizer: Tạo tiếng gõ phách gỗ / tiếng sóng biển thiền định
  const stopAudioSynthesizer = () => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
    setIsPlayingChauVanAudio(false);
    setIsPlayingSeaSound(false);
  };

  const playWoodenClapperSound = (ctx: AudioContext, time: number, pitch = 880) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(pitch, time);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, time + 0.08);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.12);
  };

  const playBellSound = (ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(528, time); // 528Hz Solfeggio Love frequency

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 2.2);
  };

  const toggleChauVanAudio = () => {
    if (isPlayingChauVanAudio) {
      stopAudioSynthesizer();
      return;
    }

    stopAudioSynthesizer();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      setIsPlayingChauVanAudio(true);

      // Nhịp phách Chầu Văn: Cắc... Tùng cắc...
      let beat = 0;
      playBellSound(ctx, ctx.currentTime);

      soundIntervalRef.current = setInterval(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") return;
        const now = audioCtxRef.current.currentTime;

        if (beat % 8 === 0) {
          playBellSound(audioCtxRef.current, now); // Chuông ngân ở đầu chu kỳ
        }

        if (beat % 2 === 0) {
          playWoodenClapperSound(audioCtxRef.current, now, 820); // Phách đanh
        } else {
          playWoodenClapperSound(audioCtxRef.current, now, 640); // Phách trầm
        }

        beat = (beat + 1) % 16;
      }, 550);
    } catch {
      setIsPlayingChauVanAudio(false);
    }
  };

  const toggleSeaSound = () => {
    if (isPlayingSeaSound) {
      stopAudioSynthesizer();
      return;
    }

    stopAudioSynthesizer();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      setIsPlayingSeaSound(true);

      // Mô phỏng tiếng sóng biển rì rào với white noise buffer & lowpass filter
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();

      // Hiệu ứng sóng dâng và rút nhịp nhàng
      let waveUp = true;
      soundIntervalRef.current = setInterval(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") return;
        const now = audioCtxRef.current.currentTime;
        if (waveUp) {
          filter.frequency.exponentialRampToValueAtTime(750, now + 3);
          gain.gain.linearRampToValueAtTime(0.3, now + 3);
        } else {
          filter.frequency.exponentialRampToValueAtTime(260, now + 3.5);
          gain.gain.linearRampToValueAtTime(0.12, now + 3.5);
        }
        waveUp = !waveUp;
      }, 3500);
    } catch {
      setIsPlayingSeaSound(false);
    }
  };

  // Lưu cảm nhận
  const handleSaveNote = () => {
    const cleanNote = note.trim();
    if (!cleanNote) return;

    try {
      sessionStorage.setItem(noteStorageKey, cleanNote);
      setSavedNote(cleanNote);
      setNoteSavedSuccess(true);
      setTimeout(() => setNoteSavedSuccess(false), 3000);
    } catch {}
  };

  // Thả lời cầu ra biển
  const handleOfferSeaPrayer = () => {
    if (!seaPrayerWish.trim()) return;
    setHasOfferedSeaPrayer(true);
    // Tự động lưu lời cầu vào ghi chú
    const updatedNote = note ? `${note}\n\n[Lời cầu ra biển mẹ]: ${seaPrayerWish}` : `[Lời cầu ra biển mẹ]: ${seaPrayerWish}`;
    setNote(updatedNote);
    try {
      sessionStorage.setItem(noteStorageKey, updatedNote);
      setSavedNote(updatedNote);
    } catch {}
  };

  const activeVerse = CHAU_VAN_VERSES[activeVerseIndex];

  return (
    <div className="screen-shell">
      <main className="page-container max-w-7xl">
        {/* Top Breadcrumb Nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 text-xs text-stone-600 dark:text-stone-400">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 hover:text-accent transition-colors font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại chuyên đề vùng miền</span>
          </button>

          <Badge
            variant="outline"
            className="text-xs px-3 py-0.5 border-amber-400/40 text-amber-800 dark:text-amber-300 bg-amber-500/10 font-medium"
          >
            ✦ KHÔNG GIAN THỰC HÀNH TÂM LINH
          </Badge>
        </div>

        {/* ========================================================================= */}
        {/* ================= 1. TRẢI NGHIỆM CHẦU VĂN BẮC BỘ ======================== */}
        {/* ========================================================================= */}
        {activeKind === "chau-van" && (
          <div className="space-y-12">
            {/* Hero Magazine Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400">
                      DI SẢN DIỄN XƯỚNG TÂM LINH
                    </span>
                    <span className="text-xs text-stone-500">·</span>
                    <span className="text-xs text-stone-500">Bắc Bộ</span>
                  </div>

                  <h1
                    tabIndex={-1}
                    className="page-title font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink outline-none border-0 leading-tight"
                  >
                    Một nhịp chầu văn thật chậm
                  </h1>

                  <p className="font-display text-base sm:text-lg text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                    Lời ca nghi lễ, đàn nguyệt thong dong và cõi thiêng Tứ Phủ huyền diệu
                  </p>

                  <div className="p-4 rounded-xl border-l-2 border-amber-600 bg-amber-500/5 dark:bg-amber-500/10 border border-line/60">
                    <p className="font-display italic text-xs sm:text-sm text-ink leading-relaxed">
                      “Thánh giá hồi loan muôn thuở rạng — Đàn gảy năm cung vọng đất trời.”
                    </p>
                  </div>

                  <p className="text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed">
                    Chầu văn không chỉ là nghi thức hầu thánh linh thiêng của tín ngưỡng thờ Mẫu Tam phủ,
                    mà còn là viên ngọc quý của văn hóa dân gian Việt Nam. Từng nhịp phách, cung đàn nguyệt
                    và lời thơ lục bát đưa con người vào trạng thái an tĩnh, hòa mình cùng linh khí non sông.
                  </p>
                </div>

                {/* Sound & Sensory Controls Bar */}
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleChauVanAudio}
                      className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-800 to-amber-700 text-white flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer"
                    >
                      {isPlayingChauVanAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <div>
                      <h4 className="font-display text-sm font-bold text-ink">
                        {isPlayingChauVanAudio ? "Đang phát âm hưởng Chầu Văn & Chuông thiền" : "Bật thanh âm nhịp phách & chuông đồng"}
                      </h4>
                      <p className="text-xs text-stone-500">
                        Âm thanh gõ phách mộc mạc và chuông ngân 528Hz giúp tĩnh tâm sâu
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-xs px-3 py-1 ${
                      isPlayingChauVanAudio ? "border-amber-500 text-amber-700 bg-amber-500/20 animate-pulse" : "text-stone-500"
                    }`}
                  >
                    {isPlayingChauVanAudio ? "✦ Đang ngân vang" : "Tĩnh lặng"}
                  </Badge>
                </div>
              </div>

              {/* Right Column: Visual Artwork */}
              <div className="lg:col-span-5 relative flex flex-col justify-center">
                <div className="relative overflow-hidden rounded-2xl shadow-md border border-line bg-surface-soft h-72 sm:h-80 lg:h-full min-h-[340px]">
                  <UnverifiedImage
                    src="/images/temple_bac_bo.jpg"
                    alt="Đình làng và không gian thờ Mẫu Bắc Bộ"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-surface/90 text-amber-800 border-amber-400/40 text-xs font-bold px-3 py-1 backdrop-blur-md">
                      ✦ DI SẢN PHI VẬT THỂ UNESCO
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Trình Diễn & Thưởng Thức Văn Ca Cổ Truyền */}
            <section className="p-6 sm:p-8 rounded-2xl border border-line bg-surface/95 shadow-xs">
              <p className="mb-5 text-xs text-muted leading-relaxed italic flex items-center gap-1.5 opacity-85">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Lời văn và nhịp phách được tuyển lựa nhằm gợi mở thanh âm chốn đền phủ linh thiêng, giúp người thưởng thức lắng lòng tĩnh tại.</span>
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-line">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400 block mb-1">
                    BÀI BẢN VĂN CA KINH ĐIỂN
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
                    Lắng đọng qua từng áng văn cổ
                  </h3>
                </div>

                {/* Tab chọn bài văn */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {CHAU_VAN_VERSES.map((v, i) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveVerseIndex(i)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                        activeVerseIndex === i
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-surface-soft text-stone-600 hover:bg-amber-500/10"
                      }`}
                    >
                      {v.deity.replace("Văn ", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Active Verse */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex items-center gap-2.5">
                    <Music className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                    <h4 className="font-display text-lg sm:text-xl font-bold text-ink">
                      {activeVerse.deity}
                    </h4>
                    <Badge variant="outline" className="text-xs border-amber-400/30 text-amber-800 bg-amber-500/10">
                      {activeVerse.tempo}
                    </Badge>
                  </div>

                  {/* Khung lời văn ca cổ truyền */}
                  <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 font-display space-y-2 text-base sm:text-lg text-ink leading-relaxed">
                    {activeVerse.lyrics.map((line, idx) => (
                      <p key={idx} className="italic hover:text-amber-800 transition-colors">
                        {line}
                      </p>
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    <strong>Ý nghĩa tâm linh:</strong> {activeVerse.meaning}
                  </p>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <Card className="p-5 rounded-xl border border-line bg-surface-soft/60 space-y-3">
                    <h5 className="font-display text-sm font-bold text-ink">
                      Căn cốt của một buổi hầu văn
                    </h5>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Một canh đàn gồm các cung văn kỳ cựu tấu đàn nguyệt, gõ phách tre, trống con, cảnh đồng.
                      Lời văn ca ngợi công đức thánh thần, nhắc nhở con người nhớ về nguồn cội núi sông.
                    </p>
                    <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs text-amber-800 font-semibold">
                      <span>✦ Đạo Mẫu Tam Phủ</span>
                      <span>✦ Đàn Nguyệt Cổ</span>
                    </div>
                  </Card>

                </div>
              </div>

              {/* 3D Shrine Canvas - Hiển thị trực tiếp */}
              <div className="mt-8 pt-6 border-t border-line space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400 block mb-0.5">
                      KHÔNG GIAN LINH KHÍ 3D TRỰC QUAN
                    </span>
                    <h4 className="font-display text-lg sm:text-xl font-bold text-ink flex items-center gap-2">
                      <Flame className="w-5 h-5 text-amber-600 animate-pulse" />
                      <span>Phủ Điện Linh Thiêng & Dâng Hương Trầm</span>
                    </h4>
                  </div>
                  
                </div>

                <SceneErrorBoundary onClose={() => {}}>
                  <Suspense fallback={<div className="h-96 rounded-2xl bg-[#110a06] flex items-center justify-center text-xs text-stone-400">Đang khởi tạo không gian Phủ Điện 3D...</div>}>
                    <NorthernShrineScene />
                  </Suspense>
                </SceneErrorBoundary>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ================= 2. TRẢI NGHIỆM LỜI CẦU BÌNH AN RA BIỂN ================ */}
        {/* ========================================================================= */}
        {activeKind === "sea-prayer" && (
          <div className="space-y-12">
            {/* Hero Magazine Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-rose-800 dark:text-rose-400">
                      TÍN NGƯỠNG CẦU NGƯ & BIỂN NHỚ
                    </span>
                    <span className="text-xs text-stone-500">·</span>
                    <span className="text-xs text-stone-500">Trung Bộ</span>
                  </div>

                  <h1
                    tabIndex={-1}
                    className="page-title font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink outline-none border-0 leading-tight"
                  >
                    Gửi lời cầu bình an ra biển
                  </h1>

                  <p className="font-display text-base sm:text-lg text-rose-800 dark:text-rose-400 font-medium leading-relaxed">
                    Một khoảng dừng lấy cảm hứng từ đời sống vạn chài miền Trung duyên hải
                  </p>

                  <div className="p-4 rounded-xl border-l-2 border-rose-600 bg-rose-500/5 dark:bg-rose-500/10 border border-line/60">
                    <p className="font-display italic text-xs sm:text-sm text-ink leading-relaxed">
                      “Biển rộng trời cao ơn trời bể — Sóng yên gió lặng khách bình an.”
                    </p>
                  </div>

                  <p className="text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed">
                    Người miền duyên hải gánh hai đầu đất nước, sinh mệnh gắn liền với ngọn sóng ngọn gió.
                    Tín ngưỡng thờ Cá Ông (Nam Hải Đại Tướng Quân) và Lễ hội Cầu Ngư là nơi con người thể hiện
                    lòng biết ơn biển mẹ, gửi gắm lời cầu chúc thuận buồm xuôi gió cho những chuyến ra khơi.
                  </p>
                </div>

                {/* Ocean Sound Controls */}
                <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleSeaSound}
                      className="w-12 h-12 rounded-xl bg-gradient-to-r from-rose-800 to-rose-700 text-white flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer"
                    >
                      {isPlayingSeaSound ? <VolumeX className="w-5 h-5" /> : <Waves className="w-5 h-5" />}
                    </button>
                    <div>
                      <h4 className="font-display text-sm font-bold text-ink">
                        {isPlayingSeaSound ? "Đang lắng nghe tiếng sóng biển vỗ rì rào" : "Bật thanh âm sóng biển thư thái"}
                      </h4>
                      <p className="text-xs text-stone-500">
                        Âm hưởng tiếng sóng vỗ bờ cát giúp xoa dịu âu lo, mở rộng tâm hồn
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-xs px-3 py-1 ${
                      isPlayingSeaSound ? "border-rose-500 text-rose-700 bg-rose-500/20 animate-pulse" : "text-stone-500"
                    }`}
                  >
                    {isPlayingSeaSound ? "✦ Sóng biển đang dâng" : "Tĩnh lặng"}
                  </Badge>
                </div>
              </div>

              {/* Right Column: Visual Artwork */}
              <div className="lg:col-span-5 relative flex flex-col justify-center">
                <div className="relative overflow-hidden rounded-2xl shadow-md border border-line bg-surface-soft h-72 sm:h-80 lg:h-full min-h-[340px]">
                  <UnverifiedImage
                    src="/images/hue_trung_bo.jpg"
                    alt="Biển miền Trung và lăng tẩm Cố đô"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-surface/90 text-rose-800 border-rose-400/40 text-xs font-bold px-3 py-1 backdrop-blur-md">
                      ✦ LỄ CẦU NGƯ DUYÊN HẢI
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Nghi thức Tương Tác: Thả Lời Cầu Bình An Ra Biển */}
            <section className="p-6 sm:p-8 rounded-2xl border border-line bg-surface/95 shadow-xs">
              <div className="max-w-3xl mx-auto text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-rose-800 dark:text-rose-400 block mb-1">
                  NGHI THỨC TÂM NIỆM TRỰC TUYẾN
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-2">
                  Thả một lời chúc lành vào lòng biển mẹ
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  Chọn một đối tượng bạn muốn gửi gắm lời cầu bình an, viết đôi dòng chân thành
                  và thả ngọn nến nguyện ước trôi êm đềm trên làn sóng xanh.
                </p>
              </div>

              {/* 3 Lựa chọn đối tượng cầu nguyện */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {SEA_PRAYER_INTENTS.map((intent) => {
                  const Icon = intent.icon;
                  const isSelected = selectedSeaIntent === intent.id;
                  return (
                    <div
                      key={intent.id}
                      onClick={() => setSelectedSeaIntent(intent.id)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "bg-rose-500/10 border-rose-500/60 ring-1 ring-rose-500/30"
                          : "bg-surface-soft hover:bg-surface border-line"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-rose-700" : "text-stone-400"}`} />
                        <h4 className="font-display text-sm font-bold text-ink">
                          {intent.title}
                        </h4>
                      </div>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        {intent.tagline}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Form viết lời cầu */}
              {!hasOfferedSeaPrayer ? (
                <div className="max-w-2xl mx-auto space-y-4">
                  <Textarea
                    value={seaPrayerWish}
                    onChange={(e) => setSeaPrayerWish(e.target.value)}
                    placeholder="Viết lời chúc lành, lời cầu mong bình an cho người thân, cho chuyến đi, hoặc cho chính mình…"
                    className="min-h-28 rounded-xl border-line text-sm"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500 italic">
                      * Lời cầu nguyện sẽ được lưu vào sổ nhật ký chiêm nghiệm của bạn
                    </span>
                    <Button
                      type="button"
                      disabled={!seaPrayerWish.trim()}
                      onClick={handleOfferSeaPrayer}
                      className="min-h-11 px-6 rounded-xl bg-gradient-to-r from-rose-800 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-semibold cursor-pointer gap-2 shadow-md"
                    >
                      <Send className="w-4 h-4" />
                      <span>Thả lời cầu ra biển</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="max-w-xl mx-auto p-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-center space-y-4 animate-fade-in">
                  <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 flex items-center justify-center text-rose-700">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-display text-lg font-bold text-ink">
                      Lời nguyện ước đã hòa vào biển khơi bao la
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-600 mt-1 italic">
                      “{seaPrayerWish}”
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setHasOfferedSeaPrayer(false);
                      setSeaPrayerWish("");
                    }}
                    className="text-xs rounded-xl"
                  >
                    Gửi thêm một lời chúc lành khác
                  </Button>
                </div>
              )}

              {/* 3D Central Sea Scene - Hiển thị trực tiếp */}
              <div className="mt-8 pt-6 border-t border-line space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-rose-800 dark:text-rose-400 block mb-0.5">
                      KHÔNG GIAN BIỂN 3D TRỰC QUAN
                    </span>
                    <h4 className="font-display text-lg sm:text-xl font-bold text-ink flex items-center gap-2">
                      <Waves className="w-5 h-5 text-rose-600 animate-pulse" />
                      <span>Biển Khơi Duyên Hải & Thuyền Nan Vượt Sóng</span>
                    </h4>
                  </div>
                </div>

                <SceneErrorBoundary onClose={() => {}}>
                  <Suspense fallback={<div className="h-96 rounded-2xl bg-[#0a2333] flex items-center justify-center text-xs text-stone-400">Đang khởi tạo không gian biển 3D...</div>}>
                    <CentralSeaScene />
                  </Suspense>
                </SceneErrorBoundary>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ================= 3. TRẢI NGHIỆM SÔNG NƯỚC NAM BỘ ======================= */}
        {/* ========================================================================= */}
        {activeKind === "southern-culture" && (
          <div className="space-y-12">
            {/* Hero Magazine Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
                      PHÙ SA & ÂN TÌNH SÔNG NƯỚC
                    </span>
                    <span className="text-xs text-stone-500">·</span>
                    <span className="text-xs text-stone-500">Nam Bộ</span>
                  </div>

                  <h1
                    tabIndex={-1}
                    className="page-title font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink outline-none border-0 leading-tight"
                  >
                    Dòng sông kể chuyện nhà
                  </h1>

                  <p className="font-display text-base sm:text-lg text-emerald-800 dark:text-emerald-400 font-medium leading-relaxed">
                    Khám phá nếp sống rộng rãi, nghĩa tình của miền sông nước Cửu Long
                  </p>

                  <div className="p-4 rounded-xl border-l-2 border-emerald-600 bg-emerald-500/5 dark:bg-emerald-500/10 border border-line/60">
                    <p className="font-display italic text-xs sm:text-sm text-ink leading-relaxed">
                      “Gió đưa bông sậy về trời — Người thương ở lại trọn đời nhớ ơn.”
                    </p>
                  </div>

                  <p className="text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed">
                    Nếp sống nương theo con nước lớn ròng tạo nên tính cách phóng khoáng, trọng nghĩa khinh tài.
                    Những đêm hội hoa đăng bên bến Ninh Kiều, miếu Bà Chúa Xứ Núi Sam hay mâm cơm đầm ấm miệt vườn
                    chở nặng ân tình sâu sắc của đất phù sa phương Nam bao dung mở cõi.
                  </p>
                </div>

                {/* River Sound & Sensory Controls Bar */}
                <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleSeaSound}
                      className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 text-white flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer"
                    >
                      {isPlayingSeaSound ? <VolumeX className="w-5 h-5" /> : <Waves className="w-5 h-5" />}
                    </button>
                    <div>
                      <h4 className="font-display text-sm font-bold text-ink">
                        {isPlayingSeaSound ? "Đang lắng nghe tiếng sóng nước vỗ mạn thuyền" : "Bật thanh âm sông nước & mái chèo khua"}
                      </h4>
                      <p className="text-xs text-stone-500">
                        Thanh âm sóng nước dập dềnh êm dịu gợi nhớ khúc sông quê thanh bình
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-xs px-3 py-1 ${
                      isPlayingSeaSound ? "border-emerald-500 text-emerald-700 bg-emerald-500/20 animate-pulse" : "text-stone-500"
                    }`}
                  >
                    {isPlayingSeaSound ? "✦ Dòng nước đang trôi" : "Tĩnh lặng"}
                  </Badge>
                </div>
              </div>

              {/* Right Column: Visual Artwork */}
              <div className="lg:col-span-5 relative flex flex-col justify-center">
                <div className="relative overflow-hidden rounded-2xl shadow-md border border-line bg-surface-soft h-72 sm:h-80 lg:h-full min-h-[340px]">
                  <UnverifiedImage
                    src="/images/mekong_nam_bo.jpg"
                    alt="Sông nước miền Tây Nam Bộ"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-surface/90 text-emerald-800 border-emerald-400/40 text-xs font-bold px-3 py-1 backdrop-blur-md">
                      ✦ PHÙ SA MIỆT VƯỜN
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Nét Đẹp Tâm Linh Đất Phương Nam */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400 block mb-1">
                  DẤU ẤN VĂN HÓA ĐẶC SẮC
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-ink mb-1">
                  Ba nốt son tâm linh đất phương Nam
                </h3>
                <p className="text-xs text-stone-500">
                  Sự hòa quyện giữa tín ngưỡng thờ Mẫu, văn hóa sông nước miệt vườn và tình đoàn kết Kinh - Khmer - Hoa
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Card className="p-5 sm:p-6 rounded-2xl border-line bg-surface/95 shadow-xs flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-sm transition-all">
                  <div>
                    <span className="text-3xl block mb-3">🌺</span>
                    <h4 className="font-display text-base font-bold text-ink mb-2">
                      Vía Bà Chúa Xứ Núi Sam
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                      Trung tâm hành hương tâm linh tầm vóc quy tụ hàng triệu người mỗi độ tháng tư âm lịch,
                      thể hiện ước nguyện cầu bình an, may mắn và che chở của Thánh Mẫu.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-line text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    ✦ Di sản Phi vật thể Quốc gia
                  </div>
                </Card>

                <Card className="p-5 sm:p-6 rounded-2xl border-line bg-surface/95 shadow-xs flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-sm transition-all">
                  <div>
                    <span className="text-3xl block mb-3">🛶</span>
                    <h4 className="font-display text-base font-bold text-ink mb-2">
                      Lễ Thả Hoa Đăng Bến Ninh Kiều
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                      Hàng ngàn ngọn hoa đăng lung linh thả trôi theo dòng sông Hậu, gửi gắm lời tạ ơn đất trời
                      ban mùa màng tươi tốt và cầu nguyện cho người thân yêu luôn an hòa.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-line text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    ✦ Văn hóa Sông nước Cần Thơ
                  </div>
                </Card>

                <Card className="p-5 sm:p-6 rounded-2xl border-line bg-surface/95 shadow-xs flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-sm transition-all">
                  <div>
                    <span className="text-3xl block mb-3">🌕</span>
                    <h4 className="font-display text-base font-bold text-ink mb-2">
                      Lễ Hội Cúng Trăng Ok Om Bok
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                      Lễ hội tạ ơn thần Mặt Trăng của đồng bào Khmer Nam Bộ vào rằm tháng mười,
                      dâng cốm dẹp và thả đèn gió, đèn nước thắt chặt tình đoàn kết keo sơn Kinh - Khmer - Hoa.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-line text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    ✦ Giao lưu văn hóa đa dân tộc
                  </div>
                </Card>
              </div>
            </div>

            {/* 3D River Scene Section */}
            <section className="p-6 sm:p-8 rounded-2xl border border-line bg-surface/95 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400 block mb-1">
                    KHÔNG GIAN SÔNG NƯỚC 3D TRỰC QUAN
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
                    Đêm Hội Hoa Đăng Bến Ninh Kiều & Sông Nước Cửu Long
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Quan sát thuyền nan và hoa đăng trôi trên làn nước chở theo tâm nguyện an lành
                  </p>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-line">
                <SceneErrorBoundary onClose={() => {}}>
                  <Suspense fallback={<p className="text-xs text-stone-500 py-10 text-center">Đang tải cảnh sông nước 3D...</p>}>
                    <SouthernRiverScene
                      key={currentUserEmail || "guest"}
                      currentUserEmail={currentUserEmail}
                    />
                  </Suspense>
                </SceneErrorBoundary>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ================= SỔ CHIÊM NGHIỆM VĂN HÓA (ZEN JOURNAL) ================= */}
        {/* ========================================================================= */}
        <section className="mt-14 pt-8 border-t border-line">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <h3 className="font-display text-xl font-bold text-ink">
                  Gợi ý tự soi chiếu
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                Đọc chậm lại, đặt những xao động thường nhật xuống và giữ lại một điều khiến bạn rung động nhất.
                Văn hóa dân gian là tấm gương soi chiếu đạo lý làm người: biết ơn cội nguồn, thương quý xóm giềng và sống hướng thiện.
              </p>
              <div className="p-4 rounded-xl border border-line bg-surface-soft/60 space-y-2 text-xs text-stone-600 dark:text-stone-300">
                {activeKind === "chau-van" ? (
                  <>
                    <p>✦ <strong>Hiếu kính nguồn cội:</strong> Tôn vinh công đức Thánh Mẫu và các bậc tiền nhân hộ quốc an dân.</p>
                    <p>✦ <strong>Thanh lọc tâm hồn:</strong> Nhịp đàn phách gạn lọc âu lo, đưa tâm trí về trạng thái định tĩnh thuần khiết.</p>
                    <p>✦ <strong>Khát vọng hướng thiện:</strong> Cầu mong gia đạo bình an, tai qua nạn khỏi và vạn sự hanh thông.</p>
                  </>
                ) : activeKind === "sea-prayer" ? (
                  <>
                    <p>✦ <strong>Biết ơn biển mẹ:</strong> Tôn kính sự bao dung và nguồn sống vô tận từ biển khơi bao la.</p>
                    <p>✦ <strong>Nghĩa tình đùm bọc:</strong> Gắn kết với tinh thần quật cường của những người con vạn chài bám biển.</p>
                    <p>✦ <strong>Tĩnh tâm vững vàng:</strong> Gửi mọi muộn phiền theo sóng trôi xa, giữ lại sự bình an sâu thẳm.</p>
                  </>
                ) : (
                  <>
                    <p>✦ <strong>Thơm thảo hào sảng:</strong> Nếp sống nghĩa tình, đôn hậu và bao dung của người phương Nam.</p>
                    <p>✦ <strong>Tạ ơn đất trời:</strong> Cảm tạ dòng phù sa nuôi dưỡng mùa màng và xóm làng ấm no.</p>
                    <p>✦ <strong>Ước nguyện thắp sáng:</strong> Ngọn hoa đăng chở theo ước vọng an hòa, may mắn cho muôn nhà.</p>
                  </>
                )}
              </div>
            </div>

            <div className="md:col-span-7">
              <Card className="p-6 rounded-2xl border-line bg-surface/95 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-base font-bold text-ink">
                    Ghi lại cảm nhận & Tâm nguyện
                  </h4>
                  <span className="text-xs text-stone-400">
                    {note.length}/1.000 ký tự
                  </span>
                </div>

                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={1000}
                  placeholder="Một hình ảnh, một câu ca, một điều bạn muốn giữ lại trong lòng hôm nay…"
                  className="min-h-32 rounded-xl text-sm border-line"
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-line/60">
                  <span className="text-[11px] text-stone-500 italic">
                    {noteSavedSuccess ? "✓ Đã lưu cảm nhận an toàn vào phiên này" : "Cảm nhận được lưu riêng theo hồ sơ và vùng văn hóa"}
                  </span>

                  <Button
                    type="button"
                    onClick={handleSaveNote}
                    disabled={!note.trim() || (note.trim() === savedNote && !noteSavedSuccess)}
                    className="w-full sm:w-auto min-h-10 px-5 rounded-xl bg-gradient-to-r from-red-800 via-amber-700 to-amber-900 text-white font-semibold cursor-pointer gap-2"
                  >
                    {noteSavedSuccess ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    <span>{noteSavedSuccess ? "Đã lưu thành công" : "Lưu cảm nhận"}</span>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Khám phá các không gian vùng miền khác */}
        <section className="mt-14 pt-8 border-t border-line">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-accent block mb-1">
                TIẾP NỐI HÀNH TRÌNH
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
                Không gian văn hóa vùng miền khác
              </h3>
            </div>
            <p className="text-xs text-muted max-w-md sm:text-right">
              Mỗi vùng đất là một nốt thăng trầm trong bản hòa ca tín ngưỡng và tâm hồn người Việt
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeKind !== "chau-van" && (
              <Card
                onClick={() => {
                  stopAudioSynthesizer();
                  if (onNavigateRegion) onNavigateRegion("chau-van");
                  else setActiveKind("chau-van");
                }}
                className="p-5 sm:p-6 rounded-2xl border border-line bg-surface hover:border-amber-500/50 hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">⛩️</span>
                    <Badge variant="outline" className="border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                      Bắc Bộ
                    </Badge>
                  </div>
                  <h4 className="font-display text-base sm:text-lg font-bold text-ink mb-1 group-hover:text-accent transition-colors">
                    Nhịp Chầu Văn & Đền Phủ Tam Phủ
                  </h4>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">
                    Thưởng thức thanh âm đàn nguyệt, phách tiền và những áng văn ca kinh điển chốn linh thiêng.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs font-semibold text-accent">
                  <span>Trải nghiệm không gian</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Card>
            )}

            {activeKind !== "sea-prayer" && (
              <Card
                onClick={() => {
                  stopAudioSynthesizer();
                  if (onNavigateRegion) onNavigateRegion("sea-prayer");
                  else setActiveKind("sea-prayer");
                }}
                className="p-5 sm:p-6 rounded-2xl border border-line bg-surface hover:border-rose-500/50 hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">🌊</span>
                    <Badge variant="outline" className="border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                      Trung Bộ
                    </Badge>
                  </div>
                  <h4 className="font-display text-base sm:text-lg font-bold text-ink mb-1 group-hover:text-accent transition-colors">
                    Lời Cầu Bình An Ra Biển & Lễ Cầu Ngư
                  </h4>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">
                    Lắng nghe tiếng sóng vỗ bờ, gửi lời nguyện cầu thuận buồm xuôi gió cùng đạo nghĩa vạn chài.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs font-semibold text-accent">
                  <span>Trải nghiệm không gian</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Card>
            )}

            {activeKind !== "southern-culture" && (
              <Card
                onClick={() => {
                  stopAudioSynthesizer();
                  if (onNavigateRegion) onNavigateRegion("southern-culture");
                  else setActiveKind("southern-culture");
                }}
                className="p-5 sm:p-6 rounded-2xl border border-line bg-surface hover:border-emerald-500/50 hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">🛶</span>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                      Nam Bộ
                    </Badge>
                  </div>
                  <h4 className="font-display text-base sm:text-lg font-bold text-ink mb-1 group-hover:text-accent transition-colors">
                    Sông Nước Nghĩa Tình & Thả Hoa Đăng
                  </h4>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">
                    Chiêm nghiệm nét đẹp hào sảng, thơm thảo và thả ngọn hoa đăng cầu an trên dòng sông Hậu.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs font-semibold text-accent">
                  <span>Trải nghiệm không gian</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Card>
            )}
          </div>
        </section>

        {/* Footnote Philosophy */}
        <Card className="mt-14 p-6 sm:p-8 rounded-2xl border-line bg-surface/90 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block mb-1">
                TÔN KÍNH VĂN HÓA CỘNG ĐỒNG
              </span>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
                Không gian thực hành tâm linh mở ra cơ hội tự soi chiếu và nuôi dưỡng lòng trắc ẩn.
                Mọi thực hành đều tôn trọng nguyên bản di sản và đức tin truyền thống của nhân dân.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="rounded-xl border-line text-ink hover:text-accent font-semibold shrink-0 cursor-pointer self-start sm:self-auto min-h-11 px-5"
          >
            Quay lại chuyên đề vùng
          </Button>
        </Card>
      </main>
    </div>
  );
};

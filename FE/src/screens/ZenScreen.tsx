import React, { useState, useEffect, useRef } from "react";
import { UnverifiedImage } from "../components/UnverifiedImage";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Flame,
  Flower2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Wind,
  Layers,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import "@/src/styles/ZenScreen.css";

const SESSION_SECONDS = 180;

interface ZenScreenProps {
  onBackToExperience: () => void;
  onGoToHome: () => void;
}

export const ZenScreen: React.FC<ZenScreenProps> = ({
  onBackToExperience,
  onGoToHome,
}) => {
  // 3 States: 'ready' | 'active' | 'completed'
  const [zenState, setZenState] = useState<"ready" | "active" | "completed">("ready");

  // Display & Ambient options
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [isLampLit, setIsLampLit] = useState(false);

  // Timer & Breathing Loop (3 minutes = 180 seconds)
  const [secondsRemaining, setSecondsRemaining] =
    useState(SESSION_SECONDS);
  const [sessionSeconds, setSessionSeconds] =
    useState(SESSION_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(
    () => document.visibilityState === "visible"
  );
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");

  const accumulatedTimeRef = useRef(0);
  const sessionVersionRef = useRef(0);

  // Canvas ref for 3D Perspective Scene
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Ambient noise and a synthesized bell tone generated locally with Web Audio.
  const audioContextRef = useRef<AudioContext | null>(null);
  const bellContextRef = useRef<AudioContext | null>(null);
  const bellTimeoutRef = useRef<number | null>(null);
  const bellVersionRef = useRef(0);
  const [bellError, setBellError] = useState<string | null>(null);
  const activeNodesRef = useRef<{ [key: string]: any }>({});

  const startAmbientSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Master gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.08, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // 1. Warm Pink/Brown Noise Generator for gentle natural breeze/stream
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.96 * b1 + white * 0.11;
        b2 = 0.86 * b2 + white * 0.25;
        output[i] = (b0 + b1 + b2) * 0.15;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);
      whiteNoise.start();

      // 2. Soft tones for a quiet ambient bed.
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      const bowlGain1 = ctx.createGain();
      const bowlGain2 = ctx.createGain();
      const bowlGain3 = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(108, ctx.currentTime);
      bowlGain1.gain.setValueAtTime(0.03, ctx.currentTime);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(216.5, ctx.currentTime); // Slight detune for natural vibrato beat
      bowlGain2.gain.setValueAtTime(0.02, ctx.currentTime);

      osc3.type = "sine";
      osc3.frequency.setValueAtTime(432, ctx.currentTime);
      bowlGain3.gain.setValueAtTime(0.008, ctx.currentTime);

      osc1.connect(bowlGain1);
      osc2.connect(bowlGain2);
      osc3.connect(bowlGain3);
      bowlGain1.connect(masterGain);
      bowlGain2.connect(masterGain);
      bowlGain3.connect(masterGain);

      osc1.start();
      osc2.start();
      osc3.start();

      activeNodesRef.current = {
        whiteNoise,
        osc1,
        osc2,
        osc3,
        masterGain,
      };
    } catch {}
  };

  const stopBell = () => {
    bellVersionRef.current += 1;

    if (bellTimeoutRef.current !== null) {
      window.clearTimeout(bellTimeoutRef.current);
      bellTimeoutRef.current = null;
    }

    const context = bellContextRef.current;
    bellContextRef.current = null;

    if (context && context.state !== "closed") {
      void context.close().catch(() => {});
    }
  };

  const handleStrikeBell = async () => {
    if (
      zenState !== "active" ||
      isPaused ||
      document.visibilityState !== "visible"
    ) {
      return;
    }

    stopBell();
    setBellError(null);

    const version = bellVersionRef.current;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as Window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error("Audio unavailable");
      }

      const context = new AudioContextClass();
      bellContextRef.current = context;

      await context.resume();

      // Người dùng có thể rời trang trong lúc trình duyệt mở âm thanh.
      if (
        version !== bellVersionRef.current ||
        context.state !== "running" ||
        document.visibilityState !== "visible"
      ) {
        if (bellContextRef.current === context) {
          stopBell();
        }
        return;
      }

      const now = context.currentTime;
      const gain = context.createGain();

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.035, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
      gain.connect(context.destination);

      [432, 864].forEach((frequency) => {
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        oscillator.start(now);
        oscillator.stop(now + 3.25);
      });

      bellTimeoutRef.current = window.setTimeout(() => {
        if (version === bellVersionRef.current) {
          stopBell();
        }
      }, 3500);
    } catch {
      if (version === bellVersionRef.current) {
        stopBell();
        setBellError(
          "Chưa phát được âm chuông. Bạn có thể thử lại hoặc tiếp tục trong yên lặng."
        );
      }
    }
  };

  useEffect(() => {
    if (
      zenState !== "active" ||
      isPaused ||
      !isPageVisible
    ) {
      stopBell();
    }

    return () => stopBell();
  }, [zenState, isPaused, isPageVisible]);

  const stopAmbientSound = () => {
    try {
      if (activeNodesRef.current.osc1) activeNodesRef.current.osc1.stop();
      if (activeNodesRef.current.osc2) activeNodesRef.current.osc2.stop();
      if (activeNodesRef.current.osc3) activeNodesRef.current.osc3.stop();
      if (activeNodesRef.current.whiteNoise) activeNodesRef.current.whiteNoise.stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    } catch {}
    activeNodesRef.current = {};
    audioContextRef.current = null;
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible =
        document.visibilityState === "visible";

      setIsPageVisible(visible);

      if (!visible) {
        setIsPaused(true);
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  useEffect(() => {
    if (
      soundEnabled &&
      zenState === "active" &&
      !isPaused &&
      isPageVisible
    ) {
      startAmbientSound();
    } else {
      stopAmbientSound();
    }
    return () => stopAmbientSound();
  }, [soundEnabled, zenState, isPaused, isPageVisible]);

  // Timer interval & Breathing Cycle
  useEffect(() => {
    if (
      zenState !== "active" ||
      isPaused ||
      !isPageVisible
    ) {
      return;
    }

    const version = sessionVersionRef.current;
    const startedAt = performance.now();
    const previousTime = accumulatedTimeRef.current;

    const updateTimer = () => {
      const elapsedMs =
        previousTime + performance.now() - startedAt;

      const remaining = Math.max(
        0,
        sessionSeconds - Math.floor(elapsedMs / 1000)
      );

      setSecondsRemaining(remaining);

      const cycleSecond =
        Math.floor(elapsedMs / 1000) % 19;

      setBreathPhase(
        cycleSecond < 4
          ? "inhale"
          : cycleSecond < 11
            ? "hold"
            : "exhale"
      );

      if (remaining === 0) {
        setZenState("completed");
      }
    };

    updateTimer();

    const timer = window.setInterval(updateTimer, 250);

    return () => {
      window.clearInterval(timer);

      if (sessionVersionRef.current === version) {
        accumulatedTimeRef.current = Math.min(
          sessionSeconds * 1000,
          previousTime + performance.now() - startedAt
        );
      }
    };
  }, [zenState, isPaused, isPageVisible, sessionSeconds]);

  // Canvas Floating Particles Engine (Light golden particles dancing in transparent atmosphere)
  useEffect(() => {
    if (!isPageVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const width = (canvas.width = canvas.offsetWidth || 800);
    const height = (canvas.height = canvas.offsetHeight || 450);

    // Generate floating golden spiritual particles
    const particleCount = reducedMotion ? 25 : 60;
    const particles = Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * 600,
      y: (Math.random() - 0.5) * 400,
      z: Math.random() * 800 + 100,
      speedZ: Math.random() * 0.7 + 0.25,
      radius: Math.random() * 2 + 1.2,
      opacity: Math.random() * 0.7 + 0.3,
    }));

    let angle = 0;

    const render = () => {
      // Clear transparently so landscape photo behind remains crystal clear
      ctx.clearRect(0, 0, width, height);

      const fov = 350;
      const centerX = width / 2;
      const centerY = height / 2;

      // Draw 3D rotating lotus / meditation platform
      if (!reducedMotion && !isPaused) {
        angle += 0.008;
      }
      const pulse =
        breathPhase === "inhale"
          ? 1.08
          : breathPhase === "hold"
          ? 1.05
          : 0.96;

      ctx.save();
      ctx.translate(centerX, centerY + 20);

      // Concentric 3D elliptical rings
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.ellipse(0, 40, (110 - r * 15) * pulse, (35 - r * 5) * pulse, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(216, 132, 118, ${0.15 + r * 0.1})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Golden Lantern / Singing Bowl Center Glow
      if (isLampLit) {
        const glow = ctx.createRadialGradient(0, -10, 2, 0, -10, 80);
        glow.addColorStop(0, "rgba(251, 191, 36, 0.6)");
        glow.addColorStop(0.5, "rgba(245, 158, 11, 0.2)");
        glow.addColorStop(1, "rgba(245, 158, 11, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, -10, 80, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Render 3D Perspective Particles
      particles.forEach((p) => {
        if (!reducedMotion && !isPaused) {
          p.z -= p.speedZ;
        }
        if (p.z <= 10) {
          p.z = 800;
          p.x = (Math.random() - 0.5) * 600;
          p.y = (Math.random() - 0.5) * 400;
        }

        const scale = fov / (fov + p.z);
        const projX = centerX + p.x * scale;
        const projY = centerY + p.y * scale;
        const projRadius = p.radius * scale * (isLampLit ? 1.3 : 1);

        if (projX >= 0 && projX <= width && projY >= 0 && projY <= height) {
          ctx.beginPath();
          ctx.arc(projX, projY, Math.max(0.5, projRadius), 0, Math.PI * 2);
          ctx.fillStyle = isLampLit
            ? `rgba(251, 191, 36, ${p.opacity * scale})`
            : `rgba(235, 214, 197, ${p.opacity * scale * 0.75})`;
          ctx.fill();
        }
      });

      if (!reducedMotion && !isPaused) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [
    breathPhase,
    isLampLit,
    reducedMotion,
    isPaused,
    isPageVisible,
  ]);

  const handleStartZen = () => {
    sessionVersionRef.current += 1;
    accumulatedTimeRef.current = 0;

    setSecondsRemaining(sessionSeconds);
    setBreathPhase("inhale");
    setIsPaused(false);
    setZenState("active");
  };

  const handleReset = () => {
    sessionVersionRef.current += 1;
    accumulatedTimeRef.current = 0;

    setSecondsRemaining(sessionSeconds);
    setBreathPhase("inhale");
    setIsPaused(false);
    setZenState("ready");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const elapsedSeconds =
    sessionSeconds - secondsRemaining;

  const completedFullSession = secondsRemaining === 0;

  return (
    <div className="screen-shell">
      <main className="page-container max-w-6xl">
        {/* Top Breadcrumb & Tag */}
        {/* Top Breadcrumb & Step Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 text-xs text-muted">
          <nav
            aria-label="Đường dẫn"
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={onBackToExperience}
              className="hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              Trải nghiệm
            </button>

            <span aria-hidden="true">/</span>

            <span
              aria-current="page"
              className="font-semibold text-accent"
            >
              Không gian tĩnh tâm
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-line text-xs font-semibold uppercase tracking-wider text-muted shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              <span>Khoảng lặng an trú</span>
            </div>
          </div>
        </div>

        {/* Header Title Section */}
        <div className="mb-3.5">
          <h1 tabIndex={-1} className="zen-page-title mb-1.5 outline-none focus:outline-none flex items-center gap-2 text-2xl sm:text-3xl text-ink font-display">
            <span className="zen-seal-badge" aria-hidden="true">靜</span>
            <span>Một khoảng nghỉ ba phút</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-2xl">
            Một khoảng lặng tương tác tượng trưng lấy cảm hứng từ mỹ thuật và kiến trúc dân
            gian mộc mạc của hiên nhà Việt. Dành cho bạn vài phút buông xả căng thẳng, chú tâm
            vào hơi thở mà không vướng bận lễ nghi.
          </p>
        </div>

        {/* Interactive Controls Bar */}
        <div className="px-3.5 py-2 rounded-full bg-surface/70 border border-line/70 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-ink">Không gian:</span>
            <span>Hiên chùa ven hồ mộc mạc • Tĩnh tâm chánh niệm</span>
          </div>

          {/* Sound & Motion toggles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-pressed={soundEnabled}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`zen-pill-btn ${
                soundEnabled ? "zen-pill-btn--active" : ""
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-200" />
                  <span>Âm nền: Bật</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-muted" />
                  <span>Âm nền: Tắt</span>
                </>
              )}
            </button>

            <button
              type="button"
              aria-pressed={reducedMotion}
              onClick={() => setReducedMotion(!reducedMotion)}
              className="zen-pill-btn"
            >
              <Wind className="w-3.5 h-3.5 text-accent" />
              <span>Chuyển động: {reducedMotion ? "Tối thiểu" : "Mặc định"}</span>
            </button>
          </div>
        </div>

        {/* 16:9 Cinematic Canvas Scene */}
        <div className="relative h-[480px] sm:h-[510px] lg:h-[520px] w-full rounded-card overflow-hidden border border-line shadow-md bg-stone-950 mb-8 select-none">
          {/* Bức ảnh hiên chùa Bắc Bộ luôn luôn hiện rõ ràng, sắc nét */}
          <UnverifiedImage
            src="/images/temple_bac_bo.jpg"
            alt="Hiên nhà Việt tĩnh lặng"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
              isLampLit
                ? "brightness-105 saturate-110 contrast-105"
                : zenState === "active"
                ? "scale-105 filter blur-[1px] brightness-85"
                : "brightness-95"
            }`}
          />

          {/* Lớp phủ chuyển sắc dịu nhẹ */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/35 pointer-events-none" />

          {/* Hiệu ứng Hào quang đèn hoa đăng khi được thắp */}
          {isLampLit && (
            <div className="zen-lamp-glow-overlay" />
          )}

          {/* Canvas hạt bụi vàng / đom đóm thiền định bay lơ lửng trên nền trong suốt */}
          <canvas
            ref={canvasRef}
            className="w-full h-full block absolute inset-0 z-2 pointer-events-none"
          />

          {/* Ngọn đèn hoa đăng góc dưới khi thắp sáng */}
          {isLampLit && (
            <div className="zen-floating-lantern" aria-label="Ngọn đèn hoa đăng thắp sáng">
              <div className="w-8 h-8 rounded-full bg-amber-400/30 blur-md absolute -top-1" />
              <span className="text-2xl filter drop-shadow">🪔</span>
              <span className="text-[10px] font-semibold text-amber-200 bg-black/60 px-2 py-0.5 rounded-full border border-amber-400/40 mt-1">
                Tâm đăng chiếu rạng
              </span>
            </div>
          )}

          {/* Top-Right: Light Oil Lamp Button */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setIsLampLit(!isLampLit)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                isLampLit
                  ? "bg-amber-500 text-white border-amber-300 shadow-amber-500/40 ring-2 ring-amber-400/40"
                  : "bg-black/60 text-white/90 border-white/20 hover:bg-black/80 hover:border-amber-400/50"
              }`}
            >
              <Flame
                className={`w-3.5 h-3.5 ${
                  isLampLit ? "text-amber-200 animate-pulse fill-current" : "text-amber-400"
                }`}
              />
              <span>{isLampLit ? "Ngọn đèn đang sáng rạng 🕯️" : "Thắp ánh sáng biểu tượng 🕯️"}</span>
            </button>
          </div>

          {/* Center Interactive Modal based on zenState */}
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
            {/* ================= STATE 1: READY ================= */}
            {zenState === "ready" && (
              <div className="zen-state-card max-w-md w-full relative">
                <div className="w-12 h-12 rounded-full bg-amber-400/15 border border-amber-300/30 mx-auto mb-3 flex items-center justify-center text-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.2)]">
                  <Flower2 className="w-6 h-6" />
                </div>

                <div className="text-xs uppercase font-bold tracking-widest text-amber-300 mb-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  KHOẢNG KHẮC AN TRÚ
                </div>

                <h2 className="section-title text-xl sm:text-2xl mb-3 font-display font-bold text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
                  Bạn đã sẵn sàng cho {sessionSeconds / 60} phút an trú?
                </h2>

                <p className="text-sm text-stone-200 leading-relaxed mb-6 font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                  Thả lỏng đôi vai, nới lỏng cơ mặt và để nhịp thở diễn ra tự nhiên. Hãy cho phép
                  bản thân tạm gác lại mọi âu lo.
                </p>

                <fieldset className="mb-5">
                  <legend className="mb-2 text-sm text-stone-200">
                    Chọn thời lượng
                  </legend>

                  <div className="flex justify-center gap-2">
                    {[60, 180, 300].map((seconds) => (
                      <label
                        key={seconds}
                        className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm ${
                          sessionSeconds === seconds
                            ? "border-amber-300 bg-amber-400/20 text-white"
                            : "border-white/20 bg-white/5 text-stone-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="zen-duration"
                          value={seconds}
                          checked={sessionSeconds === seconds}
                          onChange={() => {
                            setSessionSeconds(seconds);
                            setSecondsRemaining(seconds);
                          }}
                          className="accent-amber-300"
                        />
                        {seconds / 60} phút
                      </label>
                    ))}
                  </div>
                </fieldset>

                <button
                  type="button"
                  onClick={handleStartZen}
                  className="zen-action-btn w-full text-sm font-semibold"
                >
                  <span className="zen-btn-sheen" />
                  <span>Bắt đầu {sessionSeconds / 60} phút tĩnh tâm</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}

            {/* ================= STATE 2: ACTIVE (BREATHING & COUNTDOWN) ================= */}
            {zenState === "active" && (
              <div className="zen-active-card max-w-md w-full relative">
                {/* Breathing Ring Visualizer */}
                <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center">
                  <div
                    className={`absolute inset-0 rounded-full border-2 transition-all duration-1000 ${
                      breathPhase === "inhale"
                        ? "zen-breath-ring-inhale scale-110"
                        : breathPhase === "hold"
                        ? "zen-breath-ring-hold scale-105"
                        : "zen-breath-ring-exhale scale-95"
                    }`}
                  />
                  <div className="text-center z-10">
                    <div className="font-sans tabular-nums text-2xl font-bold tracking-tight text-white mb-0.5">
                      {formatTime(secondsRemaining)}
                    </div>
                    <div className="text-xs text-white/60">
                      / {formatTime(sessionSeconds)}
                    </div>
                  </div>
                </div>

                {/* Breathing Text Guide */}
                <div className="mb-6">
                  <div className="text-base sm:text-lg font-display font-bold text-on-inverse mb-1">
                    {isPaused
                      ? "Phiên đang tạm dừng"
                      : breathPhase === "inhale"
                        ? "Hít vào nhẹ nhàng..."
                        : breathPhase === "hold"
                          ? "Một khoảng dừng..."
                          : "Thở ra nhẹ nhàng..."}
                  </div>
                  <p className="text-sm text-white/70 italic">
                    {isPaused
                      ? "Bấm tiếp tục khi bạn muốn trở lại."
                      : "Bạn có thể theo nhịp gợi ý hoặc thở theo nhịp tự nhiên của mình."}
                  </p>
                </div>

                {/* Active Controls */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={isPaused || !isPageVisible}
                    onClick={() => void handleStrikeBell()}
                    className="min-h-11 px-4 py-2.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-xs font-semibold text-amber-100 backdrop-blur-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Gõ chuông âm tổng hợp"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Gõ chuông tổng hợp</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={isPaused}
                    onClick={() => setIsPaused(!isPaused)}
                    className="min-h-11 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white backdrop-blur-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? "Tiếp tục" : "Tạm dừng"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setZenState("completed")}
                    className="min-h-11 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white/80 hover:text-white backdrop-blur-xs transition-all cursor-pointer"
                  >
                    Kết thúc sớm
                  </button>
                </div>

                {bellError && (
                  <p role="status" className="mt-3 text-sm text-amber-200">
                    {bellError}
                  </p>
                )}
              </div>
            )}

            {/* ================= STATE 3: COMPLETED ================= */}
            {zenState === "completed" && (
              <div className="zen-state-card max-w-md w-full relative">
                <div className="w-14 h-14 rounded-full bg-amber-400/15 border border-amber-300/30 mx-auto mb-3 flex items-center justify-center text-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.2)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="text-xs uppercase font-bold tracking-widest text-amber-300 mb-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  PHIÊN THIỀN ĐÃ KẾT THÚC
                </div>

                <h2 className="section-title text-xl sm:text-2xl mb-2.5 font-display font-bold text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
                  {completedFullSession
                    ? `Bạn đã dành ${sessionSeconds / 60} phút cho mình`
                    : "Bạn đã kết thúc phiên"}
                </h2>

                <p className="text-sm text-stone-200 leading-relaxed mb-6 font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                  Bạn đã dành {formatTime(elapsedSeconds)} cho phiên này.
                  <br className="hidden sm:inline" /> Bạn có thể trở về ngày của mình hoặc bắt đầu một phiên mới.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={onGoToHome}
                    className="zen-action-btn w-full sm:w-auto text-xs px-5 py-2.5 font-semibold"
                  >
                    <span className="zen-btn-sheen" />
                    <span>Trở về Hôm nay</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold gap-1.5 border-amber-400/40 text-amber-100 hover:bg-white/10 hover:text-white bg-black/30 backdrop-blur-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Chuẩn bị phiên mới</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3 Mindful Living Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 rounded-card bg-surface border border-line shadow-2xs">
            <div className="w-10 h-10 rounded-panel bg-surface text-accent flex items-center justify-center mb-4">
              <Flower2 className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-ink mb-2">
              01. Thả lỏng thân thể
            </h3>
            <p className="text-sm text-ink leading-relaxed">
              Ngồi thẳng lưng tự nhiên, thả lỏng bờ vai và khớp hàm. Để trọng lực nâng đỡ thân thể
              mà không gồng cứng hay tạo áp lực.
            </p>
          </Card>

          <Card className="p-6 rounded-card bg-surface border border-line shadow-2xs">
            <div className="w-10 h-10 rounded-panel bg-surface text-accent flex items-center justify-center mb-4">
              <Wind className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-ink mb-2">
              02. Nhận diện hơi thở
            </h3>
            <p className="text-sm text-ink leading-relaxed">
              Chỉ đơn giản nhận biết hơi thở vào và hơi thở ra. Khi tâm trí đi lang thang, nhẹ
              nhàng mỉm cười và đưa sự chú ý trở về luồng dưỡng khí.
            </p>
          </Card>

          <Card className="p-6 rounded-card bg-surface border border-line shadow-2xs">
            <div className="w-10 h-10 rounded-panel bg-surface text-accent flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-ink mb-2">
              03. Nuôi dưỡng an tĩnh
            </h3>
            <p className="text-sm text-ink leading-relaxed">
              Sự an định không đến từ việc cưỡng ép tâm trí ngừng suy nghĩ, mà đến từ sự chấp
              nhận bao dung trước mọi trạng thái đang hiện diện.
            </p>
          </Card>
        </div>

        {/* Bottom Pledge Banner */}
        <Card className="p-6 rounded-card bg-surface/70 border border-line mb-12 shadow-2xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-panel bg-surface border border-line flex items-center justify-center text-accent shrink-0 mt-0.5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-accent mb-1.5">
                NGUYÊN TẮC KHÔNG GIAN TĨNH TÂM & MINH BẠCH VĂN HÓA
              </div>
              <p className="text-sm text-ink leading-relaxed max-w-4xl">
                Đây là không gian thực hành ngắn với hình ảnh lấy cảm hứng
                từ văn hóa Việt. Bạn có thể bật hoặc tắt âm thanh,
                tạm dừng và kết thúc bất cứ lúc nào.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

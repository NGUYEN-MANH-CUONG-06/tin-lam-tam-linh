import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Compass,
  Pencil,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { AppDialog } from "../components/AppDialog";
import {
  DEMO_ASTROLOGY_PALACES,
  DEMO_ASTROLOGY_TABS,
  getDemoAstrologyChart,
  loadDemoAstrologyCharts,
  resetDemoAstrologyCharts,
  saveDemoAstrologyChart,
  selectDemoAstrologyPalace,
  validateDemoAstrologyInput,
  type DemoAstrologyChart,
  type DemoAstrologyInput,
  type DemoAstrologyPalace,
} from "../data/demoAstrology";
import { DemoAstrologyTabPanel, type DemoAstrologyTabSelection } from "../components/DemoAstrologyTabPanel";

const timeOptions = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);

function getCanChiHourLabel(time: string): string {
  const hour = Number.parseInt(time.slice(0, 2), 10);
  if (Number.isNaN(hour)) return time;
  let canChi = "";
  if (hour === 23 || hour === 0) canChi = "Giờ Tý (23h–01h)";
  else if (hour === 1 || hour === 2) canChi = "Giờ Sửu (01h–03h)";
  else if (hour === 3 || hour === 4) canChi = "Giờ Dần (03h–05h)";
  else if (hour === 5 || hour === 6) canChi = "Giờ Mão (05h–07h)";
  else if (hour === 7 || hour === 8) canChi = "Giờ Thìn (07h–09h)";
  else if (hour === 9 || hour === 10) canChi = "Giờ Tỵ (09h–11h)";
  else if (hour === 11 || hour === 12) canChi = "Giờ Ngọ (11h–13h)";
  else if (hour === 13 || hour === 14) canChi = "Giờ Mùi (13h–15h)";
  else if (hour === 15 || hour === 16) canChi = "Giờ Thân (15h–17h)";
  else if (hour === 17 || hour === 18) canChi = "Giờ Dậu (17h–19h)";
  else if (hour === 19 || hour === 20) canChi = "Giờ Tuất (19h–21h)";
  else if (hour === 21 || hour === 22) canChi = "Giờ Hợi (21h–23h)";
  return `${time} · ${canChi}`;
}

function emptyInput(): DemoAstrologyInput {
  return { fullName: "", gender: "Nam", birthDate: "", birthTime: "", targetYear: new Date().getFullYear() };
}

export function DemoAstrologyScreen({ onBackToExperience }: { onBackToExperience: () => void }) {
  const [input, setInput] = useState<DemoAstrologyInput>(emptyInput);
  const [chart, setChart] = useState<DemoAstrologyChart | null>(null);
  const [savedCharts, setSavedCharts] = useState(loadDemoAstrologyCharts);
  const [selectedPalaceId, setSelectedPalaceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<typeof DEMO_ASTROLOGY_TABS[number]>(DEMO_ASTROLOGY_TABS[0]);
  const [tabSelection, setTabSelection] = useState<DemoAstrologyTabSelection>(() => ({
    palaceId: null, dashaId: "dasha-1", minorYear: new Date().getFullYear(),
    monthId: "month-1", day: new Date().toISOString().slice(0, 10), themeId: "theme-self",
  }));
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  const selectedPalace = useMemo(() => selectDemoAstrologyPalace(selectedPalaceId), [selectedPalaceId]);

  const updateTabSelection = <K extends keyof DemoAstrologyTabSelection>(key: K, value: DemoAstrologyTabSelection[K]) => {
    setTabSelection((current) => ({ ...current, [key]: value }));
  };
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % DEMO_ASTROLOGY_TABS.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + DEMO_ASTROLOGY_TABS.length) % DEMO_ASTROLOGY_TABS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = DEMO_ASTROLOGY_TABS.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    setActiveTab(DEMO_ASTROLOGY_TABS[nextIndex]);
    tabRefs.current[nextIndex]?.focus();
  };

  const updateInput = (field: keyof DemoAstrologyInput, value: string) => {
    setInput((current) => ({ ...current, [field]: field === "targetYear" ? Number(value) : value }));
    setErrors([]);
  };

  const buildChart = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateDemoAstrologyInput(input);
    setErrors(nextErrors);
    if (nextErrors.length) return;
    const now = new Date().toISOString();
    setChart((current) => ({
      id: current?.id ?? `preview-${crypto.randomUUID()}`,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
      input: { ...input, fullName: input.fullName.trim() },
      fixtureVersion: "minh-hoa-01",
    }));
    setInput((current) => ({ ...current, fullName: current.fullName.trim() }));
    updateTabSelection("minorYear", input.targetYear);
    setEditing(false);
    setSelectedPalaceId(null);
    setNotice("Đã khởi tạo thiên bàn 12 cung. Bạn có thể chọn từng cung để khám phá triết lý di sản.");
  };

  const saveChart = () => {
    if (!chart) return;
    try {
      const saved = saveDemoAstrologyChart(input, chart.id.startsWith("preview-") ? undefined : chart.id);
      setChart(saved);
      setSavedCharts(loadDemoAstrologyCharts());
      setNotice("Đã lưu giữ thiên bàn vào danh sách trên thiết bị của bạn.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Chưa lưu được lá số.");
    }
  };

  const openSavedChart = (id: string) => {
    const saved = getDemoAstrologyChart(id);
    if (!saved) return;
    setChart(saved);
    setInput(saved.input);
    setSelectedPalaceId(null);
    updateTabSelection("minorYear", saved.input.targetYear);
    setEditing(false);
    setErrors([]);
    setNotice(`Đang xem thiên bàn đã lưu ngày ${new Date(saved.updatedAt).toLocaleDateString("vi-VN")}.`);
  };

  const startNewChart = () => {
    setChart(null);
    setInput(emptyInput());
    setSelectedPalaceId(null);
    setEditing(false);
    setErrors([]);
    setNotice("");
  };

  const resetAstrologyDemo = () => {
    resetDemoAstrologyCharts();
    setSavedCharts([]);
    setChart(null);
    setInput(emptyInput());
    setSelectedPalaceId(null);
    setEditing(false);
    setResetOpen(false);
    setNotice("Đã dọn dẹp các lá số đã lưu trên thiết bị. Các dữ liệu khác vẫn được giữ nguyên vẹn.");
  };

  return (
    <div className="screen-shell">
      <main className="page-container max-w-7xl">
        <button type="button" onClick={onBackToExperience} className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Về Trải nghiệm
        </button>

        <header className="relative mb-6 overflow-hidden rounded-card border border-gold/40 bg-surface px-6 py-6 shadow-card sm:px-8 sm:py-8">
          {/* Decorative celestial background rings */}
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-gold/25 opacity-70" />
          <div className="pointer-events-none absolute -right-10 -top-14 h-52 w-52 rounded-full border border-dashed border-gold/30 opacity-60" />
          <div className="pointer-events-none absolute -bottom-16 right-16 h-40 w-40 rounded-full border border-gold/15 opacity-50" />
          <div className="pointer-events-none absolute -right-4 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-gold/5 blur-2xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
                <Compass className="h-4 w-4 text-gold" aria-hidden="true" />
                Di sản Phương Đông · Triết lý Thiên Địa Nhân
              </p>
              <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                Lá số Tử vi 12 Cung
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                Khám phá cấu trúc đồ bàn 12 cung, vòng tràng sinh và các phương vị tam hợp truyền thống. Bản mẫu minh họa trực quan giúp bạn nắm bắt cách tổ chức một thiên bàn hoàn chỉnh trong di sản Tử vi Đẩu số.
              </p>
            </div>
            <div className="flex shrink-0 items-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold-soft/60 px-3.5 py-1.5 text-xs font-semibold text-accent shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                Bản mẫu Thiên Bàn Di Sản
              </span>
            </div>
          </div>
        </header>

        {!chart || editing ? (
          <AstrologyInputForm input={input} errors={errors} onChange={updateInput} onSubmit={buildChart} onCancelEdit={() => setEditing(false)} editing={editing} />
        ) : (
          <>
            <section className="mb-4 flex flex-col gap-4 rounded-panel border border-gold/35 bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">ĐƯƠNG SỐ · THIÊN BÀN TỬ VI</p>
                <h2 className="mt-1 truncate font-display text-2xl font-semibold text-ink">{chart.input.fullName}</h2>
                <p className="mt-1 text-sm text-muted">
                  Sinh ngày {formatDate(chart.input.birthDate)} · {getCanChiHourLabel(chart.input.birthTime)} · {chart.input.gender} · Lưu niên năm {chart.input.targetYear}
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button variant="outline" className="gap-2" onClick={() => { setEditing(true); setNotice(""); }}>
                  <Pencil className="h-4 w-4" aria-hidden="true" /> Chỉnh sửa thông tin
                </Button>
                <Button variant="bronze" className="gap-2" onClick={saveChart}>
                  <Save className="h-4 w-4" aria-hidden="true" /> Lưu thiên bàn
                </Button>
              </div>
            </section>

            <nav aria-label="Các phần của lá số" role="tablist" className="mb-4 overflow-x-auto rounded-panel border border-line bg-surface p-1.5">
              <div className="flex min-w-max gap-1">
                {DEMO_ASTROLOGY_TABS.map((tab, index) => <button key={tab} id={`astrology-tab-${tab.replaceAll(" ", "-").toLowerCase()}`} ref={(node) => { tabRefs.current[index] = node; }} type="button" role="tab" aria-selected={activeTab === tab} aria-controls={`astrology-panel-${tab.replaceAll(" ", "-").toLowerCase()}`} tabIndex={activeTab === tab ? 0 : -1} onClick={() => setActiveTab(tab)} onKeyDown={(event) => handleTabKeyDown(event, index)} className={`min-h-11 rounded-control px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${activeTab === tab ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:bg-surface-soft hover:text-ink"}`}>{tab}</button>)}
              </div>
            </nav>

            {notice && <p role="status" className="mb-4 rounded-panel border border-success/30 bg-success-soft px-4 py-3 text-sm text-ink">{notice}</p>}

            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="font-display text-xl font-semibold text-ink">{activeTab === "Lá số" ? "Bản đồ Thiên Bàn 12 Cung" : activeTab}</span>
                  <span className="hidden text-xs font-medium text-gold sm:inline">Minh họa chuẩn di sản</span>
                </div>
                <DemoAstrologyTabPanel activeTab={activeTab} input={chart.input} selection={{ ...tabSelection, palaceId: selectedPalaceId }} onSelectPalace={(id) => { setSelectedPalaceId(id); updateTabSelection("palaceId", id); }} onSelectDasha={(id) => updateTabSelection("dashaId", id)} onSelectMinorYear={(year) => updateTabSelection("minorYear", year)} onSelectMonth={(id) => updateTabSelection("monthId", id)} onSelectDay={(day) => updateTabSelection("day", day)} onSelectTheme={(id) => updateTabSelection("themeId", id)} />
              </div>

              <aside aria-live="polite" className="min-w-0">
                {selectedPalace ? (
                  <PalaceDetail palace={selectedPalace} onClose={() => setSelectedPalaceId(null)} />
                ) : (
                  <div className="rounded-card border border-dashed border-gold/50 bg-surface/80 p-5 sm:p-6 shadow-sm">
                    <Compass className="h-5 w-5 text-gold" aria-hidden="true" />
                    <h2 className="mt-3 font-display text-lg font-semibold text-ink">Chiêm nghiệm từng cung</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      Chạm chọn một ô cung trên bản đồ thiên bàn để xem chi tiết ý nghĩa vị trí, ngũ hành và các sao đại diện.
                    </p>
                  </div>
                )}
                <SavedCharts charts={savedCharts} currentId={chart.id} onOpen={openSavedChart} onNew={startNewChart} />
              </aside>
            </div>
          </>
        )}

        {!chart && savedCharts.length > 0 && <SavedCharts charts={savedCharts} currentId={null} onOpen={openSavedChart} onNew={startNewChart} />}

        {notice && (!chart || editing) && <p role="status" className="mt-4 rounded-panel border border-line bg-surface px-4 py-3 text-sm text-muted">{notice}</p>}
        {savedCharts.length > 0 && <div className="mt-8 border-t border-line pt-4"><button type="button" onClick={() => setResetOpen(true)} className="text-xs text-muted underline decoration-line underline-offset-4 hover:text-accent">Dọn dẹp thiên bàn đã lưu</button></div>}
        {resetOpen && <AppDialog labelledBy="demo-astrology-reset-title" onClose={() => setResetOpen(false)}><h2 id="demo-astrology-reset-title" className="font-display text-xl font-semibold text-ink">Xóa danh sách thiên bàn đã lưu?</h2><p className="mt-3 text-sm leading-relaxed text-muted">Chỉ các bản ghi thiên bàn trên máy này sẽ được dọn dẹp. Số dư và các dữ liệu trải nghiệm khác vẫn được bảo toàn nguyên vẹn.</p><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setResetOpen(false)}>Hủy</Button><Button onClick={resetAstrologyDemo}>Xác nhận xóa</Button></div></AppDialog>}
      </main>
    </div>
  );
}

export function AstrologyInputForm({ input, errors, onChange, onSubmit, onCancelEdit, editing }: {
  input: DemoAstrologyInput;
  errors: string[];
  onChange: (field: keyof DemoAstrologyInput, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  editing: boolean;
}) {
  return (
    <section className="grid gap-6 rounded-card border border-gold/35 bg-surface p-6 shadow-card sm:p-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)] lg:items-stretch">
      <div className="flex flex-col justify-between">
        <div>
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
              <Compass className="h-4 w-4" aria-hidden="true" />
              {editing ? "Hiệu chỉnh thông tin" : "Thiết lập thông tin"}
            </div>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              {editing ? "Chỉnh sửa Thông tin Đương số" : "Thông tin Đương số"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Nhập thông tin để đồ bàn khởi tạo vị trí quan sát. Dữ liệu được bảo mật an toàn và chỉ lưu cục bộ trên thiết bị của bạn.
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
                <User className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                Họ và tên đương số <span className="text-accent">*</span>
              </span>
              <input
                required
                maxLength={80}
                autoComplete="name"
                value={input.fullName}
                onChange={(event) => onChange("fullName", event.target.value)}
                className="min-h-12 w-full rounded-control border border-line bg-canvas px-3.5 text-ink transition-colors hover:border-gold/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Ví dụ: Nguyễn An Nhiên"
                aria-invalid={errors.some((error) => error.includes("tên"))}
              />
            </label>

            <label>
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
                <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                Giới tính <span className="text-accent">*</span>
              </span>
              <select
                required
                value={input.gender}
                onChange={(event) => onChange("gender", event.target.value)}
                className="min-h-12 w-full rounded-control border border-line bg-canvas px-3.5 text-ink transition-colors hover:border-gold/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác/không muốn nêu">Khác / Không muốn nêu</option>
              </select>
            </label>

            <label>
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
                <Calendar className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                Ngày sinh (Dương lịch) <span className="text-accent">*</span>
              </span>
              <input
                required
                type="date"
                value={input.birthDate}
                onChange={(event) => onChange("birthDate", event.target.value)}
                className="min-h-12 w-full rounded-control border border-line bg-canvas px-3.5 text-ink transition-colors hover:border-gold/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                aria-invalid={errors.some((error) => error.includes("ngày sinh"))}
              />
            </label>

            <label>
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
                <Clock className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                Giờ sinh Can Chi <span className="text-accent">*</span>
              </span>
              <select
                required
                value={input.birthTime}
                onChange={(event) => onChange("birthTime", event.target.value)}
                className="min-h-12 w-full rounded-control border border-line bg-canvas px-3.5 text-ink transition-colors hover:border-gold/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">-- Chọn khung giờ sinh --</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {getCanChiHourLabel(time)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
                <Compass className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                Năm lưu niên muốn xem <span className="text-accent">*</span>
              </span>
              <input
                required
                type="number"
                min={1900}
                max={2200}
                step={1}
                value={input.targetYear}
                onChange={(event) => onChange("targetYear", event.target.value)}
                className="min-h-12 w-full rounded-control border border-line bg-canvas px-3.5 text-ink transition-colors hover:border-gold/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <div className="mt-2 flex flex-wrap gap-3 sm:col-span-2">
              <Button
                type="submit"
                className="min-h-12 gap-2 bg-accent px-6 text-sm font-semibold text-on-accent shadow-sm transition-all hover:bg-accent/90 hover:shadow-md"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {editing ? "Lưu thay đổi lá số" : "Khởi tạo Thiên Bàn 12 Cung"}
              </Button>
              {editing && (
                <Button type="button" variant="outline" className="min-h-12" onClick={onCancelEdit}>
                  Hủy chỉnh sửa
                </Button>
              )}
            </div>
          </form>

          {errors.length > 0 && (
            <ul role="alert" className="mt-4 space-y-1 rounded-panel border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              {errors.map((error) => (
                <li key={error} className="flex items-center gap-2">
                  <span className="text-xs">✕</span> {error}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="flex h-full flex-col justify-between rounded-card border border-gold/40 bg-gradient-to-b from-gold-soft/35 via-surface to-gold-soft/20 p-5 sm:p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 border-b border-gold/30 pb-3">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-gold/40 bg-gold-soft text-gold">
              <Compass className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">Quy cách an bàn</p>
              <h3 className="font-display text-base font-semibold text-ink">Triết lý & Chỉ dẫn Thiên Bàn</h3>
            </div>
          </div>

          <ul className="mt-4 space-y-3.5 text-sm leading-relaxed text-muted">
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <div>
                <strong className="font-medium text-ink">Bảo mật riêng tư tuyệt đối:</strong> Dữ liệu lưu cục bộ trên trình duyệt của bạn, tôn trọng sự an toàn và tĩnh tâm.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <div>
                <strong className="font-medium text-ink">12 Khung giờ Can Chi:</strong> Giờ sinh chuẩn xác theo 12 thời khắc Hoàng đạo (Tý, Sửu, Dần, Mão...) giúp định chuẩn cung Thân và Mệnh.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Compass className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <div>
                <strong className="font-medium text-ink">Bố cục Tam Hợp & Tứ Chính:</strong> Bản mẫu mô phỏng nguyên bản vị trí 12 cung (Mệnh, Quan Lộc, Tài Bạch, Thiên Di...) theo cổ pháp.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <div>
                <strong className="font-medium text-ink">Tùy biến & Chiêm nghiệm:</strong> Bạn có thể dễ dàng hiệu chỉnh lại thông tin hoặc lưu lại nhiều bản đồ để suy ngẫm theo thời gian.
              </div>
            </li>
          </ul>
        </div>

        <div className="mt-6 rounded-panel border border-gold/30 bg-surface/80 p-3.5 text-center">
          <p className="font-serif text-xs italic leading-relaxed text-gold">
            “Tâm an vạn sự an · Thấu tỏ cung mệnh để thuận theo thời vận, hướng thiện và vững tâm trên bước đường nhân sinh.”
          </p>
        </div>
      </aside>
    </section>
  );
}

function PalaceDetail({ palace, onClose }: { palace: DemoAstrologyPalace; onClose: () => void }) {
  return (
    <section className="rounded-card border border-gold/40 bg-surface p-5 shadow-card" aria-labelledby="palace-detail-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">CUNG ĐANG CHIÊM NGHIỆM</p>
          <h2 id="palace-detail-title" className="mt-1 font-display text-xl font-semibold text-ink">Cung {palace.name}</h2>
        </div>
        <button
          type="button"
          aria-label="Đóng ghi chú cung"
          onClick={onClose}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors hover:bg-surface-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-3 text-sm text-muted">Phương vị: <span className="font-medium text-ink">{palace.branch}</span> · Ngũ hành: <span className="font-medium text-ink">{palace.element}</span></p>
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-gold">Sao mẫu biểu tượng</h3>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {palace.stars.map((star) => (
          <li key={star} className="rounded-full border border-accent/25 bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            {star}
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-muted">{palace.note}</p>
      <p className="mt-3 text-xs italic text-gold">Bản mẫu biểu tượng phục vụ chiêm nghiệm di sản và tự phản tỉnh.</p>
    </section>
  );
}

function SavedCharts({ charts, currentId, onOpen, onNew }: { charts: DemoAstrologyChart[]; currentId: string | null; onOpen: (id: string) => void; onNew: () => void }) {
  return (
    <section className="mt-5 rounded-panel border border-gold/30 bg-surface p-4 shadow-sm" aria-labelledby="saved-demo-charts-title">
      <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
        <h2 id="saved-demo-charts-title" className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Save className="h-4 w-4 text-gold" aria-hidden="true" />
          Thiên bàn đã lưu
        </h2>
        <button type="button" className="text-xs font-semibold text-accent underline underline-offset-4 hover:opacity-80" onClick={onNew}>
          + Lập bản mới
        </button>
      </div>
      {charts.length ? (
        <ul className="mt-3 space-y-2">
          {charts.map((saved) => (
            <li key={saved.id}>
              <button
                type="button"
                aria-current={currentId === saved.id ? "true" : undefined}
                onClick={() => onOpen(saved.id)}
                className={`w-full rounded-control border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  currentId === saved.id ? "border-accent bg-accent-soft" : "border-line hover:border-gold/40 hover:bg-surface-soft"
                }`}
              >
                <span className="block truncate text-sm font-semibold text-ink">{saved.input.fullName}</span>
                <span className="block text-xs text-muted">Lưu niên {saved.input.targetYear} · Lưu ngày {new Date(saved.updatedAt).toLocaleDateString("vi-VN")}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-muted">Chưa có bản lưu. Bạn có thể lưu lại các thiên bàn để mở lại chiêm nghiệm bất kỳ lúc nào.</p>
      )}
    </section>
  );
}

function formatDate(date: string): string {
  if (!date) return "Chưa có ngày sinh";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}


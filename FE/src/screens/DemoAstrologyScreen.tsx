import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowLeft, Compass, Pencil, Save, Sparkles, X } from "lucide-react";
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
    setNotice("Đã lập bản xem minh họa. Vị trí sao dùng fixture cố định, không tính từ thông tin sinh.");
  };

  const saveChart = () => {
    if (!chart) return;
    try {
      const saved = saveDemoAstrologyChart(input, chart.id.startsWith("preview-") ? undefined : chart.id);
      setChart(saved);
      setSavedCharts(loadDemoAstrologyCharts());
      setNotice("Đã lưu lá số minh họa trên thiết bị này.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Chưa lưu được lá số demo.");
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
    setNotice(`Đang xem bản đã lưu ngày ${new Date(saved.updatedAt).toLocaleDateString("vi-VN")}.`);
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
    setNotice("Đã xóa các lá số demo đã lưu. Số dư và các dữ liệu demo khác vẫn được giữ nguyên.");
  };

  return (
    <div className="screen-shell">
      <main className="page-container max-w-7xl">
        <button type="button" onClick={onBackToExperience} className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Về Trải nghiệm
        </button>

        <header className="relative mb-6 overflow-hidden rounded-card border border-gold/40 bg-surface px-5 py-6 shadow-card sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-gold/20" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gold"><Compass className="h-4 w-4" aria-hidden="true" /> Chiêm nghiệm di sản · trải nghiệm demo</p>
              <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">Lá số Tử vi 12 cung</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">Tạo một bản xem để khám phá cách bố cục lá số được tổ chức. Đây là fixture minh họa, không an sao hoặc luận đoán từ ngày giờ sinh.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Lá số minh họa</span>
          </div>
        </header>

        {!chart || editing ? (
          <AstrologyInputForm input={input} errors={errors} onChange={updateInput} onSubmit={buildChart} onCancelEdit={() => setEditing(false)} editing={editing} />
        ) : (
          <>
            <section className="mb-4 flex flex-col gap-4 rounded-panel border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gold">NGƯỜI XEM</p>
                <h2 className="mt-1 truncate font-display text-2xl font-semibold text-ink">{chart.input.fullName}</h2>
                <p className="mt-1 text-sm text-muted">Sinh {formatDate(chart.input.birthDate)} · {chart.input.birthTime} · {chart.input.gender} · Năm xem {chart.input.targetYear}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => { setEditing(true); setNotice(""); }}><Pencil className="h-4 w-4" aria-hidden="true" /> Chỉnh sửa thông tin</Button>
                <Button variant="bronze" onClick={saveChart}><Save className="h-4 w-4" aria-hidden="true" /> Lưu lá số demo</Button>
              </div>
            </section>

            <nav aria-label="Các phần của lá số" role="tablist" className="mb-4 overflow-x-auto rounded-panel border border-line bg-surface p-1.5">
              <div className="flex min-w-max gap-1">
                {DEMO_ASTROLOGY_TABS.map((tab, index) => <button key={tab} id={`astrology-tab-${tab.replaceAll(" ", "-").toLowerCase()}`} ref={(node) => { tabRefs.current[index] = node; }} type="button" role="tab" aria-selected={activeTab === tab} aria-controls={`astrology-panel-${tab.replaceAll(" ", "-").toLowerCase()}`} tabIndex={activeTab === tab ? 0 : -1} onClick={() => setActiveTab(tab)} onKeyDown={(event) => handleTabKeyDown(event, index)} className={`min-h-11 rounded-control px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${activeTab === tab ? "bg-accent text-on-accent" : "text-muted hover:bg-surface-soft hover:text-ink"}`}>{tab}</button>)}
              </div>
            </nav>

            {notice && <p role="status" className="mb-4 rounded-panel border border-success/30 bg-success-soft px-4 py-3 text-sm text-ink">{notice}</p>}

            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0">
                <div className="mb-3 flex items-center justify-between gap-3"><span className="font-display text-xl font-semibold text-ink">{activeTab === "Lá số" ? "Bản đồ 12 cung" : activeTab}</span><span className="hidden text-xs font-medium text-gold sm:inline">Fixture {chart.fixtureVersion}</span></div>
                <DemoAstrologyTabPanel activeTab={activeTab} input={chart.input} selection={{ ...tabSelection, palaceId: selectedPalaceId }} onSelectPalace={(id) => { setSelectedPalaceId(id); updateTabSelection("palaceId", id); }} onSelectDasha={(id) => updateTabSelection("dashaId", id)} onSelectMinorYear={(year) => updateTabSelection("minorYear", year)} onSelectMonth={(id) => updateTabSelection("monthId", id)} onSelectDay={(day) => updateTabSelection("day", day)} onSelectTheme={(id) => updateTabSelection("themeId", id)} />
              </div>

              <aside aria-live="polite" className="min-w-0">
                {selectedPalace ? <PalaceDetail palace={selectedPalace} onClose={() => setSelectedPalaceId(null)} /> : <div className="rounded-card border border-dashed border-gold/50 bg-surface/70 p-5 sm:p-6"><Compass className="h-5 w-5 text-gold" aria-hidden="true" /><h2 className="mt-3 font-display text-lg font-semibold text-ink">Góc nhìn từng cung</h2><p className="mt-2 text-sm leading-relaxed text-muted">Chọn một ô trên bản đồ. Ghi chú sẽ mở ở đây mà không làm mất lá số đang xem.</p></div>}
                <SavedCharts charts={savedCharts} currentId={chart.id} onOpen={openSavedChart} onNew={startNewChart} />
              </aside>
            </div>
          </>
        )}

        {!chart && savedCharts.length > 0 && <SavedCharts charts={savedCharts} currentId={null} onOpen={openSavedChart} onNew={startNewChart} />}

        {notice && (!chart || editing) && <p role="status" className="mt-4 rounded-panel border border-line bg-surface px-4 py-3 text-sm text-muted">{notice}</p>}
        {savedCharts.length > 0 && <div className="mt-8 border-t border-line pt-4"><button type="button" onClick={() => setResetOpen(true)} className="text-xs text-muted underline decoration-line underline-offset-4 hover:text-accent">Xóa dữ liệu tử vi demo</button></div>}
        {resetOpen && <AppDialog labelledBy="demo-astrology-reset-title" onClose={() => setResetOpen(false)}><h2 id="demo-astrology-reset-title" className="font-display text-xl font-semibold text-ink">Xóa các lá số demo đã lưu?</h2><p className="mt-3 text-sm leading-relaxed text-muted">Chỉ dữ liệu tử vi demo sẽ bị xóa. Số dư Premium, vật phẩm và dữ liệu demo của các tính năng khác vẫn được giữ nguyên.</p><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setResetOpen(false)}>Hủy</Button><Button onClick={resetAstrologyDemo}>Xóa lá số demo</Button></div></AppDialog>}
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
    <section className="grid gap-6 rounded-card border border-line bg-surface p-5 shadow-card sm:p-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <div className="mb-5"><h2 className="font-display text-2xl font-semibold text-ink">{editing ? "Chỉnh sửa thông tin" : "Lập lá số minh họa"}</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Thông tin chỉ dùng để hiển thị ở bản xem demo và lưu trên thiết bị này. Không gửi lên backend, không dùng để tính sao.</p></div>
        <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-ink">Họ và tên <span className="text-accent">*</span></span><input required maxLength={80} autoComplete="name" value={input.fullName} onChange={(event) => onChange("fullName", event.target.value)} className="min-h-12 w-full rounded-control border border-line bg-canvas px-3 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="Nhập tên người xem" aria-invalid={errors.some((error) => error.includes("tên"))} /></label>
          <label><span className="mb-1.5 block text-sm font-semibold text-ink">Giới tính <span className="text-accent">*</span></span><select required value={input.gender} onChange={(event) => onChange("gender", event.target.value)} className="min-h-12 w-full rounded-control border border-line bg-canvas px-3 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác/không muốn nêu">Khác/không muốn nêu</option></select></label>
          <label><span className="mb-1.5 block text-sm font-semibold text-ink">Ngày sinh <span className="text-accent">*</span></span><input required type="date" value={input.birthDate} onChange={(event) => onChange("birthDate", event.target.value)} className="min-h-12 w-full rounded-control border border-line bg-canvas px-3 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" aria-invalid={errors.some((error) => error.includes("ngày sinh"))} /></label>
          <label><span className="mb-1.5 block text-sm font-semibold text-ink">Giờ sinh <span className="text-accent">*</span></span><select required value={input.birthTime} onChange={(event) => onChange("birthTime", event.target.value)} className="min-h-12 w-full rounded-control border border-line bg-canvas px-3 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"><option value="">Chọn khung giờ</option>{timeOptions.map((time) => <option key={time} value={time}>{time}–{time.slice(0, 2)}:59</option>)}</select></label>
          <label><span className="mb-1.5 block text-sm font-semibold text-ink">Năm muốn xem <span className="text-accent">*</span></span><input required type="number" min={1900} max={2200} step={1} value={input.targetYear} onChange={(event) => onChange("targetYear", event.target.value)} className="min-h-12 w-full rounded-control border border-line bg-canvas px-3 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" /></label>
          <div className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit">Lập lá số</Button>{editing && <Button type="button" variant="outline" onClick={onCancelEdit}>Hủy chỉnh sửa</Button>}</div>
        </form>
        {errors.length > 0 && <ul role="alert" className="mt-4 space-y-1 rounded-panel border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
      </div>
      <aside className="self-start rounded-panel border border-gold/35 bg-gold-soft/40 p-5"><p className="text-sm font-semibold text-ink">Trước khi bắt đầu</p><ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted"><li>• Nhập đủ thông tin có dấu sao.</li><li>• Chọn giờ theo khung 24 giờ hiển thị.</li><li>• Các sao và ô cung là ví dụ cố định, không an theo dữ liệu cá nhân.</li><li>• Có thể sửa thông tin hoặc tạo bản mới sau khi lập.</li></ul></aside>
    </section>
  );
}

function PalaceDetail({ palace, onClose }: { palace: DemoAstrologyPalace; onClose: () => void }) {
  return <section className="rounded-card border border-gold/40 bg-surface p-5 shadow-card" aria-labelledby="palace-detail-title">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-gold">CUNG ĐANG CHỌN</p><h2 id="palace-detail-title" className="mt-1 font-display text-xl font-semibold text-ink">{palace.name}</h2></div><button type="button" aria-label="Đóng ghi chú cung" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-muted hover:bg-surface-soft hover:text-ink"><X className="h-4 w-4" aria-hidden="true" /></button></div>
    <p className="mt-3 text-sm text-muted">Vị trí fixture: {palace.branch} · {palace.element}</p><h3 className="mt-4 text-sm font-semibold text-ink">Sao minh họa</h3><ul className="mt-2 flex flex-wrap gap-2">{palace.stars.map((star) => <li key={star} className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">{star}</li>)}</ul><p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-muted">{palace.note}</p><p className="mt-3 text-xs font-semibold text-gold">Không phải luận giải cá nhân.</p>
  </section>;
}

function SavedCharts({ charts, currentId, onOpen, onNew }: { charts: DemoAstrologyChart[]; currentId: string | null; onOpen: (id: string) => void; onNew: () => void }) {
  return <section className="mt-5 rounded-panel border border-line bg-surface p-4" aria-labelledby="saved-demo-charts-title">
    <div className="flex items-center justify-between gap-2"><h2 id="saved-demo-charts-title" className="text-sm font-semibold text-ink">Lá số demo đã lưu</h2><button type="button" className="text-xs font-semibold text-accent underline underline-offset-4" onClick={onNew}>Tạo bản mới</button></div>
    {charts.length ? <ul className="mt-3 space-y-2">{charts.map((saved) => <li key={saved.id}><button type="button" aria-current={currentId === saved.id ? "true" : undefined} onClick={() => onOpen(saved.id)} className={`w-full rounded-control border px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${currentId === saved.id ? "border-accent bg-accent-soft" : "border-line hover:bg-surface-soft"}`}><span className="block truncate text-sm font-medium text-ink">{saved.input.fullName}</span><span className="block text-xs text-muted">Năm xem {saved.input.targetYear} · lưu {new Date(saved.updatedAt).toLocaleDateString("vi-VN")}</span></button></li>)}</ul> : <p className="mt-2 text-xs text-muted">Chưa có bản lưu. Lưu lá số để mở lại sau.</p>}
  </section>;
}

function formatDate(date: string): string {
  if (!date) return "Chưa có ngày sinh";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

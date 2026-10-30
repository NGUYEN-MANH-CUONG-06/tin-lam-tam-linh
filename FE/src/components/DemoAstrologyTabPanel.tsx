import type { ReactNode } from "react";
import { BookOpenCheck, CalendarDays, Compass, Sparkles } from "lucide-react";
import {
  DEMO_ASTROLOGY_PALACES,
  DEMO_ASTROLOGY_TABS,
  isValidDate,
  type DemoAstrologyInput,
  type DemoAstrologyPalace,
} from "../data/demoAstrology";
import {
  DEMO_DASHA_FIXTURES,
  DEMO_DAY_FIXTURE,
  DEMO_MINOR_YEAR_FIXTURES,
  DEMO_MONTH_FIXTURES,
  DEMO_PALACE_REFLECTIONS,
  DEMO_THEME_FIXTURES,
  type PalaceReflectionFixture,
  type ReflectionFixture,
} from "../data/demoAstrologyReadings";

export interface DemoAstrologyTabSelection {
  palaceId: string | null;
  dashaId: string;
  minorYear: number;
  monthId: string;
  day: string;
  themeId: string;
}

interface DemoAstrologyTabPanelProps {
  activeTab: typeof DEMO_ASTROLOGY_TABS[number];
  input: DemoAstrologyInput;
  selection: DemoAstrologyTabSelection;
  onSelectPalace: (id: string) => void;
  onSelectDasha: (id: string) => void;
  onSelectMinorYear: (year: number) => void;
  onSelectMonth: (id: string) => void;
  onSelectDay: (day: string) => void;
  onSelectTheme: (id: string) => void;
}

export function DemoAstrologyTabPanel(props: DemoAstrologyTabPanelProps) {
  const { activeTab, input, selection } = props;
  const panelId = `astrology-panel-${activeTab.replaceAll(" ", "-").toLowerCase()}`;
  return (
    <section id={panelId} role="tabpanel" aria-labelledby={`astrology-tab-${activeTab.replaceAll(" ", "-").toLowerCase()}`} tabIndex={0} className="min-w-0 rounded-card border border-line bg-surface p-4 shadow-card sm:p-6">
      {activeTab === "Lá số" && <FixtureIntro><p className="mb-4 text-sm leading-relaxed text-muted">Bản đồ 12 cung là fixture minh họa cố định. Thông tin nhập vào chỉ xuất hiện ở phần cá nhân; không dùng để tính vị trí sao.</p><DemoAstrologyChartGrid input={input} selectedPalaceId={selection.palaceId} onSelectPalace={props.onSelectPalace} /></FixtureIntro>}
      {activeTab === "Luận cung" && <PalaceTab selectedId={selection.palaceId} onSelect={props.onSelectPalace} />}
      {activeTab === "Đại vận" && <DashaTab selectedId={selection.dashaId} onSelect={props.onSelectDasha} />}
      {activeTab === "Tiểu vận" && <MinorYearTab startYear={input.targetYear} selectedYear={selection.minorYear} onSelect={props.onSelectMinorYear} />}
      {activeTab === "Nguyệt vận" && <MonthTab year={input.targetYear} selectedId={selection.monthId} onSelect={props.onSelectMonth} />}
      {activeTab === "Nhật vận" && <DayTab selectedDay={selection.day} onSelect={props.onSelectDay} />}
      {activeTab === "Chuyên đề" && <ThemeTab selectedId={selection.themeId} onSelect={props.onSelectTheme} />}
    </section>
  );
}

export function DemoAstrologyChartGrid({ input, selectedPalaceId, onSelectPalace }: { input: DemoAstrologyInput; selectedPalaceId: string | null; onSelectPalace: (id: string) => void }) {
  return <div className="overflow-x-auto overscroll-x-contain rounded-card border border-gold/35 bg-gold-soft/30 p-2 sm:p-3" tabIndex={0} aria-label="Bản đồ lá số có thể cuộn ngang trên màn hình nhỏ">
    <div className="grid min-w-[720px] grid-cols-4 grid-rows-4 gap-2 rounded-[1.15rem] border border-gold/30 bg-canvas p-2 sm:gap-3 sm:p-3" style={{ gridTemplateRows: "repeat(4, minmax(150px, 1fr))" }}>
      {DEMO_ASTROLOGY_PALACES.map((palace) => <PalaceCell key={palace.id} palace={palace} selected={selectedPalaceId === palace.id} onSelect={() => onSelectPalace(palace.id)} />)}
      <div className="col-span-2 row-span-2 flex min-w-0 flex-col items-center justify-center rounded-panel border border-gold/45 bg-surface px-4 py-5 text-center shadow-inner" style={{ gridColumn: "2 / span 2", gridRow: "2 / span 2" }}>
        <span className="mb-2 grid h-10 w-10 place-items-center rounded-full border border-gold/40 bg-gold-soft text-gold"><Compass className="h-5 w-5" aria-hidden="true" /></span>
        <p className="text-[11px] font-semibold text-gold">THIÊN BÀN · MINH HỌA</p><h3 className="mt-1 max-w-full break-words font-display text-xl font-semibold text-ink">{input.fullName}</h3>
        <p className="mt-2 text-xs leading-relaxed text-muted">{formatDate(input.birthDate)}<br />{input.birthTime} · {input.gender}<br />Năm xem {input.targetYear}</p>
        <div className="mt-3 rounded-full border border-line bg-surface-soft px-3 py-1 text-[11px] font-medium text-muted">Mệnh · Cục: chưa tính</div>
      </div>
    </div>
  </div>;
}

function PalaceTab({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  const selected = DEMO_ASTROLOGY_PALACES.find((palace) => palace.id === selectedId) ?? DEMO_ASTROLOGY_PALACES[0];
  const reflection = DEMO_PALACE_REFLECTIONS.find((item) => item.palaceId === selected.id)!;
  return <div>
    <TabHeading icon={<BookOpenCheck className="h-5 w-5" />} title="Luận cung" description="Chọn một cung để xem ý nghĩa biểu tượng và câu hỏi tự chiêm nghiệm. Nội dung không được tính từ thông tin lá số." />
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{DEMO_ASTROLOGY_PALACES.map((palace) => <ChoiceButton key={palace.id} selected={selected.id === palace.id} onClick={() => onSelect(palace.id)}>{palace.name}</ChoiceButton>)}</div>
      <PalaceReflection palace={selected} reflection={reflection} />
    </div>
    <FixtureDisclaimer />
  </div>;
}

function PalaceReflection({ palace, reflection }: { palace: DemoAstrologyPalace; reflection: PalaceReflectionFixture }) {
  return <article className="rounded-panel border border-gold/35 bg-gold-soft/30 p-4 sm:p-5" aria-live="polite">
    <p className="text-xs font-semibold text-gold">CUNG {palace.name.toLocaleUpperCase("vi-VN")} · GÓC NHÌN BIỂU TƯỢNG</p>
    <h3 className="mt-1 font-display text-xl font-semibold text-ink">{reflection.theme}</h3>
    <p className="mt-2 text-sm leading-relaxed text-muted">{reflection.symbol}</p>
    <div className="mt-4"><p className="text-sm font-semibold text-ink">Chủ đề thường được quan tâm</p><div className="mt-2 flex flex-wrap gap-2">{reflection.commonTopics.map((topic) => <span key={topic} className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">{topic}</span>)}</div></div>
    <ReflectionQuestions items={reflection.reflection} />
    <PracticePrompt text={reflection.practice} />
  </article>;
}

function DashaTab({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const selected = DEMO_DASHA_FIXTURES.find((item) => item.id === selectedId) ?? DEMO_DASHA_FIXTURES[0];
  return <div>
    <TabHeading icon={<Compass className="h-5 w-5" />} title="Đại vận · các chặng dài hạn" description="Timeline dưới đây là các chặng mười năm để tổ chức mục tiêu dài hạn. Đây không phải đại vận được tính từ lá số." />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.9fr)]">
      <ol className="grid gap-2 sm:grid-cols-2">{DEMO_DASHA_FIXTURES.map((item, index) => <li key={item.id}><ChoiceButton selected={selected.id === item.id} onClick={() => onSelect(item.id)}><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold-soft text-[11px] text-gold">{index + 1}</span><span className="text-left">{item.title}<span className="block text-xs font-normal text-muted">Chặng 10 năm minh họa</span></span></ChoiceButton></li>)}</ol>
      <ReflectionPanel fixture={selected} label="Chặng được chọn" />
    </div>
    <FixtureDisclaimer />
  </div>;
}

function MinorYearTab({ startYear, selectedYear, onSelect }: { startYear: number; selectedYear: number; onSelect: (year: number) => void }) {
  const fixtureIndex = ((selectedYear - startYear) % DEMO_MINOR_YEAR_FIXTURES.length + DEMO_MINOR_YEAR_FIXTURES.length) % DEMO_MINOR_YEAR_FIXTURES.length;
  const selected = DEMO_MINOR_YEAR_FIXTURES[fixtureIndex];
  return <div>
    <TabHeading icon={<CalendarDays className="h-5 w-5" />} title="Tiểu vận · nhìn lại từng năm" description="Chọn năm trong một thập niên minh họa. Các gợi ý là câu hỏi lập kế hoạch chung, không dự báo tương lai." />
    <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">{Array.from({ length: 10 }, (_, index) => startYear + index).map((year) => <ChoiceButton key={year} selected={selectedYear === year} onClick={() => onSelect(year)}>{year}</ChoiceButton>)}</div>
    <ReflectionPanel fixture={{ ...selected, title: `Năm ${selectedYear} · ${selected.title}` }} label="Chủ đề năm minh họa" details={[["Công việc và học tập", "Chọn một kỹ năng hoặc mục tiêu cụ thể để dành thời gian."], ["Các mối quan hệ", "Ưu tiên trao đổi rõ ràng, tôn trọng khác biệt và ranh giới."], ["Sức khỏe và cân bằng", "Giữ lời khuyên ở mức chăm sóc chung; tìm chuyên gia khi cần tư vấn sức khỏe."], ["Mục tiêu cá nhân", selected.practice]]} />
    <FixtureDisclaimer />
  </div>;
}

function MonthTab({ year, selectedId, onSelect }: { year: number; selectedId: string; onSelect: (id: string) => void }) {
  const selected = DEMO_MONTH_FIXTURES.find((item) => item.id === selectedId) ?? DEMO_MONTH_FIXTURES[0];
  return <div>
    <TabHeading icon={<CalendarDays className="h-5 w-5" />} title={`Nguyệt vận · năm ${year}`} description="Chọn một tháng để nhận gợi ý lập kế hoạch và lời nhắc tích cực từ bộ nội dung cố định." />
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">{DEMO_MONTH_FIXTURES.map((item) => <ChoiceButton key={item.id} selected={selected.id === item.id} onClick={() => onSelect(item.id)}>{item.title}</ChoiceButton>)}</div>
    <div className="mt-5"><ReflectionPanel fixture={selected} label="Chủ đề tháng minh họa" details={[["Gợi ý lập kế hoạch", selected.practice], ["Lời nhắc", "Có thể điều chỉnh kế hoạch theo hoàn cảnh thực tế của mình."]]}/></div>
    <FixtureDisclaimer />
  </div>;
}

function DayTab({ selectedDay, onSelect }: { selectedDay: string; onSelect: (day: string) => void }) {
  const valid = isValidDate(selectedDay);
  return <div>
    <TabHeading icon={<CalendarDays className="h-5 w-5" />} title="Nhật vận · một ngày có chủ đích" description="Chọn một ngày hợp lệ để hiển thị bộ câu hỏi chung. Ngày không tạo kết luận tốt/xấu hoặc thông tin may rủi." />
    <label className="block max-w-xs"><span className="mb-1.5 block text-sm font-semibold text-ink">Ngày muốn suy ngẫm</span><input type="date" value={selectedDay} max={todayString()} onChange={(event) => onSelect(event.target.value)} className="min-h-12 w-full rounded-control border border-line bg-canvas px-3 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" aria-invalid={!valid} /></label>
    {!valid ? <p role="alert" className="mt-3 text-sm text-danger">Chọn một ngày hợp lệ, không ở tương lai.</p> : <div className="mt-5"><ReflectionPanel fixture={DEMO_DAY_FIXTURE} label={`Gợi ý chung cho ${formatDate(selectedDay)}`} details={[["Cân bằng cảm xúc", "Tạm dừng, nhận biết cảm xúc hiện tại và tìm sự hỗ trợ phù hợp nếu cần."], ["Kế hoạch ưu tiên", DEMO_DAY_FIXTURE.practice]]} /></div>}
    <p className="mt-4 text-xs leading-relaxed text-muted">Cùng một bộ gợi ý được dùng cho mọi ngày. Nội dung không được sinh hoặc tính từ ngày đã chọn.</p>
  </div>;
}

function ThemeTab({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const selected = DEMO_THEME_FIXTURES.find((item) => item.id === selectedId) ?? DEMO_THEME_FIXTURES[0];
  return <div>
    <TabHeading icon={<Sparkles className="h-5 w-5" />} title="Chuyên đề tự khám phá" description="Chọn một lĩnh vực để bắt đầu từ câu hỏi thực tế và góc nhìn có thể tự điều chỉnh." />
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{DEMO_THEME_FIXTURES.map((item) => <ChoiceButton key={item.id} selected={selected.id === item.id} onClick={() => onSelect(item.id)}>{item.title}</ChoiceButton>)}</div>
    <div className="mt-5"><ReflectionPanel fixture={selected} label="Chuyên đề minh họa" /></div>
    <FixtureDisclaimer />
  </div>;
}

function ReflectionPanel({ fixture, label, details = [] }: { fixture: ReflectionFixture; label: string; details?: [string, string][] }) {
  return <article className="rounded-panel border border-gold/35 bg-gold-soft/30 p-4 sm:p-5" aria-live="polite">
    <p className="text-xs font-semibold text-gold">{label}</p><h3 className="mt-1 font-display text-xl font-semibold text-ink">{fixture.theme}</h3>
    {details.map(([title, body]) => <div key={title} className="mt-4"><h4 className="text-sm font-semibold text-ink">{title}</h4><p className="mt-1 text-sm leading-relaxed text-muted">{body}</p></div>)}
    <ReflectionQuestions items={fixture.reflection} />
    {details.length === 0 && <PracticePrompt text={fixture.practice} />}
    <p className="mt-4 border-t border-gold/25 pt-3 text-xs font-medium text-muted">Gợi ý để tự suy ngẫm; không phải dự báo cá nhân.</p>
  </article>;
}

function ReflectionQuestions({ items }: { items: string[] }) {
  return <div className="mt-4"><h4 className="text-sm font-semibold text-ink">Câu hỏi tự chiêm nghiệm</h4><ul className="mt-2 space-y-2">{items.map((item) => <li key={item} className="flex gap-2 text-sm leading-relaxed text-muted"><span className="mt-1 text-gold" aria-hidden="true">✦</span><span>{item}</span></li>)}</ul></div>;
}

function PracticePrompt({ text }: { text: string }) {
  return <div className="mt-4 rounded-control border border-line bg-surface p-3"><h4 className="text-sm font-semibold text-ink">Gợi ý thực hành</h4><p className="mt-1 text-sm leading-relaxed text-muted">{text}</p></div>;
}

function FixtureIntro({ children }: { children: ReactNode }) {
  return <div><div className="mb-4 flex items-start gap-3 rounded-panel border border-gold/35 bg-gold-soft/30 p-4"><BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" /><p className="text-xs leading-relaxed text-muted">Đây là bản đồ fixture minh họa. Thông tin cá nhân không dùng để an sao hoặc tính mệnh lý.</p></div>{children}<FixtureDisclaimer /></div>;
}

function FixtureDisclaimer() {
  return <p className="mt-5 rounded-panel border border-line bg-surface-soft/60 px-4 py-3 text-xs leading-relaxed text-muted">Toàn bộ nội dung Phase 8B là mẫu chiêm nghiệm cố định của bản demo. Không phải kết quả được tính từ ngày giờ sinh, dự báo sự kiện, chẩn đoán hay lời khuyên chuyên môn.</p>;
}

function TabHeading({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <header className="mb-5 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/35 bg-gold-soft text-gold">{icon}</span><div><h2 className="font-display text-2xl font-semibold text-ink">{title}</h2><p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">{description}</p></div></header>;
}

function ChoiceButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`flex min-h-12 w-full items-center rounded-control border px-3 py-2 text-sm font-medium text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${selected ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface hover:border-gold/50 hover:bg-gold-soft/30"}`}>{children}</button>;
}

function PalaceCell({ palace, selected, onSelect }: { palace: DemoAstrologyPalace; selected: boolean; onSelect: () => void }) {
  const tones = { lacquer: "border-t-[#8f202b]", bronze: "border-t-[#8c6328]", moss: "border-t-[#496b51]", indigo: "border-t-[#5b607d]" };
  return <button type="button" aria-label={`Cung ${palace.name}`} aria-pressed={selected} onClick={onSelect} className={`group flex min-w-0 flex-col items-start overflow-hidden rounded-lg border border-line border-t-[3px] ${tones[palace.tone]} bg-surface p-2 text-left transition-colors hover:border-accent hover:bg-accent-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:rounded-panel sm:p-3 ${selected ? "ring-2 ring-accent ring-offset-1 ring-offset-canvas" : ""}`} style={{ gridColumn: palace.grid[1], gridRow: palace.grid[0] }}>
    <span className="max-w-full truncate text-sm font-semibold text-ink sm:text-base">{palace.name}</span><span className="mt-0.5 text-[10px] text-muted sm:text-xs">{palace.branch} · {palace.element}</span>
    <span className="mt-2 flex min-w-0 flex-wrap gap-1">{palace.stars.map((star) => <span key={star} className="max-w-full rounded-full border border-line bg-surface-soft px-1.5 py-0.5 text-[9px] leading-tight text-muted sm:text-[10px]">{star}</span>)}</span>
    <span className="mt-auto pt-2 text-[10px] font-medium text-accent opacity-80 group-hover:opacity-100">Xem ghi chú</span>
  </button>;
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function todayString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

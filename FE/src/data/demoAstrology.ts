import { isDemoMode } from "./demoMode";
import { readDemoValue, writeDemoValue } from "./demoStorage";

export const DEMO_ASTROLOGY_STORAGE_KEY = "astrology-charts-v1";
export const DEMO_ASTROLOGY_FIXTURE_VERSION = "minh-hoa-01";

export interface DemoAstrologyInput {
  fullName: string;
  gender: "Nam" | "Nữ" | "Khác/không muốn nêu";
  birthDate: string;
  birthTime: string;
  targetYear: number;
}

export interface DemoAstrologyChart {
  id: string;
  createdAt: string;
  updatedAt: string;
  input: DemoAstrologyInput;
  fixtureVersion: typeof DEMO_ASTROLOGY_FIXTURE_VERSION;
}

export interface DemoAstrologyPalace {
  id: string;
  name: string;
  grid: [number, number];
  branch: string;
  element: string;
  stars: string[];
  note: string;
  tone: "lacquer" | "bronze" | "moss" | "indigo";
}

// Fixed editorial fixture for layout demonstration; never derived from birth data.
export const DEMO_ASTROLOGY_PALACES: DemoAstrologyPalace[] = [
  { id: "menh", name: "Mệnh", grid: [1, 1], branch: "Tý · mẫu", element: "Thủy · mẫu", stars: ["Tử Vi · ví dụ", "Thiên Phủ · ví dụ"], note: "Nội dung minh họa cho cách trình bày một ô cung.", tone: "lacquer" },
  { id: "phu-mau", name: "Phụ Mẫu", grid: [1, 2], branch: "Sửu · mẫu", element: "Thổ · mẫu", stars: ["Thiên Khôi · ví dụ", "Long Đức · ví dụ"], note: "Các tên sao và vị trí không được an theo ngày giờ sinh.", tone: "bronze" },
  { id: "phuc-duc", name: "Phúc Đức", grid: [1, 3], branch: "Dần · mẫu", element: "Mộc · mẫu", stars: ["Thiên Đồng · ví dụ", "Thiên Việt · ví dụ"], note: "Ô cung cố định từ bộ fixture minh họa.", tone: "moss" },
  { id: "dien-trach", name: "Điền Trạch", grid: [1, 4], branch: "Mão · mẫu", element: "Mộc · mẫu", stars: ["Thái Âm · ví dụ", "Hữu Bật · ví dụ"], note: "Không dùng nội dung này để kết luận về nhà cửa hay tài sản.", tone: "indigo" },
  { id: "quan-loc", name: "Quan Lộc", grid: [2, 4], branch: "Thìn · mẫu", element: "Thổ · mẫu", stars: ["Vũ Khúc · ví dụ", "Văn Xương · ví dụ"], note: "Tên sao chỉ giúp mô phỏng bố cục của lá số.", tone: "lacquer" },
  { id: "no-boc", name: "Nô Bộc", grid: [3, 4], branch: "Tỵ · mẫu", element: "Hỏa · mẫu", stars: ["Thiên Tướng · ví dụ", "Thiên Quan · ví dụ"], note: "Không phải nhận định về các mối quan hệ của người xem.", tone: "bronze" },
  { id: "thien-di", name: "Thiên Di", grid: [4, 4], branch: "Ngọ · mẫu", element: "Hỏa · mẫu", stars: ["Liêm Trinh · ví dụ", "Đào Hoa · ví dụ"], note: "Vị trí được giữ nguyên cho mọi bộ thông tin nhập vào.", tone: "moss" },
  { id: "tat-ach", name: "Tật Ách", grid: [4, 3], branch: "Mùi · mẫu", element: "Thổ · mẫu", stars: ["Thiên Lương · ví dụ", "Thiên Y · ví dụ"], note: "Không dùng để suy đoán sức khỏe hoặc chẩn đoán.", tone: "indigo" },
  { id: "tai-bach", name: "Tài Bạch", grid: [4, 2], branch: "Thân · mẫu", element: "Kim · mẫu", stars: ["Tham Lang · ví dụ", "Lộc Tồn · ví dụ"], note: "Không phải lời khuyên hoặc dự báo tài chính.", tone: "lacquer" },
  { id: "tu-tuc", name: "Tử Tức", grid: [4, 1], branch: "Dậu · mẫu", element: "Kim · mẫu", stars: ["Cự Môn · ví dụ", "Thiên Hỷ · ví dụ"], note: "Không dùng để suy luận về con cái hoặc sinh nở.", tone: "bronze" },
  { id: "phu-the", name: "Phu Thê", grid: [3, 1], branch: "Tuất · mẫu", element: "Thổ · mẫu", stars: ["Thái Dương · ví dụ", "Hồng Loan · ví dụ"], note: "Không kết luận về tình trạng hay tương lai quan hệ.", tone: "moss" },
  { id: "huynh-de", name: "Huynh Đệ", grid: [2, 1], branch: "Hợi · mẫu", element: "Thủy · mẫu", stars: ["Phá Quân · ví dụ", "Tả Phù · ví dụ"], note: "Bản đồ này chỉ minh họa cách sắp xếp 12 ô cung.", tone: "indigo" },
];

export const DEMO_ASTROLOGY_TABS = ["Lá số", "Luận cung", "Đại vận", "Tiểu vận", "Nguyệt vận", "Nhật vận", "Chuyên đề"] as const;

export function validateDemoAstrologyInput(value: DemoAstrologyInput | Record<string, unknown>): string[] {
  const errors: string[] = [];
  const fullName = typeof value.fullName === "string" ? value.fullName.trim() : "";
  const gender = value.gender;
  const birthDate = typeof value.birthDate === "string" ? value.birthDate : "";
  const birthTime = typeof value.birthTime === "string" ? value.birthTime : "";
  const targetYear = value.targetYear;
  if (!fullName) errors.push("Vui lòng nhập họ và tên.");
  else if (fullName.length > 80) errors.push("Họ và tên không được quá 80 ký tự.");
  if (!(gender === "Nam" || gender === "Nữ" || gender === "Khác/không muốn nêu")) errors.push("Vui lòng chọn giới tính.");
  if (!isValidDate(birthDate)) errors.push("Vui lòng nhập ngày sinh hợp lệ.");
  if (!isValidBirthTime(birthTime)) errors.push("Vui lòng chọn giờ sinh.");
  if (!Number.isInteger(targetYear) || (targetYear as number) < 1900 || (targetYear as number) > 2200) errors.push("Năm muốn xem phải từ 1900 đến 2200.");
  return errors;
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const current = new Date();
  const today = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day && date <= today;
}

export function isValidBirthTime(value: string): boolean {
  return /^([01]\d|2[0-3]):00$/.test(value);
}

export function selectDemoAstrologyPalace(id: string | null): DemoAstrologyPalace | null {
  return DEMO_ASTROLOGY_PALACES.find((palace) => palace.id === id) ?? null;
}

export function loadDemoAstrologyCharts(): DemoAstrologyChart[] {
  const stored = readDemoValue<unknown>(DEMO_ASTROLOGY_STORAGE_KEY, []);
  if (!Array.isArray(stored)) return [];
  return stored.filter(isDemoAstrologyChart);
}

export function saveDemoAstrologyChart(input: DemoAstrologyInput, chartId?: string, now = new Date()): DemoAstrologyChart {
  assertDemoMode();
  const errors = validateDemoAstrologyInput(input);
  if (errors.length) throw new Error(errors.join(" "));
  const charts = loadDemoAstrologyCharts();
  const current = chartId ? charts.find((chart) => chart.id === chartId) : undefined;
  const chart: DemoAstrologyChart = {
    id: current?.id ?? `demo-astrology-${crypto.randomUUID()}`,
    createdAt: current?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
    input: { ...input, fullName: input.fullName.trim() },
    fixtureVersion: DEMO_ASTROLOGY_FIXTURE_VERSION,
  };
  writeDemoValue(DEMO_ASTROLOGY_STORAGE_KEY, [chart, ...charts.filter((item) => item.id !== chart.id)]);
  return chart;
}

export function getDemoAstrologyChart(id: string): DemoAstrologyChart | null {
  return loadDemoAstrologyCharts().find((chart) => chart.id === id) ?? null;
}

export function resetDemoAstrologyCharts(): void {
  assertDemoMode();
  writeDemoValue(DEMO_ASTROLOGY_STORAGE_KEY, []);
}

function isDemoAstrologyChart(value: unknown): value is DemoAstrologyChart {
  if (!value || typeof value !== "object") return false;
  const chart = value as Partial<DemoAstrologyChart>;
  return typeof chart.id === "string" && typeof chart.createdAt === "string" && typeof chart.updatedAt === "string"
    && chart.fixtureVersion === DEMO_ASTROLOGY_FIXTURE_VERSION && !!chart.input
    && validateDemoAstrologyInput(chart.input).length === 0;
}

function assertDemoMode(): void {
  if (!isDemoMode()) throw new Error("Lá số minh họa chỉ được lưu trong Demo Mode.");
}

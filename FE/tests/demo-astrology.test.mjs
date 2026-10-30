import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DEMO_ASTROLOGY_PALACES,
  DEMO_ASTROLOGY_STORAGE_KEY,
  getDemoAstrologyChart,
  isValidDate,
  loadDemoAstrologyCharts,
  resetDemoAstrologyCharts,
  saveDemoAstrologyChart,
  selectDemoAstrologyPalace,
  validateDemoAstrologyInput,
} from "../src/data/demoAstrology.ts";
import { clearDemoValues, readDemoValue } from "../src/data/demoStorage.ts";
import { DemoAstrologyChartGrid, DemoAstrologyTabPanel } from "../src/components/DemoAstrologyTabPanel.tsx";
import { DEMO_ASTROLOGY_TABS } from "../src/data/demoAstrology.ts";
import {
  DEMO_DASHA_FIXTURES, DEMO_DAY_FIXTURE, DEMO_MINOR_YEAR_FIXTURES,
  DEMO_MONTH_FIXTURES, DEMO_PALACE_REFLECTIONS, DEMO_THEME_FIXTURES,
} from "../src/data/demoAstrologyReadings.ts";

function installMemoryStorage() {
  const entries = new Map();
  globalThis.localStorage = {
    getItem(key) { return entries.get(key) ?? null; },
    setItem(key, value) { entries.set(key, String(value)); },
    removeItem(key) { entries.delete(key); },
    key(index) { return [...entries.keys()][index] ?? null; },
    get length() { return entries.size; },
  };
  globalThis.window = {
    location: { search: "?demo=1", href: "http://localhost:3000/astrology?demo=1", assign() {} },
    sessionStorage: { getItem() { return "true"; }, setItem() {}, removeItem() {} },
  };
  return entries;
}

const validInput = {
  fullName: "Nguyễn An",
  gender: "Nữ",
  birthDate: "1992-02-29",
  birthTime: "08:00",
  targetYear: 2026,
};

test("form validation requires a name, supported gender, valid non-future date, hour, and target year", () => {
  installMemoryStorage();
  assert.deepEqual(validateDemoAstrologyInput(validInput), []);
  assert.ok(validateDemoAstrologyInput({ ...validInput, fullName: "  " }).some((error) => error.includes("họ và tên")));
  assert.ok(validateDemoAstrologyInput({ ...validInput, gender: "" }).some((error) => error.includes("giới tính")));
  assert.equal(isValidDate("2025-02-29"), false);
  assert.ok(validateDemoAstrologyInput({ ...validInput, birthDate: "2025-02-29" }).some((error) => error.includes("ngày sinh")));
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const futureDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  assert.ok(validateDemoAstrologyInput({ ...validInput, birthDate: futureDate }).some((error) => error.includes("ngày sinh")));
  assert.ok(validateDemoAstrologyInput({ ...validInput, birthTime: "8:30" }).some((error) => error.includes("giờ sinh")));
  assert.ok(validateDemoAstrologyInput({ ...validInput, targetYear: 2201 }).some((error) => error.includes("Năm muốn xem")));
});

test("fixed fixture contains 12 distinct perimeter palaces and selects a palace without calculating placements", () => {
  assert.equal(DEMO_ASTROLOGY_PALACES.length, 12);
  assert.equal(new Set(DEMO_ASTROLOGY_PALACES.map((palace) => palace.id)).size, 12);
  assert.equal(new Set(DEMO_ASTROLOGY_PALACES.map((palace) => palace.grid.join(","))).size, 12);
  assert.ok(DEMO_ASTROLOGY_PALACES.every((palace) => palace.stars.every((star) => star.includes("ví dụ"))));
  assert.equal(selectDemoAstrologyPalace("menh")?.name, "Mệnh");
  assert.equal(selectDemoAstrologyPalace("not-a-palace"), null);
});

test("the chart grid renders all 12 cells, the personal center, and the selected state", () => {
  const markup = renderToStaticMarkup(React.createElement(DemoAstrologyChartGrid, {
    input: validInput,
    selectedPalaceId: "menh", onSelectPalace() {},
  }));
  assert.equal((markup.match(/aria-label="Cung /g) ?? []).length, 12);
  assert.match(markup, /aria-label="Cung Mệnh" aria-pressed="true"/);
  assert.match(markup, /THIÊN BÀN · MINH HỌA/);
  assert.match(markup, /Nguyễn An/);
});

test("all seven tabs render their corresponding fixed demo content", () => {
  assert.equal(DEMO_ASTROLOGY_TABS.length, 7);
  const selected = { palaceId: "menh", dashaId: "dasha-1", minorYear: 2026, monthId: "month-1", day: "2026-01-01", themeId: "theme-self" };
  for (const tab of DEMO_ASTROLOGY_TABS) {
    const markup = renderToStaticMarkup(React.createElement(DemoAstrologyTabPanel, {
      activeTab: tab, input: validInput, selection: selected,
      onSelectPalace() {}, onSelectDasha() {}, onSelectMinorYear() {}, onSelectMonth() {}, onSelectDay() {}, onSelectTheme() {},
    }));
    assert.match(markup, /role="tabpanel"/);
    assert.ok(markup.length > 500, `${tab} should render meaningful content`);
    const tabContent = {
      "Lá số": "Bản đồ 12 cung",
      "Luận cung": "Tự hiểu mình",
      "Đại vận": "Tạo nền",
      "Tiểu vận": "Sắp xếp ưu tiên",
      "Nguyệt vận": "Khởi động vừa sức",
      "Nhật vận": "Tập trung vào điều có thể làm hôm nay",
      "Chuyên đề": "Giá trị và lựa chọn",
    }[tab];
    assert.ok(markup.includes(tabContent), `${tab} should render its matching fixture`);
  }
  assert.equal(DEMO_PALACE_REFLECTIONS.length, 12);
  assert.equal(DEMO_DASHA_FIXTURES.length, 6);
  assert.equal(DEMO_MINOR_YEAR_FIXTURES.length, 10);
  assert.equal(DEMO_MONTH_FIXTURES.length, 12);
  assert.equal(DEMO_THEME_FIXTURES.length, 6);
  assert.ok(DEMO_DAY_FIXTURE.reflection.length > 0);
});

test("saved charts can be reopened and edited without duplicating the chart ID", () => {
  installMemoryStorage();
  const first = saveDemoAstrologyChart(validInput, undefined, new Date("2026-01-01T00:00:00.000Z"));
  assert.equal(loadDemoAstrologyCharts().length, 1);
  assert.equal(getDemoAstrologyChart(first.id)?.input.fullName, "Nguyễn An");
  const edited = saveDemoAstrologyChart({ ...validInput, fullName: "Nguyễn An đã sửa", targetYear: 2027 }, first.id, new Date("2026-02-01T00:00:00.000Z"));
  assert.equal(edited.id, first.id);
  assert.equal(edited.createdAt, first.createdAt);
  assert.equal(loadDemoAstrologyCharts().length, 1);
  assert.equal(getDemoAstrologyChart(first.id)?.input.targetYear, 2027);
  const second = saveDemoAstrologyChart({ ...validInput, fullName: "Bản mới" });
  assert.notEqual(second.id, first.id);
  assert.equal(loadDemoAstrologyCharts().length, 2);
});

test("astrology-only reset preserves commerce state; namespace reset clears astrology demo data", () => {
  const entries = installMemoryStorage();
  saveDemoAstrologyChart(validInput);
  entries.set("tltl-demo-commerce-state-v1", "commerce-preserved");
  entries.set("production-profile", "production-preserved");
  resetDemoAstrologyCharts();
  assert.deepEqual(loadDemoAstrologyCharts(), []);
  assert.equal(entries.get("tltl-demo-commerce-state-v1"), "commerce-preserved");
  saveDemoAstrologyChart(validInput);
  clearDemoValues();
  assert.deepEqual(readDemoValue(DEMO_ASTROLOGY_STORAGE_KEY, []), []);
  assert.equal(entries.has("tltl-demo-commerce-state-v1"), false);
  assert.equal(entries.get("production-profile"), "production-preserved");
});

test("saving and resetting astrology data are blocked outside Demo Mode", () => {
  const entries = installMemoryStorage();
  globalThis.window.location.search = "";
  globalThis.window.sessionStorage.getItem = () => null;
  assert.throws(() => saveDemoAstrologyChart(validInput), /Demo Mode/);
  assert.throws(() => resetDemoAstrologyCharts(), /Demo Mode/);
  assert.equal(entries.has(`tltl-demo-${DEMO_ASTROLOGY_STORAGE_KEY}`), false);
});

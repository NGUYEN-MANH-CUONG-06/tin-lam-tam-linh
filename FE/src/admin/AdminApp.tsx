import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpenText,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  CreditCard,
  ClipboardCheck,
  Crown,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  Filter,
  Gift,
  Globe,
  Handshake,
  LayoutDashboard,
  LayoutGrid,
  LibraryBig,
  List,
  Lock,
  LogOut,
  Mail,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  UsersRound,
  X,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { ApiError, apiRequest } from "../lib/api";
import { DEMO_MODE_LABEL, exitDemoMode, isDemoMode } from "../data/demoMode";
import {
  loginAccount,
  logoutAccount,
  restoreSession,
} from "../data/authService";
import {
  loadAdminList,
  loadAdminOverview,
  reviewAdminRecord,
  getDemoAdminRecord,
  requestDemoAdminChanges,
  type AdminOverview,
  type AdminPage,
  type AdminRecord,
} from "../data/adminService";
import { ContentEditor, type Kind } from "./ContentEditor";
import { ContentDetailModal } from "./ContentDetailModal";
import { DemoCatalogStatusPanel } from "./DemoCatalogStatusPanel";
import { getContentCardCategory, getContentCardStatus } from "./contentCardPresentation";
import { SignalAdminPanel } from "./SignalAdminPanel";
import { PartnershipPanel } from "../components/PartnershipPanel";
import { AdminPaymentsPanel } from "./AdminPaymentsPanel";
import { AdminPaymentAlertsPanel } from "./AdminPaymentAlertsPanel";
import { AdminPartnerGiftsPanel } from "./AdminPartnerGiftsPanel";
import {
  SparklineChart,
  InteractiveTrendChart,
  DonutChart,
  ContentStatusBarChart,
  ContentSectionAnalyticsDeck,
} from "./AdminCharts";
import { LogoutConfirmDialog } from "../components/LogoutConfirmDialog";
import { toast, ToastContainer } from "../components/ui/Toast";
import { EDITOR_SECTIONS, getAdminAccessState, getAllowedAdminSection } from "./adminAccess";
import { allowedEditorialActions, editorialStatusLabel as sharedEditorialStatusLabel } from "../../../shared/editorial-workflow.mjs";
import { TeamAccessPanel } from "./TeamAccessPanel";
import { ReviewQueuePanel } from "./ReviewQueuePanel";
import {
  getAdminSectionFromSearch,
  getAdminSectionUrl,
  closeAdminOverlay,
  pushAdminOverlay,
  type AdminSection,
} from "./adminNavigation";
import "./admin.css";

type Section = AdminSection;
type ReviewField = "verified" | "active";
type ContentFilter = "all" | "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "HIDDEN" | "REVOKED" | "needs_source";
type ViewMode = "grid" | "table";

function isReviewableSection(section: Section): section is Kind {
  return ["culture", "calendar", "xam", "rituals", "prayers"].includes(section);
}

const NAV: Array<{
  id: Section;
  label: string;
  icon: typeof LayoutDashboard;
  group: string;
}> = [
  {
    id: "overview",
    label: "Tổng quan",
    icon: LayoutDashboard,
    group: "TỔNG QUAN",
  },
  {
    id: "review-queue",
    label: "Hàng chờ duyệt",
    icon: ClipboardCheck,
    group: "KIỂM DUYỆT",
  },
  {
    id: "culture",
    label: "Kho văn hóa",
    icon: BookOpenText,
    group: "KHO NỘI DUNG",
  },
  {
    id: "calendar",
    label: "Lịch sự kiện",
    icon: CalendarDays,
    group: "KHO NỘI DUNG",
  },
  { id: "xam", label: "Danh mục xin xăm", icon: LibraryBig, group: "KHO NỘI DUNG" },
  { id: "rituals", label: "Nghi lễ", icon: BookOpenText, group: "KHO NỘI DUNG" },
  { id: "prayers", label: "Văn khấn", icon: FileCheck2, group: "KHO NỘI DUNG" },
  { id: "signals", label: "Lời chiêm nghiệm", icon: Sparkles, group: "KHO NỘI DUNG" },
  {
    id: "payments",
    label: "Đơn thanh toán",
    icon: CreditCard,
    group: "VẬN HÀNH & ĐỐI TÁC",
  },
  {
    id: "payment-alerts",
    label: "Cảnh báo thanh toán",
    icon: ShieldAlert,
    group: "VẬN HÀNH & ĐỐI TÁC",
  },
  {
    id: "partnerships",
    label: "Đề xuất hợp tác",
    icon: Handshake,
    group: "VẬN HÀNH & ĐỐI TÁC",
  },
  {
    id: "partner-gifts",
    label: "Hộp quà văn hóa",
    icon: Gift,
    group: "VẬN HÀNH & ĐỐI TÁC",
  },
  {
    id: "membership-interests",
    label: "Quan tâm hội viên",
    icon: UsersRound,
    group: "VẬN HÀNH & ĐỐI TÁC",
  },
  {
    id: "audit-logs",
    label: "Nhật ký quản trị",
    icon: FileCheck2,
    group: "QUẢN TRỊ HỆ THỐNG",
  },
  { id: "team", label: "Tài khoản nhóm", icon: UsersRound, group: "QUẢN TRỊ HỆ THỐNG" },
];

const TITLES: Record<
  Section,
  { title: string; description: string; tag: string }
> = {
  overview: {
    title: "Tổng quan vận hành",
    description:
      "Bảng tổng hợp chỉ số hoạt động, chất lượng nội dung và tiến độ kết nối hội viên.",
    tag: "TỔNG QUAN ĐIỀU HÀNH",
  },
  "review-queue": {
    title: "Hàng chờ duyệt",
    description: "Xem các nội dung thành viên gửi lên và mở đúng danh mục để thẩm định.",
    tag: "KIỂM DUYỆT NỘI DUNG",
  },
  culture: {
    title: "Kho văn hóa",
    description:
      "Kiểm tra nguồn tham khảo và quản lý trạng thái công khai của tư liệu văn hóa Việt.",
    tag: "TƯ LIỆU VĂN HÓA",
  },
  calendar: {
    title: "Lịch sự kiện",
    description:
      "Kiểm tra ngày âm/dương, loại sự kiện lễ hội và liên kết nguồn tham chiếu.",
    tag: "LỄ HỘI CỔ TRUYỀN",
  },
  xam: {
    title: "Danh mục xin xăm",
    description:
      "Quản lý thẻ xăm, thơ và diễn giải cùng trạng thái thẩm định.",
    tag: "CHIÊM NGHIỆM",
  },
  rituals: {
    title: "Nghi lễ truyền thống",
    description:
      "Rà soát quy trình nghi lễ, xuất xứ vùng miền và hướng dẫn phong tục chu chuẩn.",
    tag: "NGHI THỨC",
  },
  prayers: {
    title: "Văn khấn cổ truyền",
    description:
      "Đối chiếu văn tự Hán Nôm/Quốc ngữ, locator nguồn lưu trữ và xác nhận bản quyền.",
    tag: "VĂN TỰ THỜ CÚNG",
  },
  signals: {
    title: "Lời chiêm nghiệm",
    description: "Biên tập và duyệt nội dung check-in theo cảm xúc, ngữ cảnh và hồ sơ nguồn thực tế.",
    tag: "CHECK-IN · TƯ LIỆU BIÊN TẬP",
  },
  payments: {
    title: "Quản lý đơn thanh toán",
    description: "Theo dõi đơn hội viên, gói vật phẩm và đối soát giao dịch thời gian thực từ cổng thanh toán.",
    tag: "GIAO DỊCH & DOANH THU",
  },
  "payment-alerts": {
    title: "Cảnh báo giao dịch thanh toán",
    description: "Giám sát các giao dịch chênh lệch, nghi vấn hoặc sự cố IPN cần rà soát kiểm tra tài chính.",
    tag: "AN TOÀN TÀI CHÍNH",
  },
  partnerships: {
    title: "Quản lý đề xuất hợp tác",
    description: "Tiếp nhận và phản hồi hồ sơ liên hệ, đề xuất hợp tác từ các ban quản lý di tích và đối tác.",
    tag: "HỢP TÁC CHIẾN LƯỢC",
  },
  "partner-gifts": {
    title: "Hộp quà văn hóa từ đối tác",
    description: "Quản lý quà tặng văn hóa đối tác, liên kết trải nghiệm và trạng thái phân phối tới người dùng.",
    tag: "QUÀ TẶNG VĂN HÓA",
  },
  "membership-interests": {
    title: "Quan tâm hội viên",
    description:
      "Danh sách người dùng tiềm năng đã tự nguyện đăng ký nhận thông tin gói hội viên.",
    tag: "ĐĂNG KÝ NHẬN CẬP NHẬT",
  },
  "audit-logs": {
    title: "Nhật ký quản trị",
    description:
      "Lịch sử chi tiết mọi thao tác kiểm duyệt, thay đổi trạng thái nội dung của quản trị viên.",
    tag: "HỆ THỐNG KIỂM SOÁT",
  },
  team: {
    title: "Tài khoản nhóm",
    description: "Quản lý cơ cấu nhân sự, cấp quyền biên tập và kiểm soát an toàn truy cập nội bộ.",
    tag: "PHÂN QUYỀN NỘI BỘ",
  },
};

const DEMO_ADMIN_MODULES: Partial<Record<Section, {
  stats: Array<{ label: string; value: string }>;
  rows: Array<{ title: string; detail: string; status: string; meta: string }>;
}>> = {
  signals: {
    stats: [{ label: "Tổng lời khuyên", value: "24" }, { label: "Chờ duyệt", value: "5" }, { label: "Đang hiển thị", value: "19" }],
    rows: [
      { title: "Chậm lại để lắng nghe", detail: "An yên · Bình an & Tâm trí", status: "Chờ duyệt", meta: "Cập nhật hôm nay · Tài khoản demo" },
      { title: "Chia nhỏ việc cần làm", detail: "Công việc · Tập trung", status: "Đang hiển thị", meta: "Cập nhật hôm qua · Tài khoản demo" },
      { title: "Gửi lời hỏi thăm", detail: "Gia đình · Kết nối", status: "Bản nháp", meta: "Cập nhật 2 ngày trước · Tài khoản demo" },
    ],
  },
  payments: {
    stats: [{ label: "Đơn trong tháng", value: "128" }, { label: "Đã thanh toán", value: "96" }, { label: "Cần đối soát", value: "4" }],
    rows: [
      { title: "TL-DEMO-24081 · Nguyễn Minh Anh", detail: "Gói An Nhiên · 3 tháng", status: "Đã thanh toán", meta: "450.000 ₫ · Hôm nay, 09:42" },
      { title: "TL-DEMO-24080 · Trần Thu Hà", detail: "Hộp quà văn hóa · Trầm hương", status: "Chờ xác nhận", meta: "320.000 ₫ · Hôm nay, 08:17" },
      { title: "TL-DEMO-24079 · Lê Hoàng Nam", detail: "Gói Đồng Hành · 12 tháng", status: "Đã thanh toán", meta: "1.200.000 ₫ · Hôm qua, 20:31" },
    ],
  },
  "payment-alerts": {
    stats: [{ label: "Cảnh báo mới", value: "3" }, { label: "Đang rà soát", value: "2" }, { label: "Đã xử lý", value: "11" }],
    rows: [
      { title: "IPN phản hồi chậm · TL-DEMO-24075", detail: "Cổng thanh toán · Gói An Nhiên", status: "Cần rà soát", meta: "450.000 ₫ · 12 phút trước" },
      { title: "Số tiền lệch · TL-DEMO-24062", detail: "Đơn hàng · Hộp quà văn hóa", status: "Đang kiểm tra", meta: "320.000 ₫ · Hôm nay, 08:03" },
      { title: "Giao dịch lặp · TL-DEMO-24018", detail: "Cổng thanh toán · Gói Đồng Hành", status: "Đã xử lý", meta: "1.200.000 ₫ · Hôm qua" },
    ],
  },
  partnerships: {
    stats: [{ label: "Hồ sơ mới", value: "7" }, { label: "Đang trao đổi", value: "4" }, { label: "Đã hợp tác", value: "12" }],
    rows: [
      { title: "Ban quản lý di tích Phủ Dầy", detail: "Đề xuất nội dung lễ hội và tư liệu địa phương", status: "Mới tiếp nhận", meta: "Nguyễn Thu Trang · Hôm nay" },
      { title: "Hợp tác quà tặng làng nghề Huế", detail: "Kết nối sản phẩm thủ công với trải nghiệm văn hóa", status: "Đang trao đổi", meta: "Trần Minh Đức · Hôm qua" },
      { title: "Trung tâm bảo tồn di sản miền Trung", detail: "Đề xuất chia sẻ nguồn tư liệu", status: "Đã xác nhận", meta: "Lê Hoàng Nam · 18/10/2026" },
    ],
  },
  "partner-gifts": {
    stats: [{ label: "Mẫu quà", value: "18" }, { label: "Đang phân phối", value: "12" }, { label: "Đơn chờ gửi", value: "6" }],
    rows: [
      { title: "Trầm hương An Nhiên", detail: "Mã quà DEMO-GIFT-08 · Đối tác Huế", status: "Đang phân phối", meta: "Còn 42 phần · Cập nhật hôm nay" },
      { title: "Trà sen hồ Tịnh Tâm", detail: "Mã quà DEMO-GIFT-12 · Đối tác Huế", status: "Chờ bổ sung", meta: "Còn 8 phần · Cập nhật hôm qua" },
      { title: "Sổ tay di sản Việt", detail: "Mã quà DEMO-GIFT-03 · Đối tác Hà Nội", status: "Đang phân phối", meta: "Còn 76 phần · 20/10/2026" },
    ],
  },
  team: {
    stats: [{ label: "Thành viên", value: "6" }, { label: "Quản trị viên", value: "2" }, { label: "Biên tập viên", value: "4" }],
    rows: [
      { title: "An Nhiên · admin.demo@tinlam.local", detail: "Quản trị viên · Toàn quyền quản trị", status: "Đang hoạt động", meta: "Đăng nhập gần nhất: hôm nay, 09:10" },
      { title: "Minh Anh · editor.demo@tinlam.local", detail: "Biên tập viên · Văn hóa, lịch sự kiện", status: "Đang hoạt động", meta: "Đăng nhập gần nhất: hôm qua" },
      { title: "Thu Hà · review.demo@tinlam.local", detail: "Biên tập viên · Nghi lễ, văn khấn", status: "Đang hoạt động", meta: "Đăng nhập gần nhất: 21/10/2026" },
    ],
  },
};

function readableError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403)
      return "Tài khoản đã đăng nhập nhưng chưa được cấp quyền ADMIN.";
    if (error.status === 401)
      return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
    return error.message;
  }
  return "Không thể tải dữ liệu. Hãy kiểm tra kết nối API rồi thử lại.";
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  return String(value);
}

function dateValue(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function editorialStatusLabel(row: AdminRecord) {
  const status = String(row.editorial_status || "DRAFT");
  return status === "REVOKED"
    ? `${sharedEditorialStatusLabel(status)} (dữ liệu cũ)`
    : sharedEditorialStatusLabel(status);
}

function getArticleProvenance(record: AdminRecord) {
  const content = record.content && typeof record.content === "object" ? record.content as Record<string, unknown> : {};
  return content.provenance && typeof content.provenance === "object" ? content.provenance as Record<string, unknown> : {};
}

function isGroupAuthoredCulture(record: AdminRecord) {
  return getArticleProvenance(record).contentType === "GROUP_AUTHORED";
}

function getRitualProvenance(record: AdminRecord) {
  return record.content_provenance && typeof record.content_provenance === "object"
    ? record.content_provenance as Record<string, unknown>
    : {};
}

function isGroupAuthoredRitual(record: AdminRecord) {
  return getRitualProvenance(record).contentType === "GROUP_AUTHORED";
}

function reviewProvenanceIsIncomplete(
  section: Section,
  record: AdminRecord,
  rightsConfirmed: boolean,
  usageRights: string,
  sourceUrl: string,
  sourceLocator: string,
  imageRightsConfirmed = false,
) {
  if (!rightsConfirmed) return true;
  if (section === "culture") {
    const provenance = getArticleProvenance(record);
    const groupAuthored = isGroupAuthoredCulture(record);
    const contentRightsIncomplete = groupAuthored
      ? usageRights !== "group-authored" || !String(provenance.contentRightsBasis || "").trim()
      : !["confirmed", "public-domain"].includes(usageRights);
    const imageRightsIncomplete = Boolean(record.image_url) && (
      !imageRightsConfirmed
      || !String(provenance.imageCaption || "").trim()
      || !String(provenance.imageSource || "").trim()
      || !String(provenance.imageRightsBasis || "").trim()
    );
    return contentRightsIncomplete || imageRightsIncomplete;
  }
  if (section === "rituals") {
    const provenance = getRitualProvenance(record);
    const imageRightsIncomplete = Boolean(record.image_url) && (
      !imageRightsConfirmed
      || !String(provenance.imageCaption || "").trim()
      || !String(provenance.imageCredit || "").trim()
      || !/^https:\/\/[^\s]+$/i.test(String(provenance.imageSource || "").trim())
      || !String(provenance.imageRightsBasis || "").trim()
    );
    const contentRightsIncomplete = isGroupAuthoredRitual(record)
      ? !String(provenance.authorOrOrganization || "").trim()
        || !String(provenance.scope || "").trim()
        || !String(provenance.contentRightsBasis || "").trim()
      : !/^https:\/\//i.test(sourceUrl.trim())
        || sourceLocator.trim().length < 2
        || !["confirmed", "public-domain"].includes(usageRights);
    return contentRightsIncomplete || imageRightsIncomplete;
  }
  if (section === "prayers") {
    return !/^https:\/\//i.test(sourceUrl.trim())
      || sourceLocator.trim().length < 2
      || !["confirmed", "public-domain"].includes(usageRights);
  }
  return false;
}

function getCultureApprovalIssues(record: AdminRecord) {
  const content = record.content && typeof record.content === "object"
    ? record.content as Record<string, unknown>
    : {};
  const provenance = content.provenance && typeof content.provenance === "object"
    ? content.provenance as Record<string, unknown>
    : {};
  const groupAuthored = provenance.contentType === "GROUP_AUTHORED";
  const sections = Array.isArray(content.sections) ? content.sections : [];
  const issues: string[] = [];

  if (content.contentKind !== "article" || !sections.some((section) => {
    if (!section || typeof section !== "object") return false;
    return String((section as Record<string, unknown>).body || "").trim().length >= 120;
  })) {
    issues.push("cần ít nhất một phần nội dung dài 120 ký tự");
  }
  if (!groupAuthored && !String(provenance.sourceTitle || "").trim()) {
    issues.push("thiếu tên nguồn tư liệu");
  }
  if (!groupAuthored && !String(provenance.bibliography || provenance.sourceUrl || record.source || "").trim()) {
    issues.push("thiếu URL hoặc thông tin thư mục nguồn");
  }
  if (!groupAuthored && !String(provenance.sourceLocator || "").trim()) {
    issues.push("thiếu trang hoặc vị trí trích dẫn");
  }
  if (Boolean(record.image_url) && (
    !String(provenance.imageCaption || "").trim()
    || !String(provenance.imageSource || "").trim()
    || !String(provenance.imageRightsBasis || "").trim()
  )) {
    issues.push("ảnh cần chú thích, nguồn ảnh và căn cứ quyền sử dụng");
  }
  return issues;
}

function reviewSubmitBlockMessage(
  section: Section | null,
  record: AdminRecord,
  reviewField: ReviewField | null,
  reviewValue: boolean,
  reviewNote: string,
  rightsConfirmed: boolean,
  usageRights: string,
  sourceUrl: string,
  sourceLocator: string,
  imageRightsConfirmed = false,
) {
  if (reviewField !== "verified" || !reviewValue) return "";
  if (!section || !isReviewableSection(section)) return "";
  if (section === "culture") {
    const issues = getCultureApprovalIssues(record);
    if (issues.length) {
      return `Chưa thể phê duyệt: ${issues.join("; ")}. Hãy yêu cầu Editor bổ sung rồi gửi duyệt lại.`;
    }
  }
  if (reviewNote.trim().length < 8) return "Ghi chú thẩm định cần ít nhất 8 ký tự.";
  if (reviewProvenanceIsIncomplete(section, record, rightsConfirmed, usageRights, sourceUrl, sourceLocator, imageRightsConfirmed)) {
    if (!rightsConfirmed) return "Hãy đánh dấu xác nhận đã đối chiếu nguồn và quyền sử dụng ở trên.";
    if (section === "culture" && isGroupAuthoredCulture(record)
      && (usageRights !== "group-authored" || !String(getArticleProvenance(record).contentRightsBasis || "").trim())) {
      return "Hãy xác nhận nội dung nguyên bản do nhóm biên soạn và kiểm tra căn cứ quyền nội dung trong hồ sơ.";
    }
    if (section === "culture" && Boolean(record.image_url) && !imageRightsConfirmed) {
      return "Bài có ảnh: hãy xác nhận đã kiểm tra hồ sơ nguồn và quyền ảnh riêng.";
    }
    if (section === "rituals" && Boolean(record.image_url)) {
      const provenance = getRitualProvenance(record);
      if (!String(provenance.imageCaption || "").trim()) return "Ảnh tổng quan nghi lễ còn thiếu chú thích.";
      if (!String(provenance.imageCredit || "").trim()) return "Ảnh tổng quan nghi lễ còn thiếu tác giả hoặc thông tin ghi công.";
      if (!/^https:\/\/[^\s]+$/i.test(String(provenance.imageSource || "").trim())) return "Ảnh tổng quan nghi lễ cần URL HTTPS của trang nguồn ảnh.";
      if (!String(provenance.imageRightsBasis || "").trim()) return "Ảnh tổng quan nghi lễ còn thiếu căn cứ quyền sử dụng.";
      if (!imageRightsConfirmed) return "Hãy xác nhận đã kiểm tra riêng căn cứ quyền sử dụng ảnh nghi lễ.";
    }
    if (section === "culture" && Boolean(record.image_url) && (
      !String(getArticleProvenance(record).imageCaption || "").trim()
      || !String(getArticleProvenance(record).imageSource || "").trim()
      || !String(getArticleProvenance(record).imageRightsBasis || "").trim()
    )) {
      return "Ảnh cần có chú thích, nguồn ảnh và căn cứ quyền sử dụng trong hồ sơ.";
    }
    if ((section === "culture" || section === "prayers" || (section === "rituals" && !isGroupAuthoredRitual(record)))
      && !["confirmed", "public-domain"].includes(usageRights)) {
      return "Hãy chọn căn cứ quyền sử dụng đã xác minh: có giấy phép hoặc thuộc phạm vi công cộng.";
    }
    return "Hãy hoàn tất các trường nguồn và căn cứ quyền bắt buộc ở trên.";
  }
  return "";
}

function getRecordTitle(row: AdminRecord, section: Section): string {
  if (typeof row.title === "string" && row.title.trim()) {
    return row.title.trim();
  }
  if (typeof row.name === "string" && row.name.trim()) {
    return row.name.trim();
  }
  if (section === "xam") {
    const stick =
      row.stick_number !== undefined && row.stick_number !== null
        ? `Thẻ số ${row.stick_number}`
        : "Thẻ xăm";
    const cat = row.category ? `: ${row.category}` : "";
    const fortune = row.fortune_level ? ` (${row.fortune_level})` : "";
    return `${stick}${cat}${fortune}`;
  }
  if (typeof row.email === "string" && row.email.trim()) {
    return row.email.trim();
  }
  if (typeof row.action === "string" && row.action.trim()) {
    return row.action.trim();
  }
  if (typeof row.slug === "string" && row.slug.trim()) {
    return `/${row.slug.trim()}`;
  }
  if (row.id) {
    return `Mục #${String(row.id).slice(0, 8)}`;
  }
  return "Không có tiêu đề";
}

export default function AdminApp() {
  const { dark, toggleTheme } = useTheme();
  const [section, setSection] = useState<Section>(() =>
    getAdminSectionFromSearch(window.location.search),
  );
  const [adminName, setAdminName] = useState("");
  const [userRole, setUserRole] = useState("USER");
  const [booting, setBooting] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [sessionUnavailable, setSessionUnavailable] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [pendingQueueCount, setPendingQueueCount] = useState<number | null>(null);
  const [reviewQueueKey, setReviewQueueKey] = useState(0);
  const [pageData, setPageData] = useState<AdminPage<AdminRecord> | null>(null);
  const [rows, setRows] = useState<AdminRecord[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [publishingXam, setPublishingXam] = useState(false);
  const [xamPublicationMessage, setXamPublicationMessage] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [reviewRecord, setReviewRecord] = useState<AdminRecord | null>(null);
  const [reviewField, setReviewField] = useState<ReviewField | null>(null);
  const [reviewSection, setReviewSection] = useState<Kind | null>(null);
  const [reviewValue, setReviewValue] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [imageRightsConfirmed, setImageRightsConfirmed] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceLocator, setSourceLocator] = useState("");
  const [usageRights, setUsageRights] = useState<
    "confirmed" | "public-domain" | "permission-required" | "unknown" | "group-authored"
  >("unknown");
  const [editing, setEditing] = useState<{
    kind: "culture" | "calendar" | "xam" | "rituals" | "prayers";
    id?: string;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const contentEdit = params.get("contentEdit") as Kind | null;
    if (contentEdit && ["culture", "calendar", "xam", "rituals", "prayers"].includes(contentEdit)) {
      const editId = params.get("editId") || undefined;
      return { kind: contentEdit, id: editId };
    }
    return null;
  });
  const [savingReview, setSavingReview] = useState(false);
  const [contentDetails, setContentDetails] = useState<{ kind: Kind; id: string; record: AdminRecord } | null>(null);
  const [changeRequestNote, setChangeRequestNote] = useState("");
  const [contentDetailError, setContentDetailError] = useState("");

  // New Interactive Controls
  const [activeFilter, setActiveFilter] = useState<ContentFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const latestRequest = useRef(0);

  const fetchSection = useCallback(
    async (target: Section, nextPage = 1, query = "", status: ContentFilter = "all") => {
      if (target === "signals" || target === "review-queue") {
        latestRequest.current += 1;
        setLoading(false);
        setPageData(null);
        setRows([]);
        return;
      }
      const requestId = ++latestRequest.current;
      setLoading(true);
      setError("");
      try {
        if (target === "overview") {
          const data = await loadAdminOverview();
          if (requestId !== latestRequest.current) return;
          setOverview(data);
          setPageData(null);
          setRows([]);
        } else if (
          target === "payments" ||
          target === "payment-alerts" ||
          target === "partnerships" ||
          target === "partner-gifts" ||
          target === "team"
        ) {
          if (requestId !== latestRequest.current) return;
          setPageData(null);
          setRows([]);
        } else {
          const data = await loadAdminList<AdminRecord>(
            target,
            nextPage,
            query,
            status,
          );
          if (requestId !== latestRequest.current) return;
          setPageData(data);
          setRows(data.items);
        }
      } catch (loadError) {
        if (requestId !== latestRequest.current) return;
        const message = readableError(loadError);
        setError(message);
        if (loadError instanceof ApiError && loadError.status === 403)
          setForbidden(true);
      } finally {
        if (requestId === latestRequest.current) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let mounted = true;
    if (isDemoMode()) {
      const requestedSection = getAdminSectionFromSearch(window.location.search);
      const requestedStatus = new URLSearchParams(window.location.search).get("status") as ContentFilter | null;
      const initialFilter: ContentFilter = requestedStatus && ["all", "DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "HIDDEN", "REVOKED", "needs_source"].includes(requestedStatus)
        ? requestedStatus
        : "all";
      setAdminName("Quản trị viên demo");
      setUserRole("ADMIN");
      setIsAuthenticated(true);
      setSection(requestedSection);
      setActiveFilter(initialFilter);
      void (async () => {
        await fetchSection(requestedSection, 1, "", initialFilter);
        if (mounted) setBooting(false);
      })();
      return () => { mounted = false; };
    }
    void restoreSession().then(async (session) => {
      if (!mounted) return;
      const user = session.user;
      if (session.status === "unavailable") {
        setSessionUnavailable(session.message);
        setBooting(false);
        return;
      }
      if (!user) {
        setBooting(false);
        // Chưa đăng nhập: chuyển hướng sang màn hình đăng nhập chung
        window.location.replace("/?login=true&redirect=/admin");
        return;
      }
      if (user.role?.toUpperCase() === "EDITOR") {
        const requestedSection = getAdminSectionFromSearch(window.location.search);
        const editorSection = EDITOR_SECTIONS.includes(requestedSection as (typeof EDITOR_SECTIONS)[number])
          ? requestedSection
          : "culture";
        window.location.replace(`/editor?section=${encodeURIComponent(editorSection)}`);
        return;
      }
      const access = getAdminAccessState(user);
      if (access === "forbidden") {
        setForbidden(true);
        setBooting(false);
        return;
      }
      setAdminName(user.name);
      setUserRole(user.role?.toUpperCase() || "USER");
      setIsAuthenticated(true);
      const requestedSection = getAdminSectionFromSearch(window.location.search);
      const initialSection = getAllowedAdminSection(user.role, requestedSection) as Section;
      const requestedStatus = new URLSearchParams(window.location.search).get("status") as ContentFilter | null;
      const initialFilter: ContentFilter = requestedStatus && ["all", "DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "HIDDEN", "REVOKED", "needs_source"].includes(requestedStatus)
        ? requestedStatus
        : "all";
      setSection(initialSection);
      setActiveFilter(initialFilter);
      if (initialSection !== requestedSection) {
        window.history.replaceState(window.history.state, "", getAdminSectionUrl(window.location.href, initialSection));
      }
      await fetchSection(initialSection, 1, "", initialFilter);
      if (mounted) {
        setBooting(false);
        if (initialSection !== "overview") {
          void loadAdminOverview().then((data) => {
            if (mounted && data) {
              setOverview(data);
            }
          }).catch(() => {});
        }
        try {
          const justLoggedIn = sessionStorage.getItem("tltl_admin_just_logged_in");
          if (justLoggedIn) {
            sessionStorage.removeItem("tltl_admin_just_logged_in");
            toast.success(
              `Chào mừng Quản trị viên ${justLoggedIn} đã trở lại Cổng điều hành Tin Lắm Tâm Linh!`,
              "Đăng nhập thành công"
            );
          }
        } catch {}
      }
    });
    return () => {
      mounted = false;
    };
  }, [fetchSection]);

  const navigate = (target: Section, initialFilter: ContentFilter = "all") => {
    if (userRole === "EDITOR" && !EDITOR_SECTIONS.includes(target as (typeof EDITOR_SECTIONS)[number])) return;
    const nextUrl = new URL(getAdminSectionUrl(window.location.href, target), window.location.origin);
    if (initialFilter === "all") nextUrl.searchParams.delete("status");
    else nextUrl.searchParams.set("status", initialFilter);
    nextUrl.searchParams.delete("signalEdit");
    nextUrl.searchParams.delete("signalDetail");
    window.history.pushState(
      { adminSection: target, status: initialFilter },
      "",
      `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
    );
    setSection(target);
    setPage(1);
    setSearch("");
    setSearchDraft("");
    setActiveFilter(initialFilter);
    setReviewRecord(null);
    setEditing(null);
    setMobileNavOpen(false);
    window.dispatchEvent(new CustomEvent("admin:close-modals"));
    void fetchSection(target, 1, "", initialFilter);
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const contentEdit = params.get("contentEdit") as Kind | null;
      if (contentEdit && ["culture", "calendar", "xam", "rituals", "prayers"].includes(contentEdit)) {
        const editId = params.get("editId") || undefined;
        setEditing({ kind: contentEdit, id: editId });
      } else {
        setEditing(null);
      }
      if (reviewRecord) {
        setReviewRecord(null);
        setReviewField(null);
        return;
      }
      const target = getAllowedAdminSection(userRole, getAdminSectionFromSearch(window.location.search)) as Section;
      const requested = getAdminSectionFromSearch(window.location.search);
      if (target !== requested) {
        window.history.replaceState(window.history.state, "", getAdminSectionUrl(window.location.href, target));
      }
      setSection(target);
      setPage(1);
      setSearch("");
      setSearchDraft("");
      const requestedStatus = new URLSearchParams(window.location.search).get("status") as ContentFilter | null;
      const restoredFilter: ContentFilter = requestedStatus && ["all", "DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "HIDDEN", "REVOKED", "needs_source"].includes(requestedStatus)
        ? requestedStatus
        : "all";
      setActiveFilter(restoredFilter);
      setReviewRecord(null);
      void fetchSection(target, 1, "", restoredFilter);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [fetchSection, reviewRecord, userRole]);

  const openContentEditor = (kind: Kind, id?: string) => {
    pushAdminOverlay("content-editor");
    setEditing({ kind, id });
    const url = new URL(window.location.href);
    url.searchParams.set("contentEdit", kind);
    if (id) url.searchParams.set("editId", id);
    else url.searchParams.delete("editId");
    window.history.pushState(window.history.state, "", url.toString());
  };

  const openContentDetails = async (kind: Kind, id: string) => {
    setContentDetailError("");
    setChangeRequestNote("");
    try {
      const record = isDemoMode()
        ? getDemoAdminRecord(kind, id)
        : await apiRequest<AdminRecord>(`/admin/${kind}/${encodeURIComponent(id)}`);
      if (!record) throw new Error("Không tìm thấy hồ sơ demo này.");
      setContentDetails({ kind, id, record });
      const url = new URL(window.location.href);
      url.searchParams.set("contentEdit", kind);
      url.searchParams.set("editId", id);
      window.history.replaceState(window.history.state, "", url.toString());
    } catch (detailError) {
      setContentDetailError(detailError instanceof Error ? detailError.message : "Không thể tải nội dung.");
    }
  };

  const closeContentDetails = () => {
    setContentDetails(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("contentEdit");
    url.searchParams.delete("editId");
    window.history.replaceState(window.history.state, "", url.toString());
  };

  const requestContentChanges = async () => {
    if (!contentDetails || changeRequestNote.trim().length < 8) {
      setContentDetailError("Vui lòng nhập lý do chỉnh sửa, tối thiểu 8 ký tự.");
      return;
    }
    setContentDetailError("");
    try {
      if (isDemoMode()) requestDemoAdminChanges(contentDetails.kind, contentDetails.id, changeRequestNote.trim());
      else await apiRequest(`/admin/${contentDetails.kind}/${encodeURIComponent(contentDetails.id)}/request-changes`, {
        method: "POST",
        body: JSON.stringify({ expectedUpdatedAt: contentDetails.record.updated_at, reviewNote: changeRequestNote.trim() }),
      });
      const title = getRecordTitle(contentDetails.record, contentDetails.kind);
      closeContentDetails();
      setChangeRequestNote("");
      setReviewQueueKey((key) => key + 1);
      await fetchSection(section, page, search, activeFilter);
      toast.success(`Đã gửi yêu cầu chỉnh sửa cho nội dung "${title}".`, "Yêu cầu chỉnh sửa");
    } catch (requestError) {
      const msg = requestError instanceof Error ? requestError.message : "Không thể gửi yêu cầu chỉnh sửa.";
      setContentDetailError(msg);
      toast.error(msg, "Lỗi gửi yêu cầu");
    }
  };

  const closeContentEditor = () => {
    setEditing(null);
    closeAdminOverlay("content-editor");
    const url = new URL(window.location.href);
    url.searchParams.delete("contentEdit");
    url.searchParams.delete("editId");
    window.history.pushState(window.history.state, "", url.toString());
  };

  const closeReview = () => {
    setReviewRecord(null);
    setReviewField(null);
    setReviewSection(null);
    closeAdminOverlay("review");
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = searchDraft.trim();
    setSearch(next);
    setPage(1);
    if (section !== "overview") void fetchSection(section, 1, next, activeFilter);
  };

  const handleClearSearch = () => {
    setSearchDraft("");
    setSearch("");
    setPage(1);
    if (section !== "overview") void fetchSection(section, 1, "", activeFilter);
  };

  const publishOriginalXam = async () => {
    if (publishingXam || isDemoMode() || userRole !== "ADMIN") return;
    const confirmed = window.confirm("Phát hành riêng bộ TLTL_ORIGINAL_100_V1 phiên bản 1.0.1-draft? Máy chủ chỉ chấp nhận khi đủ 100 quẻ hợp lệ và tất cả đã được duyệt. Thao tác này đưa cả bộ vào trạng thái công khai.");
    if (!confirmed) return;
    setPublishingXam(true);
    setError("");
    setXamPublicationMessage("");
    try {
      const result = await apiRequest<{ count: number }>("/admin/xam/original/publish", {
        method: "POST",
        body: JSON.stringify({ reviewNote: "Phát hành catalog sau khi xác nhận riêng trên Admin Dashboard." }),
      });
      setXamPublicationMessage(`Đã phát hành ${result.count} quẻ.`);
      await fetchSection("xam", 1, search, activeFilter);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể phát hành bộ quẻ.");
    } finally {
      setPublishingXam(false);
    }
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    void fetchSection(section, nextPage, search, activeFilter);
  };

  const beginReview = (record: AdminRecord, field: ReviewField, targetSection: Kind = section as Kind) => {
    pushAdminOverlay("review");
    setReviewRecord(record);
    setReviewField(field);
    setReviewSection(targetSection);
    setReviewValue(!Boolean(record[field]));
    setReviewNote("");
    setRightsConfirmed(false);
    setImageRightsConfirmed(false);
    setSourceUrl(typeof record.source === "string" ? record.source : "");
    setSourceLocator(targetSection === "rituals" ? String(getRitualProvenance(record).sourceLocator || "") : "");
    setUsageRights("unknown");
  };

  const saveReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetSection = reviewSection;
    if (!reviewRecord || !reviewField || !targetSection || !isReviewableSection(targetSection)) return;
    setSavingReview(true);
    setError("");
    try {
      const needsRights =
        (targetSection === "culture" || targetSection === "xam" || targetSection === "rituals" || targetSection === "prayers") &&
        reviewField === "verified" &&
        reviewValue;
      if (reviewField === "verified" && !reviewValue && !isDemoMode()) {
        await apiRequest(`/admin/${targetSection}/${encodeURIComponent(reviewRecord.id)}/revoke-approval`, {
          method: "POST",
          body: JSON.stringify({ expectedUpdatedAt: String(reviewRecord.updated_at || ""), reviewNote: reviewNote.trim() }),
        });
      } else {
        await reviewAdminRecord(targetSection, reviewRecord.id, {
          expectedUpdatedAt: String(reviewRecord.updated_at || ""),
          [reviewField]: reviewValue,
          reviewNote,
          ...(needsRights
            ? {
                rightsConfirmed,
                ...((targetSection === "culture" || (targetSection === "rituals" && Boolean(reviewRecord.image_url))) ? { imageRightsConfirmed } : {}),
                ...(targetSection === "rituals" || targetSection === "prayers"
                  ? { source: targetSection === "rituals" && isGroupAuthoredRitual(reviewRecord) ? "" : sourceUrl.trim() }
                  : {}),
                sourceLocator,
                usageRights,
              }
            : {}),
        });
      }
      const title = getRecordTitle(reviewRecord, targetSection);
      const isApproved = reviewField === "verified" && reviewValue;
      const isRevoked = reviewField === "verified" && !reviewValue;
      const isPublished = reviewField === "active" && reviewValue;
      const isHidden = reviewField === "active" && !reviewValue;

      closeReview();
      setPage(1);
      setReviewQueueKey((key) => key + 1);
      if (section === targetSection) await fetchSection(targetSection, 1, search, activeFilter);

      if (isApproved) {
        toast.success(`Đã duyệt nội dung: "${title}"`, "Duyệt nội dung thành công");
      } else if (isRevoked) {
        toast.info(`Đã thu hồi duyệt và đưa "${title}" về bản nháp để chỉnh sửa.`, "Thu hồi duyệt để chỉnh sửa");
      } else if (isPublished) {
        toast.success(`Nội dung "${title}" đã được công khai trên hệ thống.`, "Công khai thành công");
      } else if (isHidden) {
        toast.info(`Nội dung "${title}" đã được chuyển sang chế độ ẩn.`, "Đã ẩn nội dung");
      }
    } catch (saveError) {
      const msg = readableError(saveError);
      setError(msg);
      toast.error(msg, "Thao tác không thành công");
    } finally {
      setSavingReview(false);
    }
  };

  const handleLogout = async () => {
    if (isDemoMode()) {
      setIsAuthenticated(false);
      exitDemoMode();
      return;
    }
    const result = await logoutAccount();
    setIsAuthenticated(false);
    setForbidden(false);
    setOverview(null);
    setRows([]);
    window.location.replace(result.serverRevoked ? "/?screen=login" : "/?screen=login&logout=unconfirmed");
  };

  const filteredRows = rows;

  // Statistics for content deck
  const contentStats = useMemo(() => {
    const stats = pageData?.stats;
    const statuses = stats?.statuses;
    const total = stats?.total ?? pageData?.pagination.total ?? rows.length;
    const verifiedCount = statuses ? statuses.APPROVED + statuses.PUBLISHED + statuses.HIDDEN : rows.filter((r) => Boolean(r.verified)).length;
    const hasSourceCount = stats?.withSource ?? rows.filter((r) => Boolean(r.source)).length;
    const activeCount = statuses?.PUBLISHED ?? rows.filter((r) => Boolean(r.active)).length;
    const north = stats?.regions.NORTH ?? 0;
    const central = stats?.regions.CENTRAL ?? 0;
    const south = stats?.regions.SOUTH ?? 0;
    const nation = stats?.regions.NATIONWIDE ?? 0;

    return {
      total,
      verifiedCount,
      hasSourceCount,
      activeCount,
      regionCounts: { north, central, south, nation },
      statuses: statuses ?? { DRAFT: 0, IN_REVIEW: 0, APPROVED: 0, PUBLISHED: 0, HIDDEN: 0, REVOKED: 0 },
      missingSource: stats?.missingSource ?? Math.max(0, total - hasSourceCount),
    };
  }, [pageData, rows, section]);

  if (booting) {
    return (
      <div className="admin-boot-screen" role="status">
        <div className="admin-boot-spinner-wrap">
          <div className="admin-boot-spinner" />
          <ShieldCheck size={28} className="admin-boot-icon" />
        </div>
        <p className="admin-boot-title">Tin Lắm Tâm Linh</p>
        <span className="admin-boot-subtitle">Đang tải dữ liệu quản trị…</span>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="admin-boot-screen" role="alert">
        <div className="admin-boot-spinner-wrap">
          <Lock size={28} className="admin-boot-icon" />
        </div>
        <p className="admin-boot-title">Tài khoản chưa có quyền quản trị</p>
        <span className="admin-boot-subtitle">
          Chỉ tài khoản ADMIN mới có thể truy cập khu vực này.
        </span>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <a className="admin-secondary-button" href="/">Về ứng dụng</a>
          <button
            className="admin-secondary-button"
            type="button"
            onClick={() => void handleLogout()}
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  if (sessionUnavailable) {
    return (
      <div className="admin-boot-screen" role="alert">
        <div className="admin-boot-spinner-wrap"><ShieldCheck size={28} className="admin-boot-icon" /></div>
        <p className="admin-boot-title">Chưa xác minh được phiên quản trị</p>
        <span className="admin-boot-subtitle">{sessionUnavailable}</span>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <a className="admin-secondary-button" href="/?login=true&redirect=/admin">Thử đăng nhập lại</a>
          <a className="admin-secondary-button" href="/">Về ứng dụng</a>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-boot-screen" role="status">
        <div className="admin-boot-spinner-wrap">
          <div className="admin-boot-spinner" />
          <ShieldCheck size={28} className="admin-boot-icon" />
        </div>
        <p className="admin-boot-title">Cổng Quản Trị Tin Lắm Tâm Linh</p>
        <span className="admin-boot-subtitle">
          Chưa xác thực phiên quản trị. Đang chuyển hướng về cổng đăng nhập…{" "}
          <a
            href="/?login=true&redirect=/admin"
            style={{ color: "var(--admin-gold)", textDecoration: "underline", marginLeft: "6px" }}
          >
            Nhấn vào đây nếu trang không tự chuyển
          </a>
        </span>
      </div>
    );
  }

  const current = TITLES[section];
  const isCommerceSection =
    section === "payments" ||
    section === "payment-alerts" ||
    section === "partnerships" ||
    section === "partner-gifts" ||
    section === "team";
  const hasSearch =
    section !== "overview" &&
    section !== "review-queue" &&
    section !== "audit-logs" &&
    section !== "signals" &&
    !isCommerceSection;
  const canCreate = userRole === "EDITOR" && (
    section === "culture" ||
    section === "calendar" ||
    section === "xam" ||
    section === "rituals" ||
    section === "prayers");
  const isContentSection =
    section === "culture" ||
    section === "calendar" ||
    section === "xam" ||
    section === "rituals" ||
    section === "prayers";

  return (
    <div className="admin-shell">
      {mobileNavOpen && (
        <button
          className="admin-nav-scrim"
          type="button"
          aria-label="Đóng menu điều hướng"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Modern Luxury Obsidian Sidebar */}
      <aside
        className={`admin-sidebar ${mobileNavOpen ? "is-open" : ""}`}
        aria-label="Điều hướng quản trị"
      >
        <div className="admin-sidebar-header">
          <a
            href="/admin"
            className="admin-brand"
              aria-label="Cổng quản trị Tin Lắm Tâm Linh"
          >
            <span className="admin-brand-mark">
              <ShieldCheck size={20} aria-hidden="true" />
            </span>
            <div className="admin-brand-text">
              <strong>Tin Lắm Tâm Linh</strong>
              <small>QUẢN TRỊ NỘI BỘ</small>
            </div>
          </a>
          <div className="admin-portal-badge">{userRole === "ADMIN" ? "ADMIN" : "BIÊN TẬP"}</div>
        </div>

        <nav className="admin-nav">
          {NAV.filter((item) => userRole === "ADMIN" || EDITOR_SECTIONS.includes(item.id as (typeof EDITOR_SECTIONS)[number])).map((item, index, visibleNav) => {
            const Icon = item.icon;
            const previous = visibleNav[index - 1];
            const totalOverviewPending = overview?.content
              ? (overview.content.articlesAwaitingReview || 0) +
                (overview.content.calendarEventsAwaitingReview || 0) +
                (overview.content.xamLotsAwaitingReview || 0) +
                (overview.content.ritualsAwaitingReview || 0) +
                (overview.content.prayersAwaitingReview || 0)
              : 0;
            const displayPendingCount =
              pendingQueueCount !== null ? pendingQueueCount : (overview ? totalOverviewPending : null);

            return (
              <div key={item.id} className="admin-nav-group-wrapper">
                {item.group !== previous?.group && (
                  <p className="admin-nav-group">{item.group}</p>
                )}
                <button
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`admin-nav-item ${section === item.id ? "is-active" : ""}`}
                  aria-current={section === item.id ? "page" : undefined}
                >
                  <Icon
                    size={18}
                    aria-hidden="true"
                    className="admin-nav-icon"
                  />
                  <span className="admin-nav-label">{item.label}</span>
                  {item.id === "review-queue" && (displayPendingCount ?? 0) > 0 && (
                    <span className="admin-nav-badge" aria-label={`${displayPendingCount} mục chờ duyệt`}>
                      {displayPendingCount}
                    </span>
                  )}
                  {section === item.id && (
                    <span className="admin-nav-indicator" aria-hidden="true" />
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-session-card">
            <span className="admin-avatar">
              {adminName.slice(0, 1).toUpperCase() || "A"}
            </span>
            <div className="admin-session-info">
              <strong>{adminName || "Quản trị viên"}</strong>
              <small>
                <span className="admin-live-dot" /> {userRole === "ADMIN" ? "Quản trị toàn hệ thống" : "Biên tập nội dung"}
              </small>
            </div>
            <button
              type="button"
              className="admin-session-logout-btn"
              onClick={() => setShowLogoutConfirm(true)}
              title="Đăng xuất khỏi Cổng Quản Trị"
              aria-label="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Administrative Container */}
      <main className="admin-main">
        {isDemoMode() && <div role="status" className="admin-demo-banner">
          <span>{DEMO_MODE_LABEL} · Quản trị viên giả lập</span>
          <button type="button" onClick={exitDemoMode}>Thoát demo</button>
        </div>}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-mobile-menu"
              type="button"
              aria-label="Mở menu điều hướng"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="admin-breadcrumb">
              <span className="admin-crumb-root">Quản trị</span>
              <ChevronRight size={14} className="admin-crumb-arrow" />
              <span className="admin-crumb-active">{current.title}</span>
            </div>
          </div>

          <div className="admin-topbar-right">
            <a
              href="/"
              className="admin-use-app-button"
              title="Mở trang Tin Lắm Tâm Linh dành cho người dùng"
            >
              <Globe size={15} />
              <span>Xem trang người dùng</span>
            </a>
            <button
              type="button"
              className="admin-theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={
                dark
                  ? "Chuyển sang giao diện sáng"
                  : "Chuyển sang giao diện tối"
              }
              title={
                dark
                  ? "Chuyển sang Màu Be (Ban Ngày)"
                  : "Chuyển sang Màu Đỏ (Ban Đêm)"
              }
            >
              {dark ? (
                <Moon size={16} aria-hidden="true" />
              ) : (
                <Sun size={16} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              className="admin-quick-refresh-btn"
              onClick={() => void fetchSection(section, page, search, activeFilter)}
              title="Tải lại dữ liệu"
              disabled={loading}
            >
              <RefreshCw
                size={14}
                className={loading ? "admin-spin-icon" : ""}
              />
              <span>Làm mới</span>
            </button>
          </div>
        </header>

        <div className="admin-content">
          {/* Page Heading & Actions Banner */}
          <div className="admin-page-heading">
            <div className="admin-heading-copy">
              <div className="admin-eyebrow-tag">
                <Sparkles size={12} /> {current.tag}
              </div>
              <h1>{current.title}</h1>
              <p className="admin-muted">{current.description}</p>
            </div>

            <div className="admin-heading-actions">
              {section === "xam" && userRole === "ADMIN" && !isDemoMode() && (
                <button type="button" className="admin-create-button" onClick={() => void publishOriginalXam()} disabled={publishingXam}>
                  {publishingXam ? "Đang kiểm tra và phát hành…" : "Phát hành bộ 100 quẻ nguyên tác"}
                </button>
              )}
              {hasSearch && (
                <form
                  className="admin-search"
                  onSubmit={handleSearch}
                  role="search"
                >
                  <Search size={16} className="admin-search-icon" />
                  <input
                    aria-label="Tìm theo tiêu đề, danh mục hoặc từ khóa"
                    placeholder="Tìm nội dung…"
                    value={searchDraft}
                    onChange={(event) => setSearchDraft(event.target.value)}
                  />
                  {searchDraft && (
                    <button
                      type="button"
                      className="admin-search-clear"
                      onClick={handleClearSearch}
                      aria-label="Xóa từ khóa"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button type="submit" className="admin-search-submit">
                    Tìm
                  </button>
                </form>
              )}

              {canCreate && (
                <button
                  className="admin-create-button"
                  type="button"
                  onClick={() => openContentEditor(section as Kind)}
                >
                  <Plus size={16} /> Tạo bản thảo mới
                </button>
              )}
            </div>
            {section === "xam" && xamPublicationMessage && <p className="admin-success-message" role="status">{xamPublicationMessage}</p>}
          </div>

          {error && (
            <div className="admin-alert" role="alert">
              <div className="admin-alert-content">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
              <button
                type="button"
                aria-label="Đóng thông báo"
                onClick={() => setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {section === "xam" && userRole === "ADMIN" && <DemoCatalogStatusPanel />}

          {/* Section View: Overview Dashboard */}
          {section === "overview" && (
            <OverviewPanel
              overview={overview}
              loading={loading}
              onNavigate={navigate}
            />
          )}

          {section === "review-queue" && (
            <ReviewQueuePanel
              key={reviewQueueKey}
              onSelect={(target) => navigate(target, "IN_REVIEW")}
              onReviewItem={(kind, id) => {
                if (kind === "signals") {
                  navigate("signals", "IN_REVIEW");
                } else {
                  void openContentDetails(kind as Kind, id);
                }
              }}
              onTotalChange={(total) => setPendingQueueCount(total)}
            />
          )}

          {/* Section View: Content & Data List */}
          {section === "signals" && (isDemoMode() ? <AdminDemoPanel section={section} title="Kho lời khuyên" /> : <SignalAdminPanel canReview={userRole === "ADMIN"} />)}
          {section === "team" && userRole === "ADMIN" && (isDemoMode() ? <AdminDemoPanel section={section} title="Quản lý nhóm" /> : <TeamAccessPanel />)}

          {/* Section View: Commerce & Partnership Management Panels */}
          {section === "payments" && (
            isDemoMode() ? <AdminDemoPanel section={section} title="Thanh toán" /> : <div className="admin-panel-container"><AdminPaymentsPanel /></div>
          )}

          {section === "payment-alerts" && (
            isDemoMode() ? <AdminDemoPanel section={section} title="Cảnh báo thanh toán" /> : <div className="admin-panel-container"><AdminPaymentAlertsPanel /></div>
          )}

          {section === "partnerships" && (
            isDemoMode() ? <AdminDemoPanel section={section} title="Đề xuất hợp tác" /> : <div className="admin-panel-container"><PartnershipPanel admin /></div>
          )}

          {section === "partner-gifts" && (
            isDemoMode() ? <AdminDemoPanel section={section} title="Quà tặng đối tác" /> : <div className="admin-panel-container"><AdminPartnerGiftsPanel /></div>
          )}

          {section !== "overview" &&
            section !== "review-queue" &&
            section !== "signals" &&
            !isCommerceSection && (
            <section
              aria-label={current.title}
              aria-busy={loading}
              className="admin-data-section"
            >
              {/* MINI ANALYTICS & VISUAL CHART DECK FOR CONTENT PAGES */}
              {isContentSection && !loading && pageData?.stats && (
                <ContentSectionAnalyticsDeck
                  total={contentStats.total}
                  verifiedCount={contentStats.verifiedCount}
                  hasSourceCount={contentStats.hasSourceCount}
                  activeCount={contentStats.activeCount}
                  regionCounts={contentStats.regionCounts}
                />
              )}

              {/* INTERACTIVE CONTROLS BAR: FILTER TABS & VIEW MODE */}
              {isContentSection && (
                <div className="admin-filter-control-bar">
                  <div className="admin-filter-tabs">
                    <button
                      type="button"
                      className={`admin-filter-tab ${activeFilter === "all" ? "is-active" : ""}`}
                      onClick={() => { setActiveFilter("all"); setPage(1); void fetchSection(section, 1, search, "all"); }}
                    >
                      <Filter size={13} /> Tất cả ({contentStats.total})
                    </button>
                    <button
                      type="button"
                      className={`admin-filter-tab ${activeFilter === "DRAFT" ? "is-active" : ""}`}
                      onClick={() => { setActiveFilter("DRAFT"); setPage(1); void fetchSection(section, 1, search, "DRAFT"); }}
                    >
                      Bản nháp ({contentStats.statuses.DRAFT})
                    </button>
                    <button
                      type="button"
                      className={`admin-filter-tab ${activeFilter === "IN_REVIEW" ? "is-active" : ""}`}
                      onClick={() => { setActiveFilter("IN_REVIEW"); setPage(1); void fetchSection(section, 1, search, "IN_REVIEW"); }}
                    >
                      Chờ duyệt ({contentStats.statuses.IN_REVIEW})
                    </button>
                    <button
                      type="button"
                      className={`admin-filter-tab ${activeFilter === "APPROVED" ? "is-active" : ""}`}
                      onClick={() => { setActiveFilter("APPROVED"); setPage(1); void fetchSection(section, 1, search, "APPROVED"); }}
                    >
                      Đã duyệt · chưa công khai ({contentStats.statuses.APPROVED})
                    </button>
                    <button
                      type="button"
                      className={`admin-filter-tab ${activeFilter === "PUBLISHED" ? "is-active" : ""}`}
                      onClick={() => { setActiveFilter("PUBLISHED"); setPage(1); void fetchSection(section, 1, search, "PUBLISHED"); }}
                    >
                      Đang công khai ({contentStats.statuses.PUBLISHED})
                    </button>
                    <button type="button" className={`admin-filter-tab ${activeFilter === "HIDDEN" ? "is-active" : ""}`} onClick={() => { setActiveFilter("HIDDEN"); setPage(1); void fetchSection(section, 1, search, "HIDDEN"); }}>
                      Đã ẩn ({contentStats.statuses.HIDDEN})
                    </button>
                    <button type="button" className={`admin-filter-tab ${activeFilter === "REVOKED" ? "is-active" : ""}`} onClick={() => { setActiveFilter("REVOKED"); setPage(1); void fetchSection(section, 1, search, "REVOKED"); }}>
                      Đã thu hồi (dữ liệu cũ) ({contentStats.statuses.REVOKED})
                    </button>
                    <button type="button" className={`admin-filter-tab ${activeFilter === "needs_source" ? "is-active" : ""}`} onClick={() => { setActiveFilter("needs_source"); setPage(1); void fetchSection(section, 1, search, "needs_source"); }}>
                      Chưa có URL nguồn ({contentStats.missingSource})
                    </button>
                  </div>

                  <div className="admin-view-toggle">
                    <button
                      type="button"
                      className={`admin-view-btn ${viewMode === "grid" ? "is-active" : ""}`}
                      onClick={() => setViewMode("grid")}
                      title="Chế độ xem dạng Thẻ (Grid)"
                    >
                      <LayoutGrid size={15} />
                    </button>
                    <button
                      type="button"
                      className={`admin-view-btn ${viewMode === "table" ? "is-active" : ""}`}
                      onClick={() => setViewMode("table")}
                      title="Chế độ xem dạng Bảng (Table)"
                    >
                      <List size={15} />
                    </button>
                  </div>
                </div>
              )}

              {loading && (
                <div className="admin-loading-card" role="status">
                  <RefreshCw size={24} className="admin-spin-icon" />
                  <p>Đang đồng bộ dữ liệu từ máy chủ…</p>
                </div>
              )}

              {!loading && filteredRows.length === 0 && !error && (
                <div className="admin-empty">
                  <div className="admin-empty-icon-wrap">
                    <CircleHelp size={28} />
                  </div>
                  <strong>Không tìm thấy bản ghi nào</strong>
                  <span>
                    {search
                      ? `Không có kết quả khớp với "${search}". Hãy thử từ khóa khác.`
                      : activeFilter !== "all"
                        ? "Không có bản ghi nào khớp với bộ lọc đang chọn."
                        : "Danh mục này hiện chưa có dữ liệu khả dụng."}
                  </span>
                  {(search || activeFilter !== "all") && (
                    <button
                      type="button"
                      className="admin-secondary-button admin-empty-reset"
                      onClick={() => {
                        setActiveFilter("all");
                        setSearchDraft("");
                        setSearch("");
                        setPage(1);
                        void fetchSection(section, 1, "", "all");
                      }}
                    >
                      Xóa bộ lọc & Đặt lại
                    </button>
                  )}
                </div>
              )}

              {!loading && filteredRows.length > 0 && (
                <RecordList
                  section={section}
                  rows={filteredRows}
                  viewMode={viewMode}
                  canReview={userRole === "ADMIN"}
                  onReview={beginReview}
                  onEdit={(id) => { void openContentDetails(section as Kind, id); }}
                />
              )}

              {/* Review / Verification Modal Drawer */}
              {reviewRecord && reviewField && (
                <div className="admin-review-overlay">
                  <form
                    className="admin-review-panel"
                    onSubmit={(event) => void saveReview(event)}
                  >
                    <div className="admin-review-header">
                      <div>
                        <h3>
                          {reviewField === "verified"
                            ? (reviewValue ? "Duyệt nội dung" : "Thu hồi duyệt để chỉnh sửa")
                            : (reviewValue ? "Công khai nội dung" : "Ẩn nội dung")}
                        </h3>
                        <p className="admin-muted">
                          {reviewField === "verified" && reviewValue
                            ? "Rà soát nguồn và quyền sử dụng, sau đó duyệt nội dung. Việc công khai được thực hiện riêng ở bước tiếp theo."
                            : reviewField === "verified"
                              ? "Nội dung sẽ ngừng hiển thị và trở về Bản nháp để biên tập viên chỉnh sửa. Lịch sử duyệt cũ vẫn được giữ lại. Ghi rõ lý do bên dưới."
                              : reviewValue
                                ? "Nội dung đã duyệt sẽ được công khai. Hãy kiểm tra phiên bản và hiển thị trước khi xác nhận."
                                : "Nội dung sẽ tạm ngừng hiển thị. Kết quả duyệt được giữ lại để có thể hiện lại."}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="admin-review-close"
                        onClick={closeReview}
                        aria-label="Đóng bảng"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {error && <div className="admin-alert" role="alert">{error}</div>}

                    {reviewSection === "culture" && (
                      <div className="admin-review-form-fields" aria-label="Hồ sơ nguồn và quyền nội dung">
                        <strong style={{ fontSize: "14px", color: "var(--admin-heading)", display: "flex", alignItems: "center", gap: 6 }}>
                          <BookOpenText size={16} style={{ color: "var(--admin-gold)" }} />
                          Hồ sơ nguồn đối chiếu
                        </strong>
                        {(() => {
                          const provenance = getArticleProvenance(reviewRecord);
                          const contentTypes: Record<string, string> = {
                            GROUP_AUTHORED: "Do nhóm biên soạn",
                            FACT: "Thông tin / sự kiện",
                            LEGEND: "Truyền thuyết / tín ngưỡng",
                            QUOTATION: "Có câu trích dẫn",
                          };
                          const items = [
                            { label: "Loại nội dung", value: contentTypes[String(provenance.contentType)] || (provenance.contentType ? String(provenance.contentType) : "") },
                            { label: "Nguồn / tài liệu", value: provenance.sourceTitle ? String(provenance.sourceTitle) : "" },
                            { label: "Tác giả / tổ chức", value: provenance.sourceAuthor ? String(provenance.sourceAuthor) : "" },
                            { label: "URL nguồn", value: reviewRecord.source ? String(reviewRecord.source) : "", isUrl: true },
                            { label: "Thông tin xuất bản", value: provenance.bibliography ? String(provenance.bibliography) : "" },
                            { label: "Trang / Mục trích dẫn", value: provenance.sourceLocator ? String(provenance.sourceLocator) : "" },
                            { label: "Địa phương / cộng đồng", value: provenance.localCommunity ? String(provenance.localCommunity) : "" },
                            { label: "Căn cứ quyền nội dung", value: provenance.contentRightsBasis ? String(provenance.contentRightsBasis) : "" },
                            { label: "Chú thích ảnh", value: provenance.imageCaption ? String(provenance.imageCaption) : "" },
                            { label: "Nguồn ảnh", value: provenance.imageSource ? String(provenance.imageSource) : "" },
                            { label: "Căn cứ quyền ảnh", value: provenance.imageRightsBasis ? String(provenance.imageRightsBasis) : "" },
                          ].filter((item) => item.value && item.value.trim().length > 0 && item.value.trim() !== "—");

                          if (items.length === 0) {
                            return (
                              <div className="admin-detail-prov-warning" style={{ margin: "4px 0" }}>
                                <span>Chưa có thông tin đối chiếu nguồn trong hồ sơ nội dung.</span>
                              </div>
                            );
                          }

                          return (
                            <dl className="admin-record-details">
                              {items.map((it, idx) => (
                                <div key={idx}>
                                  <dt>{it.label}</dt>
                                  <dd>
                                    {it.isUrl && it.value.startsWith("https://") ? (
                                      <a href={it.value} target="_blank" rel="noreferrer" className="table-source-link">
                                        <ExternalLink size={12} /> {it.value}
                                      </a>
                                    ) : (
                                      it.value
                                    )}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          );
                        })()}
                      </div>
                    )}

                    {reviewSection === "rituals" && (
                      <div className="admin-review-form-fields" aria-label="Phạm vi và nguồn hướng dẫn nghi lễ">
                        <strong style={{ fontSize: "14px", color: "var(--admin-heading)", display: "flex", alignItems: "center", gap: 6 }}>
                          <BookOpenText size={16} style={{ color: "var(--admin-gold)" }} />
                          Phạm vi và nguồn hướng dẫn nghi lễ
                        </strong>
                        {(() => {
                          const provenance = getRitualProvenance(reviewRecord);
                          const items = [
                            { label: "Loại nội dung", value: provenance.contentType ? String(provenance.contentType) : "" },
                            { label: "Người / nhóm biên soạn", value: provenance.authorOrOrganization ? String(provenance.authorOrOrganization) : "" },
                            { label: "Phạm vi áp dụng", value: provenance.scope ? String(provenance.scope) : "" },
                            { label: "Cộng đồng / địa phương", value: provenance.localCommunity ? String(provenance.localCommunity) : "" },
                            { label: "Căn cứ quyền nội dung", value: provenance.contentRightsBasis ? String(provenance.contentRightsBasis) : "" },
                            { label: "Chú thích ảnh", value: provenance.imageCaption ? String(provenance.imageCaption) : "" },
                            { label: "Tác giả / ghi công ảnh", value: provenance.imageCredit ? String(provenance.imageCredit) : "" },
                            { label: "Trang nguồn ảnh", value: provenance.imageSource ? String(provenance.imageSource) : "", isUrl: true },
                            { label: "Căn cứ quyền ảnh", value: provenance.imageRightsBasis ? String(provenance.imageRightsBasis) : "" },
                            { label: "URL nguồn", value: reviewRecord.source ? String(reviewRecord.source) : "", isUrl: true },
                            { label: "Trang / Mục trích dẫn", value: provenance.sourceLocator ? String(provenance.sourceLocator) : "" },
                          ].filter((item) => item.value && item.value.trim().length > 0 && item.value.trim() !== "—");

                          if (items.length === 0) {
                            return (
                              <div className="admin-detail-prov-warning" style={{ margin: "4px 0" }}>
                                <span>Chưa có thông tin đối chiếu nguồn trong hồ sơ nghi lễ.</span>
                              </div>
                            );
                          }

                          return (
                            <>
                            {Boolean(reviewRecord.image_url) && (
                              <figure style={{ margin: "8px 0 12px", maxWidth: 520 }}>
                                <img src={String(reviewRecord.image_url)} alt={String(provenance.imageCaption || reviewRecord.title || "Ảnh tổng quan nghi lễ")} style={{ display: "block", width: "100%", maxHeight: 280, objectFit: "contain", borderRadius: 10, background: "var(--admin-surface-muted)" }} />
                                {Boolean(provenance.imageCaption) && <figcaption className="admin-muted">{String(provenance.imageCaption)}</figcaption>}
                              </figure>
                            )}
                            <dl className="admin-record-details">
                              {items.map((it, idx) => (
                                <div key={idx}>
                                  <dt>{it.label}</dt>
                                  <dd>
                                    {it.isUrl && it.value.startsWith("https://") ? (
                                      <a href={it.value} target="_blank" rel="noreferrer" className="table-source-link">
                                        <ExternalLink size={12} /> {it.value}
                                      </a>
                                    ) : (
                                      it.value
                                    )}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                            </>
                          );
                        })()}
                        {isGroupAuthoredRitual(reviewRecord) && <p className="admin-muted">Hướng dẫn nguyên bản không cần URL ngoài; kiểm tra người biên soạn, phạm vi áp dụng, checklist và căn cứ quyền thực tế.</p>}
                      </div>
                    )}

                    {(reviewSection === "culture" || reviewSection === "xam" ||
                      reviewSection === "rituals" ||
                      reviewSection === "prayers") &&
                      reviewField === "verified" &&
                      reviewValue && (
                        <div className="admin-review-form-fields">
                          {reviewSection === "culture" && (
                            <div className="admin-form-row">
                              <label htmlFor="admin-usage-rights">
                                Căn cứ quyền nội dung <span aria-hidden="true">*</span>
                              </label>
                              <select
                                id="admin-usage-rights"
                                value={usageRights}
                                onChange={(event) => setUsageRights(event.target.value as typeof usageRights)}
                              >
                                <option value="unknown">Chưa xác minh quyền sử dụng</option>
                                {isGroupAuthoredCulture(reviewRecord) && (
                                  <option value="group-authored">Nội dung nguyên bản do nhóm biên soạn</option>
                                )}
                                <option value="confirmed">Đã có văn bản ủy quyền / giấy phép</option>
                                <option value="public-domain">Nội dung thuộc phạm vi công cộng (Public Domain)</option>
                                <option value="permission-required">Cần bổ sung văn bản cho phép</option>
                              </select>
                            </div>
                          )}
                          {(reviewSection === "culture" || reviewSection === "rituals") && Boolean(reviewRecord.image_url) && (
                            <label className="admin-review-rights-box">
                              <input
                                type="checkbox"
                                style={{ width: "18px", height: "18px", marginTop: "2px", accentColor: "var(--admin-gold)" }}
                                checked={imageRightsConfirmed}
                                onChange={(event) => setImageRightsConfirmed(event.target.checked)}
                              />
                              <div className="admin-review-rights-copy">
                                <strong>Xác nhận hồ sơ quyền ảnh riêng</strong>
                                <span>Tôi đã kiểm tra chú thích, ghi công, URL trang nguồn và căn cứ quyền ảnh; xác nhận này tách biệt với quyền nội dung.</span>
                              </div>
                            </label>
                          )}
                          {(reviewSection === "prayers" || (reviewSection === "rituals" && !isGroupAuthoredRitual(reviewRecord))) && (
                            <>
                              <div className="admin-form-row">
                                <label htmlFor="admin-source-url">
                                  URL nguồn tham chiếu HTTPS <span aria-hidden="true">*</span>
                                </label>
                                <input
                                  id="admin-source-url"
                                  type="url"
                                  required
                                  value={sourceUrl}
                                  onChange={(event) => setSourceUrl(event.target.value)}
                                  placeholder="https://dlib.vn/..."
                                />
                              </div>
                              <div className="admin-form-row">
                                <label htmlFor="admin-source-locator">
                                  Trang / Mục trích dẫn <span aria-hidden="true">*</span>
                                </label>
                                <input
                                  id="admin-source-locator"
                                  required
                                  minLength={2}
                                  maxLength={500}
                                  value={sourceLocator}
                                  onChange={(event) => setSourceLocator(event.target.value)}
                                  placeholder="Trang, mục, quyển, số hiệu văn bản…"
                                />
                              </div>
                              <div className="admin-form-row">
                                <label htmlFor="admin-usage-rights">
                                  Căn cứ quyền sử dụng <span aria-hidden="true">*</span>
                                </label>
                                <select
                                  id="admin-usage-rights"
                                  value={usageRights}
                                  onChange={(event) => setUsageRights(event.target.value as typeof usageRights)}
                                >
                                  <option value="unknown">Chưa xác minh</option>
                                  <option value="confirmed">Đã có văn bản ủy quyền</option>
                                  <option value="public-domain">Thuộc phạm vi công cộng (Public Domain)</option>
                                  <option value="permission-required">Cần bổ sung văn bản cho phép</option>
                                </select>
                              </div>
                            </>
                          )}
                          <label className="admin-review-rights-box">
                            <input
                              type="checkbox"
                              style={{ width: "18px", height: "18px", marginTop: "2px", accentColor: "var(--admin-gold)" }}
                              checked={rightsConfirmed}
                              onChange={(event) => setRightsConfirmed(event.target.checked)}
                            />
                            <div className="admin-review-rights-copy">
                              <strong>{reviewSection === "culture" ? "Xác nhận căn cứ quyền nội dung" : "Xác nhận đối chiếu tư liệu"}</strong>
                              <span>{reviewSection === "culture" ? "Tôi xác nhận căn cứ quyền đã chọn phù hợp với loại nội dung và hồ sơ biên soạn." : "Tôi xác nhận đã đối chiếu tư liệu nguồn tham khảo và kiểm tra bản quyền hợp lệ."}</span>
                            </div>
                          </label>
                        </div>
                      )}

                    <div className="admin-form-row">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <label htmlFor="admin-review-note">
                          Ghi chú thẩm định <span aria-hidden="true">*</span>
                        </label>
                        <span className={`admin-note-counter ${reviewNote.trim().length >= 8 ? "is-valid" : ""}`}>
                          {reviewNote.trim().length < 8 ? `Tối thiểu 8 ký tự (còn ${8 - reviewNote.trim().length})` : "✓ Đạt yêu cầu"}
                        </span>
                      </div>
                      <textarea
                        id="admin-review-note"
                        required
                        minLength={8}
                        maxLength={500}
                        rows={3}
                        value={reviewNote}
                        onChange={(event) => setReviewNote(event.target.value)}
                        placeholder="Nêu rõ nguồn tài liệu, ấn bản đối chiếu và căn cứ duyệt (ví dụ: Đã đối chiếu hồ sơ di sản UNESCO, nội dung đạt chuẩn)…"
                      />
                    </div>

                    {reviewSubmitBlockMessage(
                      reviewSection,
                      reviewRecord,
                      reviewField,
                      reviewValue,
                      reviewNote,
                      rightsConfirmed,
                      usageRights,
                      sourceUrl,
                      sourceLocator,
                      imageRightsConfirmed,
                    ) && (
                      <p className="admin-review-validation" role="status">
                        {reviewSubmitBlockMessage(
                          reviewSection,
                          reviewRecord,
                          reviewField,
                          reviewValue,
                          reviewNote,
                          rightsConfirmed,
                          usageRights,
                          sourceUrl,
                          sourceLocator,
                          imageRightsConfirmed,
                        )}
                      </p>
                    )}

                    <div className="admin-review-actions">
                      <button
                        className="admin-secondary-button"
                        type="button"
                        onClick={closeReview}
                      >
                        Hủy bỏ
                      </button>
                      <button
                        className="admin-primary-button"
                        type="submit"
                        disabled={
                          savingReview ||
                          reviewNote.trim().length < 8 ||
                          ((reviewSection === "culture" || reviewSection === "xam" ||
                            reviewSection === "rituals" || reviewSection === "prayers") &&
                            reviewField === "verified" &&
                            reviewValue &&
                            (reviewProvenanceIsIncomplete(
                                reviewSection,
                                reviewRecord,
                                rightsConfirmed,
                                usageRights,
                                sourceUrl,
                                sourceLocator,
                                imageRightsConfirmed,
                              ) ||
                              (reviewSection === "culture" && getCultureApprovalIssues(reviewRecord).length > 0)))
                        }
                      >
                        {savingReview
                          ? "Đang ghi nhận…"
                          : reviewField === "verified"
                           ? (reviewValue ? "Duyệt nội dung" : "Thu hồi duyệt để chỉnh sửa")
                          : (reviewValue ? "Công khai" : "Ẩn nội dung")}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Enhanced Pagination */}
              {pageData && pageData.pagination.pageCount > 1 && (
                <div className="admin-pagination">
                  <span className="admin-pagination-info">
                    Tổng cộng{" "}
                    <strong>
                      {pageData.pagination.total.toLocaleString("vi-VN")}
                    </strong>{" "}
                    bản ghi · Trang <strong>{page}</strong> /{" "}
                    {pageData.pagination.pageCount}
                  </span>
                  <div className="admin-pagination-buttons">
                    <button
                      type="button"
                      aria-label="Trang trước"
                      disabled={page <= 1 || loading}
                      onClick={() => changePage(page - 1)}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="admin-page-number-pill">{page}</span>
                    <button
                      type="button"
                      aria-label="Trang sau"
                      disabled={
                        page >= pageData.pagination.pageCount || loading
                      }
                      onClick={() => changePage(page + 1)}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Content Editor Dialog */}
          {editing && userRole !== "ADMIN" && (
            <ContentEditor
              key={`${editing.kind}:${editing.id || "new"}`}
              {...editing}
              onClose={closeContentEditor}
              onSaved={({ id: savedId, submittedForReview }) => {
                if (submittedForReview) {
                  closeContentEditor();
                } else if (savedId) {
                  setEditing((current) => current ? { ...current, id: savedId } : current);
                  const url = new URL(window.location.href);
                  url.searchParams.set("editId", savedId);
                  window.history.replaceState(window.history.state, "", url.toString());
                }
                setPage(1);
                setReviewQueueKey((k) => k + 1);
                void fetchSection(section, 1, search, activeFilter);
              }}
            />
          )}

          {contentDetails && (
            <ContentDetailModal
              kind={contentDetails.kind}
              id={contentDetails.id}
              record={contentDetails.record}
              onClose={closeContentDetails}
              onApprove={(kind, record) => beginReview(record, "verified", kind)}
              onRequestChanges={async (note) => {
                if (isDemoMode()) requestDemoAdminChanges(contentDetails.kind, contentDetails.id, note);
                else await apiRequest(
                    `/admin/${contentDetails.kind}/${encodeURIComponent(contentDetails.id)}/request-changes`,
                    { method: "POST", body: JSON.stringify({ expectedUpdatedAt: contentDetails.record.updated_at, reviewNote: note }) },
                  );
                const itemTitle = getRecordTitle(contentDetails.record, contentDetails.kind);
                closeContentDetails();
                setReviewQueueKey((key) => key + 1);
                await fetchSection(section, page, search, activeFilter);
                toast.success(`Đã gửi yêu cầu chỉnh sửa cho nội dung "${itemTitle}".`, "Yêu cầu chỉnh sửa");
              }}
            />
          )}

          <footer className="admin-footer">
            <div className="admin-footer-left">
              <span>
                Hệ thống quản trị <strong>Tin Lắm Tâm Linh</strong>.
              </span>
            </div>
            <div className="admin-footer-right">
              <span>
                Quản lý nội dung và trạng thái duyệt
              </span>
            </div>
          </footer>
        </div>
      </main>

      {/* Forbidden Dialog */}
      {forbidden && (
        <div
          className="admin-forbidden"
          role="alertdialog"
          aria-labelledby="admin-forbidden-title"
        >
          <div className="admin-forbidden-card">
            <div className="admin-forbidden-badge">
              <ShieldCheck size={32} />
            </div>
            <h2 id="admin-forbidden-title">Tài khoản chưa có quyền quản trị</h2>
            <p>
              Tài khoản đăng nhập không sở hữu role <code>ADMIN</code> được cấp
              phép trên hệ thống máy chủ. Vui lòng liên hệ quản trị viên cấp cao
              để được cấp quyền.
            </p>
            <div className="admin-forbidden-actions">
              <a
                className="admin-secondary-button"
                href="/"
              >
                Về ứng dụng khách
              </a>
              <button
                className="admin-primary-button"
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
              >
                Đăng xuất tài khoản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirm Dialog */}
      <LogoutConfirmDialog
        open={showLogoutConfirm}
        userName={adminName || "Quản trị viên"}
        title="Kết thúc phiên Quản trị?"
        description="Bạn có chắc chắn muốn đăng xuất khỏi Cổng Quản Trị Tin Lắm Tâm Linh? Mọi dữ liệu kiểm duyệt đã lưu sẽ được bảo toàn an toàn."
        confirmText="Xác nhận Đăng xuất"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          void handleLogout();
        }}
      />

      <ToastContainer />
    </div>
  );
}

function AdminDemoPanel({ section, title }: { section: Section; title: string }) {
  const module = DEMO_ADMIN_MODULES[section];
  return (
    <div className="admin-panel-container">
      <section className="admin-demo-module-panel" aria-label={title}>
        <div className="admin-panel-heading"><div><span className="admin-demo-kicker">DỮ LIỆU MẪU</span><h2>{title}</h2></div><span className="admin-count-pill">DEMO</span></div>
        <div className="admin-demo-stats">
          {(module?.stats || [{ label: "Hồ sơ mẫu", value: "3" }, { label: "Đang hoạt động", value: "2" }, { label: "Chờ xử lý", value: "1" }]).map((stat) => <div key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></div>)}
        </div>
        <div className="admin-demo-rows">
          {(module?.rows || []).map((row) => <article key={row.title}>
            <div className="admin-demo-row-heading"><h3>{row.title}</h3><span>{row.status}</span></div>
            <p>{row.detail}</p><small>{row.meta}</small>
          </article>)}
        </div>
        <p className="admin-demo-footnote">Thông tin giả lập chỉ dùng để xem trước. Không có giao dịch hay thay đổi nào được gửi lên máy chủ.</p>
      </section>
    </div>
  );
}

function OverviewPanel({
  overview,
  loading,
  onNavigate,
}: {
  overview: AdminOverview | null;
  loading: boolean;
  onNavigate: (section: Section) => void;
}) {
  if (loading && !overview) {
    return (
      <div className="admin-loading-card" role="status">
        <RefreshCw size={24} className="admin-spin-icon" />
        <p>Đang tính toán các chỉ số vận hành và biểu đồ…</p>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="admin-empty">
        <div className="admin-empty-icon-wrap">
          <CircleHelp size={28} />
        </div>
        <strong>Chưa tải được số liệu vận hành</strong>
        <span>Kiểm tra kết nối tới máy chủ backend và thử tải lại.</span>
      </div>
    );
  }

  const metricCards = [
    {
      label: "Khách truy cập hôm nay",
      value: overview.analytics.dau,
      note: "Theo giờ Việt Nam (GMT+7) · Đã cấp phép đo lường",
      icon: Activity,
      color: "metric-crimson",
      sparkColor: "#8b252e",
      sparkData: overview.analytics.sparklines?.dau || [],
    },
    {
      label: "Khách truy cập tháng này",
      value: overview.analytics.mau,
      note: "Tính trong tháng hiện tại · Ẩn danh hợp lệ",
      icon: UsersRound,
      color: "metric-gold",
      sparkColor: "#c89655",
      sparkData: overview.analytics.sparklines?.engagements || [],
    },
    {
      label: "Tỷ lệ trải nghiệm ngày đầu",
      value:
        overview.analytics.activationRate30d === null
          ? "0%"
          : `${overview.analytics.activationRate30d}%`,
      note:
        overview.analytics.activationRate30d === null
          ? "Đo lường người dùng gieo quẻ hoặc đọc bài trong 24h"
          : "Hoàn thành xin xăm hoặc đọc bài trong 24 giờ đầu",
      icon: ArrowUpRight,
      color: "metric-emerald",
      sparkColor: "#2d7a52",
      sparkData: [],
    },
    {
      label: "Đăng ký gói hội viên",
      value: overview.membershipInterestCount,
      note: "Người dùng tiềm năng quan tâm gói tâm linh",
      icon: Crown,
      color: "metric-blue",
      sparkColor: "#2c6ca8",
      sparkData: [],
      target: "membership-interests" as const,
    },
  ];

  const reviewItems = [
    {
      label: "Bài văn hóa cần rà soát",
      value: overview.content.articlesAwaitingReview,
      total: overview.content.activeArticles,
      target: "culture" as const,
    },
    {
      label: "Sự kiện lịch cần rà soát",
      value: overview.content.calendarEventsAwaitingReview,
      total: overview.content.activeCalendarEvents,
      target: "calendar" as const,
    },
    {
      label: "Thẻ xin xăm cần rà soát",
      value: overview.content.xamLotsAwaitingReview,
      total: overview.content.activeXamLots,
      target: "xam" as const,
    },
    {
      label: "Nghi lễ cần rà soát",
      value: overview.content.ritualsAwaitingReview,
      total: overview.content.activeRituals,
      target: "rituals" as const,
    },
    {
      label: "Văn khấn cần rà soát",
      value: overview.content.prayersAwaitingReview,
      total: overview.content.activePrayers,
      target: "prayers" as const,
    },
  ];

  const totalReviewsNeeded = reviewItems.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  // Content Bar Chart Data
  const contentComparisonData = [
    {
      name: "Kho văn hóa",
      verified:
        overview.content.activeArticles -
        overview.content.articlesAwaitingReview,
      unverified: overview.content.articlesAwaitingReview,
    },
    {
      name: "Lịch sự kiện",
      verified:
        overview.content.activeCalendarEvents -
        overview.content.calendarEventsAwaitingReview,
      unverified: overview.content.calendarEventsAwaitingReview,
    },
    {
      name: "Xin xăm",
      verified:
        overview.content.activeXamLots - overview.content.xamLotsAwaitingReview,
      unverified: overview.content.xamLotsAwaitingReview,
    },
    {
      name: "Nghi lễ",
      verified:
        overview.content.activeRituals - overview.content.ritualsAwaitingReview,
      unverified: overview.content.ritualsAwaitingReview,
    },
    {
      name: "Văn khấn",
      verified:
        overview.content.activePrayers - overview.content.prayersAwaitingReview,
      unverified: overview.content.prayersAwaitingReview,
    },
  ];

  // User Acquisition Donut Data
  const SOURCE_LABELS: Record<string, string> = {
    campus_qr: "QR Học đường",
    direct: "Trực tiếp",
    organic_social: "Mạng xã hội",
    referral: "Giới thiệu",
    google_search: "Tìm kiếm",
  };

  const acquisitionDonutData = (overview.analytics.acquisition || []).map((item, idx) => ({
    label: SOURCE_LABELS[item.source] || item.source.replaceAll("_", " "),
    value: item.signups,
    color: ["#c89655", "#8b252e", "#2d7a52", "#2c6ca8", "#8b5cf6"][idx % 5],
  }));

  return (
    <div className="admin-overview">
      {/* 4 Elevated Metric Cards with Sparkline Glow Curves */}
      <div className="admin-metric-grid">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          const isClickable = Boolean(metric.target);
          return (
            <article
              className={`admin-metric-card ${metric.color} ${isClickable ? "is-clickable" : ""}`}
              key={metric.label}
              onClick={isClickable && metric.target ? () => onNavigate(metric.target) : undefined}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              title={isClickable ? "Bấm để mở danh sách đăng ký hội viên" : undefined}
            >
              <div className="admin-metric-header">
                <div className="admin-metric-icon">
                  <Icon size={20} />
                </div>
                <SparklineChart
                  data={metric.sparkData}
                  color={metric.sparkColor}
                  height={32}
                  width={100}
                />
              </div>
              <p className="admin-metric-label">{metric.label}</p>
              <strong className="admin-metric-value">
                {typeof metric.value === "number"
                  ? metric.value.toLocaleString("vi-VN")
                  : metric.value}
              </strong>
              <span className="admin-metric-note">{metric.note}</span>
            </article>
          );
        })}
      </div>

      {/* FULL-WIDTH INTERACTIVE TREND CHART */}
      <InteractiveTrendChart
        title="Lưu lượng Truy cập & Tương tác Tâm Linh (7 ngày)"
        subtitle="Xu hướng tương tác và truy cập thực tế theo ngày"
        data={overview.analytics.trends || []}
      />

      {/* GRID: CONTENT STATUS BAR CHART & USER ACQUISITION DONUT */}
      <div className="admin-overview-grid">
        <ContentStatusBarChart
          title="Chỉ số Thẩm định & Xác minh 5 Kho nội dung"
          categories={contentComparisonData}
        />
        <DonutChart
          title="Phân bổ Nguồn Tăng trưởng (30 ngày)"
          data={acquisitionDonutData}
          size={160}
          strokeWidth={22}
          unit="lượt"
        />
      </div>

      {/* Grid: Quality Control Review Queue & Retention */}
      <div className="admin-overview-grid">
        <section className="admin-panel admin-review-queue-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">KIỂM SOÁT NỘI DUNG</p>
              <h2>Hàng chờ rà soát & thẩm định</h2>
            </div>
            <span
              className={`admin-count-pill ${totalReviewsNeeded > 0 ? "has-pending" : ""}`}
            >
              {totalReviewsNeeded} mục
            </span>
          </div>

          <div className="admin-review-queue-list">
            {reviewItems.map((item) => (
              <button
                className="admin-review-row"
                key={item.target}
                type="button"
                onClick={() => onNavigate(item.target)}
              >
                <div className="admin-review-row-left">
                  <span className="admin-review-row-icon">
                    <FileCheck2 size={16} />
                  </span>
                  <div className="admin-review-row-copy">
                    <strong>{item.label}</strong>
                    <small>
                      {item.total.toLocaleString("vi-VN")} mục đang lưu hành
                    </small>
                  </div>
                </div>
                <div className="admin-review-row-right">
                  <span
                    className={`admin-review-badge ${item.value > 0 ? "is-alert" : "is-clean"}`}
                  >
                    {item.value.toLocaleString("vi-VN")} cần duyệt
                  </span>
                  <ChevronRight size={16} className="admin-review-arrow" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Retention Cohort Table */}
        <section className="admin-panel admin-retention-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">CHỈ SỐ GIỮ CHÂN</p>
              <h2>Retention Cohort theo ngày</h2>
            </div>
            <span className="admin-subtle-icon">
              <Clock3 size={18} />
            </span>
          </div>

          <div className="admin-retention-grid">
            {overview.analytics.retention.map((item) => (
              <article key={item.day} className="admin-retention-card">
                <span className="admin-retention-day">{item.day}</span>
                <strong className="admin-retention-rate">
                  {item.ratePercent === null ? "—" : `${item.ratePercent}%`}
                </strong>
                <small className="admin-retention-stats">
                  {item.retained}/{item.cohortSize} tài khoản
                </small>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Premium Membership VIP Banner */}
      <button
        className="admin-membership-callout"
        type="button"
        onClick={() => onNavigate("membership-interests")}
      >
        <div className="admin-callout-content">
          <div className="admin-callout-icon-box">
            <UsersRound size={22} />
          </div>
          <div className="admin-callout-text">
            <strong>Danh sách quan tâm gói hội viên</strong>
            <small>
              Xem và xuất danh sách các liên hệ tiềm năng đăng ký nhận tin
            </small>
          </div>
        </div>
        <div className="admin-callout-stats">
          <b>{overview.membershipInterestCount.toLocaleString("vi-VN")}</b>
          <span>đăng ký</span>
          <ChevronRight size={18} />
        </div>
      </button>
    </div>
  );
}

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: "verified" | "pending" | "published" | "hidden";
}) {
  return (
    <span className={`admin-status-badge is-${variant}`}>
      <span className="admin-status-dot" />
      {label}
    </span>
  );
}

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    void navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success(`Đã sao chép email: ${email}`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      className="card-action-btn btn-copy"
      onClick={handleCopy}
      title="Sao chép địa chỉ email"
    >
      <Copy size={13} />
      <span>{copied ? "Đã chép" : "Sao chép"}</span>
    </button>
  );
}

function fortuneLevelClass(level: unknown) {
  const l = String(level || "").toLowerCase();
  if (l.includes("thượng") || l.includes("đại cát")) return "fortune-top";
  if (l.includes("hạ")) return "fortune-low";
  return "fortune-mid";
}

function RegionPill({ region }: { region?: unknown }) {
  const reg = String(region || "").toUpperCase();
  let label = "Toàn quốc";
  let colorClass = "region-nation";

  if (reg.includes("NORTH") || reg.includes("BẮC")) {
    label = "Miền Bắc";
    colorClass = "region-north";
  } else if (reg.includes("CENTRAL") || reg.includes("TRUNG")) {
    label = "Miền Trung";
    colorClass = "region-central";
  } else if (reg.includes("SOUTH") || reg.includes("NAM")) {
    label = "Miền Nam";
    colorClass = "region-south";
  }

  return <span className={`admin-region-pill ${colorClass}`}>{label}</span>;
}

function RecordList({
  section,
  rows,
  viewMode = "grid",
  onReview,
  onEdit,
  canReview: canReviewPermission,
}: {
  section: Section;
  rows: AdminRecord[];
  viewMode?: ViewMode;
  onReview: (record: AdminRecord, field: ReviewField) => void;
  onEdit: (id: string) => void;
  canReview: boolean;
}) {
  const canReview = canReviewPermission && (
    section === "culture" ||
    section === "calendar" ||
    section === "xam" ||
    section === "rituals" ||
    section === "prayers");
  const canEdit =
    section === "culture" ||
    section === "calendar" ||
    section === "xam" ||
    section === "rituals" ||
    section === "prayers";
  const requiresExistingSource =
    section === "culture" || section === "calendar" || section === "xam";

  // RENDER DẠNG BẢNG DOANH NGHIỆP (TABLE VIEW)
  if (viewMode === "table") {
    // 1. Table View cho Đăng ký hội viên
    if (section === "membership-interests") {
      return (
        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Email người dùng</th>
                <th>Phân loại</th>
                <th>Thời gian đăng ký</th>
                <th className="th-actions">Thao tác liên hệ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="table-lead-email-cell">
                      <Mail size={15} className="table-lead-icon" />
                      <strong>{displayValue(row.email)}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="card-vip-lead-badge">Đăng ký nhận cập nhật</span>
                  </td>
                  <td>
                    <span className="table-date-cell">
                      <Clock3 size={13} /> {dateValue(row.created_at)}
                    </span>
                  </td>
                  <td>
                    <div className="table-action-cell">
                      <CopyEmailButton email={String(row.email || "")} />
                      <a
                        href={`mailto:${row.email}`}
                        className="admin-mini-action-btn mail"
                        title="Gửi thư liên hệ"
                      >
                        <ExternalLink size={12} /> Gửi email
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // 2. Table View cho Nhật ký kiểm duyệt
    if (section === "audit-logs") {
      return (
        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Thời gian & Quản trị viên</th>
                <th>Hành động</th>
                <th>Mục tiêu</th>
                <th>Chi tiết cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const actorName =
                  (row.users as { full_name?: string } | undefined)?.full_name ||
                  "Quản trị viên";
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="table-title-cell">
                        <strong>{actorName}</strong>
                        <small className="table-date-cell">
                          <Clock3 size={12} /> {dateValue(row.created_at)}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span className="card-audit-action-badge">
                        🛡️ {displayValue(row.action)}
                      </span>
                    </td>
                    <td>
                      <div className="table-cat-cell">
                        <span className="card-audit-target-badge">
                          {displayValue(row.target_type)}
                        </span>
                        <code className="table-id-code">
                          #{String(row.target_id).slice(0, 8)}
                        </code>
                      </div>
                    </td>
                    <td>
                      <pre className="table-audit-details-preview">
                        {displayValue(JSON.stringify(row.details, null, 2))}
                      </pre>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // 3. Table View cho 5 Kho nội dung (Văn hóa, Lịch, Xăm, Nghi lễ, Văn khấn)
    return (
      <div className="admin-table-wrapper">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Tiêu đề & Định danh</th>
              <th>Đặc thù & Vùng miền</th>
              <th>Nguồn tham chiếu</th>
              <th>Xác minh</th>
              <th>Hiển thị</th>
              <th className="th-actions">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const title = getRecordTitle(row, section);
              const editorialActions = new Set(allowedEditorialActions({
                role: canReview ? "ADMIN" : "EDITOR",
                status: String(row.editorial_status || "DRAFT"),
                approvalCurrent: row.verified === true,
              }));
              const source =
                typeof row.source === "string" &&
                row.source.startsWith("https://")
                  ? row.source
                  : null;
              const category = displayValue(
                row.category ??
                  row.xam_type ??
                  row.occasion ??
                  row.target_type ??
                  "Chung",
              );

              return (
                <tr key={row.id}>
                  <td>
                    <div className="table-title-cell">
                      <strong>{title}</strong>
                      {section === "calendar" && (
                        <small className="table-calendar-sub">
                          {row.calendar === "LUNAR" ? "🌙 Âm lịch" : "☀️ Dương lịch"} Ngày {displayValue(row.day)}/{displayValue(row.month)}
                        </small>
                      )}
                      {section === "xam" && (
                        <small className="table-xam-sub">
                          Thẻ #{displayValue(row.stick_number)} · Điềm: {displayValue(row.fortune_level)}
                        </small>
                      )}
                      {Boolean(row.slug) && (
                        <small className="table-slug">
                          /{displayValue(row.slug)}
                        </small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="table-cat-cell">
                      <span className="table-cat-tag">{category}</span>
                      <RegionPill region={row.region} />
                    </div>
                  </td>
                  <td>
                    {source ? (
                      <a
                        className="table-source-link"
                        href={source}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink size={12} /> Mở URL nguồn
                      </a>
                    ) : (
                      <span className="table-source-missing">Chưa có URL</span>
                    )}
                  </td>
                  <td>
                    {row.verified !== undefined ? (
                      <StatusBadge
                        label={editorialStatusLabel(row)}
                        variant={row.verified ? "verified" : "pending"}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {row.active !== undefined ? (
                      <StatusBadge
                        label={row.active ? "Đang công khai" : "Đã ẩn"}
                        variant={row.active ? "published" : "hidden"}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <div className="table-action-cell">
                      {canEdit && (
                        <button
                          type="button"
                          className="admin-mini-action-btn edit"
                          onClick={() => onEdit(row.id)}
                          title="Xem chi tiết"
                        >
                          <Eye size={13} /> Xem chi tiết
                        </button>
                      )}
                      {canReview && row.verified !== undefined && (editorialActions.has("approve") || editorialActions.has("revoke_approval")) && (
                        <button
                          type="button"
                          className={`admin-mini-action-btn ${editorialActions.has("revoke_approval") ? "unverify" : "verify"}`}
                          disabled={
                            editorialActions.has("approve") && requiresExistingSource && !source
                          }
                          onClick={() => onReview(row, "verified")}
                          title={
                            editorialActions.has("approve") && requiresExistingSource && !source
                              ? "Cần có URL nguồn HTTPS hợp lệ trước khi duyệt"
                              : editorialActions.has("revoke_approval")
                                ? "Thu hồi duyệt để gỡ nội dung khỏi công khai và đưa về bản nháp"
                                : "Mở màn hình xem xét, duyệt nội dung"
                          }
                        >
                          <Check size={13} /> {editorialActions.has("revoke_approval") ? "Thu hồi duyệt" : "Xem xét"}
                        </button>
                      )}
                      {canReview && row.active !== undefined && (editorialActions.has("hide") || editorialActions.has("show") || editorialActions.has("publish")) && (
                        <button
                          type="button"
                          className={`admin-mini-action-btn ${editorialActions.has("hide") ? "toggle-hide" : "toggle-show"}`}
                          onClick={() => onReview(row, "active")}
                          title={editorialActions.has("hide") ? "Ẩn nội dung đang công khai" : editorialActions.has("show") ? "Hiện lại nội dung đã duyệt" : "Công khai nội dung đã duyệt"}
                        >
                          {editorialActions.has("hide") ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // RENDER DẠNG THẺ TẠP CHÍ DI SẢN (GRID VIEW)
  // 1. Grid View riêng cho Quan tâm hội viên (Leads)
  if (section === "membership-interests") {
    return (
      <div className="admin-record-grid">
        {rows.map((row) => (
          <article className="admin-record-magazine-card card-variant-lead" key={row.id}>
            <div className="card-top-bar">
              <div className="card-tags-group">
                <span className="card-vip-lead-badge">
                  Đăng ký nhận cập nhật hội viên
                </span>
              </div>
              <span className="card-lead-time">
                <Clock3 size={12} /> {dateValue(row.created_at)}
              </span>
            </div>

            <div className="card-body">
              <div className="card-lead-email-row">
                <Mail size={18} className="card-lead-icon" />
                <strong className="card-lead-email">{displayValue(row.email)}</strong>
              </div>
              <p className="card-lead-note">
                Người dùng đồng ý nhận cập nhật về kế hoạch hội viên. Chưa có thanh toán hoặc quyền lợi kích hoạt.
              </p>
            </div>

            <div className="card-footer-actions">
              <CopyEmailButton email={String(row.email || "")} />
              <a
                href={`mailto:${row.email}`}
                className="card-action-btn btn-mail"
                title="Gửi email trao đổi trực tiếp"
              >
                <ExternalLink size={13} /> Gửi thư liên hệ
              </a>
            </div>
          </article>
        ))}
      </div>
    );
  }

  // 2. Grid View riêng cho Nhật ký quản trị (Audit Logs)
  if (section === "audit-logs") {
    return (
      <div className="admin-record-grid">
        {rows.map((row) => {
          const actorName =
            (row.users as { full_name?: string } | undefined)?.full_name ||
            "Quản trị viên";
          return (
            <article className="admin-record-magazine-card card-variant-audit" key={row.id}>
              <div className="card-top-bar">
                <div className="card-tags-group">
                  <span className="card-audit-action-badge">
                    🛡️ {displayValue(row.action)}
                  </span>
                  <span className="card-audit-target-badge">
                    {displayValue(row.target_type)}
                  </span>
                </div>
                <span className="card-lead-time">
                  <Clock3 size={12} /> {dateValue(row.created_at)}
                </span>
              </div>

              <div className="card-body">
                <div className="card-audit-actor-row">
                  <span>Người thực hiện:</span>
                  <strong>{actorName}</strong>
                </div>
                <div className="card-audit-box">
                  <small>Mã mục tiêu: {displayValue(row.target_id)}</small>
                  <pre>{displayValue(JSON.stringify(row.details, null, 2))}</pre>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  // 3. Grid View cho 5 Kho nội dung (Văn hóa, Lịch, Xăm, Nghi lễ, Văn khấn)
  return (
    <div className="admin-record-grid">
      {rows.map((row) => {
        const title = getRecordTitle(row, section);
        const editorialActions = new Set(allowedEditorialActions({
          role: canReview ? "ADMIN" : "EDITOR",
          status: String(row.editorial_status || "DRAFT"),
          approvalCurrent: row.verified === true,
        }));
        const source =
          typeof row.source === "string" && row.source.startsWith("https://")
            ? row.source
            : null;
        const category = getContentCardCategory(section, row);
        const cardStatus = getContentCardStatus(row);

        return (
          <article
            className={`admin-record-magazine-card card-variant-${section}`}
            key={row.id}
          >
            <div className="card-top-bar">
              <div className="card-tags-group">
                {/* Lịch sự kiện: Date Pill */}
                {section === "calendar" && (
                  <span
                    className={`card-calendar-date-pill ${row.calendar === "LUNAR" ? "is-lunar" : "is-solar"}`}
                  >
                    {row.calendar === "LUNAR" ? "🌙 Âm lịch" : "☀️ Dương lịch"}: Ngày {displayValue(row.day)}/{displayValue(row.month)}
                  </span>
                )}

                {/* Danh mục xin xăm: Stick Number & Fortune Badge */}
                {section === "xam" && (
                  <>
                    <span className="card-xam-stick-badge">
                      🎋 Thẻ số {displayValue(row.stick_number)}
                    </span>
                    {Boolean(row.fortune_level) && (
                      <span
                        className={`card-fortune-pill ${fortuneLevelClass(row.fortune_level)}`}
                      >
                        ✨ {displayValue(row.fortune_level)}
                      </span>
                    )}
                  </>
                )}

                {/* Nghi lễ: Occasion Badge */}
                {section === "rituals" && (
                  <span className="card-ritual-occasion-badge">
                    🏮 Dịp: {displayValue(row.occasion || "Quanh năm")}
                  </span>
                )}

                {/* Văn khấn: Language Style & Ritual Tag */}
                {section === "prayers" && (
                  <>
                    <span className="card-prayer-style-badge">
                      📜 {displayValue(row.language_style || "Quốc ngữ chuẩn")}
                    </span>
                    {Boolean(row.ritual_id) && (
                      <span className="card-prayer-ritual-tag">
                        🏮 Gắn nghi lễ
                      </span>
                    )}
                  </>
                )}

                {/* Phân loại & Vùng miền chung */}
                {section !== "xam" && section !== "prayers" && category && (
                  <span className="card-cat-pill">{displayValue(category)}</span>
                )}
                <RegionPill region={row.region} />
              </div>

              <div className="card-status-group">
                {(row.editorial_status || row.verified !== undefined || row.active !== undefined) && (
                  <StatusBadge label={cardStatus.label} variant={cardStatus.variant} />
                )}
              </div>
            </div>

            <div className="card-body">
              <h3 className="card-title">{title}</h3>
              {row.editorial_status === "IN_REVIEW" && typeof row.submitted_by === "string" && (
                <p className="card-meta">Người gửi duyệt: <strong>{row.submitted_by}</strong></p>
              )}

              {/* Lịch sự kiện: Description Snippet */}
              {section === "calendar" && Boolean(row.description) && (
                <p className="card-desc-snippet">{displayValue(row.description)}</p>
              )}

              {/* Xin xăm: Collection & Category */}
              {section === "xam" && (
                <p className="card-meta">
                  Bộ thẻ: <strong>{displayValue(row.xam_type || "Chung")}</strong> · Phân loại: {category}
                </p>
              )}

              {/* Kho văn hóa / Nghi lễ: Slug */}
              {(section === "culture" || section === "rituals") && Boolean(row.slug) && (
                <div className="card-slug">
                  <span>Đường dẫn:</span> <code>/{displayValue(row.slug)}</code>
                </div>
              )}

              <div className="card-source-bar">
                {source ? (
                  <a
                    className="card-source-link"
                    href={source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={12} /> Mở nguồn tham khảo
                  </a>
                ) : (
                  requiresExistingSource && (
                    <span className="card-source-missing">
                      <AlertCircle size={12} /> Chưa có URL nguồn HTTPS
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="card-footer-actions">
              {canEdit && (
                <button
                  type="button"
                  className="card-action-btn btn-edit"
                  onClick={() => onEdit(row.id)}
                  title="Xem chi tiết nội dung"
                >
                  <Eye size={13} /> Xem chi tiết
                </button>
              )}

              {canReview && row.verified !== undefined && (editorialActions.has("approve") || editorialActions.has("revoke_approval")) && (
                <button
                  type="button"
                  className={`card-action-btn ${editorialActions.has("revoke_approval") ? "btn-unverify" : "btn-verify"}`}
                  disabled={editorialActions.has("approve") && requiresExistingSource && !source}
                  onClick={() => onReview(row, "verified")}
                  title={
                    editorialActions.has("approve") && requiresExistingSource && !source
                      ? "Cần có URL nguồn HTTPS hợp lệ trước khi duyệt"
                      : editorialActions.has("revoke_approval")
                        ? "Thu hồi duyệt để gỡ nội dung khỏi công khai và đưa về bản nháp"
                        : "Mở màn hình xem xét, duyệt nội dung"
                  }
                >
                  <Check size={13} />
                  {editorialActions.has("revoke_approval") ? "Thu hồi duyệt" : "Xem xét nội dung"}
                </button>
              )}

              {canReview && row.active !== undefined && (editorialActions.has("hide") || editorialActions.has("show") || editorialActions.has("publish")) && (
                <button
                  type="button"
                  className={`card-action-btn ${editorialActions.has("hide") ? "btn-hide" : "btn-show"}`}
                  onClick={() => onReview(row, "active")}
                  title={editorialActions.has("hide") ? "Ẩn nội dung đang công khai" : editorialActions.has("show") ? "Hiện lại nội dung đã duyệt" : "Công khai nội dung đã duyệt"}
                >
                  {editorialActions.has("hide") ? <EyeOff size={13} /> : <Eye size={13} />}
                  {editorialActions.has("hide") ? "Ẩn nội dung" : editorialActions.has("show") ? "Hiện lại" : "Công khai"}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

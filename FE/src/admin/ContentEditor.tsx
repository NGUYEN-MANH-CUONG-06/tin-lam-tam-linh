import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  FileCheck2,
  FileText,
  Globe,
  Image as ImageIcon,
  Info,
  LibraryBig,
  Link2,
  Lock,
  MapPin,
  Moon,
  Plus,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Sun,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import { ApiError, apiRequest } from "../lib/api";
import { editorialStatusLabel } from "../../../shared/editorial-workflow.mjs";
import {
  hasCompleteXamPoem,
  normalizeXamPoemLines,
} from "../../../shared/xin-xam-publication.mjs";
import { loadAdminList, type AdminRecord } from "../data/adminService";
import { loadXinXamOptions } from "../data/reflectionService";
import { pushAdminOverlay } from "./adminNavigation";
import { useTheme } from "../hooks/useTheme";
import { toast } from "../components/ui/Toast";
import {
  type RegionType,
} from "../data/xinXamData";

export type Kind = "culture" | "calendar" | "xam" | "rituals" | "prayers";
const CONTENT_NOUN: Record<Kind, string> = {
  culture: "bài văn hóa",
  calendar: "sự kiện",
  xam: "thẻ quẻ",
  rituals: "hướng dẫn nghi lễ",
  prayers: "văn khấn",
};
type Step = { title: string; description: string };
type ChecklistDraft = { id: string; label: string };
type RitualChoice = AdminRecord & { title: string };
type EditorialStatus = NonNullable<AdminRecord["editorial_status"]>;

const EDITORIAL_STATUS_LABELS: Record<EditorialStatus, string> = {
  DRAFT: editorialStatusLabel("DRAFT"),
  IN_REVIEW: editorialStatusLabel("IN_REVIEW"),
  APPROVED: editorialStatusLabel("APPROVED"),
  PUBLISHED: editorialStatusLabel("PUBLISHED"),
  HIDDEN: editorialStatusLabel("HIDDEN"),
  REVOKED: editorialStatusLabel("REVOKED"),
};

export function slugifyVietnamese(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidHttpsUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isValidImageUrl(value: string) {
  const trimmed = value.trim();
  return (
    !trimmed || isValidHttpsUrl(trimmed) || /^\/images\/[\w./-]+$/.test(trimmed)
  );
}

const CULTURE_CATEGORIES = [
  "Phong tục & Nghi lễ",
  "Lễ hội truyền thống",
  "Không gian tín ngưỡng",
  "Di tích & Danh thắng",
  "Diễn tích & Điển tích xưa",
  "Nhân vật lịch sử & Tâm linh",
  "Ẩm thực & Lễ vật cúng lễ",
  "Tín ngưỡng dân gian",
];

function isCompatibleXamType(value: string, regions: string[], topics: string[]): boolean {
  const [region, topic, ...extra] = value.split(":");
  return (
    extra.length === 0 &&
    regions.includes(region) &&
    topics.includes(topic)
  );
}

function createChecklistId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `check-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
}

const KIND_META: Record<
  Kind,
  { title: string; tag: string; icon: typeof BookOpenText }
> = {
  culture: {
    title: "Nội dung văn hóa",
    tag: "KHO VĂN HÓA",
    icon: BookOpenText,
  },
  calendar: {
    title: "Sự kiện lễ hội cổ truyền",
    tag: "LỊCH SỰ KIỆN TÂM LINH",
    icon: CalendarDays,
  },
  xam: {
    title: "Thẻ xăm chiêm nghiệm",
    tag: "HỆ THỐNG QUẺ XĂM",
    icon: LibraryBig,
  },
  rituals: {
    title: "Hướng dẫn nghi lễ",
    tag: "NGHI THỨC TRUYỀN THỐNG",
    icon: BookOpenText,
  },
  prayers: {
    title: "Văn khấn",
    tag: "VĂN KHẤN",
    icon: FileCheck2,
  },
};

export function ContentEditor({
  kind,
  id,
  onClose,
  onSaved,
}: {
  kind: Kind;
  id?: string;
  onClose: () => void;
  onSaved: (result: { id: string; submittedForReview: boolean }) => void;
}) {
  const { dark, toggleTheme } = useTheme();
  const [xamRegions, setXamRegions] = useState<string[]>([]);
  const [xamTopics, setXamTopics] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<
    "info" | "content" | "media" | "preview"
  >("info");
  const [slugUnlocked, setSlugUnlocked] = useState(!id);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string>();
  const [editorialStatus, setEditorialStatus] =
    useState<EditorialStatus | null>(id ? null : "DRAFT");

  const [values, setValues] = useState<Record<string, string>>({
    title: "",
    slug: "",
    category: kind === "culture" ? "Phong tục & Nghi lễ" : "",
    excerpt: "",
    region: "NATIONWIDE",
    image_url: "",
    source: "",
    reviewNote: "",
    // Special kind fields
    calendar: "LUNAR",
    day: "",
    month: "",
    description: "",
    name: "",
    stick_number: "1",
    xam_type: "",
    fortune_level: "Thượng Cát",
    poem: "",
    meaning: "",
    advice: "",
    occasion: "",
    language_style: "Quốc ngữ chuẩn",
    ritual_id: "",
    content: "",
  });

  // Source & provenance metadata (clean separation)
  const [sourceDoc, setSourceDoc] = useState("");
  const [sourceAuthor, setSourceAuthor] = useState("");
  const [bibliography, setBibliography] = useState("");
  const [contentType, setContentType] = useState<
    "" | "GROUP_AUTHORED" | "FACT" | "LEGEND" | "QUOTATION"
  >("");
  const [sourceLocator, setSourceLocator] = useState("");
  const [localCommunity, setLocalCommunity] = useState("");
  const [scopeOfPractice, setScopeOfPractice] = useState("");
  const [contentRightsBasis, setContentRightsBasis] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [imageCredit, setImageCredit] = useState("");
  const [imageSource, setImageSource] = useState("");
  const [imageRightsBasis, setImageRightsBasis] = useState("");
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageFitMode, setImageFitMode] = useState<"contain" | "cover">(
    "contain",
  );
  const [membersOnly, setMembersOnly] = useState(false);

  // Dynamic sections (culture) and steps (rituals)
  const [sections, setSections] = useState([{ heading: "", body: "" }]);
  const [steps, setSteps] = useState<Step[]>([{ title: "", description: "" }]);
  const [checklists, setChecklists] = useState<ChecklistDraft[]>([]);
  const [rituals, setRituals] = useState<RitualChoice[]>([]);

  const [error, setError] = useState("");
  const [reviewNoteError, setReviewNoteError] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [editorAccessDenied, setEditorAccessDenied] = useState(false);
  const [savingMode, setSavingMode] = useState<"draft" | "submit" | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<{
    note: string;
    reviewerName: string;
    createdAt: string;
    feedbackKind?: "approval-revoked" | "changes-requested";
    isPreviousRound: boolean;
  } | null>(null);
  const cleanSnapshotRef = useRef<string | null>(null);
  const historyBackPendingRef = useRef(false);
  const discardStayButtonRef = useRef<HTMLButtonElement>(null);

  const editorSnapshot = JSON.stringify({
    values,
    sourceDoc,
    sourceAuthor,
    bibliography,
    contentType,
    sourceLocator,
    localCommunity,
    scopeOfPractice,
    contentRightsBasis,
    imageCaption,
    imageCredit,
    imageSource,
    imageRightsBasis,
    membersOnly,
    sections,
    steps,
    checklists,
  });
  const hasUnsavedChanges =
    cleanSnapshotRef.current !== null &&
    cleanSnapshotRef.current !== editorSnapshot;
  const reviewNoteLength = (values.reviewNote || "").trim().length;
  const hasUsableChecklist = checklists.some(
    (item) => item.id.trim() && item.label.trim(),
  );
  const [xamPreviewRegion = "", xamPreviewTopic = ""] =
    values.xam_type.split(":");
  const regionLabel =
    values.region === "NORTH"
      ? "Bắc Bộ"
      : values.region === "CENTRAL"
        ? "Trung Bộ"
        : values.region === "SOUTH"
          ? "Nam Bộ"
          : "Toàn quốc";

  const resumeEditing = () => {
    window.dispatchEvent(new CustomEvent("admin:cancel-content-editor-close"));
    if (historyBackPendingRef.current) {
      pushAdminOverlay("content-editor");
      historyBackPendingRef.current = false;
    }
    setShowDiscardConfirm(false);
  };

  useEffect(() => {
    if (!loading && cleanSnapshotRef.current === null) {
      cleanSnapshotRef.current = editorSnapshot;
    }
  }, [editorSnapshot, loading]);

  useEffect(() => {
    if (showDiscardConfirm) discardStayButtonRef.current?.focus();
  }, [showDiscardConfirm]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (savingMode) return;
      if (showDiscardConfirm) {
        resumeEditing();
      } else if (hasUnsavedChanges) {
        setShowDiscardConfirm(true);
      } else {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [
    hasUnsavedChanges,
    onClose,
    resumeEditing,
    savingMode,
    showDiscardConfirm,
  ]);

  const requestClose = () => {
    if (savingMode) return;
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  };

  useEffect(() => {
    const handleCloseRequest = () => requestClose();
    window.addEventListener(
      "admin:request-content-editor-close",
      handleCloseRequest,
    );
    return () =>
      window.removeEventListener(
        "admin:request-content-editor-close",
        handleCloseRequest,
      );
  }, [requestClose]);

  useEffect(() => {
    const handlePopState = () => {
      if (savingMode) return;
      historyBackPendingRef.current = true;
      requestClose();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [requestClose, savingMode]);

  const meta = KIND_META[kind];
  // Load rituals if kind is prayers
  useEffect(() => {
    let active = true;
    if (kind === "xam") {
      void loadXinXamOptions()
        .then(({ regions, topics, defaultRegion }) => {
          if (!active) return;
          setXamRegions(regions.filter((region) => region !== defaultRegion));
          setXamTopics(topics);
        })
        .catch(() => {
          if (active) setError("Không tải được danh mục Xin xăm từ máy chủ.");
        });
    }
    return () => {
      active = false;
    };
  }, [kind]);

  useEffect(() => {
    let active = true;
    if (kind === "prayers") {
      void (async () => {
        try {
          const firstPage = await loadAdminList<RitualChoice>("rituals", 1, "");
          const remaining = await Promise.all(
            Array.from(
              { length: Math.max(0, firstPage.pagination.pageCount - 1) },
              (_, index) =>
                loadAdminList<RitualChoice>("rituals", index + 2, ""),
            ),
          );
          if (active) {
            setRituals(
              [
                ...firstPage.items,
                ...remaining.flatMap((page) => page.items),
              ].filter(
                (ritual) =>
                  ritual.active &&
                  ritual.verified &&
                  ritual.editorial_status === "PUBLISHED",
              ),
            );
          }
        } catch (loadError) {
          if (active) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "Không tải được danh sách nghi lễ.",
            );
          }
        }
      })();
    }
    return () => {
      active = false;
    };
  }, [kind]);

  // Load record if editing
  useEffect(() => {
    if (!id) return;
    let active = true;
    apiRequest<Record<string, unknown>>(`/admin/${kind}/${id}`)
      .then((record) => {
        setExpectedUpdatedAt(
          typeof record.updated_at === "string" ? record.updated_at : undefined,
        );
        if (!active) return;
        const feedback = record.editor_feedback_meta as typeof adminFeedback;
        setAdminFeedback(
          feedback && typeof feedback.note === "string" ? feedback : null,
        );
        const loadedStatus = record.editorial_status;
        if (loadedStatus !== "DRAFT") {
          setEditorialStatus(
            loadedStatus === "IN_REVIEW" ||
              loadedStatus === "APPROVED" ||
              loadedStatus === "PUBLISHED" ||
              loadedStatus === "HIDDEN" ||
              loadedStatus === "REVOKED"
              ? loadedStatus
              : null,
          );
          setEditorAccessDenied(true);
          setError(
            "Chỉ bản nháp thuộc quyền biên tập của bạn mới có thể mở để chỉnh sửa.",
          );
          return;
        }
        setEditorialStatus(
          loadedStatus === "DRAFT" ||
            loadedStatus === "IN_REVIEW" ||
            loadedStatus === "APPROVED" ||
            loadedStatus === "PUBLISHED" ||
            loadedStatus === "HIDDEN" ||
            loadedStatus === "REVOKED"
            ? loadedStatus
            : null,
        );
        const next: Record<string, string> = {};
        for (const [key, value] of Object.entries(record)) {
          if (typeof value === "string" || typeof value === "number") {
            next[key] = String(value);
          }
        }

        // Clean source URL: if source contains "Tư liệu biên tập nội bộ" or is not https, move to sourceDoc
        if (record.source) {
          const rawSource = String(record.source).trim();
          if (/^https?:\/\//i.test(rawSource)) {
            next.source = rawSource;
          } else {
            next.source = "";
            setSourceDoc(rawSource);
          }
        }

        setValues((current) => ({ ...current, ...next }));
        setMembersOnly(record.members_only === true);

        const content = record.content as
          | {
              provenance?: Record<string, unknown>;
              sections?: Array<{
                heading?: string;
                title?: string;
                body?: string | string[];
                paragraphs?: string[];
              }>;
            }
          | undefined;

        const provenance =
          content?.provenance ??
          (record.editorial_metadata &&
          typeof record.editorial_metadata === "object"
            ? (record.editorial_metadata as Record<string, unknown>)
            : undefined);
        const ritualProvenance =
          record.content_provenance &&
          typeof record.content_provenance === "object"
            ? (record.content_provenance as Record<string, unknown>)
            : undefined;
        const legacyProvenance =
          record.legacyProvenance && typeof record.legacyProvenance === "object"
            ? (record.legacyProvenance as Record<string, unknown>)
            : undefined;
        if (provenance) {
          setSourceDoc(String(provenance.sourceTitle ?? ""));
          setSourceAuthor(String(provenance.sourceAuthor ?? ""));
          setBibliography(String(provenance.bibliography ?? ""));
          setSourceLocator(String(provenance.sourceLocator ?? ""));
          setLocalCommunity(String(provenance.localCommunity ?? ""));
          setImageCaption(String(provenance.imageCaption ?? ""));
          setImageSource(String(provenance.imageSource ?? ""));
          setImageRightsBasis(String(provenance.imageRightsBasis ?? ""));
          setContentRightsBasis(String(provenance.contentRightsBasis ?? ""));
          if (
            ["GROUP_AUTHORED", "FACT", "LEGEND", "QUOTATION"].includes(
              String(provenance.contentType),
            )
          )
            setContentType(
              String(provenance.contentType) as typeof contentType,
            );
        } else if (legacyProvenance) {
          setSourceDoc(String(legacyProvenance.sourceTitle ?? ""));
          setSourceLocator(String(legacyProvenance.sourceLocator ?? ""));
          setLocalCommunity(String(legacyProvenance.localCommunity ?? ""));
          setImageCaption(String(legacyProvenance.imageCaption ?? ""));
          setImageRightsBasis(String(legacyProvenance.imageRightsBasis ?? ""));
        }
        if (kind === "rituals" && ritualProvenance) {
          const ritualType = String(ritualProvenance.contentType ?? "");
          if (
            ["GROUP_AUTHORED", "FACT", "LEGEND", "QUOTATION"].includes(
              ritualType,
            )
          )
            setContentType(ritualType as typeof contentType);
          setSourceDoc(String(ritualProvenance.sourceTitle ?? ""));
          setSourceAuthor(
            String(
              ritualProvenance.authorOrOrganization ??
                ritualProvenance.sourceAuthor ??
                "",
            ),
          );
          setSourceLocator(String(ritualProvenance.sourceLocator ?? ""));
          setLocalCommunity(String(ritualProvenance.localCommunity ?? ""));
          setScopeOfPractice(String(ritualProvenance.scope ?? ""));
          setContentRightsBasis(
            String(ritualProvenance.contentRightsBasis ?? ""),
          );
          setBibliography(String(ritualProvenance.bibliography ?? ""));
          setImageCaption(String(ritualProvenance.imageCaption ?? ""));
          setImageCredit(String(ritualProvenance.imageCredit ?? ""));
          setImageSource(String(ritualProvenance.imageSource ?? ""));
          setImageRightsBasis(String(ritualProvenance.imageRightsBasis ?? ""));
        }

        if (content?.sections?.length) {
          setSections(
            content.sections.map((section) => ({
              heading: section.heading ?? section.title ?? "",
              body: Array.isArray(section.body)
                ? section.body.join("\n\n")
                : (section.body ?? section.paragraphs?.join("\n\n") ?? ""),
            })),
          );
        }

        const storedSteps = record.ritual_steps as
          | Array<{ title?: string; description?: string }>
          | undefined;
        if (storedSteps?.length) {
          setSteps(
            storedSteps.map((step) => ({
              title: step.title ?? "",
              description: step.description ?? "",
            })),
          );
        }
        const storedChecklists = record.checklists as
          | ChecklistDraft[]
          | undefined;
        if (Array.isArray(storedChecklists)) {
          setChecklists(
            storedChecklists.filter(
              (item) =>
                item &&
                typeof item.id === "string" &&
                typeof item.label === "string",
            ),
          );
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không tải được bản thảo.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [kind, id]);

  const set = (key: string, value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  };

  const handleTitleChange = (newTitle: string) => {
    set("title", newTitle);
    // Auto-generate slug if not customized and not an existing article
    if (slugUnlocked && !id) {
      set("slug", slugifyVietnamese(newTitle));
    }
  };

  const isSourceUrlInvalid =
    Boolean(values.source.trim()) && !isValidHttpsUrl(values.source);
  const isRitualImageUrlInvalid =
    kind === "rituals" && !isValidImageUrl(values.image_url);
  const hasCompleteRitualImageProfile =
    kind === "rituals" &&
    Boolean(
      values.image_url.trim() &&
      imageCaption.trim() &&
      imageCredit.trim() &&
      isValidHttpsUrl(imageSource) &&
      imageRightsBasis.trim(),
    );

  const isExcerptDuplicatingTitle =
    Boolean(values.title && values.excerpt) &&
    values.excerpt.trim().toLowerCase() === values.title.trim().toLowerCase();

  const isStep1Complete = (() => {
    if (kind === "xam") {
      return Boolean(
        values.name?.trim() && values.stick_number && values.fortune_level,
      );
    }
    const hasTitle = Boolean(values.title?.trim());
    const hasCategory = Boolean(values.category?.trim());
    if (kind === "culture") {
      return hasTitle && hasCategory && Boolean(contentType);
    }
    if (kind === "calendar") {
      const day = Number(values.day);
      const month = Number(values.month);
      const maxDay =
        values.calendar === "LUNAR"
          ? 30
          : [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
      return (
        hasTitle &&
        hasCategory &&
        day >= 1 &&
        day <= maxDay &&
        month >= 1 &&
        month <= 12
      );
    }
    if (kind === "rituals" || kind === "prayers") {
      return (
        hasTitle &&
        hasCategory &&
        (kind !== "rituals" || Boolean(contentType)) &&
        (kind !== "prayers" || Boolean(values.ritual_id))
      );
    }
    return hasTitle && hasCategory;
  })();

  const isStep2Complete = (() => {
    if (kind === "culture") {
      return (
        sections.length > 0 &&
        sections.every((s) => s.heading.trim() && s.body.trim()) &&
        sections.some((s) => s.body.trim().length >= 120)
      );
    }
    if (kind === "rituals") {
      return (
        steps.length > 0 &&
        steps.every((s) => s.title.trim() && s.description.trim()) &&
        hasUsableChecklist
      );
    }
    if (kind === "prayers") {
      return Boolean(values.content?.trim());
    }
    if (kind === "xam") {
      return (
        hasCompleteXamPoem(values.poem) &&
        Boolean(values.meaning?.trim() && values.advice?.trim())
      );
    }
    if (kind === "calendar") {
      return Boolean(values.description?.trim());
    }
    return false;
  })();

  const isStep3Complete = (() => {
    if (isSourceUrlInvalid) return false;
    if (kind === "calendar") return isValidHttpsUrl(values.source);
    if (kind === "culture") {
      const contentRightsReady =
        contentType === "GROUP_AUTHORED"
          ? Boolean(contentRightsBasis.trim())
          : Boolean(
              sourceDoc.trim() &&
              (bibliography.trim() || values.source.trim()) &&
              sourceLocator.trim(),
            );
      const imageReady =
        !values.image_url.trim() ||
        Boolean(
          imageCaption.trim() &&
          (imageSource.trim() || imageCredit.trim()) &&
          imageRightsBasis.trim(),
        );
      return contentRightsReady && imageReady;
    }
    if (kind === "rituals") {
      const sourceReady =
        contentType === "GROUP_AUTHORED"
          ? Boolean(
              sourceAuthor.trim() &&
              scopeOfPractice.trim() &&
              contentRightsBasis.trim(),
            )
          : Boolean(isValidHttpsUrl(values.source) && sourceLocator.trim());
      const imageReady =
        !values.image_url.trim() ||
        (!isRitualImageUrlInvalid &&
          Boolean(
            imageCaption.trim() &&
            imageCredit.trim() &&
            isValidHttpsUrl(imageSource) &&
            imageRightsBasis.trim(),
          ));
      return sourceReady && imageReady;
    }
    if (kind === "prayers")
      return Boolean(isValidHttpsUrl(values.source) && sourceLocator.trim());
    if (kind === "xam") return isValidHttpsUrl(values.source);
    return true;
  })();

  const missingReviewRequirements: Array<{
    tab: "info" | "content" | "media";
    label: string;
  }> = [];
  const addMissing = (tab: "info" | "content" | "media", label: string) => {
    missingReviewRequirements.push({ tab, label });
  };
  if (kind === "xam") {
    if (!values.name.trim()) addMissing("info", "tên thẻ quẻ");
    if (!values.stick_number.trim()) addMissing("info", "số quẻ");
  } else {
    if (!values.title.trim()) addMissing("info", "tiêu đề");
    if (
      (kind === "culture" ||
        kind === "calendar" ||
        kind === "rituals" ||
        kind === "prayers") &&
      !values.category.trim()
    ) {
      addMissing("info", "chủ đề chuyên mục");
    }
  }
  if (kind === "culture" && !contentType)
    addMissing("info", "phương thức biên soạn");
  if (kind === "rituals" && !contentType)
    addMissing("info", "phương thức biên soạn");
  if (kind === "calendar") {
    const day = Number(values.day);
    const month = Number(values.month);
    const maxDay =
      values.calendar === "LUNAR"
        ? 30
        : [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
    if (!values.day.trim() || !values.month.trim()) {
      if (!values.day.trim()) addMissing("info", "ngày");
      if (!values.month.trim()) addMissing("info", "tháng");
    } else if (day < 1 || day > maxDay || month < 1 || month > 12) {
      addMissing("info", "ngày hợp lệ theo tháng và hệ lịch");
    }
  }
  if (kind === "prayers" && !values.ritual_id)
    addMissing("info", "nghi lễ đã công khai cần liên kết");

  if (kind === "culture") {
    if (
      !sections.length ||
      sections.some(
        (section) => !section.heading.trim() || !section.body.trim(),
      )
    ) {
      addMissing("content", "tiêu đề và nội dung của từng phân mục");
    }
    if (!sections.some((section) => section.body.trim().length >= 120))
      addMissing("content", "một phân mục có ít nhất 120 ký tự");
  } else if (kind === "rituals") {
    if (
      !steps.length ||
      steps.some((step) => !step.title.trim() || !step.description.trim())
    )
      addMissing("content", "tên và mô tả của từng bước nghi lễ");
    if (!hasUsableChecklist)
      addMissing("content", "ít nhất một mục checklist có nội dung");
  } else if (kind === "prayers" && !values.content.trim()) {
    addMissing("content", "toàn văn bài văn khấn");
  } else if (kind === "xam") {
    if (!hasCompleteXamPoem(values.poem))
      addMissing("content", "đủ bốn dòng thơ quẻ");
    if (!values.meaning.trim())
      addMissing("content", "phần diễn giải ý nghĩa quẻ");
    if (!values.advice.trim()) addMissing("content", "lời khuyên");
  } else if (kind === "calendar" && !values.description.trim()) {
    addMissing("content", "mô tả sự kiện");
  }

  if (isSourceUrlInvalid)
    addMissing("media", "URL nguồn hợp lệ bắt đầu bằng https://");
  if (kind === "calendar" && !isValidHttpsUrl(values.source))
    addMissing("media", "URL nguồn HTTPS hợp lệ");
  if (kind === "xam" && !isValidHttpsUrl(values.source))
    addMissing("media", "URL nguồn HTTPS hợp lệ");
  if (kind === "prayers") {
    if (!isValidHttpsUrl(values.source))
      addMissing("media", "URL nguồn HTTPS hợp lệ");
    if (!sourceLocator.trim()) addMissing("media", "vị trí trích dẫn");
  }
  if (kind === "culture") {
    if (contentType === "GROUP_AUTHORED" && !contentRightsBasis.trim())
      addMissing("media", "căn cứ quyền nội dung tự biên soạn");
    if (contentType && contentType !== "GROUP_AUTHORED") {
      if (!sourceDoc.trim()) addMissing("media", "tên tài liệu nguồn");
      if (!(bibliography.trim() || values.source.trim()))
        addMissing("media", "thông tin xuất bản hoặc URL nguồn");
      if (!sourceLocator.trim()) addMissing("media", "vị trí trích dẫn");
    }
    if (values.image_url.trim()) {
      if (!imageCaption.trim()) addMissing("media", "chú thích ảnh");
      if (!(imageSource.trim() || imageCredit.trim()))
        addMissing("media", "nguồn ảnh");
      if (!imageRightsBasis.trim())
        addMissing("media", "căn cứ quyền sử dụng ảnh");
    }
  }
  if (kind === "rituals") {
    if (contentType === "GROUP_AUTHORED") {
      if (!sourceAuthor.trim())
        addMissing("media", "người hoặc nhóm biên soạn");
      if (!scopeOfPractice.trim()) addMissing("media", "phạm vi áp dụng");
      if (!contentRightsBasis.trim())
        addMissing("media", "căn cứ quyền nội dung");
    } else if (contentType) {
      if (!isValidHttpsUrl(values.source))
        addMissing("media", "URL nguồn HTTPS hợp lệ");
      if (!sourceLocator.trim()) addMissing("media", "vị trí trích dẫn");
    }
    if (values.image_url.trim()) {
      if (isRitualImageUrlInvalid)
        addMissing("media", "đường dẫn ảnh HTTPS hoặc /images/ hợp lệ");
      if (!imageCaption.trim()) addMissing("media", "chú thích ảnh tổng quan");
      if (!imageCredit.trim()) addMissing("media", "tác giả / ghi công ảnh");
      if (!isValidHttpsUrl(imageSource))
        addMissing("media", "liên kết HTTPS trang nguồn ảnh");
      if (!imageRightsBasis.trim())
        addMissing("media", "căn cứ quyền sử dụng ảnh");
    }
  }
  const reviewStepLabels = {
    info: "Thông tin",
    content: "Nội dung",
    media: "Nguồn",
  } as const;
  const groupedReviewRequirements = (["info", "content", "media"] as const)
    .map((tab) => {
      const labels = missingReviewRequirements
        .filter((item) => item.tab === tab)
        .map((item) => item.label);
      return labels.length
        ? `${reviewStepLabels[tab]}: ${labels.join(", ")}`
        : "";
    })
    .filter(Boolean);
  const reviewMissingSummary = [
    ...groupedReviewRequirements,
    ...(reviewNoteLength < 8
      ? ["Xem trước: ghi chú gửi duyệt cần ít nhất 8 ký tự"]
      : []),
  ].join(" · ");

  const isEditorPortal =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/editor");

  const save = async (event?: React.FormEvent, submitForReview = false) => {
    if (event) event.preventDefault();
    if (savingMode) return;

    const mainTitle =
      kind === "xam" ? values.name?.trim() : values.title?.trim();
    if (!mainTitle) {
      setError(
        `Vui lòng nhập ${kind === "xam" ? "tên " : "tiêu đề "}${CONTENT_NOUN[kind]} trước khi tiếp tục.`,
      );
      setActiveTab("info");
      return;
    }
    if (submitForReview && values.reviewNote.trim().length < 8) {
      setReviewNoteError(true);
      const reviewNoteField = document.getElementById("field-reviewNote");
      reviewNoteField?.focus();
      reviewNoteField?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setReviewNoteError(false);

    // Validate HTTPS source URL
    if (isSourceUrlInvalid) {
      setError(
        "URL nguồn tham khảo không hợp lệ. Vui lòng nhập URL bắt đầu bằng https:// hoặc để trống.",
      );
      setActiveTab("media");
      return;
    }
    if (kind === "culture" && submitForReview && !contentType) {
      setError(
        "Hãy chọn phương thức biên soạn & tính chất tư liệu ở Bước 1 để hoàn tất hồ sơ nội dung.",
      );
      setActiveTab("info");
      return;
    }
    if (kind === "rituals" && submitForReview && !contentType) {
      setError(
        "Hãy khai báo phương thức biên soạn (nguyên bản hay dựa trên tư liệu) ở Bước 1 trước khi gửi duyệt.",
      );
      setActiveTab("info");
      return;
    }
    if (kind === "xam") {
      if (!isCompatibleXamType(values.xam_type, xamRegions, xamTopics)) {
        setError(
          "Hãy chọn đúng tổ hợp vùng miền và chủ đề đang có trên màn xin xăm.",
        );
        setActiveTab("info");
        return;
      }
    }
    if (
      submitForReview &&
      (!isStep1Complete || !isStep2Complete || !isStep3Complete)
    ) {
      setError(
        `Chưa thể gửi duyệt. Còn thiếu: ${groupedReviewRequirements.join("; ") || "thông tin bắt buộc trong các bước"}.`,
      );
      setActiveTab(
        missingReviewRequirements[0]?.tab ||
          (!isStep1Complete ? "info" : !isStep2Complete ? "content" : "media"),
      );
      return;
    }

    setSavingMode(submitForReview ? "submit" : "draft");
    setError("");

    const payload: Record<string, unknown> = {
      region: values.region || "NATIONWIDE",
      source: values.source.trim(),
      category: values.category.trim(),
      image_url: values.image_url.trim(),
      ...(values.reviewNote.trim()
        ? { reviewNote: values.reviewNote.trim() }
        : {}),
      editorialStatus: submitForReview ? "IN_REVIEW" : "DRAFT",
      ...(id && expectedUpdatedAt ? { expectedUpdatedAt } : {}),
    };

    if (kind === "culture") {
      const generatedSlug =
        values.slug.trim() || slugifyVietnamese(values.title) || "bai-viet-moi";
      payload.slug = generatedSlug;
      payload.title = values.title.trim();
      payload.members_only = membersOnly;
      payload.category = values.category.trim() || "Phong tục & Nghi lễ";
      payload.excerpt = values.excerpt.trim();
      payload.image_url = values.image_url.trim();
      payload.provenance = {
        ...(contentType ? { contentType } : {}),
        contentRightsBasis: contentRightsBasis.trim(),
        sourceTitle: sourceDoc.trim(),
        sourceAuthor: sourceAuthor.trim(),
        bibliography: bibliography.trim(),
        sourceLocator: sourceLocator.trim(),
        localCommunity: localCommunity.trim(),
        imageCaption: imageCaption.trim(),
        imageSource: imageSource.trim() || imageCredit.trim(),
        imageRightsBasis: imageRightsBasis.trim(),
      };
      payload.sections = sections.map((sec, idx) => ({
        heading: sec.heading.trim(),
        body: sec.body.trim(),
      }));
    } else if (kind === "calendar") {
      payload.title = values.title.trim();
      payload.category = values.category.trim() || "Lễ hội";
      payload.calendar = values.calendar || "LUNAR";
      payload.day = values.day.trim() ? Number(values.day) : null;
      payload.month = values.month.trim() ? Number(values.month) : null;
      payload.description = values.description.trim();
    } else if (kind === "xam") {
      const [xamRegion] = values.xam_type.split(":");
      const regionCode: Record<RegionType, string> = {
        "Bắc Bộ": "NORTH",
        "Trung Bộ": "CENTRAL",
        "Nam Bộ": "SOUTH",
      };
      payload.region = regionCode[xamRegion as RegionType];
      payload.name = values.name.trim() || `Quẻ số ${values.stick_number}`;
      payload.stick_number = Number(values.stick_number) || 1;
      payload.xam_type = values.xam_type;
      payload.category = values.category.trim() || "Chiêm nghiệm";
      payload.fortune_level = values.fortune_level || "Thượng Cát";
      payload.poem = normalizeXamPoemLines(values.poem).join("\n");
      payload.meaning = values.meaning.trim();
      payload.advice = values.advice.trim();
    } else if (kind === "rituals") {
      const generatedSlug =
        values.slug.trim() || slugifyVietnamese(values.title) || "nghi-le-moi";
      payload.slug = generatedSlug;
      payload.title = values.title.trim();
      payload.description = values.description.trim();
      payload.occasion = values.occasion.trim() || "Dịp lễ truyền thống";
      payload.calendar = values.calendar || null;
      payload.steps = steps.map((st, idx) => ({
        title: st.title.trim(),
        description: st.description.trim(),
      }));
      payload.checklists = checklists
        .map((item) => ({ id: item.id, label: item.label.trim() }))
        .filter((item) => item.label.length > 0);
      payload.provenance = {
        ...(contentType ? { contentType } : {}),
        authorOrOrganization: sourceAuthor.trim(),
        scope: scopeOfPractice.trim(),
        sourceTitle: sourceDoc.trim(),
        sourceAuthor: sourceAuthor.trim(),
        bibliography: bibliography.trim(),
        sourceLocator: sourceLocator.trim(),
        localCommunity: localCommunity.trim(),
        contentRightsBasis: contentRightsBasis.trim(),
        imageCaption: imageCaption.trim(),
        imageCredit: imageCredit.trim(),
        imageSource: imageSource.trim(),
        imageRightsBasis: imageRightsBasis.trim(),
      };
    } else if (kind === "prayers") {
      payload.title = values.title.trim();
      payload.language_style = values.language_style.trim() || "Quốc ngữ chuẩn";
      payload.content = values.content.trim();
      payload.ritual_id = values.ritual_id || null;
    }

    if (kind !== "culture" && kind !== "rituals") {
      payload.provenance = {
        ...(contentType ? { contentType } : {}),
        contentRightsBasis: contentRightsBasis.trim(),
        sourceTitle: sourceDoc.trim(),
        sourceAuthor: sourceAuthor.trim(),
        bibliography: bibliography.trim(),
        sourceLocator: sourceLocator.trim(),
        localCommunity: localCommunity.trim(),
        imageCaption: imageCaption.trim(),
        imageSource: imageSource.trim() || imageCredit.trim(),
        imageRightsBasis: imageRightsBasis.trim(),
      };
    }

    try {
      const savedRecord = await apiRequest<AdminRecord>(
        `/admin/${kind}${id ? `/${id}` : ""}`,
        {
          method: id ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );
      if (submitForReview) {
        toast.success(
          `Nội dung "${mainTitle}" đã được gửi lên hàng đợi chờ duyệt.`,
          "Gửi duyệt thành công",
        );
      } else {
        cleanSnapshotRef.current = editorSnapshot;
        toast.success(
          `Bản thảo "${mainTitle}" đã được lưu an toàn vào hệ thống.`,
          "Đã lưu bản nháp",
        );
      }
      onSaved({
        id: savedRecord.id || id || "",
        submittedForReview: submitForReview,
      });
    } catch (saveError) {
      const msg =
        saveError instanceof ApiError && saveError.errors[0]
          ? `${saveError.message} (${saveError.errors[0].field || "field"}: ${saveError.errors[0].message})`
          : saveError instanceof Error
            ? saveError.message
            : "Chưa lưu được nội dung bản thảo.";
      setError(msg);
      toast.error(msg, "Lưu không thành công");
    } finally {
      setSavingMode(null);
    }
  };

  return (
    <div
      className="admin-editor-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-editor-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div className="admin-editor-modal">
        {/* Header */}
        <div className="admin-editor-header">
          <div className="admin-editor-header-copy">
            <span className="admin-editor-eyebrow">
              <Sparkles size={13} /> {meta.tag}
            </span>
            <h2 id="content-editor-title" className="admin-editor-title">
              {id ? `Biên tập ${meta.title}` : `Tạo bản nháp ${meta.title}`}
            </h2>
            <div className="admin-editor-heading-row">
              <div className="admin-editor-breadcrumb">
                {isEditorPortal ? "Không gian biên tập" : "Cổng quản trị"}{" "}
                <ChevronRight size={14} /> {meta.tag}
              </div>
              <span
                className={`admin-editor-status-pill ${editorialStatus === "PUBLISHED" ? "is-published" : editorialStatus === "IN_REVIEW" ? "is-review" : ""}`}
              >
                <span className="admin-editor-status-dot" />
                {editorialStatus
                  ? EDITORIAL_STATUS_LABELS[editorialStatus]
                  : "Đang tải trạng thái"}
              </span>
            </div>
          </div>
          <div
            className="admin-editor-header-actions"
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <button
              type="button"
              className="admin-theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={
                dark ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"
              }
              title={
                dark
                  ? "Chuyển sang giao diện Sáng"
                  : "Chuyển sang giao diện Tối"
              }
            >
              {dark ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              type="button"
              className="admin-editor-close-btn"
              onClick={requestClose}
              disabled={Boolean(savingMode)}
              title="Đóng bản thảo (Esc)"
              aria-label="Đóng bản thảo"
            >
              <ArrowLeft size={18} />
            </button>
          </div>
        </div>

        {/* Keep the workflow guidance available without crowding the editor. */}
        <div className="admin-editor-notice-wrap">
          <details className="admin-editor-notice">
            <summary className="admin-editor-notice-summary">
              <Info size={16} aria-hidden="true" />
              <span>
                <strong>Quy trình duyệt bài</strong> · Lưu nháp để tiếp tục
                chỉnh sửa; gửi duyệt để chuyển cho người phụ trách rà soát.
              </span>
              <ChevronDown
                size={16}
                className="admin-editor-notice-chevron"
                aria-hidden="true"
              />
            </summary>
            <div className="admin-editor-notice-details">
              <div>
                <strong>Lưu bản nháp:</strong> Nội dung chưa hiển thị với người
                dùng.
              </div>
              <div>
                <strong>Gửi duyệt:</strong> Chuyển nội dung sang Chờ duyệt để
                kiểm tra nội dung, nguồn và quyền sử dụng trước khi công khai.
              </div>
              {editorialStatus === "PUBLISHED" && (
                <div>
                  <strong>Lưu ý:</strong> Bài đang công khai sẽ tạm ẩn sau khi
                  lưu thay đổi và cần được duyệt, công khai lại.
                </div>
              )}
            </div>
          </details>
        </div>

        {showDiscardConfirm && (
          <div
            className="admin-editor-discard-backdrop"
            onClick={(event) => {
              if (event.target === event.currentTarget) resumeEditing();
            }}
          >
            <section
              className="admin-editor-discard-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="admin-editor-discard-title"
              aria-describedby="admin-editor-discard-description"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="admin-editor-discard-icon">
                <AlertCircle size={20} />
              </span>
              <h3 id="admin-editor-discard-title">Bỏ các thay đổi chưa lưu?</h3>
              <p id="admin-editor-discard-description">
                Nội dung bạn vừa chỉnh sửa sẽ mất nếu đóng bản nháp ngay bây
                giờ.
              </p>
              <div className="admin-editor-discard-actions">
                <button
                  type="button"
                  className="admin-editor-action-btn is-cancel"
                  ref={discardStayButtonRef}
                  onClick={resumeEditing}
                >
                  Tiếp tục chỉnh sửa
                </button>
                <button
                  type="button"
                  className="admin-editor-action-btn is-discard"
                  onClick={onClose}
                >
                  Bỏ thay đổi
                </button>
              </div>
            </section>
          </div>
        )}

        {adminFeedback && (
          <aside className="admin-editor-feedback-callout" role="note">
            <strong>
              {adminFeedback.feedbackKind === "approval-revoked"
                ? adminFeedback.isPreviousRound
                  ? "Lý do thu hồi duyệt · lượt trước"
                  : "Lý do thu hồi duyệt · lượt hiện tại"
                : adminFeedback.isPreviousRound
                  ? "Góp ý vòng trước"
                  : "Góp ý Admin · lượt hiện tại"}
            </strong>
            <span>
              {adminFeedback.reviewerName} ·{" "}
              {adminFeedback.createdAt
                ? new Intl.DateTimeFormat("vi-VN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(adminFeedback.createdAt))
                : "Không rõ thời gian"}
            </span>
            <p>{adminFeedback.note}</p>
          </aside>
        )}

        {/* Form Body */}
        {loading ? (
          <div
            className="admin-editor-body"
            style={{
              alignItems: "center",
              justifyContent: "center",
              minHeight: "320px",
            }}
          >
            <RefreshCw
              size={26}
              className="admin-spin-icon"
              style={{ color: "var(--admin-gold)" }}
            />
            <p
              style={{
                margin: 0,
                color: "var(--admin-muted)",
                fontSize: "14px",
              }}
            >
              Đang đồng bộ dữ liệu bản thảo từ máy chủ…
            </p>
          </div>
        ) : editorAccessDenied ? (
          <div className="admin-editor-body" role="alert">
            <div className="admin-alert" style={{ margin: 0 }}>
              <div className="admin-alert-content">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            </div>
          </div>
        ) : (
          <form
            id="admin-content-editor-form"
            onSubmit={(event) => void save(event, false)}
            className="admin-editor-body"
          >
            {error && (
              <div className="admin-alert" role="alert" style={{ margin: 0 }}>
                <div className="admin-alert-content">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Đóng"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* 3 MVP Group Tabs + Live Preview */}
            <div className="admin-editor-workspace">
              <nav
                className="admin-editor-tabs-nav"
                aria-label="Các phần biên tập"
              >
                <button
                  type="button"
                  aria-current={activeTab === "info" ? "page" : undefined}
                  className={`admin-editor-tab-btn ${activeTab === "info" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("info")}
                >
                  <BookOpenText size={15} /> 1. Thông tin {CONTENT_NOUN[kind]}
                  {isStep1Complete && (
                    <>
                      <CheckCircle2 size={13} className="tab-completed-check" />
                      <span className="admin-editor-tab-status">
                        Đã nhập thông tin
                      </span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  aria-current={activeTab === "content" ? "page" : undefined}
                  className={`admin-editor-tab-btn ${activeTab === "content" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("content")}
                >
                  <FileText size={15} /> 2. Nội dung chi tiết
                  {isStep2Complete && (
                    <>
                      <CheckCircle2 size={13} className="tab-completed-check" />
                      <span className="admin-editor-tab-status">
                        Đã nhập thông tin
                      </span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  aria-current={activeTab === "media" ? "page" : undefined}
                  className={`admin-editor-tab-btn ${activeTab === "media" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("media")}
                >
                  <Link2 size={15} /> 3.{" "}
                  {kind === "culture" ? "Nguồn & ảnh minh họa" : "Nguồn"}
                  {isStep3Complete && (
                    <>
                      <CheckCircle2 size={13} className="tab-completed-check" />
                      <span className="admin-editor-tab-status">
                        Đã nhập thông tin
                      </span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  aria-current={activeTab === "preview" ? "page" : undefined}
                  className={`admin-editor-tab-btn ${activeTab === "preview" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("preview")}
                >
                  <Eye size={15} /> Xem trước
                </button>
              </nav>
              <div className="admin-editor-main-panel">
                {/* TAB 1: THÔNG TIN BÀI VIẾT */}
                {activeTab === "info" && (
                  <div className="admin-editor-grid">
                    {/* Tiêu đề nội dung */}
                    <div className="admin-editor-field admin-editor-col-full">
                      <label
                        htmlFor="field-title"
                        className="admin-editor-label"
                      >
                        <span>
                          {kind === "calendar"
                            ? "Tên sự kiện / Lễ hội"
                            : kind === "rituals"
                              ? "Tên nghi lễ truyền thống"
                              : kind === "prayers"
                                ? "Tên bài văn khấn"
                                : kind === "xam"
                                  ? "Tên thẻ quẻ"
                                  : `Tiêu đề ${CONTENT_NOUN[kind]}`}{" "}
                          <span style={{ color: "var(--admin-crimson)" }}>
                            *
                          </span>
                        </span>
                        <span className="admin-editor-label-hint">
                          Bắt buộc
                        </span>
                      </label>
                      <input
                        id="field-title"
                        required
                        className="admin-editor-input"
                        type="text"
                        placeholder="Nhập tiêu đề cô đọng, rõ nghĩa (ví dụ: Lễ hội Tịch điền Đọi Sơn)…"
                        value={
                          kind === "xam"
                            ? values.name || ""
                            : values.title || ""
                        }
                        onChange={(e) =>
                          kind === "xam"
                            ? set("name", e.target.value)
                            : handleTitleChange(e.target.value)
                        }
                      />
                    </div>

                    {(kind === "culture" || kind === "rituals") && (
                      <div className="admin-editor-field admin-editor-col-full">
                        <label
                          htmlFor="field-slug"
                          className="admin-editor-label"
                        >
                          <span>
                            Đường dẫn{" "}
                            {kind === "culture" ? "bài văn hóa" : "nghi lễ"}{" "}
                            (slug)
                          </span>
                          <span className="admin-editor-label-hint">
                            {slugUnlocked
                              ? "Tự tạo từ tiêu đề; có thể chỉnh sửa"
                              : "Đang khóa để bảo toàn liên kết"}
                          </span>
                        </label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            id="field-slug"
                            className="admin-editor-input"
                            type="text"
                            disabled={!slugUnlocked}
                            placeholder="ten-bai-van-hoa"
                            value={values.slug || ""}
                            onChange={(event) =>
                              set("slug", event.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="admin-secondary-button"
                            style={{ padding: "0 12px", flexShrink: 0 }}
                            title={
                              slugUnlocked
                                ? "Khóa chỉnh sửa slug"
                                : "Mở khóa chỉnh sửa slug"
                            }
                            onClick={() => setSlugUnlocked(!slugUnlocked)}
                          >
                            {slugUnlocked ? (
                              <Lock size={15} />
                            ) : (
                              <Unlock size={15} />
                            )}
                            <span
                              style={{ fontSize: "12px", marginLeft: "4px" }}
                            >
                              {slugUnlocked ? "Khóa" : "Mở khóa"}
                            </span>
                          </button>
                        </div>
                        <div className="admin-field-feedback is-info">
                          <Info size={13} />
                          <span>
                            {id
                              ? "Slug hiện tại được giữ để tránh làm hỏng liên kết đã chia sẻ. Chỉ mở khóa khi cần đổi đường dẫn."
                              : "Slug được tạo tự động theo tiêu đề không dấu; có thể chỉnh trước khi lưu."}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Chủ đề văn hóa */}
                    <div className="admin-editor-field">
                      <label
                        htmlFor="field-category"
                        className="admin-editor-label"
                      >
                        <span>
                          Chủ đề chuyên mục
                          {kind !== "xam" && (
                            <span style={{ color: "var(--admin-crimson)" }}>
                              {" "}
                              *
                            </span>
                          )}
                        </span>
                        <span className="admin-editor-label-hint">
                          {kind === "culture"
                            ? "Chọn một danh mục"
                            : kind === "xam"
                              ? "Tùy chọn"
                              : "Bắt buộc"}
                        </span>
                      </label>
                      {kind === "culture" ? (
                        <select
                          id="field-category"
                          className="admin-editor-select"
                          value={values.category || "Phong tục & Nghi lễ"}
                          onChange={(e) => set("category", e.target.value)}
                        >
                          {/* If legacy data has custom category, display it gracefully */}
                          {values.category &&
                            !CULTURE_CATEGORIES.includes(values.category) && (
                              <option value={values.category}>
                                Tùy chỉnh: {values.category}
                              </option>
                            )}
                          {CULTURE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id="field-category"
                          className="admin-editor-input"
                          type="text"
                          placeholder="Phân loại chủ đề…"
                          value={values.category || ""}
                          onChange={(e) => set("category", e.target.value)}
                        />
                      )}
                    </div>

                    {/* Vùng miền liên quan */}
                    <div className="admin-editor-field">
                      <label
                        htmlFor="field-region"
                        className="admin-editor-label"
                      >
                        <span>
                          Vùng miền liên quan{" "}
                          <span style={{ color: "var(--admin-crimson)" }}>
                            *
                          </span>
                        </span>
                      </label>
                      <select
                        id="field-region"
                        className="admin-editor-select"
                        value={values.region || "NATIONWIDE"}
                        onChange={(event) => set("region", event.target.value)}
                      >
                        <option value="NATIONWIDE">Toàn quốc (Chung)</option>
                        <option value="NORTH">Miền Bắc (Bắc Bộ)</option>
                        <option value="CENTRAL">Miền Trung (Trung Bộ)</option>
                        <option value="SOUTH">Miền Nam (Nam Bộ)</option>
                      </select>
                    </div>

                    {kind === "rituals" && (
                      <div className="admin-editor-field">
                        <label
                          htmlFor="field-ritual-content-type"
                          className="admin-editor-label"
                        >
                          <span>Phương thức biên soạn & Tính chất tư liệu</span>
                          <span className="admin-editor-label-hint">
                            Căn cứ lưu vết bản quyền & đối chiếu
                          </span>
                        </label>
                        <select
                          id="field-ritual-content-type"
                          className="admin-editor-select"
                          value={contentType}
                          onChange={(event) =>
                            setContentType(
                              event.target.value as typeof contentType,
                            )
                          }
                        >
                          <option value="">Chưa phân loại</option>
                          <option value="GROUP_AUTHORED">
                            Hướng dẫn nguyên bản do ban biên tập tự biên soạn
                          </option>
                          <option value="FACT">
                            Hướng dẫn dựa trên tài liệu tham khảo
                          </option>
                          <option value="LEGEND">
                            Tập tục truyền khẩu / tín ngưỡng bản địa
                          </option>
                          <option value="QUOTATION">
                            Có đoạn trích dẫn nghi lễ cổ
                          </option>
                        </select>
                      </div>
                    )}

                    {/* Phạm vi nội dung: Địa phương / Cộng đồng cụ thể */}
                    {kind !== "prayers" && (
                      <div className="admin-editor-field admin-editor-col-full">
                        <label
                          htmlFor="field-local-community"
                          className="admin-editor-label"
                        >
                          <span>Địa phương / Cộng đồng (nếu có)</span>
                          <span className="admin-editor-label-hint">
                            Khuyến nghị chi tiết hóa (ví dụ: Hội An, Sa Pa, Tây
                            Ninh…)
                          </span>
                        </label>
                        <input
                          id="field-local-community"
                          className="admin-editor-input"
                          type="text"
                          placeholder="Ví dụ: Làng Đọi Tam (Hà Nam), Đồng bào Khmer Trà Vinh, Đền Hùng (Phú Thọ)…"
                          value={localCommunity}
                          onChange={(e) => setLocalCommunity(e.target.value)}
                        />
                      </div>
                    )}

                    {kind === "rituals" && (
                      <div className="admin-editor-field admin-editor-col-full">
                        <label
                          htmlFor="field-ritual-scope"
                          className="admin-editor-label"
                        >
                          Phạm vi áp dụng / trường hợp hướng dẫn này phù hợp
                        </label>
                        <textarea
                          id="field-ritual-scope"
                          rows={2}
                          className="admin-editor-textarea"
                          maxLength={500}
                          value={scopeOfPractice}
                          onChange={(event) =>
                            setScopeOfPractice(event.target.value)
                          }
                          placeholder="Ghi giới hạn theo gia đình, địa phương hoặc hoàn cảnh; tránh tuyên bố chuẩn chung."
                        />
                      </div>
                    )}

                    {kind === "rituals" && (
                      <div className="admin-editor-field admin-editor-col-full">
                        <label
                          htmlFor="field-rit-desc"
                          className="admin-editor-label"
                        >
                          <span>Giới thiệu và hướng dẫn thực hiện</span>
                        </label>
                        <textarea
                          id="field-rit-desc"
                          rows={3}
                          className="admin-editor-textarea"
                          placeholder="Nêu rõ bối cảnh và ý nghĩa của nghi lễ…"
                          value={values.description || ""}
                          onChange={(event) =>
                            set("description", event.target.value)
                          }
                        />
                      </div>
                    )}

                    {kind === "culture" && (
                      <div className="admin-editor-field">
                        <label
                          htmlFor="field-content-type"
                          className="admin-editor-label"
                        >
                          <span>Phương thức biên soạn & Tính chất tư liệu</span>
                          <span className="admin-editor-label-hint">
                            Căn cứ lưu vết bản quyền & đối chiếu nguồn
                          </span>
                        </label>
                        <select
                          id="field-content-type"
                          className="admin-editor-select"
                          value={contentType}
                          onChange={(event) =>
                            setContentType(
                              event.target.value as typeof contentType,
                            )
                          }
                        >
                          <option value="">
                            -- Chọn tính chất biên soạn --
                          </option>
                          <option value="GROUP_AUTHORED">
                            Nội dung nguyên bản do ban biên tập tự nghiên cứu &
                            biên soạn
                          </option>
                          <option value="FACT">
                            Nội dung dựa trên tư liệu
                          </option>
                          <option value="LEGEND">
                            Ghi chép truyền thuyết, tích xưa & tín ngưỡng dân
                            gian
                          </option>
                          <option value="QUOTATION">
                            Trích dẫn trực tiếp từ thư tịch, sách cổ hoặc tư
                            liệu ngoài
                          </option>
                        </select>
                      </div>
                    )}

                    {/* Tóm tắt ngắn (1-3 câu, không lặp tiêu đề) */}
                    {kind === "culture" && (
                      <div className="admin-editor-field admin-editor-col-full">
                        <label
                          htmlFor="field-excerpt"
                          className="admin-editor-label"
                        >
                          <span>Tóm tắt giới thiệu (1–3 câu)</span>
                          <span className="admin-editor-label-hint">
                            {values.excerpt?.length || 0}/500 ký tự
                          </span>
                        </label>
                        <textarea
                          id="field-excerpt"
                          rows={3}
                          className="admin-editor-textarea"
                          placeholder="Viết 1–3 câu giới thiệu bối cảnh, ý nghĩa và giá trị nhân văn cốt lõi của nội dung (không lặp lại nguyên văn tiêu đề)…"
                          value={values.excerpt || ""}
                          onChange={(e) => set("excerpt", e.target.value)}
                        />
                        {isExcerptDuplicatingTitle && (
                          <div className="admin-field-feedback is-warning">
                            <AlertCircle size={14} />
                            <span>
                              Lưu ý: Tóm tắt đang lặp nguyên tiêu đề. Hãy viết
                              1–3 câu khái quát nội dung và bối cảnh.
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Đặc quyền hội viên Tâm An (Card thiết kế sang trọng) */}
                    {kind === "culture" && (
                      <div className="admin-editor-col-full admin-editor-membership-card">
                        <div className="admin-editor-membership-header">
                          <div className="admin-editor-membership-icon">
                            <Crown size={18} />
                          </div>
                          <div className="admin-editor-membership-info">
                            <label
                              htmlFor="field-members-only"
                              className="admin-editor-membership-title"
                            >
                              Đặc quyền hội viên Tâm An
                            </label>
                            <p className="admin-editor-membership-desc">
                              Khi kích hoạt, bài viết chỉ hiển thị cho người
                              dùng đã đăng ký gói hội viên Tâm An. Bài vẫn tuân
                              thủ đầy đủ quy trình xét duyệt và kiểm chứng nguồn
                              trước khi công khai.
                            </p>
                          </div>
                          <label
                            className="admin-editor-switch"
                            title="Bật/tắt nội dung đặc quyền hội viên"
                          >
                            <input
                              id="field-members-only"
                              type="checkbox"
                              checked={membersOnly}
                              onChange={(event) =>
                                setMembersOnly(event.target.checked)
                              }
                            />
                            <span className="admin-editor-slider" />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Calendar specific fields */}
                    {kind === "calendar" && (
                      <>
                        <div className="admin-editor-field">
                          <label
                            htmlFor="field-cal-type"
                            className="admin-editor-label"
                          >
                            <span>
                              Hệ thống lịch tổ chức{" "}
                              <span style={{ color: "var(--admin-crimson)" }}>
                                *
                              </span>
                            </span>
                          </label>
                          <select
                            id="field-cal-type"
                            className="admin-editor-select"
                            value={values.calendar || "LUNAR"}
                            onChange={(e) => set("calendar", e.target.value)}
                          >
                            <option value="LUNAR">
                              🌙 Âm lịch truyền thống
                            </option>
                            <option value="SOLAR">☀️ Dương lịch quốc tế</option>
                          </select>
                        </div>
                        <div
                          className="admin-editor-field"
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "10px",
                          }}
                        >
                          <div>
                            <label
                              htmlFor="field-day"
                              className="admin-editor-label"
                            >
                              <span>Ngày</span>
                            </label>
                            <input
                              id="field-day"
                              type="number"
                              min={1}
                              max={31}
                              className="admin-editor-input"
                              value={values.day || ""}
                              onChange={(e) => set("day", e.target.value)}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="field-month"
                              className="admin-editor-label"
                            >
                              <span>Tháng</span>
                            </label>
                            <input
                              id="field-month"
                              type="number"
                              min={1}
                              max={12}
                              className="admin-editor-input"
                              value={values.month || ""}
                              onChange={(e) => set("month", e.target.value)}
                            />
                          </div>
                        </div>
                        <p className="admin-editor-label-hint admin-editor-col-full">
                          Sự kiện theo ngày/tháng và lặp hằng năm; hiện chưa hỗ
                          trợ sự kiện một lần hoặc gắn năm cụ thể. Ngày và tháng
                          cần có trước khi gửi duyệt.
                        </p>
                      </>
                    )}

                    {/* Xam specific fields */}
                    {kind === "xam" && (
                      <>
                        <div className="admin-editor-field admin-editor-col-full">
                          <label
                            htmlFor="field-xam-type"
                            className="admin-editor-label"
                          >
                            <span>
                              Bộ xăm theo màn người dùng{" "}
                              <span style={{ color: "var(--admin-crimson)" }}>
                                *
                              </span>
                            </span>
                          </label>
                          <select
                            id="field-xam-type"
                            required
                            className="admin-editor-select"
                            value={values.xam_type}
                            onChange={(e) => set("xam_type", e.target.value)}
                          >
                            <option value="">Chọn vùng miền · chủ đề</option>
                            {xamRegions.flatMap((region) =>
                              xamTopics.map((topic) => {
                                const value = `${region}:${topic}`;
                                return (
                                  <option key={value} value={value}>
                                    {region} · {topic}
                                  </option>
                                );
                              }),
                            )}
                          </select>
                          <p className="admin-editor-label-hint">
                            Mã bộ được tạo tự động từ vùng miền và chủ đề; người
                            dùng rút thẻ theo đúng tổ hợp này.
                          </p>
                          {values.xam_type &&
                            !isCompatibleXamType(values.xam_type, xamRegions, xamTopics) && (
                              <p
                                className="admin-editor-label-hint"
                                role="status"
                              >
                                Mã bộ cũ “{values.xam_type}” chưa khớp danh mục
                                rút xăm. Hãy chọn tổ hợp mới trước khi lưu.
                              </p>
                            )}
                        </div>
                        <div className="admin-editor-field">
                          <label
                            htmlFor="field-stick-number"
                            className="admin-editor-label"
                          >
                            <span>
                              Số hiệu quẻ xăm (1–100){" "}
                              <span style={{ color: "var(--admin-crimson)" }}>
                                *
                              </span>
                            </span>
                          </label>
                          <input
                            id="field-stick-number"
                            type="number"
                            min={1}
                            max={100}
                            required
                            className="admin-editor-input"
                            value={values.stick_number || "1"}
                            onChange={(e) =>
                              set("stick_number", e.target.value)
                            }
                          />
                        </div>
                        <div className="admin-editor-field">
                          <label
                            htmlFor="field-fortune"
                            className="admin-editor-label"
                          >
                            <span>
                              Xếp loại điềm quẻ{" "}
                              <span style={{ color: "var(--admin-crimson)" }}>
                                *
                              </span>
                            </span>
                          </label>
                          <select
                            id="field-fortune"
                            className="admin-editor-select"
                            value={values.fortune_level || "Thượng Cát"}
                            onChange={(e) =>
                              set("fortune_level", e.target.value)
                            }
                          >
                            <option value="Thượng Cát">
                              ✨ Thượng Cát (Đại Cát)
                            </option>
                            <option value="Trung Cát">
                              ⚖️ Trung Cát (Trung Bình)
                            </option>
                            <option value="Hạ Bình">
                              ⚠️ Hạ Bình (Hạ Điềm)
                            </option>
                            <option value="Bình">Bình thường</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Rituals occasion */}
                    {kind === "rituals" && (
                      <div className="admin-editor-field admin-editor-col-full">
                        <label
                          htmlFor="field-occasion"
                          className="admin-editor-label"
                        >
                          <span>Dịp áp dụng thực hiện</span>
                        </label>
                        <input
                          id="field-occasion"
                          className="admin-editor-input"
                          type="text"
                          placeholder="Ví dụ: Rằm tháng Giêng, Tết Nguyên đán, Lễ nhập trạch…"
                          value={values.occasion || ""}
                          onChange={(e) => set("occasion", e.target.value)}
                        />
                      </div>
                    )}

                    {/* Prayers linked ritual */}
                    {kind === "prayers" && (
                      <div className="admin-editor-field admin-editor-col-full">
                        <label
                          htmlFor="field-ritual"
                          className="admin-editor-label"
                        >
                          <span>
                            Gắn với nghi lễ đã công khai{" "}
                            <span style={{ color: "var(--admin-crimson)" }}>
                              *
                            </span>
                          </span>
                          <span className="admin-editor-label-hint">
                            Bắt buộc trước khi gửi duyệt; văn khấn được đọc
                            trong trang nghi lễ.
                          </span>
                        </label>
                        <select
                          id="field-ritual"
                          className="admin-editor-select"
                          value={values.ritual_id || ""}
                          onChange={(e) => set("ritual_id", e.target.value)}
                        >
                          <option value="">Chọn nghi lễ đã công khai</option>
                          {rituals.map((ritual) => (
                            <option key={ritual.id} value={ritual.id}>
                              {ritual.title}
                            </option>
                          ))}
                        </select>
                        {rituals.length === 0 ? (
                          <p className="admin-editor-label-hint">
                            Chưa có nghi lễ nào được công khai. Hãy công khai
                            nghi lễ trước khi gửi văn khấn duyệt.
                          </p>
                        ) : (
                          <p className="admin-editor-label-hint">
                            Danh sách chỉ gồm nghi lễ đã công khai trong phạm vi
                            biên tập của bạn.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: NỘI DUNG CHI TIẾT */}
                {activeTab === "content" && (
                  <div className="admin-editor-grid">
                    {/* Kind: Culture -> Multi-section content */}
                    {kind === "culture" && (
                      <div className="admin-editor-sections-block admin-editor-col-full">
                        <div className="admin-editor-block-header">
                          <div>
                            <strong>
                              Các phân mục nội dung ({sections.length})
                            </strong>
                            <p
                              style={{
                                margin: "2px 0 0",
                                fontSize: "12px",
                                color: "var(--admin-muted)",
                              }}
                            >
                              Mỗi phân mục gồm tiêu đề đề mục và nội dung phân
                              tích chi tiết.
                            </p>
                          </div>
                          <button
                            type="button"
                            className="admin-editor-add-sub-btn"
                            onClick={() =>
                              setSections([
                                ...sections,
                                { heading: "", body: "" },
                              ])
                            }
                          >
                            <Plus size={14} /> Thêm phân mục
                          </button>
                        </div>

                        {sections.map((section, index) => (
                          <div key={index} className="admin-editor-sub-card">
                            <div className="admin-editor-sub-card-top">
                              <span>Phân mục #{index + 1}</span>
                              <button
                                type="button"
                                className="admin-editor-remove-sub-btn"
                                disabled={sections.length === 1}
                                onClick={() =>
                                  setSections(
                                    sections.filter((_, i) => i !== index),
                                  )
                                }
                              >
                                <Trash2 size={12} /> Xóa phân mục
                              </button>
                            </div>
                            <input
                              className="admin-editor-input"
                              placeholder={`Tiêu đề phân mục ${index + 1} (ví dụ: Nguồn gốc lịch sử)…`}
                              value={section.heading}
                              onChange={(e) =>
                                setSections(
                                  sections.map((item, i) =>
                                    i === index
                                      ? { ...item, heading: e.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <textarea
                              rows={8}
                              className="admin-editor-textarea admin-editor-section-body"
                              placeholder="Nội dung chi tiết phân mục (phân tích nguồn gốc, nghi thức, giá trị nhân văn)…"
                              value={section.body}
                              onChange={(e) =>
                                setSections(
                                  sections.map((item, i) =>
                                    i === index
                                      ? { ...item, body: e.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Kind: Rituals -> Step-by-step */}
                    {kind === "rituals" && (
                      <>
                        <div className="admin-editor-sections-block admin-editor-col-full">
                          <div className="admin-editor-block-header">
                            <strong>
                              Các bước tiến hành nghi thức ({steps.length})
                            </strong>
                            <button
                              type="button"
                              className="admin-editor-add-sub-btn"
                              onClick={() =>
                                setSteps([
                                  ...steps,
                                  { title: "", description: "" },
                                ])
                              }
                            >
                              <Plus size={14} /> Thêm bước nghi lễ
                            </button>
                          </div>
                          {steps.map((step, index) => (
                            <div key={index} className="admin-editor-sub-card">
                              <div className="admin-editor-sub-card-top">
                                <span>Bước #{index + 1}</span>
                                <button
                                  type="button"
                                  className="admin-editor-remove-sub-btn"
                                  disabled={steps.length === 1}
                                  onClick={() =>
                                    setSteps(
                                      steps.filter((_, i) => i !== index),
                                    )
                                  }
                                >
                                  <Trash2 size={12} /> Xóa bước này
                                </button>
                              </div>
                              <input
                                className="admin-editor-input"
                                placeholder={`Tên bước ${index + 1} (ví dụ: Chuẩn bị lễ phẩm)…`}
                                value={step.title}
                                onChange={(e) =>
                                  setSteps(
                                    steps.map((item, i) =>
                                      i === index
                                        ? { ...item, title: e.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <textarea
                                rows={3}
                                className="admin-editor-textarea"
                                placeholder="Hướng dẫn cách thức hành lễ chi tiết…"
                                value={step.description}
                                onChange={(e) =>
                                  setSteps(
                                    steps.map((item, i) =>
                                      i === index
                                        ? {
                                            ...item,
                                            description: e.target.value,
                                          }
                                        : item,
                                    ),
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>

                        <div className="admin-editor-sections-block admin-editor-col-full">
                          <div className="admin-editor-block-header">
                            <div>
                              <strong>
                                Checklist chuẩn bị ({checklists.length})
                              </strong>
                              <p
                                style={{
                                  margin: "2px 0 0",
                                  fontSize: "12px",
                                  color: "var(--admin-muted)",
                                }}
                              >
                                ID mục được giữ nguyên khi đổi nhãn hoặc thứ tự
                                để bảo toàn tiến độ người dùng.
                              </p>
                            </div>
                            <button
                              type="button"
                              className="admin-editor-add-sub-btn"
                              onClick={() =>
                                setChecklists((items) => [
                                  ...items,
                                  { id: createChecklistId(), label: "" },
                                ])
                              }
                            >
                              <Plus size={14} /> Thêm mục checklist
                            </button>
                          </div>
                          {checklists.map((item, index) => (
                            <div
                              key={item.id}
                              className="admin-editor-sub-card"
                            >
                              <div className="admin-editor-sub-card-top">
                                <span>Mục #{index + 1}</span>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button
                                    type="button"
                                    className="admin-editor-remove-sub-btn"
                                    disabled={index === 0}
                                    aria-label={`Chuyển mục ${index + 1} lên`}
                                    onClick={() =>
                                      setChecklists((items) => {
                                        const next = [...items];
                                        [next[index - 1], next[index]] = [
                                          next[index],
                                          next[index - 1],
                                        ];
                                        return next;
                                      })
                                    }
                                  >
                                    <ArrowUp size={12} /> Lên
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-editor-remove-sub-btn"
                                    disabled={index === checklists.length - 1}
                                    aria-label={`Chuyển mục ${index + 1} xuống`}
                                    onClick={() =>
                                      setChecklists((items) => {
                                        const next = [...items];
                                        [next[index], next[index + 1]] = [
                                          next[index + 1],
                                          next[index],
                                        ];
                                        return next;
                                      })
                                    }
                                  >
                                    <ArrowDown size={12} /> Xuống
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-editor-remove-sub-btn"
                                    onClick={() =>
                                      setChecklists((items) =>
                                        items.filter(
                                          (candidate) =>
                                            candidate.id !== item.id,
                                        ),
                                      )
                                    }
                                  >
                                    <Trash2 size={12} /> Xóa
                                  </button>
                                </div>
                              </div>
                              <input
                                className="admin-editor-input"
                                aria-label={`Nội dung mục checklist ${index + 1}`}
                                placeholder="Ví dụ: Chuẩn bị nước sạch"
                                value={item.label}
                                onChange={(event) =>
                                  setChecklists((items) =>
                                    items.map((candidate) =>
                                      candidate.id === item.id
                                        ? {
                                            ...candidate,
                                            label: event.target.value,
                                          }
                                        : candidate,
                                    ),
                                  )
                                }
                              />
                            </div>
                          ))}
                          {!hasUsableChecklist && (
                            <p
                              style={{
                                color: "var(--admin-crimson)",
                                fontSize: 13,
                              }}
                            >
                              Chưa có mục checklist hợp lệ. Thêm ít nhất một mục
                              có nội dung trước khi gửi duyệt.
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Kind: Calendar -> Event Description */}
                    {kind === "calendar" && (
                      <div className="admin-editor-field admin-editor-col-full">
                        <label
                          htmlFor="field-cal-desc"
                          className="admin-editor-label"
                        >
                          <span>Giới thiệu sự kiện & lưu ý tổ chức</span>
                        </label>
                        <textarea
                          id="field-cal-desc"
                          rows={6}
                          className="admin-editor-textarea"
                          placeholder="Mô tả bối cảnh lễ hội, các hoạt động văn hóa đặc sắc và lưu ý chuẩn bị…"
                          value={values.description || ""}
                          onChange={(e) => set("description", e.target.value)}
                        />
                      </div>
                    )}

                    {/* Kind: Xam -> Poem, Meaning, Advice */}
                    {kind === "xam" && (
                      <>
                        <div className="admin-editor-field admin-editor-col-full">
                          <label
                            htmlFor="field-poem"
                            className="admin-editor-label"
                          >
                            <span>Thơ gốc chữ Hán / Dịch thơ</span>
                          </label>
                          <textarea
                            id="field-poem"
                            rows={4}
                            className="admin-editor-textarea"
                            placeholder="Nội dung bài thơ quẻ xăm…"
                            value={values.poem || ""}
                            onChange={(e) => set("poem", e.target.value)}
                          />
                        </div>
                        <div className="admin-editor-field admin-editor-col-full">
                          <label
                            htmlFor="field-meaning"
                            className="admin-editor-label"
                          >
                            <span>
                              Diễn giải ý nghĩa quẻ{" "}
                              <span style={{ color: "var(--admin-crimson)" }}>
                                *
                              </span>
                            </span>
                          </label>
                          <textarea
                            id="field-meaning"
                            rows={4}
                            className="admin-editor-textarea"
                            placeholder="Ý nghĩa tổng quan của thẻ quẻ…"
                            value={values.meaning || ""}
                            onChange={(e) => set("meaning", e.target.value)}
                          />
                        </div>
                        <div className="admin-editor-field admin-editor-col-full">
                          <label
                            htmlFor="field-advice"
                            className="admin-editor-label"
                          >
                            <span>Lời khuyên chiêm nghiệm</span>
                          </label>
                          <textarea
                            id="field-advice"
                            rows={3}
                            className="admin-editor-textarea"
                            placeholder="Lời khuyên tu dưỡng, hành thiện…"
                            value={values.advice || ""}
                            onChange={(e) => set("advice", e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {/* Kind: Prayers -> Sacred text */}
                    {kind === "prayers" && (
                      <div className="admin-editor-field admin-editor-col-full">
                        <label
                          htmlFor="field-content"
                          className="admin-editor-label"
                        >
                          <span>
                            Toàn văn bài văn khấn cổ truyền{" "}
                            <span style={{ color: "var(--admin-crimson)" }}>
                              *
                            </span>
                          </span>
                        </label>
                        <textarea
                          id="field-content"
                          rows={12}
                          className="admin-editor-textarea"
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: "14.5px",
                            lineHeight: 1.8,
                          }}
                          placeholder="Nam mô A Di Đà Phật!..."
                          value={values.content || ""}
                          onChange={(e) => set("content", e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: NGUỒN & ẢNH MINH HỌA */}
                {activeTab === "media" && (
                  <div className="admin-editor-grid">
                    {/* Phần 1: Nguồn tham khảo */}
                    <div
                      className="admin-editor-col-full"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          borderBottom: "1px solid var(--admin-line)",
                          paddingBottom: "8px",
                        }}
                      >
                        <Globe
                          size={16}
                          style={{ color: "var(--admin-gold)" }}
                        />
                        <strong
                          style={{
                            fontSize: "14px",
                            color: "var(--admin-heading)",
                          }}
                        >
                          Nguồn tham khảo
                        </strong>
                      </div>

                      {/* URL nguồn tham khảo HTTPS */}
                      <div className="admin-editor-field">
                        <label
                          htmlFor="field-source-url"
                          className="admin-editor-label"
                        >
                          <span>
                            Liên kết nguồn (HTTPS)
                            {kind === "calendar" && (
                              <span style={{ color: "var(--admin-crimson)" }}>
                                {" "}
                                *
                              </span>
                            )}
                          </span>
                          <span className="admin-editor-label-hint">
                            {kind === "calendar" ||
                            kind === "xam" ||
                            kind === "prayers"
                              ? "Cần URL HTTPS để gửi duyệt; bản nháp có thể để trống."
                              : contentType === "GROUP_AUTHORED"
                                ? "Có thể để trống nếu nội dung do nhóm tự biên soạn."
                                : "Nhập URL HTTPS hoặc thông tin tài liệu lưu trữ nội bộ."}
                          </span>
                        </label>
                        <input
                          id="field-source-url"
                          className="admin-editor-input"
                          type="url"
                          placeholder="https://example.com/tai-lieu-co-truyen…"
                          value={values.source || ""}
                          onChange={(e) => set("source", e.target.value)}
                        />
                        {isSourceUrlInvalid && (
                          <div className="admin-field-feedback is-error">
                            <AlertCircle size={14} />
                            <span>
                              URL nguồn phải là liên kết HTTPS hợp lệ.
                            </span>
                          </div>
                        )}
                        {kind === "calendar" && !values.source.trim() && (
                          <div className="admin-field-feedback is-info">
                            <Info size={14} />
                            <span>
                              Lịch sự kiện cần nguồn HTTPS để gửi duyệt.
                            </span>
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px",
                        }}
                      >
                        {/* Tên tài liệu / Cơ quan xuất bản */}
                        {kind !== "prayers" && (
                          <div className="admin-editor-field">
                            <label
                              htmlFor="field-source-doc"
                              className="admin-editor-label"
                            >
                              <span>
                                {kind === "calendar"
                                  ? "Tên tài liệu / cơ quan cung cấp"
                                  : "Tên nguồn / tài liệu"}
                              </span>
                            </label>
                            <textarea
                              id="field-source-doc"
                              rows={2}
                              className="admin-editor-textarea"
                              placeholder={
                                kind === "calendar"
                                  ? "Ví dụ: UNESCO World Heritage Centre"
                                  : "Tên sách, văn bản hoặc cơ quan lưu trữ…"
                              }
                              value={sourceDoc}
                              onChange={(e) => setSourceDoc(e.target.value)}
                            />
                          </div>
                        )}

                        {/* Vị trí trích dẫn */}
                        <div className="admin-editor-field">
                          <label
                            htmlFor="field-source-locator"
                            className="admin-editor-label"
                          >
                            <span>
                              {kind === "calendar"
                                ? "Trang / mục tham khảo"
                                : "Trang hoặc mục tham khảo"}
                            </span>
                          </label>
                          <textarea
                            id="field-source-locator"
                            rows={2}
                            className="admin-editor-textarea"
                            placeholder={
                              kind === "calendar"
                                ? "Ví dụ: Đoạn mở đầu xác nhận ngày tổ chức hằng năm là 18/4"
                                : "Ví dụ: Tập 2, tr. 145-148, Mục II…"
                            }
                            value={sourceLocator}
                            onChange={(e) => setSourceLocator(e.target.value)}
                          />
                        </div>
                      </div>

                      {kind === "culture" && (
                        <div className="admin-editor-field admin-editor-col-full">
                          <label
                            htmlFor="field-content-rights"
                            className="admin-editor-label"
                          >
                            <span>
                              Căn cứ quyền sử dụng nội dung{" "}
                              <span style={{ color: "var(--admin-crimson)" }}>
                                *
                              </span>
                            </span>
                            <span className="admin-editor-label-hint">
                              Nêu rõ nội dung tự biên soạn, phạm vi trích dẫn
                              hoặc căn cứ cấp phép.
                            </span>
                          </label>
                          <textarea
                            id="field-content-rights"
                            className="admin-editor-textarea"
                            rows={2}
                            maxLength={1000}
                            value={contentRightsBasis}
                            onChange={(event) =>
                              setContentRightsBasis(event.target.value)
                            }
                            placeholder="Ví dụ: Nội dung do Ban biên tập tự nghiên cứu và biên soạn; phần trích dẫn có ghi nguồn và vị trí."
                          />
                        </div>
                      )}

                      {(kind === "culture" || kind === "rituals" || kind === "xam") && (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                            marginTop: "12px",
                          }}
                        >
                          <div className="admin-editor-field">
                            <label
                              htmlFor="field-source-author"
                              className="admin-editor-label"
                            >
                              {kind === "xam" ? "Tác giả nguyên tác" : "Tác giả / tổ chức"}
                            </label>
                            <textarea
                              id="field-source-author"
                              rows={2}
                              className="admin-editor-textarea"
                              placeholder={kind === "xam" ? "Tên tác giả nguyên tác nếu xác định được…" : "Tên tác giả hoặc tổ chức ban hành…"}
                              value={sourceAuthor}
                              onChange={(event) =>
                                setSourceAuthor(event.target.value)
                              }
                            />
                          </div>
                          <div className="admin-editor-field">
                            <label
                              htmlFor="field-bibliography"
                              className="admin-editor-label"
                            >
                              Thông tin xuất bản / thư mục
                            </label>
                            <textarea
                              id="field-bibliography"
                              rows={2}
                              className="admin-editor-textarea"
                              placeholder="NXB, năm xuất bản, số lưu trữ…"
                              value={bibliography}
                              onChange={(event) =>
                                setBibliography(event.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}
                      {kind === "rituals" && (
                        <>
                          <div className="admin-editor-field">
                            <label
                              htmlFor="field-content-rights"
                              className="admin-editor-label"
                            >
                              Căn cứ quyền sử dụng nội dung
                            </label>
                            <textarea
                              id="field-content-rights"
                              rows={2}
                              className="admin-editor-textarea"
                              maxLength={1000}
                              value={contentRightsBasis}
                              onChange={(event) =>
                                setContentRightsBasis(event.target.value)
                              }
                              placeholder="Nêu căn cứ thực tế; không nhập URL thay cho căn cứ quyền."
                            />
                          </div>
                          <p className="admin-editor-label-hint">
                            Hướng dẫn nguyên bản cần người/nhóm biên soạn, phạm
                            vi, checklist hữu ích và quyền nội dung được người
                            duyệt xác nhận. Chỉ nhận định dựa trên tư liệu hoặc
                            câu trích mới cần URL HTTPS và locator.
                          </p>
                        </>
                      )}
                    </div>

                    {kind === "rituals" && (
                      <section
                        className="admin-editor-col-full"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          marginTop: "16px",
                          padding: "16px",
                          border: "1px solid var(--admin-line)",
                          borderRadius: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            borderBottom: "1px solid var(--admin-line)",
                            paddingBottom: "8px",
                          }}
                        >
                          <ImageIcon
                            size={16}
                            style={{ color: "var(--admin-gold)" }}
                          />
                          <strong
                            style={{
                              fontSize: "14px",
                              color: "var(--admin-heading)",
                            }}
                          >
                            Ảnh minh họa — tùy chọn
                          </strong>
                        </div>
                        <div className="admin-editor-field">
                          <label
                            htmlFor="field-ritual-image-url"
                            className="admin-editor-label"
                          >
                            <span>Đường dẫn ảnh tổng quan</span>
                            <span className="admin-editor-label-hint">
                              URL HTTPS hoặc đường dẫn nội bộ /images/...
                            </span>
                          </label>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <input
                              id="field-ritual-image-url"
                              className="admin-editor-input"
                              type="text"
                              placeholder="https://... hoặc /images/..."
                              value={values.image_url || ""}
                              onChange={(event) => {
                                set("image_url", event.target.value);
                                setImageLoadError(false);
                              }}
                            />
                            <button
                              type="button"
                              className="admin-secondary-button"
                              disabled={
                                !values.image_url &&
                                !imageCaption &&
                                !imageCredit &&
                                !imageSource &&
                                !imageRightsBasis
                              }
                              onClick={() => {
                                set("image_url", "");
                                setImageCaption("");
                                setImageCredit("");
                                setImageSource("");
                                setImageRightsBasis("");
                                setImageLoadError(false);
                              }}
                            >
                              Gỡ ảnh
                            </button>
                          </div>
                          {isRitualImageUrlInvalid && (
                            <div
                              className="admin-field-feedback is-error"
                              role="alert"
                            >
                              <AlertCircle size={14} />
                              <span>
                                Đường dẫn ảnh cần là URL HTTPS hoặc đường dẫn
                                nội bộ /images/ hợp lệ.
                              </span>
                            </div>
                          )}
                        </div>
                        {values.image_url && (
                          <div className="admin-img-preview-card">
                            <div className="admin-img-preview-viewport is-contain">
                              {!imageLoadError ? (
                                <img
                                  src={values.image_url}
                                  alt={imageCaption || "Ảnh tổng quan nghi lễ"}
                                  className="admin-img-preview-img is-contain"
                                  onError={() => setImageLoadError(true)}
                                />
                              ) : (
                                <div
                                  className="admin-img-preview-empty"
                                  role="status"
                                >
                                  <ImageIcon
                                    size={30}
                                    style={{ opacity: 0.5 }}
                                  />
                                  <span>
                                    Không tải được ảnh. Hãy kiểm tra lại đường
                                    dẫn.
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                          }}
                        >
                          <div className="admin-editor-field">
                            <label
                              htmlFor="field-ritual-image-caption"
                              className="admin-editor-label"
                            >
                              Chú thích ảnh
                            </label>
                            <textarea
                              id="field-ritual-image-caption"
                              rows={2}
                              maxLength={500}
                              className="admin-editor-textarea"
                              value={imageCaption}
                              onChange={(event) =>
                                setImageCaption(event.target.value)
                              }
                              placeholder="Mô tả ngắn gọn ảnh tổng quan…"
                            />
                          </div>
                          <div className="admin-editor-field">
                            <label
                              htmlFor="field-ritual-image-credit"
                              className="admin-editor-label"
                            >
                              Tác giả / ghi công
                            </label>
                            <textarea
                              id="field-ritual-image-credit"
                              rows={2}
                              maxLength={1000}
                              className="admin-editor-textarea"
                              value={imageCredit}
                              onChange={(event) =>
                                setImageCredit(event.target.value)
                              }
                              placeholder="Tên người chụp, tác giả hoặc đơn vị cung cấp…"
                            />
                          </div>
                          <div className="admin-editor-field admin-editor-col-full">
                            <label
                              htmlFor="field-ritual-image-source"
                              className="admin-editor-label"
                            >
                              Liên kết trang nguồn ảnh
                            </label>
                            <input
                              id="field-ritual-image-source"
                              type="url"
                              className="admin-editor-input"
                              value={imageSource}
                              onChange={(event) =>
                                setImageSource(event.target.value)
                              }
                              placeholder="https://example.org/nguon-anh"
                            />
                          </div>
                          <div className="admin-editor-field">
                            <label
                              htmlFor="field-ritual-image-rights"
                              className="admin-editor-label"
                            >
                              Căn cứ quyền sử dụng
                            </label>
                            <textarea
                              id="field-ritual-image-rights"
                              rows={2}
                              maxLength={1000}
                              className="admin-editor-textarea"
                              value={imageRightsBasis}
                              onChange={(event) =>
                                setImageRightsBasis(event.target.value)
                              }
                              placeholder="Giấy phép, phạm vi công cộng hoặc văn bản cho phép…"
                            />
                          </div>
                        </div>
                        <p className="admin-editor-label-hint">
                          Khi có ảnh, cần điền đủ chú thích, ghi công, URL trang
                          nguồn HTTPS và căn cứ quyền trước khi gửi duyệt.
                        </p>
                      </section>
                    )}

                    {/* Phần 2: Ảnh minh họa & Bản quyền */}
                    {kind === "culture" && (
                      <div
                        className="admin-editor-col-full"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          marginTop: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            borderBottom: "1px solid var(--admin-line)",
                            paddingBottom: "8px",
                          }}
                        >
                          <ImageIcon
                            size={16}
                            style={{ color: "var(--admin-gold)" }}
                          />
                          <strong
                            style={{
                              fontSize: "14px",
                              color: "var(--admin-heading)",
                            }}
                          >
                            Ảnh minh họa & Bản quyền sử dụng
                          </strong>
                        </div>

                        {/* URL ảnh */}
                        <div className="admin-editor-field">
                          <label
                            htmlFor="field-image-url"
                            className="admin-editor-label"
                          >
                            <span>Đường dẫn ảnh</span>
                            <span className="admin-editor-label-hint">
                              https:// hoặc đường dẫn nội bộ /images/...
                            </span>
                          </label>
                          <input
                            id="field-image-url"
                            className="admin-editor-input"
                            type="text"
                            placeholder="URL ảnh hoặc đường dẫn nội bộ"
                            value={values.image_url || ""}
                            onChange={(e) => {
                              set("image_url", e.target.value);
                              setImageLoadError(false);
                            }}
                          />
                        </div>

                        {/* Live Image Preview Card */}
                        <div className="admin-img-preview-card">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12.5px",
                                fontWeight: 650,
                                color: "var(--admin-subtle)",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <ImageIcon size={14} /> Ảnh dùng trong nội dung
                              (Xem trước):
                            </span>
                            {values.image_url && !imageLoadError && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => setImageFitMode("contain")}
                                  style={{
                                    padding: "4px 10px",
                                    fontSize: "11.5px",
                                    fontWeight:
                                      imageFitMode === "contain" ? 650 : 500,
                                    borderRadius: "6px",
                                    border:
                                      imageFitMode === "contain"
                                        ? "1px solid var(--admin-gold)"
                                        : "1px solid var(--admin-line)",
                                    background:
                                      imageFitMode === "contain"
                                        ? "rgba(200, 150, 85, 0.15)"
                                        : "transparent",
                                    color:
                                      imageFitMode === "contain"
                                        ? "var(--admin-gold)"
                                        : "var(--admin-muted)",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  Trọn vẹn ảnh (100%)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setImageFitMode("cover")}
                                  style={{
                                    padding: "4px 10px",
                                    fontSize: "11.5px",
                                    fontWeight:
                                      imageFitMode === "cover" ? 650 : 500,
                                    borderRadius: "6px",
                                    border:
                                      imageFitMode === "cover"
                                        ? "1px solid var(--admin-gold)"
                                        : "1px solid var(--admin-line)",
                                    background:
                                      imageFitMode === "cover"
                                        ? "rgba(200, 150, 85, 0.15)"
                                        : "transparent",
                                    color:
                                      imageFitMode === "cover"
                                        ? "var(--admin-gold)"
                                        : "var(--admin-muted)",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  Cắt vừa khung 16:9
                                </button>
                                <a
                                  href={values.image_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    padding: "4px 10px",
                                    fontSize: "11.5px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--admin-line)",
                                    color: "var(--admin-subtle)",
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  Mở ảnh gốc ↗
                                </a>
                              </div>
                            )}
                          </div>
                          <div
                            className={`admin-img-preview-viewport ${imageFitMode === "cover" ? "is-cover" : "is-contain"}`}
                          >
                            {values.image_url && !imageLoadError ? (
                              <img
                                src={values.image_url}
                                alt="Ảnh minh họa"
                                className={`admin-img-preview-img ${imageFitMode === "cover" ? "is-cover" : "is-contain"}`}
                                onError={() => setImageLoadError(true)}
                              />
                            ) : (
                              <div className="admin-img-preview-empty">
                                <ImageIcon size={32} style={{ opacity: 0.5 }} />
                                <span>
                                  {imageLoadError
                                    ? "Không thể tải trước hình ảnh từ liên kết này. Vui lòng kiểm tra lại URL."
                                    : "Chưa thêm ảnh. Có thể để trống nếu chưa có ảnh phù hợp."}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                          }}
                        >
                          {/* Chú thích ảnh */}
                          <div className="admin-editor-field">
                            <label
                              htmlFor="field-img-caption"
                              className="admin-editor-label"
                            >
                              <span>Chú thích ảnh minh họa</span>
                            </label>
                            <textarea
                              id="field-img-caption"
                              className="admin-editor-textarea"
                              rows={3}
                              placeholder="Mô tả đúng nội dung ảnh, nhân vật, công trình hoặc bối cảnh…"
                              value={imageCaption}
                              onChange={(e) => setImageCaption(e.target.value)}
                              style={{ minHeight: "76px" }}
                            />
                          </div>

                          {/* Tác giả & Căn cứ quyền sử dụng */}
                          <div className="admin-editor-field">
                            <label
                              htmlFor="field-img-credit"
                              className="admin-editor-label"
                            >
                              <span>Nguồn / tác giả ảnh</span>
                            </label>
                            <textarea
                              id="field-img-credit"
                              className="admin-editor-textarea"
                              rows={3}
                              placeholder="Người chụp, cơ quan phát hành hoặc kho ảnh kèm liên kết…"
                              value={imageCredit}
                              onChange={(e) => setImageCredit(e.target.value)}
                              style={{ minHeight: "76px" }}
                            />
                          </div>
                        </div>
                        <div className="admin-editor-field">
                          <label
                            htmlFor="field-image-rights"
                            className="admin-editor-label"
                          >
                            <span>Căn cứ quyền sử dụng ảnh</span>
                          </label>
                          <select
                            id="field-image-rights-suggestion"
                            className="admin-editor-select"
                            value=""
                            onChange={(event) => {
                              if (event.target.value)
                                setImageRightsBasis(event.target.value);
                            }}
                            aria-label="Chọn gợi ý quyền sử dụng ảnh"
                          >
                            <option value="">Chọn gợi ý quyền ảnh</option>
                            <option value="Ảnh do Ban biên tập tự chụp hoặc tự tạo">
                              Ảnh do Ban biên tập tự chụp hoặc tự tạo
                            </option>
                            <option value="Creative Commons CC BY 4.0">
                              Creative Commons CC BY 4.0
                            </option>
                            <option value="Creative Commons CC BY-SA 4.0">
                              Creative Commons CC BY-SA 4.0
                            </option>
                            <option value="Phạm vi công cộng (Public Domain)">
                              Phạm vi công cộng (Public Domain)
                            </option>
                            <option value="Được cấp phép hoặc ủy quyền bằng văn bản">
                              Được cấp phép hoặc ủy quyền bằng văn bản
                            </option>
                          </select>
                          <textarea
                            id="field-image-rights"
                            className="admin-editor-textarea"
                            rows={2}
                            placeholder="Chọn gợi ý hoặc ghi rõ giấy phép, URL và điều kiện sử dụng…"
                            value={imageRightsBasis}
                            onChange={(event) =>
                              setImageRightsBasis(event.target.value)
                            }
                            style={{ minHeight: "56px" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: XEM TRƯỚC BÀI VIẾT (LIVE READER SIMULATION) */}
                {activeTab === "preview" && (
                  <div className="admin-preview-frame">
                    <div className="admin-preview-badges">
                      <span className="admin-preview-badge">
                        <Sparkles size={12} />{" "}
                        {values.category ||
                          (kind === "xam"
                            ? "Xin xăm"
                            : kind === "prayers"
                              ? "Văn khấn"
                              : kind === "rituals"
                                ? "Nghi lễ"
                                : "Văn hóa Việt")}
                      </span>
                      <span className="admin-preview-badge">
                        <Globe size={12} />{" "}
                        {kind === "xam"
                          ? xamPreviewRegion || regionLabel
                          : regionLabel}
                      </span>
                      {localCommunity &&
                        kind !== "calendar" &&
                        kind !== "prayers" && (
                          <span className="admin-preview-badge">
                            <>
                              <MapPin size={12} /> {localCommunity}
                            </>
                          </span>
                        )}
                      <span
                        className="admin-preview-badge"
                        style={{
                          background: "rgba(200, 150, 85, 0.15)",
                          marginLeft: "auto",
                        }}
                      >
                        Bản xem trước · Chưa công khai
                      </span>
                    </div>

                    <h1 className="admin-preview-title">
                      {values.title || values.name || "Chưa có tiêu đề"}
                    </h1>

                    {values.excerpt && (
                      <blockquote className="admin-preview-excerpt">
                        {values.excerpt}
                      </blockquote>
                    )}

                    {kind === "culture" &&
                    values.image_url &&
                    imageCaption.trim() &&
                    (imageSource.trim() || imageCredit.trim()) &&
                    imageRightsBasis.trim() &&
                    !imageLoadError ? (
                      <figure className="admin-preview-figure">
                        <div className="admin-preview-img-container">
                          <img
                            src={values.image_url}
                            alt={imageCaption || values.title}
                          />
                        </div>
                        <figcaption className="admin-preview-figcaption">
                          {imageCaption && <span>{imageCaption}</span>}
                          <span>Nguồn: {imageSource || imageCredit}</span>
                          <span>Quyền sử dụng: {imageRightsBasis}</span>
                        </figcaption>
                      </figure>
                    ) : kind === "culture" && values.image_url ? (
                      <p className="admin-preview-references">
                        Ảnh chưa hiển thị trong bản xem trước. Kiểm tra ảnh có
                        tải được và đã có chú thích, nguồn cùng căn cứ quyền sử
                        dụng.
                      </p>
                    ) : null}

                    {kind === "rituals" &&
                      values.image_url &&
                      (hasCompleteRitualImageProfile && !imageLoadError ? (
                        <figure className="admin-preview-figure">
                          <div className="admin-preview-img-container">
                            <img src={values.image_url} alt={imageCaption} />
                          </div>
                          <figcaption className="admin-preview-figcaption">
                            <span>{imageCaption}</span>
                            <span>Ghi công: {imageCredit}</span>
                            <a
                              href={imageSource}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Nguồn ảnh ↗
                            </a>
                            <span>Căn cứ quyền: {imageRightsBasis}</span>
                          </figcaption>
                        </figure>
                      ) : (
                        <p className="admin-preview-references">
                          {imageLoadError
                            ? "Ảnh tổng quan không tải được; hãy kiểm tra lại đường dẫn."
                            : "Ảnh chưa hiển thị vì hồ sơ cần đủ chú thích, ghi công, URL trang nguồn HTTPS và căn cứ quyền sử dụng."}
                        </p>
                      ))}

                    {/* Render Sections */}
                    {kind === "culture" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "20px",
                        }}
                      >
                        {sections.map((section, idx) => (
                          <div key={idx} className="admin-preview-section">
                            <h2 className="admin-preview-heading">
                              <span style={{ color: "var(--admin-gold)" }}>
                                §{idx + 1}.
                              </span>{" "}
                              {section.heading || `Mục ${idx + 1}`}
                            </h2>
                            <div className="admin-preview-body-text">
                              {section.body ||
                                "Chưa có nội dung cho phân mục này."}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Render Ritual Steps */}
                    {kind === "rituals" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                        }}
                      >
                        <p className="admin-preview-references">
                          Dịp áp dụng:{" "}
                          {values.occasion || "Dịp lễ truyền thống"}
                        </p>
                        {values.description && (
                          <p className="admin-preview-body-text">
                            {values.description}
                          </p>
                        )}
                        {steps.map((step, idx) => (
                          <div
                            key={idx}
                            className="admin-preview-section"
                            style={{
                              padding: "12px",
                              border: "1px solid var(--admin-line)",
                              borderRadius: "10px",
                            }}
                          >
                            <h3
                              style={{
                                margin: 0,
                                fontSize: "15px",
                                color: "var(--admin-gold)",
                              }}
                            >
                              Bước {idx + 1}: {step.title || "Tên bước"}
                            </h3>
                            <p
                              className="admin-preview-body-text"
                              style={{ marginTop: "6px" }}
                            >
                              {step.description ||
                                "Chưa có mô tả bước thực hiện."}
                            </p>
                          </div>
                        ))}
                        <section className="admin-preview-section">
                          <h2 className="admin-preview-heading">
                            Checklist chuẩn bị
                          </h2>
                          {checklists.some((item) => item.label.trim()) ? (
                            <ul className="admin-preview-body-text">
                              {checklists
                                .filter((item) => item.label.trim())
                                .map((item) => (
                                  <li key={item.id}>{item.label}</li>
                                ))}
                            </ul>
                          ) : (
                            <p className="admin-preview-references">
                              Chưa có mục checklist.
                            </p>
                          )}
                        </section>
                      </div>
                    )}

                    {kind === "calendar" && (
                      <section className="admin-preview-section">
                        <p className="admin-preview-badge">
                          {values.calendar === "SOLAR"
                            ? "Dương lịch"
                            : "Âm lịch"}{" "}
                          · Ngày {values.day || "—"}, tháng{" "}
                          {values.month || "—"}
                        </p>
                        <h2 className="admin-preview-heading">
                          Thông tin sự kiện
                        </h2>
                        <p className="admin-preview-body-text">
                          {values.description || "Chưa có mô tả sự kiện."}
                        </p>
                      </section>
                    )}

                    {kind === "xam" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "18px",
                        }}
                      >
                        <div className="admin-preview-badges">
                          <span className="admin-preview-badge">
                            Số thẻ: {values.stick_number || "—"}
                          </span>
                          <span className="admin-preview-badge">
                            Vùng: {xamPreviewRegion || "Chưa chọn"}
                          </span>
                          <span className="admin-preview-badge">
                            Chủ đề: {xamPreviewTopic || "Chưa chọn"}
                          </span>
                          <span className="admin-preview-badge">
                            Xếp loại: {values.fortune_level || "Chưa chọn"}
                          </span>
                        </div>
                        <section className="admin-preview-section">
                          <h2 className="admin-preview-heading">Bài thơ quẻ</h2>
                          <p className="admin-preview-references">
                            {normalizeXamPoemLines(values.poem).length}/4 dòng
                            thơ
                            {hasCompleteXamPoem(values.poem)
                              ? " · Đủ bốn dòng"
                              : " · Cần đúng bốn dòng trước khi gửi duyệt"}
                          </p>
                          <div
                            className="admin-preview-body-text"
                            style={{
                              whiteSpace: "pre-line",
                              fontFamily: "var(--font-serif)",
                              textAlign: "center",
                            }}
                          >
                            {normalizeXamPoemLines(values.poem).length > 0
                              ? normalizeXamPoemLines(values.poem).map(
                                  (line, index) => (
                                    <div key={index}>{line}</div>
                                  ),
                                )
                              : "Chưa nhập bài thơ quẻ."}
                          </div>
                        </section>
                        <section className="admin-preview-section">
                          <h2 className="admin-preview-heading">Ý nghĩa</h2>
                          <p className="admin-preview-body-text">
                            {values.meaning ||
                              "Chưa nhập phần diễn giải ý nghĩa."}
                          </p>
                        </section>
                        <section className="admin-preview-section">
                          <h2 className="admin-preview-heading">Lời khuyên</h2>
                          <p className="admin-preview-body-text">
                            {values.advice || "Chưa nhập lời khuyên."}
                          </p>
                        </section>
                      </div>
                    )}

                    {/* Render Prayers Content */}
                    {kind === "prayers" && (
                      <div
                        style={{
                          padding: "20px",
                          background: "var(--admin-surface-muted)",
                          borderRadius: "12px",
                          border: "1px solid var(--admin-line)",
                        }}
                      >
                        <p className="admin-preview-references">
                          Nghi lễ liên kết:{" "}
                          {rituals.find(
                            (ritual) => ritual.id === values.ritual_id,
                          )?.title || "Chưa liên kết với nghi lễ"}
                        </p>
                        <p
                          className="admin-preview-body-text"
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: "16px",
                          }}
                        >
                          {values.content || "Chưa nhập nội dung bài khấn."}
                        </p>
                      </div>
                    )}

                    {/* Footer Sources in Preview */}
                    <div className="admin-preview-references">
                      <strong>Nguồn và hồ sơ biên tập</strong>
                      {sourceAuthor && (
                        <div>{kind === "xam" ? "Tác giả nguyên tác" : "Người biên soạn / tác giả"}: {sourceAuthor}</div>
                      )}
                      {contentType && (
                        <div>
                          Loại nội dung:{" "}
                          {contentType === "GROUP_AUTHORED"
                            ? "Nhóm biên soạn"
                            : contentType}
                        </div>
                      )}
                      {values.source ? (
                        <div>
                          🔗 Liên kết đối chiếu:{" "}
                          {isValidHttpsUrl(values.source) ? (
                            <a
                              href={values.source}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "var(--admin-gold)",
                                textDecoration: "underline",
                              }}
                            >
                              {values.source}
                            </a>
                          ) : (
                            values.source
                          )}
                        </div>
                      ) : null}
                      {sourceDoc && <div>Tên tài liệu: {sourceDoc}</div>}
                      {bibliography && (
                        <div>Thông tin xuất bản: {bibliography}</div>
                      )}
                      {!values.source && !sourceDoc && !bibliography && (
                        <div>Chưa có thông tin nguồn.</div>
                      )}
                      {sourceLocator && (
                        <div>Vị trí trích dẫn: {sourceLocator}</div>
                      )}
                      {contentRightsBasis && (
                        <div>Căn cứ quyền nội dung: {contentRightsBasis}</div>
                      )}
                      <div>
                        Trạng thái: Bản nháp, chưa được duyệt để hiển thị cho
                        khách.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        )}

        {/* Footer */}
        <div
          className={`admin-editor-footer${activeTab === "preview" ? " has-submit-note" : ""}`}
        >
          {activeTab === "preview" && (
            <div className="admin-editor-submit-note">
              <label htmlFor="field-reviewNote" className="admin-editor-label">
                <span>
                  Ghi chú gửi duyệt{" "}
                  <span style={{ color: "var(--admin-crimson)" }}>*</span>
                </span>
                <span className="admin-editor-label-hint">
                  Tối thiểu 8 ký tự
                </span>
              </label>
              <textarea
                id="field-reviewNote"
                maxLength={500}
                rows={2}
                className={`admin-editor-textarea${reviewNoteError ? " is-invalid" : ""}`}
                placeholder="Ví dụ: Đã bổ sung nguồn trích dẫn và rà soát nội dung."
                value={values.reviewNote || ""}
                aria-invalid={reviewNoteError}
                aria-describedby={
                  reviewNoteError
                    ? "field-reviewNote-help field-reviewNote-error"
                    : "field-reviewNote-help"
                }
                onChange={(event) => {
                  set("reviewNote", event.target.value);
                  if (event.target.value.trim().length >= 8)
                    setReviewNoteError(false);
                }}
              />
              <div className="admin-editor-submit-note-meta">
                <span id="field-reviewNote-help">
                  Ghi ngắn gọn thay đổi và điều người duyệt cần kiểm tra.
                </span>
                <span aria-live="polite">
                  {reviewNoteLength}/500 ký tự · cần ít nhất 8
                </span>
              </div>
              {reviewNoteError && (
                <div
                  id="field-reviewNote-error"
                  className="admin-field-feedback is-error"
                  role="alert"
                >
                  <AlertCircle size={13} />
                  <span>Ghi chú cần ít nhất 8 ký tự trước khi gửi duyệt.</span>
                </div>
              )}
            </div>
          )}
          {activeTab === "preview" &&
            kind === "rituals" &&
            !hasUsableChecklist && (
              <div className="admin-editor-checklist-warning" role="alert">
                <AlertCircle size={15} aria-hidden="true" />
                <span>
                  Thiếu checklist hợp lệ. Quay lại Bước 2 và thêm ít nhất một
                  mục có nội dung trước khi gửi duyệt.
                </span>
              </div>
            )}
          {activeTab === "preview" && reviewMissingSummary && (
            <div
              className="admin-field-feedback is-error"
              role="status"
              aria-live="polite"
            >
              <AlertCircle size={14} aria-hidden="true" />
              <span>
                <strong>Chưa thể gửi duyệt.</strong> Còn thiếu{" "}
                {reviewMissingSummary}.
              </span>
            </div>
          )}
          <div
            className={`admin-editor-footer-hint ${savingMode ? "is-saving" : hasUnsavedChanges ? "is-dirty" : id ? "is-saved" : "is-not-saved"}`}
          >
            {savingMode ? (
              <RefreshCw
                size={16}
                className="admin-spin-icon"
                aria-hidden="true"
              />
            ) : hasUnsavedChanges ? (
              <AlertCircle size={16} aria-hidden="true" />
            ) : id ? (
              <CheckCircle2 size={16} aria-hidden="true" />
            ) : (
              <Info size={16} aria-hidden="true" />
            )}
            <span aria-live="polite">
              {savingMode === "draft"
                ? "Đang lưu bản nháp…"
                : savingMode === "submit"
                  ? "Đang gửi nội dung để duyệt…"
                  : hasUnsavedChanges
                    ? "Có thay đổi chưa được lưu."
                    : id
                      ? "Đang hiển thị nội dung đã lưu gần nhất."
                      : "Bản nháp mới chưa được lưu."}
            </span>
          </div>
          <div className="admin-editor-footer-actions">
            {editorAccessDenied ? (
              <button
                type="button"
                className="admin-editor-action-btn is-cancel"
                onClick={requestClose}
              >
                Đóng
              </button>
            ) : (
              <>
                {activeTab === "info" && (
                  <>
                    <button
                      type="button"
                      className="admin-editor-action-btn is-cancel"
                      disabled={Boolean(savingMode)}
                      onClick={requestClose}
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      className="admin-editor-action-btn is-draft"
                      disabled={
                        Boolean(savingMode) || loading || isSourceUrlInvalid
                      }
                      onClick={() => void save(undefined, false)}
                      title="Lưu lại các nội dung đang soạn và giữ bài ở chế độ nháp để tiếp tục hoàn thiện"
                    >
                      {savingMode === "draft" ? (
                        <>
                          <RefreshCw size={14} className="admin-spin-icon" />
                          <span>Đang lưu nháp…</span>
                        </>
                      ) : (
                        <>
                          <Save size={15} />
                          <span>Lưu bản nháp</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="admin-editor-action-btn is-next"
                      onClick={() => setActiveTab("content")}
                      title="Chuyển sang Bước 2: Nhập nội dung chi tiết"
                    >
                      <span>Sang Bước 2: Nhập nội dung</span>
                      <ChevronRight size={15} />
                    </button>
                  </>
                )}

                {activeTab === "content" && (
                  <>
                    <button
                      type="button"
                      className="admin-editor-action-btn is-prev"
                      onClick={() => setActiveTab("info")}
                      title={`Quay lại Bước 1: Thông tin ${CONTENT_NOUN[kind]}`}
                    >
                      <ChevronLeft size={15} />
                      <span>Bước 1</span>
                    </button>
                    <button
                      type="button"
                      className="admin-editor-action-btn is-draft"
                      disabled={
                        Boolean(savingMode) || loading || isSourceUrlInvalid
                      }
                      onClick={() => void save(undefined, false)}
                      title="Lưu lại các nội dung đang soạn và giữ bài ở chế độ nháp để tiếp tục hoàn thiện"
                    >
                      {savingMode === "draft" ? (
                        <>
                          <RefreshCw size={14} className="admin-spin-icon" />
                          <span>Đang lưu nháp…</span>
                        </>
                      ) : (
                        <>
                          <Save size={15} />
                          <span>Lưu bản nháp</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="admin-editor-action-btn is-next"
                      onClick={() => setActiveTab("media")}
                      title="Chuyển sang Bước 3: Nguồn & Ảnh minh họa"
                    >
                      <span>Sang Bước 3: Nguồn & Ảnh</span>
                      <ChevronRight size={15} />
                    </button>
                  </>
                )}

                {activeTab === "media" && (
                  <>
                    <button
                      type="button"
                      className="admin-editor-action-btn is-prev"
                      onClick={() => setActiveTab("content")}
                      title="Quay lại Bước 2: Nội dung chi tiết"
                    >
                      <ChevronLeft size={15} />
                      <span>Bước 2</span>
                    </button>
                    <button
                      type="button"
                      className="admin-editor-action-btn is-draft"
                      disabled={
                        Boolean(savingMode) || loading || isSourceUrlInvalid
                      }
                      onClick={() => void save(undefined, false)}
                      title="Lưu lại các nội dung đang soạn và giữ bài ở chế độ nháp để tiếp tục hoàn thiện"
                    >
                      {savingMode === "draft" ? (
                        <>
                          <RefreshCw size={14} className="admin-spin-icon" />
                          <span>Đang lưu nháp…</span>
                        </>
                      ) : (
                        <>
                          <Save size={15} />
                          <span>Lưu bản nháp</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="admin-editor-action-btn is-next"
                      onClick={() => setActiveTab("preview")}
                      title="Xem trước nội dung hoàn chỉnh trước khi gửi duyệt"
                    >
                      <Eye size={15} />
                      <span>Xem trước</span>
                      <ChevronRight size={15} />
                    </button>
                  </>
                )}

                {activeTab === "preview" && (
                  <>
                    <button
                      type="button"
                      className="admin-editor-action-btn is-prev"
                      onClick={() => setActiveTab("media")}
                      title="Quay lại Bước 3 để điều chỉnh"
                    >
                      <ChevronLeft size={15} />
                      <span>Quay lại sửa</span>
                    </button>
                    <button
                      type="button"
                      className="admin-editor-action-btn is-draft"
                      disabled={
                        Boolean(savingMode) || loading || isSourceUrlInvalid
                      }
                      onClick={() => void save(undefined, false)}
                      title="Lưu lại các nội dung đang soạn và giữ bài ở chế độ nháp để tiếp tục hoàn thiện"
                    >
                      {savingMode === "draft" ? (
                        <>
                          <RefreshCw size={14} className="admin-spin-icon" />
                          <span>Đang lưu nháp…</span>
                        </>
                      ) : (
                        <>
                          <Save size={15} />
                          <span>Lưu bản nháp</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="admin-editor-action-btn is-submit"
                      disabled={
                        Boolean(savingMode) ||
                        loading ||
                        isSourceUrlInvalid ||
                        !isStep1Complete ||
                        !isStep2Complete ||
                        !isStep3Complete
                      }
                      onClick={() => void save(undefined, true)}
                      title={
                        reviewMissingSummary
                          ? `Còn thiếu: ${reviewMissingSummary}`
                          : kind === "rituals" && !hasUsableChecklist
                            ? "Thêm ít nhất một mục checklist hợp lệ trước khi gửi duyệt"
                            : kind === "prayers" && !values.ritual_id
                              ? "Gắn văn khấn với một nghi lễ đã công khai trước khi gửi duyệt"
                              : !isStep1Complete || !isStep2Complete
                                ? "Cần hoàn thiện tối thiểu Bước 1 & Bước 2 trước khi gửi duyệt"
                                : "Chuyển bài sang trạng thái Chờ duyệt để người phụ trách rà soát"
                      }
                    >
                      {savingMode === "submit" ? (
                        <>
                          <RefreshCw size={14} className="admin-spin-icon" />
                          <span>Đang gửi duyệt…</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Gửi duyệt nội dung</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

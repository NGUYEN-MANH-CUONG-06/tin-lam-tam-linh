import type { CultureArticle } from "./cultureData";
import type { RemoteContentItem } from "./contentService";

export function toCultureArticle(item: RemoteContentItem): CultureArticle {
  const sections = Array.isArray(item.sections) ? item.sections.flatMap((value, index) => {
    if (!value || typeof value !== "object") return [];
    const section = value as Record<string, unknown>;
    const body = section.paragraphs ?? section.body;
    const paragraphs = Array.isArray(body) ? body.filter((p): p is string => typeof p === "string") : typeof body === "string" ? [body] : [];
    return [{ id: `${item.id}-section-${index}`, title: String(section.title ?? section.heading ?? "Tư liệu"), paragraphs }];
  }) : [];
  const wordCount = sections.reduce((total, section) => total + section.paragraphs.join(" ").trim().split(/\s+/).filter(Boolean).length, 0);
  const readingTime = `${Math.max(3, Math.ceil(wordCount / 90))} phút`;
  const provenance = item.provenance && typeof item.provenance === "object" ? item.provenance as Record<string, unknown> : {};
  const source = typeof item.source === "string" && /^https?:\/\//.test(item.source) ? item.source : undefined;
  const review = item.review && typeof item.review === "object" ? item.review as Record<string, unknown> : undefined;
  const approved = item.verified === true && item.contentKind === "article";
  const sourceTitle = typeof provenance.sourceTitle === "string" ? provenance.sourceTitle : "";
  const sourceAuthor = typeof provenance.sourceAuthor === "string" ? provenance.sourceAuthor : "";
  const bibliography = typeof provenance.bibliography === "string" ? provenance.bibliography : "";
  const locator = typeof provenance.sourceLocator === "string" ? provenance.sourceLocator : "";
  const groupAuthored = provenance.contentType === "GROUP_AUTHORED";
  const sources = sourceTitle || source || bibliography ? [{
    id: `${item.id}-source`,
    title: sourceTitle || (groupAuthored ? "Nội dung do nhóm biên soạn" : ""),
    authorOrOrganization: sourceAuthor || undefined,
    url: source,
    bibliographicReference: bibliography || undefined,
    locator: locator || undefined,
  }] : [];
  return {
    id: item.id, title: item.title, subtitle: String(item.subtitle ?? "Tư liệu văn hóa"),
    excerpt: String(item.excerpt ?? ""),
    region: String(item.region ?? "Chưa phân vùng"), category: String(item.category ?? ""),
    image: typeof item.image === "string" ? item.image : "",
    caption: typeof provenance.imageCaption === "string" ? provenance.imageCaption : "",
    readingTime, sections,
    editorialNote: groupAuthored ? "Nội dung do nhóm biên soạn." : "Tư liệu tham khảo; trạng thái nguồn không thay thế thẩm định nội dung.",
    sources: sources.map((entry) => ({ title: entry.title, author: entry.authorOrOrganization || "", sourceType: "Tư liệu tham khảo", annotation: entry.url || entry.bibliographicReference || "" })),
    metadata: {
      contentKind: "editorial", editorialStatus: approved ? "approved" : "in-review",
      contentType: provenance.contentType === "GROUP_AUTHORED" || provenance.contentType === "FACT" || provenance.contentType === "LEGEND" || provenance.contentType === "QUOTATION" ? provenance.contentType : undefined,
      contentAuthor: sourceAuthor || undefined,
      quotationVerified: provenance.contentType === "QUOTATION" && review?.quotationVerified === true,
      reviewedBy:
        approved &&
        typeof review?.reviewerName === "string" &&
        review.reviewerName.trim()
          ? review.reviewerName.trim()
          : undefined,

      reviewedOn:
        approved &&
        typeof review?.reviewedOn === "string" &&
        review.reviewedOn.trim()
          ? review.reviewedOn.trim()
          : undefined,
      sources,
      imageSource: typeof provenance.imageSource === "string" ? provenance.imageSource : undefined,
      imageCredit: typeof provenance.imageCredit === "string" ? provenance.imageCredit : undefined,
      imageRightsBasis: typeof provenance.imageRightsBasis === "string" ? provenance.imageRightsBasis : undefined,
      usageRights: review?.rightsConfirmed === true && (review?.usageRights === "confirmed" || review?.usageRights === "public-domain") ? { status: review.usageRights, note: typeof provenance.imageRightsBasis === "string" ? provenance.imageRightsBasis : "" } : undefined,
      editorialNote: groupAuthored ? "Nội dung do nhóm biên soạn." : "Trạng thái nguồn không thay thế thẩm định nội dung.",
    },
  };
}

export function canShowArticleImage(article: Pick<CultureArticle, "image" | "metadata">): boolean {
  return Boolean(
    article.image?.trim() &&
    article.metadata?.editorialStatus === "approved" &&
    article.metadata.imageSource?.trim() &&
    article.metadata.imageRightsBasis?.trim() &&
    article.metadata.usageRights?.status,
  );
}

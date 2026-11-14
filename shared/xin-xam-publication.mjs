export function normalizeXamPoemLines(value) {
  const lines = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\r\n|\r|\n/)
      : [];

  return lines
    .filter((line) => typeof line === "string")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function hasCompleteXamPoem(value) {
  return normalizeXamPoemLines(value).length === 4;
}

function hasCompleteXamInterpretation(value) {
  const fields = Array.isArray(value) ? value : [value];
  return fields.length > 0 && fields.every((field) => typeof field === "string" && field.trim());
}

function isHttpsSource(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const ORIGINAL_SYSTEM_ID = "TLTL_ORIGINAL_100_V1";

export function isOriginalXamMetadata(metadata) {
  return metadata?.systemId === ORIGINAL_SYSTEM_ID
    && metadata?.contentType === "ORIGINAL"
    && metadata?.authoringMethod === "AI_ASSISTED_EDITORIAL_DRAFT"
    && typeof metadata?.contentVersion === "string"
    && metadata.contentVersion.trim().length > 0;
}

export function markOriginalXamApproved(metadata) {
  if (!isOriginalXamMetadata(metadata)) return null;
  return { ...metadata, reviewStatus: "APPROVED", humanApproved: true };
}

export function hasCompleteXamContent({ poem, interpretations, source, editorial_metadata }) {
  const hasContent = hasCompleteXamPoem(poem) && hasCompleteXamInterpretation(interpretations);
  return Boolean(
    hasContent && (isHttpsSource(source) || isOriginalXamMetadata(editorial_metadata))
  );
}

export function isPublishableXamCard(card) {
  return (
    card?.active === true &&
    card?.verified === true &&
    card?.editorial_status === "PUBLISHED" &&
    !String(card?.xam_type || "").startsWith("PREVIEW:") &&
    (card?.editorial_metadata?.systemId !== ORIGINAL_SYSTEM_ID
      || (card.editorial_metadata.reviewStatus === "APPROVED" && card.editorial_metadata.humanApproved === true)) &&
    hasCompleteXamContent(card)
  );
}

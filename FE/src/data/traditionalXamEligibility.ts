import type { TopicType } from "./xinXamData";
import type { ContentMetadata } from "./contentMetadata";
import {
  TRADITIONAL_XAM_COLLECTIONS,
  TRADITIONAL_XAM_STICKS,
  type TraditionalXamCollectionId,
  type TraditionalXamStick,
} from "./traditionalXamData";
import { validateTraditionalXam } from "./validateTraditionalXam";
import { isPublishableXamCard } from "../../../shared/xin-xam-publication.mjs";

function isApproved(metadata: ContentMetadata): boolean {
  return (
    metadata.contentKind === "editorial" &&
    metadata.editorialStatus === "approved" &&
    Boolean(metadata.reviewedBy?.trim()) &&
    Boolean(metadata.reviewedOn?.trim())
  );
}

function getLocatableSource(metadata: ContentMetadata): string | undefined {
  const source = metadata.sources.find(
    (item) => item.title.trim() && (item.url?.trim() || item.bibliographicReference?.trim()) && item.locator?.trim()
  );
  return source?.url || source?.bibliographicReference;
}

export function getPublishableTraditionalSticks(
  collectionId: TraditionalXamCollectionId,
  topic: TopicType
): TraditionalXamStick[] {
  const errors = validateTraditionalXam(
    TRADITIONAL_XAM_COLLECTIONS,
    TRADITIONAL_XAM_STICKS
  );

  if (errors.length > 0) return [];

  const collection = TRADITIONAL_XAM_COLLECTIONS.find(
    (item) => item.id === collectionId
  );

  if (!collection || !isApproved(collection.metadata)) {
    return [];
  }

  return TRADITIONAL_XAM_STICKS.filter(
    (stick) => {
      const translation = stick.translation;
      const reflection = stick.reflectionByTopic[topic];
      const verified =
        isApproved(collection.metadata) &&
        isApproved(stick.metadata) &&
        stick.metadata.quotationVerified &&
        translation !== undefined &&
        isApproved(translation.metadata) &&
        translation.metadata.quotationVerified;

      const publishableCard = {
        active: true,
        verified,
        editorial_status: "PUBLISHED",
        source: getLocatableSource(stick.metadata),
        poem: translation?.lines,
        interpretations: [reflection],
      };

      return (
        stick.collectionId === collectionId &&
        isPublishableXamCard(publishableCard)
      );
    }
  );
}

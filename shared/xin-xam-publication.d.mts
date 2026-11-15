export interface PublishableXamContent {
  active?: boolean;
  verified?: boolean;
  xam_type?: string;
  editorial_status?: string;
  poem?: string | string[] | null;
  interpretations?: string | Array<string | null | undefined> | null;
  source?: string | null;
  editorial_metadata?: Record<string, unknown> | null;
}

export function normalizeXamPoemLines(value: string | string[] | null | undefined): string[];
export function hasCompleteXamPoem(value: string | string[] | null | undefined): boolean;
export function hasCompleteXamContent(content: PublishableXamContent): boolean;
export function isOriginalXamMetadata(metadata: Record<string, unknown> | null | undefined): boolean;
export function markOriginalXamApproved(metadata: Record<string, unknown>): Record<string, unknown> | null;
export function isPublishableXamCard(card: PublishableXamContent): boolean;

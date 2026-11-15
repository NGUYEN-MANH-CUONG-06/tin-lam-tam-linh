import type { ContentMetadata } from "./contentMetadata";

export type RegionType = "Bắc Bộ" | "Trung Bộ" | "Nam Bộ";
export type TopicType = string;

export interface XinXamResult {
  resultToken?: string;
  reflectionQuestion?: string;
  metadata: ContentMetadata;
  aiExplanation?: {
    content: string;
    metadata: ContentMetadata;
  };
  source?: string;
  verified?: boolean;
  stickNumber: string;
  region: RegionType | "Toàn quốc";
  regionSub: string;
  topic: TopicType;
  topicTag: string;
  title: string;
  quote: string;
  poem: {
    line1: string;
    line2: string;
    line3: string;
    line4: string;
  };
  sealText: string;
  fortuneType?: string;
  category?: string;
  insight: string;
  reflectionParagraphs: string[];
  tips: {
    title: string;
    desc: string;
  }[];
  culturalAspect: string;
  relatedArticleId: string;
  relatedArticleTitle: string;
  microAction: {
    title: string;
    desc: string;
    duration: string;
  };
}

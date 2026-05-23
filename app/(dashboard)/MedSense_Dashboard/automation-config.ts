export interface AutoPublishConfig {
  enabled: boolean;
  scheduledTime: string;
  timezone: string;
  aiModel: string;
  tone: string;
  freshnessWindow: number;
  authorName: string;
  lastRunAt: string | null;
  lastRunDate: string | null;
  lastRunTime: string | null;
  lastResult: string | null;
  updatedAt: string;
}

export const DEFAULT_AUTO_PUBLISH_CONFIG: AutoPublishConfig = {
  enabled: false,
  scheduledTime: "05:00",
  timezone: "Africa/Lagos",
  aiModel: "mistral-small-latest",
  tone: "urgent, journalistic, and reader focused",
  freshnessWindow: 24,
  authorName: "Damilare",
  lastRunAt: null,
  lastRunDate: null,
  lastRunTime: null,
  lastResult: null,
  updatedAt: ""
};

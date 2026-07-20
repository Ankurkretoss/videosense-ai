export interface VideoMetadata {
  title: string;
  source: string;
  duration: string;
  resolution: string;
  fileSize: string;
  thumbnail: string;
}

export interface VideoSummary {
  short: string;
  detailed: string;
  conclusion: string;
}

export interface TimelineEntry {
  timestamp: string;
  title: string;
  description: string;
}

export interface TranscriptEntry {
  timestamp: string;
  text: string;
}

export interface Scene {
  timestamp: string;
  thumbnail: string;
  description: string;
  objects: string[];
  people: string[];
  activities: string[];
}

export interface VideoAnalysis {
  metadata: VideoMetadata;
  summary: VideoSummary;
  timeline: TimelineEntry[];
  transcript: TranscriptEntry[];
  scenes: Scene[];
  topics: string[];
  keywords: string[];
  actionItems: string[];
  insights: string[];
}

export type AnalysisStatus =
  | "idle"
  | "uploading"
  | "extracting-audio"
  | "processing-video"
  | "analyzing-frames"
  | "generating-summary"
  | "preparing-report"
  | "completed"
  | "error";

export interface UploadProgress {
  status: AnalysisStatus;
  progress: number;
  message: string;
}

export type VideoSource = "file" | "youtube";

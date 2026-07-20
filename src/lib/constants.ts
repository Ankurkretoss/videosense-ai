export const APP_NAME = "AI Video Analysis";

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export const ACCEPTED_VIDEO_TYPES = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/x-matroska": [".mkv"],
  "video/webm": [".webm"],
};

export const ACCEPTED_EXTENSIONS = [".mp4", ".mov", ".mkv", ".webm"];

export const YOUTUBE_URL_PATTERN =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/;

export const ANALYSIS_STAGES = [
  { status: "uploading" as const, message: "Uploading video..." },
  { status: "extracting-audio" as const, message: "Extracting audio..." },
  { status: "processing-video" as const, message: "Processing video..." },
  { status: "analyzing-frames" as const, message: "Analyzing frames..." },
  { status: "generating-summary" as const, message: "Generating summary..." },
  { status: "preparing-report" as const, message: "Preparing report..." },
] as const;

export const FEATURES = [
  {
    title: "AI Summary",
    description:
      "Get concise and detailed summaries of your video content powered by advanced AI.",
    icon: "Sparkles",
  },
  {
    title: "Timeline Detection",
    description:
      "Automatic timeline generation with timestamps for easy navigation.",
    icon: "Clock",
  },
  {
    title: "Scene Analysis",
    description:
      "Deep scene-by-scene analysis with object and activity detection.",
    icon: "Film",
  },
  {
    title: "Transcript",
    description: "Full searchable and downloadable transcript of your video.",
    icon: "FileText",
  },
  {
    title: "Topic Extraction",
    description: "Automatic extraction of key topics and themes from your video.",
    icon: "Tag",
  },
  {
    title: "Action Items",
    description: "Smart extraction of actionable items and next steps.",
    icon: "CheckSquare",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Upload Video",
    description: "Drag & drop a video file or paste a YouTube URL.",
  },
  {
    step: 2,
    title: "AI Analysis",
    description: "Our AI processes and analyzes your video content.",
  },
  {
    step: 3,
    title: "View Report",
    description: "Get a comprehensive analysis report instantly.",
  },
] as const;

export const FOOTER_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "GitHub", href: "https://github.com" },
  { label: "About", href: "/about" },
] as const;

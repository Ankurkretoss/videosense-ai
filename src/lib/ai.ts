import type { AnalysisStatus, VideoAnalysis } from "@/types/analysis";
import type { SportsAnalysis } from "@/types/sports-analysis";

export interface AIProvider {
  analyzeVideo(file: File): Promise<VideoAnalysis>;
  analyzeYouTubeVideo(url: string): Promise<VideoAnalysis>;
}

export interface SportsProgressEvent {
  stage: AnalysisStatus;
  progress: number;
  message: string;
}

export interface SportsAnalysisOptions {
  onProgress?: (event: SportsProgressEvent) => void;
  signal?: AbortSignal;
}

class MockAIProvider implements AIProvider {
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateMockAnalysis(title: string, source: string): VideoAnalysis {
    return {
      metadata: {
        title,
        source,
        duration: "12:34",
        resolution: "1920x1080",
        fileSize: "245 MB",
        thumbnail: "",
      },
      summary: {
        short:
          "This video provides a comprehensive overview of modern AI development practices and tools.",
        detailed:
          "The presentation covers key topics including machine learning frameworks, deployment strategies, and best practices for building production-ready AI applications. The speaker demonstrates practical examples using popular tools and libraries, making complex concepts accessible to developers of all skill levels.",
        conclusion:
          "A valuable resource for developers looking to understand the current landscape of AI development and implement best practices in their projects.",
      },
      timeline: [
        {
          timestamp: "00:00",
          title: "Introduction",
          description: "Welcome and overview of the session topics.",
        },
        {
          timestamp: "02:15",
          title: "AI Fundamentals",
          description: "Core concepts and terminology explained.",
        },
        {
          timestamp: "05:30",
          title: "Hands-on Demo",
          description: "Live coding demonstration of key features.",
        },
        {
          timestamp: "08:45",
          title: "Best Practices",
          description: "Tips and tricks for production deployment.",
        },
        {
          timestamp: "11:00",
          title: "Q&A Session",
          description: "Answering audience questions and wrap-up.",
        },
      ],
      transcript: [
        { timestamp: "00:00", text: "Welcome everyone to this session on AI development." },
        { timestamp: "00:15", text: "Today we'll be covering some exciting topics." },
        { timestamp: "00:30", text: "Let's start with the basics of machine learning." },
        { timestamp: "01:00", text: "First, let me show you the project structure." },
        { timestamp: "01:30", text: "As you can see, we have a clean architecture." },
        { timestamp: "02:00", text: "Now let's dive into the implementation details." },
        { timestamp: "02:30", text: "This approach ensures scalability and maintainability." },
        { timestamp: "03:00", text: "Let me demonstrate how this works in practice." },
      ],
      scenes: [
        {
          timestamp: "00:30",
          thumbnail: "",
          description: "Presenter introducing the topic with slides",
          objects: ["Screen", "Slides", "Microphone"],
          people: ["1"],
          activities: ["Presentation", "Speaking"],
        },
        {
          timestamp: "03:15",
          thumbnail: "",
          description: "Code editor showing live coding session",
          objects: ["Laptop", "Code Editor", "Terminal"],
          people: ["1"],
          activities: ["Coding", "Demonstration"],
        },
        {
          timestamp: "06:45",
          thumbnail: "",
          description: "Architecture diagram explaining system design",
          objects: ["Diagram", "Flowchart", "Screen"],
          people: ["1"],
          activities: ["Explaining", "Presenting"],
        },
        {
          timestamp: "09:30",
          thumbnail: "",
          description: "Terminal showing deployment process",
          objects: ["Terminal", "Command Line", "Server"],
          people: ["1"],
          activities: ["Deploying", "Testing"],
        },
      ],
      topics: [
        "AI Development",
        "Machine Learning",
        "Deployment",
        "Architecture",
        "Best Practices",
        "Production Ready",
      ],
      keywords: [
        "LLM",
        "Neural Networks",
        "Training",
        "Inference",
        "API",
        "Model",
        "Data",
        "Pipeline",
      ],
      actionItems: [
        "Review the recommended resources",
        "Set up a development environment",
        "Practice with the hands-on examples",
        "Implement the best practices discussed",
        "Join the community for support",
      ],
      insights: [
        "Presenter spends most time on practical implementation",
        "Video includes live coding demonstrations",
        "High information density throughout",
        "Mostly technical content aimed at developers",
        "Multiple real-world examples provided",
      ],
    };
  }

  async analyzeVideo(file: File): Promise<VideoAnalysis> {
    await this.delay(2000);
    return this.generateMockAnalysis(file.name, "Local File");
  }

  async analyzeYouTubeVideo(url: string): Promise<VideoAnalysis> {
    await this.delay(2000);
    const title = "YouTube Video Analysis";
    return this.generateMockAnalysis(title, url);
  }
}

let aiProvider: AIProvider = new MockAIProvider();

export function setAIProvider(provider: AIProvider): void {
  aiProvider = provider;
}

export function getAIProvider(): AIProvider {
  return aiProvider;
}

export async function analyzeVideo(file: File): Promise<VideoAnalysis> {
  return aiProvider.analyzeVideo(file);
}

export async function analyzeYouTubeVideo(url: string): Promise<VideoAnalysis> {
  return aiProvider.analyzeYouTubeVideo(url);
}

export async function initializeGeminiProvider(apiKey: string): Promise<void> {
  const { GeminiProvider } = await import("./providers/gemini");
  const provider = new GeminiProvider(apiKey);
  setAIProvider(provider);
}

export async function initializeMimoProvider(apiKey: string): Promise<void> {
  const { MimoProvider } = await import("./providers/mimo");
  const provider = new MimoProvider(apiKey);
  setAIProvider(provider);
}

export async function analyzeSportsVideo(
  file: File,
  apiKey: string,
  options: SportsAnalysisOptions = {}
): Promise<SportsAnalysis> {
  const { GeminiProvider } = await import("./providers/gemini");
  return new GeminiProvider(apiKey).analyzeSportsVideo(file, options);
}

export async function analyzeSportsYouTubeVideo(
  url: string,
  apiKey: string,
  options: SportsAnalysisOptions = {}
): Promise<SportsAnalysis> {
  const { GeminiProvider } = await import("./providers/gemini");
  return new GeminiProvider(apiKey).analyzeSportsYouTubeVideo(url, options);
}

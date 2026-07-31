<div align="center">

# 🎬 VideoSense AI

**AI-powered video analysis platform that generates summaries, transcripts, scene breakdowns, and actionable insights from video files or YouTube links.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](#license)

</div>

---

## 📚 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Supported Formats](#-supported-formats)
- [Getting Started](#-getting-started)
- [AI Providers](#-ai-providers)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [License](#-license)

---

## 🧠 Overview

VideoSense AI takes any video file or YouTube link and turns it into structured, actionable intelligence — summaries, timestamped scene breakdowns, full transcripts, extracted keywords, and next-step action items — powered by your choice of leading AI providers.

---

## ✨ Features

- 📝 **AI Summaries** — Short and detailed summaries of video content
- ⏱️ **Timeline Detection** — Automatic timestamped sections for easy navigation
- 🎞️ **Scene Analysis** — Object, people, and activity detection per scene
- 💬 **Transcript Generation** — Full searchable transcript with timestamps
- 🔑 **Topic & Keyword Extraction** — Key themes and terminology
- ✅ **Action Items** — Smart extraction of next steps and tasks
- 🔄 **Multi-Provider AI** — Switch between Gemini, MiMo, or Groq

---

## 🎞️ Supported Formats

| Format | Extension |
|--------|-----------|
| MP4    | `.mp4`    |
| MOV    | `.mov`    |
| MKV    | `.mkv`    |
| WebM   | `.webm`   |

> **Max file size:** 500 MB

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- An API key for at least one supported AI provider (Gemini, MiMo, or Groq)

### Installation

```bash
git clone https://github.com/your-username/videosense-ai.git
cd videosense-ai
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key
```

> Or configure your preferred provider via the app's settings page.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

```bash
npm run build
npm start
```

---

## 🤖 AI Providers

| Provider | Model | Auth |
|----------|-------|------|
| Gemini   | `gemini-2.0-flash` | API Key |
| MiMo     | `mimo-v2.5` | API Key |
| Groq     | `llama-3.3-70b-versatile` | API Key |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 + React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | shadcn/ui |
| **Animations** | Framer Motion |
| **Form Handling** | React Hook Form |
| **File Upload** | React Dropzone |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx            # Landing page
│   ├── analyze/page.tsx    # Analysis page
│   └── api/config/route.ts # API config endpoint
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── Hero.tsx
│   ├── UploadCard.tsx
│   ├── YouTubeInput.tsx
│   ├── TranscriptViewer.tsx
│   ├── SceneGrid.tsx
│   └── ...
├── hooks/
│   ├── useUpload.ts
│   └── useAnalysis.ts
├── lib/
│   ├── ai.ts               # AI provider abstraction
│   ├── constants.ts
│   ├── utils.ts
│   └── providers/
│       ├── gemini.ts
│       ├── mimo.ts
│       └── groq.ts
└── types/
    └── analysis.ts         # TypeScript interfaces
```

---


<div align="center">

Made with ❤️ using Next.js & AI

</div>

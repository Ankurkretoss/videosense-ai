"use client";

import { Camera, CloudSun, Gauge, MapPin, Ruler, Sun, Video, Move } from "lucide-react";
import { SectionCard, StatTile, RatingBar } from "./report-ui";
import type { BallAnalysis, VideoInfo } from "@/types/sports-analysis";

interface VideoInfoCardProps {
  videoInfo: VideoInfo;
  ballAnalysis: BallAnalysis;
}

export function VideoInfoCard({ videoInfo, ballAnalysis }: VideoInfoCardProps) {
  const facts = [
    { icon: <Video className="h-3.5 w-3.5" />, label: "Frame rate", value: videoInfo.fps },
    { icon: <Camera className="h-3.5 w-3.5" />, label: "Camera", value: videoInfo.cameraType },
    { icon: <Move className="h-3.5 w-3.5" />, label: "Movement", value: videoInfo.cameraMovement },
    { icon: <CloudSun className="h-3.5 w-3.5" />, label: "Weather", value: videoInfo.weather },
    { icon: <Sun className="h-3.5 w-3.5" />, label: "Time of day", value: videoInfo.timeOfDay },
    { icon: <MapPin className="h-3.5 w-3.5" />, label: "Venue", value: videoInfo.stadium },
    { icon: <Ruler className="h-3.5 w-3.5" />, label: "Pitch", value: videoInfo.pitchDimensions },
    { icon: <Gauge className="h-3.5 w-3.5" />, label: "Duration", value: videoInfo.duration },
  ];

  return (
    <SectionCard
      title="Footage & ball analysis"
      icon={<Video className="h-5 w-5 text-indigo-400" />}
      description="What the camera captured and how the ball behaved."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="flex items-center gap-1.5 text-xs text-gray-400">
              {fact.icon}
              {fact.label}
            </p>
            <p className="mt-1 text-sm font-medium text-white">{fact.value || "—"}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <RatingBar label="Video quality" value={videoInfo.videoQualityScore} suffix="/10" />
          <RatingBar label="Visibility" value={videoInfo.visibilityScore} suffix="/10" />
          {videoInfo.notes && <p className="text-xs text-gray-500">{videoInfo.notes}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Avg ball speed" value={`${ballAnalysis.avgSpeedKmh} km/h`} />
          <StatTile label="Max ball speed" value={`${ballAnalysis.maxSpeedKmh} km/h`} />
          <StatTile label="Longest pass" value={`${ballAnalysis.longestPassM} m`} />
          <StatTile label="Longest shot" value={`${ballAnalysis.longestShotM} m`} />
          <StatTile label="Max height" value={`${ballAnalysis.maxHeightM} m`} />
          <StatTile label="Air time" value={`${Math.round(ballAnalysis.airTimeSec)}s`} />
          <StatTile label="Bounces" value={ballAnalysis.bounceCount} />
          <StatTile label="Ground contacts" value={ballAnalysis.groundContacts} />
        </div>
      </div>

      {ballAnalysis.trajectoryNotes && (
        <p className="mt-3 text-sm text-gray-400">{ballAnalysis.trajectoryNotes}</p>
      )}
    </SectionCard>
  );
}

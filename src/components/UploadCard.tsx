"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, FileVideo, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCEPTED_VIDEO_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

interface UploadCardProps {
  onFileSelect: (file: File) => void;
  hasUpload: boolean;
  onClear: () => void;
}

export function UploadCard({ onFileSelect, hasUpload, onClear }: UploadCardProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_VIDEO_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          isDragActive
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-white/20 bg-white/5 hover:border-indigo-500/50 hover:bg-white/10"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-indigo-500/10 p-4">
            <Upload className="h-8 w-8 text-indigo-400" />
          </div>
          <div>
            <p className="text-lg font-medium text-white">
              {isDragActive ? "Drop your video here" : "Drag & drop your video"}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              or click to browse (MP4, MOV, MKV, WebM - Max 500MB)
            </p>
          </div>
        </div>
      </div>

      {hasUpload && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="absolute right-2 top-2 rounded-full bg-white/10 p-1 text-gray-400 hover:bg-white/20 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}

interface VideoPreviewProps {
  file: File;
  preview: string | null;
}

export function VideoPreview({ file, preview }: VideoPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
    >
      {preview && (
        <video
          src={preview}
          className="aspect-video w-full object-cover"
          controls
        />
      )}
      <div className="flex items-center gap-3 p-4">
        <FileVideo className="h-8 w-8 text-indigo-400" />
        <div className="flex-1">
          <p className="font-medium text-white">{file.name}</p>
          <p className="text-sm text-gray-400">
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      </div>
    </motion.div>
  );
}

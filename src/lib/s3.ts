import { S3Client } from "@aws-sdk/client-s3";

/**
 * Server-side S3 client.
 *
 * Clip bytes never pass through this server: the browser uploads them straight to
 * object storage with a presigned URL, so all the server does is sign requests.
 */

const endpoint = process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;

export const S3_BUCKET = bucket ?? "";
export const S3_PREFIX = [process.env.S3_MAIN_FOLDER, process.env.S3_INTERNAL_FOLDER]
  .filter(Boolean)
  .join("/");

export function isS3Configured(): boolean {
  return Boolean(endpoint && bucket && accessKeyId && secretAccessKey);
}

let client: S3Client | null = null;

export function getS3(): S3Client {
  if (!isS3Configured()) throw new Error("S3 is not configured.");
  if (!client) {
    client = new S3Client({
      endpoint,
      // Contabo and most S3-compatible providers need path-style addressing.
      region: process.env.S3_REGION || "eu2",
      forcePathStyle: true,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
  }
  return client;
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
}

/** Object keys stay inside the configured folder and never leave it. */
export function clipKey(matchKey: string, clipId: string): string {
  return [S3_PREFIX, "clips", safeSegment(matchKey), `${safeSegment(clipId)}.mp4`]
    .filter(Boolean)
    .join("/");
}

/** The original uploaded match video, stored alongside its cut clips. */
export function sourceKey(matchKey: string, filename: string): string {
  const ext = filename.includes(".") ? `.${filename.split(".").pop()}` : "";
  return [S3_PREFIX, "source", safeSegment(matchKey), `original${safeSegment(ext)}`]
    .filter(Boolean)
    .join("/");
}

export function isOwnedKey(key: string): boolean {
  const prefixes = (S3_PREFIX ? [`${S3_PREFIX}/clips/`, `${S3_PREFIX}/source/`] : ["clips/", "source/"]);
  return prefixes.some((prefix) => key.startsWith(prefix));
}

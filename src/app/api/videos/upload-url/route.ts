import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3, isS3Configured, sourceKey, S3_BUCKET } from "@/lib/s3";

/**
 * Hands the browser a short-lived URL it can PUT the original match video to.
 * Started the moment analysis begins so the full file is already archived by
 * the time the AI passes finish, in parallel rather than after the fact.
 */
export async function POST(request: Request) {
  if (!isS3Configured()) {
    return NextResponse.json({ error: "Video storage is not configured." }, { status: 503 });
  }

  const { matchKey, filename, contentType } = await request.json();
  if (!matchKey || !filename) {
    return NextResponse.json({ error: "matchKey and filename are required." }, { status: 400 });
  }

  const key = sourceKey(String(matchKey), String(filename));
  const url = await getSignedUrl(
    getS3(),
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType || "video/mp4",
    }),
    // A full match video can take a while to upload on a slow connection, so this
    // window is longer than the one given to individual clips.
    { expiresIn: 3600 }
  );

  return NextResponse.json({ key, url });
}

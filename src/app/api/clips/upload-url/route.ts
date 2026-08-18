import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { clipKey, getS3, isS3Configured, S3_BUCKET } from "@/lib/s3";

/** Hands the browser a short-lived URL it can PUT one clip to. */
export async function POST(request: Request) {
  if (!isS3Configured()) {
    return NextResponse.json({ error: "Clip storage is not configured." }, { status: 503 });
  }

  const { matchKey, clipId, contentType } = await request.json();
  if (!matchKey || !clipId) {
    return NextResponse.json({ error: "matchKey and clipId are required." }, { status: 400 });
  }

  const key = clipKey(String(matchKey), String(clipId));
  const url = await getSignedUrl(
    getS3(),
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType || "video/mp4",
    }),
    { expiresIn: 900 }
  );

  return NextResponse.json({ key, url });
}

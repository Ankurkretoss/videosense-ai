import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3, isOwnedKey, isS3Configured, S3_BUCKET } from "@/lib/s3";

/** Redirects to a short-lived download URL for a stored clip or source video. */
export async function GET(request: Request) {
  if (!isS3Configured()) {
    return NextResponse.json({ error: "Clip storage is not configured." }, { status: 503 });
  }

  const key = new URL(request.url).searchParams.get("key");
  if (!key || !isOwnedKey(key)) {
    return NextResponse.json({ error: "Unknown clip." }, { status: 400 });
  }

  const url = await getSignedUrl(getS3(), new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }), {
    expiresIn: 3600,
  });

  return NextResponse.redirect(url, 307);
}

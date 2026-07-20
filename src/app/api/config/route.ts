import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ configured: false, provider: null }, { status: 200 });
  }

  return NextResponse.json({
    configured: true,
    provider: "gemini",
    apiKey: apiKey,
  });
}

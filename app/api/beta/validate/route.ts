import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ valid: false });
  }

  const expected = process.env.BETA_GATE_PASSWORD;
  if (!expected) {
    console.error("BETA_GATE_PASSWORD env var is not set");
    return NextResponse.json({ valid: false }, { status: 500 });
  }

  const provided = code.trim();
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  if (providedBuf.length !== expectedBuf.length) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: timingSafeEqual(providedBuf, expectedBuf) });
}

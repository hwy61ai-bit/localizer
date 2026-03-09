import { NextResponse } from "next/server";
import { parseTourSchedule } from "@/lib/parseImport";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a tour schedule with at least some content." },
        { status: 400 }
      );
    }

    const result = await parseTourSchedule(text.trim());

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

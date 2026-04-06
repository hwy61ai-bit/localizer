import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function POST(req: NextRequest) {
  const access = await requireTourRouterAccess();
  if (!access.ok) return tourRouterAccessErrorResponse(access);

  const csvText = await req.text();
  if (!csvText.trim()) return NextResponse.json({ error: "Empty CSV" }, { status: 400 });

  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return NextResponse.json({ error: "CSV parse failed", details: result.errors }, { status: 400 });
  }

  return NextResponse.json({
    headers: result.meta.fields ?? [],
    rows: result.data,
    rowCount: result.data.length,
    errors: result.errors.length > 0 ? result.errors : undefined,
  });
}

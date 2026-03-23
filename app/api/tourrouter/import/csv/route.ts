import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import Papa from "papaparse";

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

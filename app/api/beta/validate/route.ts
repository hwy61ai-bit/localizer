import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ valid: false });
  }

  const { data } = await supabase
    .from("beta_invites")
    .select("id")
    .ilike("code", code.trim())
    .is("claimed_by", null)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ valid: !!data });
}

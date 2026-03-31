import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { code, userId } = await req.json();
  if (!code || !userId) {
    return NextResponse.json({ error: "Missing code or userId" }, { status: 400 });
  }

  const { data: invite } = await supabase
    .from("beta_invites")
    .select("id")
    .ilike("code", code.trim())
    .is("claimed_by", null)
    .limit(1)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ error: "Invalid or already claimed code" }, { status: 400 });
  }

  const { error } = await supabase
    .from("beta_invites")
    .update({ claimed_by: userId, claimed_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ claimed: true });
}

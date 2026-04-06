import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(_req: NextRequest) {
  const result = await requireTourRouterAccess({ skipBillingGate: true });
  if (!result.ok) return tourRouterAccessErrorResponse(result);

  const supabase = await supabaseServer();
  const { data: org } = await supabase
    .from("orgs")
    .select("stripe_customer_id")
    .eq("id", result.orgId)
    .single();

  if (!org?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/routing`,
  });

  return NextResponse.json({ url: session.url });
}

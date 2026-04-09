import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);

  const supabase = await supabaseServer();
  const { data: org } = await supabase
    .from("orgs")
    .select("stripe_customer_id, plan")
    .eq("id", result.orgId)
    .single();

  const { plan } = await req.json();

  // Determine price ID based on plan type
  let priceId: string | undefined;
  if (plan === "standalone") {
    priceId = process.env.STRIPE_PRICE_TOURROUTER_STANDALONE;
  } else if (plan === "addon") {
    // Check if org has an agency plan
    const isAgency = org?.plan === "agency";
    priceId = isAgency
      ? process.env.STRIPE_PRICE_TOURROUTER_ADDON_AGENCY
      : process.env.STRIPE_PRICE_TOURROUTER_ADDON;
  }

  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan or price not configured" }, { status: 400 });
  }

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/routing?billing=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/routing?billing=cancelled`,
    };

    // If org already has a Stripe customer, attach to it
    if (org?.stripe_customer_id) {
      sessionParams.customer = org.stripe_customer_id;
    } else {
      sessionParams.customer_email = result.userEmail || undefined;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

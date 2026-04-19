import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function planFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_ID_AGENCY) return "agency";
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return "pro";
  return "starter";
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check — ignore already-processed events
  const { data: existing } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existing) {
    console.log("Duplicate Stripe event ignored:", event.id);
    return NextResponse.json({ received: true });
  }

  // Mark event as processed
  await supabase.from("stripe_events").insert({ id: event.id });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = session.customer as string;
    const customerEmail = session.customer_details?.email ?? session.customer_email ?? null;
    const subscriptionId = session.subscription as string;

    let plan = "starter";
    if (subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = sub.items.data[0]?.price.id ?? "";
      plan = planFromPriceId(priceId);
    }

    if (customerEmail) {
      await supabase
        .from("orgs")
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan,
          plan_status: "active",
        })
        .eq("owner_email", customerEmail);
    }

    await resend.emails.send({
      from: "HWY61 Labs <noreply@hwy61labs.com>",
      to: "hwy61ai@gmail.com",
      subject: `New Localizer customer — ${plan.toUpperCase()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #0a0a0a; border-radius: 12px;">
          <h2 style="color: #fff; margin: 0 0 16px 0;">New Customer</h2>
          <p style="color: #888; font-size: 14px; margin: 0 0 8px 0;"><strong style="color:#fff">Email:</strong> ${customerEmail ?? "unknown"}</p>
          <p style="color: #888; font-size: 14px; margin: 0 0 8px 0;"><strong style="color:#fff">Plan:</strong> ${plan.toUpperCase()}</p>
          <p style="color: #888; font-size: 14px; margin: 0 0 8px 0;"><strong style="color:#fff">Stripe Customer ID:</strong> ${customerId}</p>
        </div>
      `,
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    await supabase
      .from("orgs")
      .update({ plan: "free", plan_status: "cancelled" })
      .eq("stripe_customer_id", customerId);
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    const priceId = sub.items.data[0]?.price.id ?? "";
    const plan = planFromPriceId(priceId);
    const plan_status = sub.status === "active" ? "active" : "past_due";
    await supabase
      .from("orgs")
      .update({ plan, plan_status })
      .eq("stripe_customer_id", customerId);
  }

  return NextResponse.json({ received: true });
}

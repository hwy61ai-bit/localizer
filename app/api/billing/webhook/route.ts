import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { tierFromPriceId } from "@/lib/stripe/localizerPrices";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Map Stripe subscription status to our internal localizer_plan_status value.
 * lib/localizer/billingGate.ts treats 'active' and 'past_due' as paid.
 * Mapping 'trialing' to 'active' so trialing customers get product access
 * (Stripe semantically treats trialing as entitled). If a trial-countdown
 * UI is added later, store trial_end on org separately — don't split this status.
 */
function mapSubStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    case "paused":
      return "paused";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    default:
      return stripeStatus;
  }
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

  // Idempotency check
  const { data: existing } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existing) {
    console.log("Duplicate Stripe event ignored:", event.id);
    return NextResponse.json({ received: true });
  }

  await supabase.from("stripe_events").insert({ id: event.id });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = session.customer as string;
    const customerEmail = session.customer_details?.email ?? session.customer_email ?? null;
    const subscriptionId = session.subscription as string;

    let tier: string | null = null;
    let subStatus: Stripe.Subscription.Status | null = null;
    if (subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = sub.items.data[0]?.price.id ?? "";
      tier = tierFromPriceId(priceId);
      subStatus = sub.status;
      if (!tier) {
        console.warn(
          `Webhook checkout.session.completed: unknown priceId ${priceId} for customer ${customerId}. localizer_plan not updated.`
        );
      }
    }

    if (customerEmail) {
      const update: Record<string, string> = {
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      };
      if (tier) {
        update.localizer_plan = tier;
        update.localizer_plan_status = subStatus ? mapSubStatus(subStatus) : "active";
      }

      const { data: updated, error: updateErr } = await supabase
        .from("orgs")
        .update(update)
        .eq("owner_email", customerEmail)
        .select();

      if (updateErr) {
        console.error("Webhook checkout.session.completed: orgs update failed:", updateErr);
      } else if (!updated || updated.length === 0) {
        console.warn(
          `Webhook checkout.session.completed: orgs update affected 0 rows for owner_email=${customerEmail}.`
        );
      }
    } else {
      console.warn(
        `Webhook checkout.session.completed: no customer email on session ${session.id}. Org not updated.`
      );
    }

    await resend.emails.send({
      from: "HWY61 Labs <noreply@hwy61labs.com>",
      to: "hwy61ai@gmail.com",
      subject: `New Localizer customer — ${(tier ?? "unknown").toUpperCase()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #0a0a0a; border-radius: 12px;">
          <h2 style="color: #fff; margin: 0 0 16px 0;">New Customer</h2>
          <p style="color: #888; font-size: 14px; margin: 0 0 8px 0;"><strong style="color:#fff">Email:</strong> ${customerEmail ?? "unknown"}</p>
          <p style="color: #888; font-size: 14px; margin: 0 0 8px 0;"><strong style="color:#fff">Plan:</strong> ${(tier ?? "unknown").toUpperCase()}</p>
          <p style="color: #888; font-size: 14px; margin: 0 0 8px 0;"><strong style="color:#fff">Stripe Customer ID:</strong> ${customerId}</p>
        </div>
      `,
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    const { data: updated, error } = await supabase
      .from("orgs")
      .update({ localizer_plan_status: "canceled" })
      .eq("stripe_customer_id", customerId)
      .select();
    if (error) {
      console.error("Webhook customer.subscription.deleted: orgs update failed:", error);
    } else if (!updated || updated.length === 0) {
      console.warn(
        `Webhook customer.subscription.deleted: orgs update affected 0 rows for stripe_customer_id=${customerId}.`
      );
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    const priceId = sub.items.data[0]?.price.id ?? "";
    const tier = tierFromPriceId(priceId);
    const localizer_plan_status = mapSubStatus(sub.status);

    const update: Record<string, string> = { localizer_plan_status };
    if (tier) {
      update.localizer_plan = tier;
    } else {
      console.warn(
        `Webhook customer.subscription.updated: unknown priceId ${priceId} for customer ${customerId}. localizer_plan_status updated, localizer_plan field skipped.`
      );
    }

    const { data: updated, error } = await supabase
      .from("orgs")
      .update(update)
      .eq("stripe_customer_id", customerId)
      .select();
    if (error) {
      console.error("Webhook customer.subscription.updated: orgs update failed:", error);
    } else if (!updated || updated.length === 0) {
      console.warn(
        `Webhook customer.subscription.updated: orgs update affected 0 rows for stripe_customer_id=${customerId}.`
      );
    }
  }

  return NextResponse.json({ received: true });
}

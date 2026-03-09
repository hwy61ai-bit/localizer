import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      const customerEmail = session.customer_details?.email;

      if (customerEmail) {
        await supabase
          .from("orgs")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
          })
          .eq("owner_email", customerEmail);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("orgs")
        .update({ subscription_status: sub.status })
        .eq("stripe_subscription_id", sub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("orgs")
        .update({ subscription_status: "canceled" })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

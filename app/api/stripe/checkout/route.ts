import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isLocalizerPriceId } from "@/lib/stripe/localizerPrices";

export async function POST(request: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: "Missing price ID." }, { status: 400 });
    }

    if (!isLocalizerPriceId(priceId)) {
      return NextResponse.json({ error: "Invalid priceId" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

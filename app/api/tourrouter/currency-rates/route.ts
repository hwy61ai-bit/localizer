import { NextResponse } from "next/server";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function GET() {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);

  try {
    const resp = await fetch("https://api.frankfurter.app/latest?base=USD");
    if (!resp.ok) {
      return NextResponse.json({ error: "Frankfurter API error" }, { status: 502 });
    }

    const data = await resp.json();
    // v35 inverts rates: multiply foreign amount by rate to get USD
    // Frankfurter returns: 1 USD = X foreign, so rate = 1/X
    const rates: Record<string, number> = {};
    for (const [currency, value] of Object.entries(data.rates)) {
      rates[currency] = 1 / (value as number);
    }

    return NextResponse.json({ rates, date: data.date });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch rates", details: msg }, { status: 500 });
  }
}

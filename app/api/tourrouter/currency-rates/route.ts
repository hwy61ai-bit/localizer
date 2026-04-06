import { NextResponse } from "next/server";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";
import { fetchLiveRates } from "@/lib/tourrouter/fetchLiveRates";

export async function GET() {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);

  const rates = await fetchLiveRates();
  if (Object.keys(rates).length === 0) {
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 502 });
  }
  return NextResponse.json({ rates });
}

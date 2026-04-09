import { NextRequest, NextResponse } from "next/server";
import { getExportData, fmtUSD, formatDateDisplay } from "../helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  const result = await getExportData(tourId);
  if (!result.ok) {
    const statusMap = { unauthorized: 401, no_org: 403, export_requires_paid: 402, not_found: 404 } as const;
    return NextResponse.json({ error: result.reason, detail: result.detail }, { status: statusMap[result.reason] });
  }
  const data = result.data;

  const { rows, fin, tourName } = data;
  const lines: (string | number)[][] = [];

  lines.push(["TOURROUTER \u2014 Tour Financial Summary", ""]);
  lines.push(["Generated", new Date().toLocaleDateString()]);
  lines.push(["Tour Span", fin.firstDate ? formatDateDisplay(fin.firstDate) + " \u2013 " + formatDateDisplay(fin.lastDate) : ""]);
  lines.push(["Total Shows", fin.showDayCount]);
  lines.push(["Total Income", fmtUSD(fin.totalIncome)]);
  lines.push(["Total Fuel", fmtUSD(fin.totalFuel)]);
  lines.push(["Total Flights", fmtUSD(fin.totalFlights)]);
  if (fin.totalBlanketShow) lines.push([fin.blanketShowLabel, fmtUSD(fin.totalBlanketShow)]);
  if (fin.totalBlanketOff) lines.push([fin.blanketOffLabel, fmtUSD(fin.totalBlanketOff)]);
  lines.push(["Total Expenses", fmtUSD(fin.totalExpenses)]);
  lines.push(["Net Income", fmtUSD(fin.netIncome)]);
  lines.push(["Margin", fin.margin.toFixed(1) + "%"]);
  lines.push([]);
  lines.push(["#", "Date", "Event", "City", "Country", "Venue", "Offer", "USD", "Status", "Capacity", "Doors", "Showtime", "Merch", "Fuel", "Flights", "Other Exp"]);

  rows.forEach((r) => {
    lines.push([
      r.num, r.date, r.event, r.city, r.country, r.venue, r.offer,
      r.usd ? Math.round(r.usd) : "", r.status, r.capacity || "",
      r.doors || "", r.showtime || "", r.merch || "",
      r.fuelCost ? Math.round(r.fuelCost) : "",
      r.flightCost ? Math.round(r.flightCost) : "",
      r.manualExp || "",
    ]);
  });

  lines.push([
    "TOTAL", "", "", "", "", "", "",
    Math.round(fin.totalIncome), "", "", "", "", "",
    Math.round(fin.totalFuel), Math.round(fin.totalFlights), Math.round(fin.totalManual),
  ]);

  const csv = lines
    .map((row) => Array.isArray(row) ? row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",") : "")
    .join("\n");

  const filename = `${tourName.replace(/[^a-zA-Z0-9]/g, "_")}_route.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

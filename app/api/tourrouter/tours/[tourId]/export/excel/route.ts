import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  getExportData,
  fmtUSD,
  fmtHours,
  formatDateDisplay,
  getRoadKm,
  estimateDriveHours,
  buildDriveDataKey,
} from "../helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  const result = await getExportData(tourId);
  if (!result.ok) {
    const statusMap = { unauthorized: 401, no_org: 403, subscription_required: 403, not_found: 404 } as const;
    return NextResponse.json({ error: result.reason, detail: result.detail }, { status: statusMap[result.reason] });
  }
  const data = result.data;

  const { rows, fin, tourName, shows, legChoices, driveData } = data;
  const wb = XLSX.utils.book_new();

  // Sheet 1: Budget Summary
  const summaryData = [
    ["TOURROUTER \u2014 Budget Summary"],
    ["Generated", new Date().toLocaleDateString()],
    ["Tour Span", fin.firstDate ? formatDateDisplay(fin.firstDate) + " \u2013 " + formatDateDisplay(fin.lastDate) : ""],
    [],
    ["INCOME"],
    ["Total Guarantee", fin.totalIncome],
    ["Average Per Show", fin.avgPerShow],
    ["Total Shows", fin.showDayCount],
    [],
    ["EXPENSES"],
    ["Fuel", fin.totalFuel],
    ["Flights", fin.totalFlights],
    [fin.blanketShowLabel || "Band Pay", fin.totalBlanketShow],
    [fin.blanketOffLabel || "Hotel + Per Diem", fin.totalBlanketOff],
    ["Other", fin.totalManual],
    ["Total Expenses", fin.totalExpenses],
    [],
    ["NET INCOME", fin.netIncome],
    ["Margin", fin.margin / 100],
    [],
    ["SHOW DETAIL"],
    ["#", "Date", "Event", "City", "Country", "Venue", "Offer", "USD", "Status", "Fuel", "Flights"],
    ...rows.map((r) => [r.num, r.date, r.event, r.city, r.country, r.venue, r.offer, r.usd || 0, r.status, r.fuelCost, r.flightCost]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Budget Summary");

  // Sheet 2: Tour Route
  const routeData = [
    ["TOURROUTER \u2014 Tour Route"],
    [fin.showDayCount + " shows \u00b7 " + fin.spanDays + " days \u00b7 " + (fin.imperialTour ? Math.round(fin.totalKm * 0.6214) + " mi" : Math.round(fin.totalKm) + " km")],
    [],
    ["#", "Date", "Event", "City", "Country", "Venue", "Offer", "USD", "Status", "Capacity", "Doors", "Showtime", "Merch"],
    ...rows.map((r) => [r.num, r.date, r.event, r.city, r.country, r.venue, r.offer, r.usd || 0, r.status, r.capacity, r.doors || "", r.showtime || "", r.merch || ""]),
    ["TOTAL", "", "", "", "", "", "", fin.totalIncome, "", fin.totalCapacity],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(routeData), "Tour Route");

  // Sheet 3: Routing Flags
  const flagData: (string | number)[][] = [
    ["TOURROUTER \u2014 Routing Flags"],
    ["Legs flagged as potentially brutal (>4h drive)"],
    [],
    ["From", "To", "Drive Time", "Distance", "Flag"],
  ];
  shows.forEach((s, i) => {
    if (i === 0) return;
    const prev = shows[i - 1];
    const driveKey = buildDriveDataKey(prev.city as string, s.city as string);
    const cached = driveData[driveKey];
    const km = cached ? cached.distanceKm : getRoadKm(prev.city as string, prev.country as string, s.city as string, s.country as string);
    const h = cached ? cached.driveHours : (km ? estimateDriveHours(km) : null);
    const flying = legChoices[i] === "fly";
    if (flying) {
      flagData.push([prev.city as string, s.city as string, "FLY", "\u2014", "FLIGHT"]);
    } else if (h && h > 4) {
      const flag = h > 6 ? "BRUTAL" : "LONG";
      flagData.push([prev.city as string, s.city as string, fmtHours(h), km ? Math.round(km * 0.6214) + " mi" : "\u2014", flag]);
    }
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(flagData), "Routing Flags");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `${tourName.replace(/[^a-zA-Z0-9]/g, "_")}_route.xlsx`;
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

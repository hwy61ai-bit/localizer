import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import {
  getExportData,
  fmtUSD,
  fmtHours,
  fmtDist,
  formatDateDisplay,
  getRoadKm,
  estimateDriveHours,
  legCountry,
  buildDriveDataKey,
} from "../helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  try {
  const result = await getExportData(tourId);
  if (!result.ok) {
    const statusMap = { unauthorized: 401, no_org: 403, export_requires_paid: 402, not_found: 404 } as const;
    return NextResponse.json({ error: result.reason, detail: result.detail }, { status: statusMap[result.reason] });
  }
  const data = result.data;

  const { rows, fin, tourName, shows, legChoices, driveData } = data;

  // Build PDF in memory
  const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const W = 841.89; // A4 landscape width in points
  const H = 595.28; // A4 landscape height

  // ── PAGE 1: Financial Overview ──

  // Header bar
  doc.rect(0, 0, W, 60).fill("#1a1a18");
  doc.font("Helvetica-Bold").fontSize(18).fillColor("#ffffff").text("TOURROUTER", 40, 18);
  doc.font("Helvetica").fontSize(9).fillColor("#aaaaaa").text("Tour Routing & Budget Tracker", 40, 40);

  // Summary band
  doc.rect(0, 60, W, 35).fill("#f0f0ec");
  const summaryParts: string[] = [];
  if (fin.firstDate) summaryParts.push(formatDateDisplay(fin.firstDate) + " \u2013 " + formatDateDisplay(fin.lastDate));
  summaryParts.push(fin.spanDays + " days");
  summaryParts.push(fin.showDayCount + " shows");
  doc.font("Helvetica").fontSize(9).fillColor("#1a1a18").text(summaryParts.join("  \u00b7  "), 40, 73);

  // Three big boxes
  const boxY = 110;
  const boxW = (W - 80 - 32) / 3;
  const boxes = [
    { label: "TOTAL INCOME", value: fmtUSD(fin.totalIncome), sub: fin.showDayCount + " shows \u00b7 avg " + fmtUSD(fin.avgPerShow), color: "#1a6b3c" },
    { label: "TOTAL EXPENSES", value: fmtUSD(fin.totalExpenses), sub: "Fuel + " + fin.blanketShowLabel + " + Other", color: "#c0392b" },
    { label: "NET INCOME", value: fmtUSD(fin.netIncome), sub: fin.margin.toFixed(1) + "% margin", color: fin.netIncome >= 0 ? "#1a5fa6" : "#c0392b" },
  ];
  boxes.forEach((b, i) => {
    const bx = 40 + i * (boxW + 16);
    doc.roundedRect(bx, boxY, boxW, 80, 6).fill(b.color);
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff").text(b.label, bx + 12, boxY + 14, { width: boxW - 24 });
    doc.font("Helvetica-Bold").fontSize(22).fillColor("#ffffff").text(b.value, bx + 12, boxY + 30, { width: boxW - 24 });
    doc.font("Helvetica").fontSize(8).fillColor("#dddddd").text(b.sub, bx + 12, boxY + 58, { width: boxW - 24 });
  });

  // Expense breakdown
  let ey = boxY + 100;
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#1a1a18").text("EXPENSE BREAKDOWN", 40, ey);
  ey += 18;

  const expItems: [string, string][] = [];
  if (fin.totalFuel) expItems.push(["Fuel", fmtUSD(fin.totalFuel)]);
  if (fin.totalFlights) expItems.push(["Flights (" + fin.flightLegs + " legs)", fmtUSD(fin.totalFlights)]);
  if (fin.totalBlanketShow) expItems.push([fin.blanketShowLabel + " (" + fin.showDayCount + " shows)", fmtUSD(fin.totalBlanketShow)]);
  if (fin.totalBlanketOff) expItems.push([fin.blanketOffLabel + " (" + fin.offDayCount + " off days)", fmtUSD(fin.totalBlanketOff)]);
  if (fin.totalManual) expItems.push(["Other Expenses", fmtUSD(fin.totalManual)]);

  expItems.forEach(([label, amount]) => {
    doc.font("Helvetica").fontSize(9).fillColor("#666666").text(label, 50, ey, { width: 300 });
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#1a1a18").text(amount, 350, ey, { width: 100, align: "right" });
    ey += 16;
  });

  // Footer
  doc.font("Helvetica").fontSize(7).fillColor("#888888").text("TOURROUTER \u00b7 Tour Routing & Budget Tracker", 40, H - 30);
  doc.text("Page 1 of 3", W - 120, H - 30, { align: "right", width: 80 });

  // ── PAGE 2: Show Schedule ──
  doc.addPage();
  doc.rect(0, 0, W, 50).fill("#1a1a18");
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#ffffff").text("SHOW SCHEDULE", 40, 18);

  // Table header
  let ty = 65;
  const cols = [
    { label: "#", w: 25 }, { label: "Date", w: 90 }, { label: "Event", w: 140 },
    { label: "City", w: 80 }, { label: "Country", w: 60 }, { label: "Venue", w: 120 },
    { label: "Offer", w: 70 }, { label: "USD", w: 60 }, { label: "Status", w: 60 }, { label: "Cap", w: 45 },
  ];

  // Header row
  doc.rect(40, ty, W - 80, 18).fill("#f0f0ec");
  let cx = 44;
  cols.forEach((col) => {
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#888888").text(col.label, cx, ty + 5, { width: col.w });
    cx += col.w;
  });
  ty += 20;

  // Data rows
  rows.forEach((r) => {
    if (ty > H - 50) { doc.addPage(); ty = 40; }
    const isOff = r.isOff;
    cx = 44;
    const rowColor = isOff ? "#aaaaaa" : "#1a1a18";
    doc.font("Helvetica").fontSize(8).fillColor(rowColor);
    const vals = [
      String(r.num), r.date, r.event, r.city, r.country, r.venue,
      r.offer || "\u2014", r.usd ? fmtUSD(r.usd) : "\u2014", r.status || "\u2014",
      r.capacity ? r.capacity.toLocaleString() : "\u2014",
    ];
    cols.forEach((col, ci) => {
      const fontWeight = ci === 7 && !isOff ? "Helvetica-Bold" : "Helvetica";
      doc.font(fontWeight).text(vals[ci] || "", cx, ty, { width: col.w, lineBreak: false });
      cx += col.w;
    });
    ty += 14;
  });

  // Totals
  if (ty > H - 50) { doc.addPage(); ty = 40; }
  doc.rect(40, ty, W - 80, 18).fill("#1a6b3c");
  cx = 44;
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff");
  doc.text("TOTAL", cx, ty + 5, { width: cols[0].w + cols[1].w + cols[2].w });
  cx = 44 + cols.slice(0, 7).reduce((s, c) => s + c.w, 0);
  doc.text(fmtUSD(fin.totalIncome), cx, ty + 5, { width: cols[7].w });

  // Footer
  doc.font("Helvetica").fontSize(7).fillColor("#888888").text("TOURROUTER \u00b7 Tour Routing & Budget Tracker", 40, H - 30);
  doc.text("Page 2 of 3", W - 120, H - 30, { align: "right", width: 80 });

  // ── PAGE 3: Routing Detail ──
  doc.addPage();
  doc.rect(0, 0, W, 50).fill("#1a1a18");
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#ffffff").text("ROUTING DETAIL", 40, 18);

  ty = 65;
  const rCols = [
    { label: "Leg", w: 220 }, { label: "Drive Time", w: 80 },
    { label: "Distance", w: 80 }, { label: "Fuel Cost", w: 80 }, { label: "Flag", w: 80 },
  ];

  doc.rect(40, ty, W - 80, 18).fill("#f0f0ec");
  cx = 44;
  rCols.forEach((col) => {
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#888888").text(col.label, cx, ty + 5, { width: col.w });
    cx += col.w;
  });
  ty += 20;

  shows.forEach((s, i) => {
    if (i === 0) return;
    if (ty > H - 50) { doc.addPage(); ty = 40; }
    const prev = shows[i - 1];
    const driveKey = buildDriveDataKey(prev.city as string, s.city as string);
    const cached = driveData[driveKey];
    const km = cached ? cached.distanceKm : getRoadKm(prev.city as string, prev.country as string, s.city as string, s.country as string);
    const driveH = cached ? cached.driveHours : (km ? estimateDriveHours(km) : null);
    const flying = legChoices[i] === "fly";
    const legCtry = legCountry(prev.country as string, s.country as string);
    const distStr = km ? fmtDist(km, legCtry === "usa" ? "usa" : "europe") : "\u2014";

    let flag = "\u2014";
    let flagColor = "#888888";
    if (flying) { flag = "FLIGHT"; flagColor = "#1a5fa6"; }
    else if (driveH && driveH > 6) { flag = "BRUTAL"; flagColor = "#c0392b"; }
    else if (driveH && driveH > 4) { flag = "LONG"; flagColor = "#b35c00"; }
    else if (driveH) { flag = "OK"; flagColor = "#1a6b3c"; }

    cx = 44;
    doc.font("Helvetica").fontSize(8).fillColor("#1a1a18");
    doc.text((prev.city as string) + " \u2192 " + (s.city as string), cx, ty, { width: rCols[0].w, lineBreak: false });
    cx += rCols[0].w;
    doc.text(flying ? "FLY" : (driveH ? fmtHours(driveH) : "\u2014"), cx, ty, { width: rCols[1].w });
    cx += rCols[1].w;
    doc.text(distStr, cx, ty, { width: rCols[2].w });
    cx += rCols[2].w;
    const fuelCost = rows[i]?.fuelCost || 0;
    doc.text(fuelCost ? fmtUSD(fuelCost) : (flying ? "Flight" : "\u2014"), cx, ty, { width: rCols[3].w });
    cx += rCols[3].w;
    doc.font("Helvetica-Bold").fillColor(flagColor).text(flag, cx, ty, { width: rCols[4].w });
    ty += 14;
  });

  // Totals
  if (ty > H - 50) { doc.addPage(); ty = 40; }
  doc.rect(40, ty, W - 80, 18).fill("#b35c00");
  cx = 44;
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff");
  doc.text("TOTALS", cx, ty + 5, { width: rCols[0].w });
  cx += rCols[0].w + rCols[1].w;
  doc.text(fin.imperialTour ? Math.round(fin.totalKm * 0.6214) + " mi" : Math.round(fin.totalKm) + " km", cx, ty + 5, { width: rCols[2].w });
  cx += rCols[2].w;
  doc.text(fmtUSD(fin.totalFuel), cx, ty + 5, { width: rCols[3].w });

  // Footer
  doc.font("Helvetica").fontSize(7).fillColor("#888888").text("TOURROUTER \u00b7 Tour Routing & Budget Tracker", 40, H - 30);
  doc.text("Page 3 of 3", W - 120, H - 30, { align: "right", width: 80 });

  doc.end();

  // Collect all chunks
  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const filename = `${tourName.replace(/[^a-zA-Z0-9]/g, "_")}_route.pdf`;
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
  } catch (e) {
    console.error("[PDF Export] Error:", e instanceof Error ? e.message : e, e instanceof Error ? e.stack : "");
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}

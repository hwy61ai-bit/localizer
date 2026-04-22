import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import {
  getExportData,
  formatDateDisplay,
  getRoadKm,
  estimateDriveHours,
  fmtHours,
  fmtDist,
  legCountry,
  buildDriveDataKey,
} from "../helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  try {
  const result = await getExportData(tourId);
  if (!result.ok) {
    const statusMap = { unauthorized: 401, no_org: 403, no_tourrouter_access: 403, export_requires_paid: 402, not_found: 404 } as const;
    return NextResponse.json({ error: result.reason, detail: result.detail }, { status: statusMap[result.reason] });
  }
  const data = result.data;

  const { shows, tourName, tour, driveData } = data;
  const showId = req.nextUrl.searchParams.get("showId");
  const artistName = (tour as Record<string, unknown>).artist_id
    ? ((tour as Record<string, unknown>).artists as Record<string, unknown>)?.name as string || ""
    : "";

  // Filter shows
  type Show = Record<string, unknown>;
  let targetShows: Show[] = shows as Show[];
  if (showId) {
    targetShows = targetShows.filter((s) => s.id === showId);
    if (targetShows.length === 0) return NextResponse.json({ error: "Show not found" }, { status: 404 });
  } else {
    targetShows = targetShows.filter((s) => !s.is_off);
  }

  // Build PDF
  const doc = new PDFDocument({ size: "LETTER", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const W = 612; // US Letter width in points
  const M = 50;  // margin
  const CW = W - M * 2; // content width

  targetShows.forEach((show, pageIdx) => {
    if (pageIdx > 0) doc.addPage();

    let y = M;

    // ── Helper functions ──
    function sectionTitle(title: string) {
      y += 6;
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#888888")
        .text(title.toUpperCase(), M, y, { width: CW });
      y += 14;
      doc.moveTo(M, y - 2).lineTo(W - M, y - 2).lineWidth(0.5).strokeColor("#DDDDDD").stroke();
    }

    function field(label: string, value: string | null | undefined, opts?: { halfWidth?: boolean; x?: number }) {
      if (!value) return;
      const x = opts?.x ?? M;
      const w = opts?.halfWidth ? CW / 2 - 5 : CW;
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#888888").text(label, x, y, { width: w, lineBreak: false });
      y += 11;
      doc.font("Helvetica").fontSize(10).fillColor("#111111").text(String(value), x, y, { width: w });
      y += 14;
    }

    function fieldRow(pairs: [string, string | null | undefined][]) {
      const filtered = pairs.filter(([, v]) => v);
      if (filtered.length === 0) return;
      const startY = y;
      const colW = CW / filtered.length - 5;
      filtered.forEach(([label, value], i) => {
        const x = M + i * (CW / filtered.length);
        y = startY;
        doc.font("Helvetica-Bold").fontSize(8).fillColor("#888888").text(label, x, y, { width: colW, lineBreak: false });
        doc.font("Helvetica").fontSize(10).fillColor("#111111").text(String(value), x, y + 11, { width: colW, lineBreak: false });
      });
      y = startY + 28;
    }

    // ── HEADER ──
    doc.font("Helvetica-Bold").fontSize(22).fillColor("#111111")
      .text("DAY SHEET", M, y, { width: CW, align: "center" });
    y += 28;

    // Tour + artist + date line
    const dateStr = show.date_iso ? formatDateDisplay(new Date(show.date_iso as string + "T00:00:00")) : "";
    const headerParts = [tourName.toUpperCase(), artistName, dateStr].filter(Boolean);
    doc.font("Helvetica").fontSize(10).fillColor("#888888")
      .text(headerParts.join("  \u00b7  "), M, y, { width: CW, align: "center" });
    y += 20;

    // Divider
    doc.moveTo(M, y).lineTo(W - M, y).lineWidth(1).strokeColor("#111111").stroke();
    y += 8;

    // ── VENUE ──
    sectionTitle("Venue");
    field("Venue", show.venue as string);
    fieldRow([
      ["Address", show.venue_address as string],
      ["City", [show.city, show.country].filter(Boolean).join(", ")],
    ]);
    fieldRow([
      ["Capacity", show.capacity ? String(show.capacity) : null],
      ["Age Limit", show.age_limit as string],
      ["Billing", show.billing as string],
    ]);

    // ── SCHEDULE ──
    sectionTitle("Schedule");
    const schedPairs: [string, string | null | undefined][] = [
      ["Load In", show.load_in_time as string],
      ["Doors", show.doors as string],
      ["Showtime", show.showtime as string],
      ["Onstage", show.onstage as string],
      ["Curfew", show.curfew as string],
    ];
    fieldRow(schedPairs.filter(([, v]) => v) as [string, string][]);

    // ── TRAVEL ──
    const showIdx = (shows as Show[]).indexOf(show);
    if (showIdx > 0) {
      const prev = (shows as Show[])[showIdx - 1];
      const driveKey = buildDriveDataKey(prev.city as string, show.city as string);
      const cachedDrive = driveData[driveKey];
      const km = cachedDrive ? cachedDrive.distanceKm : getRoadKm(prev.city as string, prev.country as string, show.city as string, show.country as string);
      const driveH = cachedDrive ? cachedDrive.driveHours : (km ? estimateDriveHours(km) : null);
      const lc = legCountry(prev.country as string, show.country as string);
      const dist = km ? fmtDist(km, lc === "usa" ? "usa" : "europe") : null;

      sectionTitle("Travel");
      const fromCity = prev.city || "Previous";
      const toCity = show.city || "Here";
      doc.font("Helvetica").fontSize(10).fillColor("#111111")
        .text(`${fromCity} \u2192 ${toCity}`, M, y, { width: CW });
      y += 14;
      if (driveH || dist) {
        fieldRow([
          ["Distance", dist],
          ["Drive Time", driveH ? fmtHours(driveH) : null],
        ]);
      }
    }

    // ── HOTEL ──
    if (show.hotel_name) {
      sectionTitle("Hotel");
      field("Hotel", show.hotel_name as string);
      if (show.hotel_address) field("Address", show.hotel_address as string);
      fieldRow([
        ["Check-in", show.hotel_checkin as string],
        ["Check-out", show.hotel_checkout as string],
        ["Rooms", show.hotel_rooms ? String(show.hotel_rooms) : null],
        ["Confirmation", show.hotel_confirmation as string],
      ]);
    }

    // ── CONTACTS ──
    const hasContacts = show.promoter || show.promoter_contact || show.production_contact;
    if (hasContacts) {
      sectionTitle("Contacts");
      fieldRow([
        ["Promoter", show.promoter as string],
        ["Promoter Contact", show.promoter_contact as string],
      ]);
      fieldRow([
        ["Production", show.production_contact as string],
        ["Production Phone", show.production_contact_phone as string],
      ]);
    }

    // ── NOTES ──
    const hasNotes = show.hospitality_notes || show.backline_notes || show.notes;
    if (hasNotes) {
      sectionTitle("Notes");
      if (show.hospitality_notes) field("Hospitality", show.hospitality_notes as string);
      if (show.backline_notes) field("Backline", show.backline_notes as string);
      if (show.notes) field("General", show.notes as string);
    }

    // ── FOOTER ──
    doc.font("Helvetica").fontSize(7).fillColor("#AAAAAA")
      .text("Generated by HWY61 TourRouter", M, 742 - M, { width: CW, align: "center" });
  });

  doc.end();

  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const filename = showId
    ? `daysheet-${targetShows[0]?.city || "show"}.pdf`
    : `daysheets-${tourName.toLowerCase().replace(/\s+/g, "-")}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
  } catch (e) {
    console.error("[DaySheet Export] Error:", e instanceof Error ? e.message : e, e instanceof Error ? e.stack : "");
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}

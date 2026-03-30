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
} from "../helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  const data = await getExportData(tourId);
  if (!data) return NextResponse.json({ error: "Unauthorized or not found" }, { status: 401 });

  const { shows, tourName, tour } = data;
  const showId = req.nextUrl.searchParams.get("showId");
  const tourRec = tour as Record<string, unknown>;
  const artistName = tourRec.artist_id
    ? ((tourRec.artists as Record<string, unknown>)?.name as string) || ""
    : "";

  type Show = Record<string, unknown>;
  let targetShows: Show[] = shows as Show[];
  if (showId) {
    targetShows = targetShows.filter((s) => s.id === showId);
    if (targetShows.length === 0) return NextResponse.json({ error: "Show not found" }, { status: 404 });
  } else {
    targetShows = targetShows.filter((s) => !s.is_off);
  }

  const doc = new PDFDocument({ size: "LETTER", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const W = 612;
  const M = 50;
  const CW = W - M * 2;

  targetShows.forEach((show, pageIdx) => {
    if (pageIdx > 0) doc.addPage();

    let y = M;

    // ── Helpers ──
    function sectionTitle(title: string) {
      y += 8;
      doc.rect(M, y, CW, 18).fill("#111111");
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff")
        .text(title.toUpperCase(), M + 8, y + 5, { width: CW - 16 });
      y += 24;
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

    function multilineField(label: string, value: string | null | undefined) {
      if (!value) return;
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#888888").text(label, M, y, { width: CW });
      y += 12;
      doc.font("Helvetica").fontSize(9).fillColor("#111111").text(String(value), M, y, { width: CW, lineGap: 3 });
      y = doc.y + 8;
    }

    // ── HEADER ──
    doc.font("Helvetica-Bold").fontSize(20).fillColor("#111111")
      .text("ADVANCE SHEET", M, y, { width: CW, align: "center" });
    y += 26;

    const headerParts = [artistName, tourName.toUpperCase()].filter(Boolean);
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111111")
      .text(headerParts.join("  \u2014  "), M, y, { width: CW, align: "center" });
    y += 18;

    const dateStr = show.date_iso ? formatDateDisplay(new Date(show.date_iso as string + "T00:00:00")) : "";
    const locationParts = [show.venue, show.city, show.country].filter(Boolean).join(", ");
    doc.font("Helvetica").fontSize(10).fillColor("#888888")
      .text([dateStr, locationParts].filter(Boolean).join("  \u00b7  "), M, y, { width: CW, align: "center" });
    y += 16;

    doc.moveTo(M, y).lineTo(W - M, y).lineWidth(1.5).strokeColor("#111111").stroke();
    y += 4;

    // ── SECTION 1: SHOW INFO ──
    sectionTitle("Show Information");
    fieldRow([
      ["Date", dateStr],
      ["Venue", show.venue as string],
      ["City", [show.city, show.country].filter(Boolean).join(", ")],
    ]);
    fieldRow([
      ["Capacity", show.capacity ? String(show.capacity).toLocaleString() : null],
      ["Age Limit", show.age_limit as string],
      ["Billing", show.billing as string],
      ["Ticket Price", show.ticket_price as string],
    ]);
    fieldRow([
      ["Doors", show.doors as string],
      ["Showtime", show.showtime as string],
      ["Onstage", show.onstage as string],
      ["Curfew", show.curfew as string],
      ["Set Length", show.set_length as string],
    ]);

    // ── SECTION 2: PRODUCTION ──
    sectionTitle("Production");
    fieldRow([
      ["Production Contact", show.production_contact as string],
      ["Phone", show.production_contact_phone as string],
      ["Email", show.production_contact_email as string],
    ]);
    fieldRow([
      ["Load In", show.load_in_time as string],
      ["Load In Location", show.load_in_location as string],
    ]);
    multilineField("Backline Notes", show.backline_notes as string);

    // ── SECTION 3: HOSPITALITY ──
    const hasHospitality = show.hospitality_notes;
    if (hasHospitality) {
      sectionTitle("Hospitality");
      multilineField("Hospitality / Catering", show.hospitality_notes as string);
    }

    // ── SECTION 4: MERCH ──
    if (show.merch) {
      sectionTitle("Merchandise");
      multilineField("Merch Deal", show.merch as string);
    }

    // ── SECTION 5: HOTEL & TRAVEL ──
    const hasHotel = show.hotel_name;
    const showIdx = (shows as Show[]).indexOf(show);
    const hasPrev = showIdx > 0;

    if (hasHotel || hasPrev) {
      sectionTitle("Hotel & Travel");
      if (hasHotel) {
        fieldRow([
          ["Hotel", show.hotel_name as string],
          ["Confirmation", show.hotel_confirmation as string],
        ]);
        if (show.hotel_address) field("Address", show.hotel_address as string);
        fieldRow([
          ["Check-in", show.hotel_checkin as string],
          ["Check-out", show.hotel_checkout as string],
          ["Rooms", show.hotel_rooms ? String(show.hotel_rooms) : null],
        ]);
      }
      if (hasPrev) {
        const prev = (shows as Show[])[showIdx - 1];
        const km = getRoadKm(prev.city as string, prev.country as string, show.city as string, show.country as string);
        const driveH = km ? estimateDriveHours(km) : null;
        const lc = legCountry(prev.country as string, show.country as string);
        const dist = km ? fmtDist(km, lc === "usa" ? "usa" : "europe") : null;
        if (km) {
          fieldRow([
            ["Traveling From", prev.city as string],
            ["Distance", dist],
            ["Est. Drive", driveH ? fmtHours(driveH) : null],
          ]);
        }
      }
    }

    // ── SECTION 6: GUEST LIST ──
    const glCutoff = show.guest_list_cutoff as string;
    if (glCutoff) {
      sectionTitle("Guest List");
      field("Guest List Cutoff", glCutoff);
    }

    // ── NOTES ──
    if (show.notes) {
      sectionTitle("Additional Notes");
      multilineField("Notes", show.notes as string);
    }

    // ── FOOTER ──
    doc.font("Helvetica").fontSize(7).fillColor("#AAAAAA")
      .text("Generated by HWY61 TourRouter \u2014 hwy61labs.com", M, 742 - M, { width: CW, align: "center" });
  });

  doc.end();

  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const filename = showId
    ? `advance-${targetShows[0]?.city || "show"}.pdf`
    : `advance-sheets-${tourName.toLowerCase().replace(/\s+/g, "-")}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

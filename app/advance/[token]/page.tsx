"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ShowInfo = {
  showId: string;
  date: string;
  dateRaw: string;
  eventName: string;
  city: string;
  country: string;
  venue: string;
  artistName: string;
  tourName: string;
  doors: string | null;
  showtime: string | null;
  onstage: string | null;
  curfew: string | null;
  alreadySubmitted: boolean;
};

export default function AdvanceFormPage() {
  const { token } = useParams<{ token: string }>();
  const [show, setShow] = useState<ShowInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    doors: "",
    showtime: "",
    onstage: "",
    curfew: "",
    adv_load_in: "",
    adv_soundcheck: "",
    adv_wifi_name: "",
    adv_wifi_password: "",
    adv_parking: "",
    adv_venue_notes: "",
    adv_production_contact_name: "",
    adv_production_contact_email: "",
    adv_production_contact_phone: "",
    adv_backline_notes: "",
    adv_hospitality_notes: "",
    adv_catering: "",
    adv_dressing_room: "",
    adv_settlement_contact_name: "",
    adv_settlement_contact_phone: "",
    adv_settlement_contact_email: "",
    adv_submitted_by_name: "",
    adv_submitted_by_email: "",
  });

  useEffect(() => {
    fetch(`/api/tourrouter/advance/${token}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setShow(data);
        if (data.alreadySubmitted) setSubmitted(true);
        setForm((prev) => ({
          ...prev,
          doors: data.doors || "",
          showtime: data.showtime || "",
          onstage: data.onstage || "",
          curfew: data.curfew || "",
        }));
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [token]);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const resp = await fetch(`/api/tourrouter/advance/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!resp.ok) {
        const err = await resp.json();
        setError(err.error || "Submission failed");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Submission failed");
    }
    setSubmitting(false);
  }

  // Field helper
  const fieldStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "12px 16px",
    border: "3px solid var(--hw-border-strong)", fontSize: 15, outline: "none",
    fontFamily: "var(--hw-font-body)", color: "var(--hw-text)",
    background: "var(--hw-bg-surface)",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400,
    letterSpacing: "1.5px", textTransform: "uppercase",
    color: "var(--hw-text-secondary)", display: "block", marginBottom: 6,
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>LOADING...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 440, padding: 40, border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)" }}>
          <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>LINK NOT FOUND</div>
          <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 15, fontWeight: 300, color: "var(--hw-text-muted)" }}>This advance form link is invalid or has expired.</div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 440, padding: 40, border: "3px solid var(--hw-green)", background: "var(--hw-green-ghost)" }}>
          <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 36, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>THANK YOU</div>
          <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 15, fontWeight: 300, color: "var(--hw-text-secondary)", lineHeight: 1.6 }}>
            Advance information received for <strong>{show?.artistName}</strong> at <strong>{show?.venue}</strong>.
            The tour manager has been notified.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "3px solid var(--hw-border-strong)" }}>
          <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, letterSpacing: "4px", color: "var(--hw-crimson)", margin: 0, marginBottom: 4 }}>HWY61</div>
          <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "4px", textTransform: "uppercase", color: "var(--hw-blue)" }}>ADVANCE INFORMATION REQUEST</div>
        </div>

        {/* Show info card */}
        <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 24, marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>{show?.artistName}</div>
          <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, letterSpacing: "1px", color: "var(--hw-text-secondary)", marginBottom: 2 }}>{show?.date}</div>
          <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 15, fontWeight: 300, color: "var(--hw-text-secondary)" }}>{show?.venue}{show?.city ? `, ${show.city}` : ""}{show?.country ? ` \u2014 ${show.country}` : ""}</div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "var(--hw-red-ghost)", border: "3px solid var(--hw-crimson)", padding: "10px 16px", marginBottom: 16, fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-crimson)" }}>
            {error}
          </div>
        )}

        {/* Section 1: Schedule */}
        <FormSection title="Schedule">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Load-in Time</label><input value={form.adv_load_in} onChange={(e) => updateField("adv_load_in", e.target.value)} placeholder="e.g. 2:00 PM" style={fieldStyle} /></div>
            <div><label style={labelStyle}>Soundcheck</label><input value={form.adv_soundcheck} onChange={(e) => updateField("adv_soundcheck", e.target.value)} placeholder="e.g. 4:00 PM" style={fieldStyle} /></div>
            <div><label style={labelStyle}>Doors</label><input value={form.doors} onChange={(e) => updateField("doors", e.target.value)} placeholder="e.g. 7:00 PM" style={fieldStyle} /></div>
            <div><label style={labelStyle}>Showtime</label><input value={form.showtime} onChange={(e) => updateField("showtime", e.target.value)} placeholder="e.g. 8:00 PM" style={fieldStyle} /></div>
            <div><label style={labelStyle}>Onstage</label><input value={form.onstage} onChange={(e) => updateField("onstage", e.target.value)} placeholder="e.g. 9:00 PM" style={fieldStyle} /></div>
            <div><label style={labelStyle}>Curfew</label><input value={form.curfew} onChange={(e) => updateField("curfew", e.target.value)} placeholder="e.g. 11:00 PM" style={fieldStyle} /></div>
          </div>
        </FormSection>

        {/* Section 2: Venue Details */}
        <FormSection title="Venue Details">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>WiFi Network</label><input value={form.adv_wifi_name} onChange={(e) => updateField("adv_wifi_name", e.target.value)} placeholder="Network name" style={fieldStyle} /></div>
            <div><label style={labelStyle}>WiFi Password</label><input value={form.adv_wifi_password} onChange={(e) => updateField("adv_wifi_password", e.target.value)} placeholder="Password" style={fieldStyle} /></div>
          </div>
          <div style={{ marginTop: 12 }}><label style={labelStyle}>Parking Info</label><textarea value={form.adv_parking} onChange={(e) => updateField("adv_parking", e.target.value)} placeholder="Loading dock access, parking for van/bus, overnight parking..." style={{ ...fieldStyle, minHeight: 60, resize: "vertical" }} /></div>
          <div style={{ marginTop: 12 }}><label style={labelStyle}>Venue Notes</label><textarea value={form.adv_venue_notes} onChange={(e) => updateField("adv_venue_notes", e.target.value)} placeholder="Any venue-specific info (green room location, stage dimensions, etc.)" style={{ ...fieldStyle, minHeight: 60, resize: "vertical" }} /></div>
        </FormSection>

        {/* Section 3: Production */}
        <FormSection title="Production">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Contact Name</label><input value={form.adv_production_contact_name} onChange={(e) => updateField("adv_production_contact_name", e.target.value)} placeholder="Name" style={fieldStyle} /></div>
            <div><label style={labelStyle}>Email</label><input value={form.adv_production_contact_email} onChange={(e) => updateField("adv_production_contact_email", e.target.value)} placeholder="Email" type="email" style={fieldStyle} /></div>
            <div><label style={labelStyle}>Phone</label><input value={form.adv_production_contact_phone} onChange={(e) => updateField("adv_production_contact_phone", e.target.value)} placeholder="Phone" type="tel" style={fieldStyle} /></div>
          </div>
          <div style={{ marginTop: 12 }}><label style={labelStyle}>Backline Notes</label><textarea value={form.adv_backline_notes} onChange={(e) => updateField("adv_backline_notes", e.target.value)} placeholder="Available backline, house gear, monitors, etc." style={{ ...fieldStyle, minHeight: 60, resize: "vertical" }} /></div>
        </FormSection>

        {/* Section 4: Hospitality */}
        <FormSection title="Hospitality">
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>Hospitality Notes</label><textarea value={form.adv_hospitality_notes} onChange={(e) => updateField("adv_hospitality_notes", e.target.value)} placeholder="Green room provisions, hospitality details..." style={{ ...fieldStyle, minHeight: 60, resize: "vertical" }} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Catering</label><input value={form.adv_catering} onChange={(e) => updateField("adv_catering", e.target.value)} placeholder="Catering details" style={fieldStyle} /></div>
            <div><label style={labelStyle}>Dressing Room</label><input value={form.adv_dressing_room} onChange={(e) => updateField("adv_dressing_room", e.target.value)} placeholder="Dressing room info" style={fieldStyle} /></div>
          </div>
        </FormSection>

        {/* Section 5: Settlement */}
        <FormSection title="Settlement">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Contact Name</label><input value={form.adv_settlement_contact_name} onChange={(e) => updateField("adv_settlement_contact_name", e.target.value)} placeholder="Name" style={fieldStyle} /></div>
            <div><label style={labelStyle}>Phone</label><input value={form.adv_settlement_contact_phone} onChange={(e) => updateField("adv_settlement_contact_phone", e.target.value)} placeholder="Phone" type="tel" style={fieldStyle} /></div>
            <div><label style={labelStyle}>Email</label><input value={form.adv_settlement_contact_email} onChange={(e) => updateField("adv_settlement_contact_email", e.target.value)} placeholder="Email" type="email" style={fieldStyle} /></div>
          </div>
        </FormSection>

        {/* Your Info */}
        <FormSection title="Your Info">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Your Name</label><input value={form.adv_submitted_by_name} onChange={(e) => updateField("adv_submitted_by_name", e.target.value)} placeholder="Name" style={fieldStyle} /></div>
            <div><label style={labelStyle}>Your Email</label><input value={form.adv_submitted_by_email} onChange={(e) => updateField("adv_submitted_by_email", e.target.value)} placeholder="Email" type="email" style={fieldStyle} /></div>
          </div>
        </FormSection>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: "100%", padding: "16px 28px",
            border: "3px solid var(--hw-action-primary)", background: "var(--hw-action-primary)", color: "#fff",
            fontFamily: "var(--hw-font-display)", fontSize: 18, letterSpacing: "3px", textTransform: "uppercase",
            cursor: submitting ? "wait" : "pointer",
            opacity: submitting ? 0.4 : 1, marginTop: 8,
            transition: "var(--hw-ease)",
          }}
        >{submitting ? "SUBMITTING..." : "SUBMIT ADVANCE INFORMATION"}</button>

        <div style={{ textAlign: "center", marginTop: 24, fontFamily: "var(--hw-font-mono)", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>
          POWERED BY HWY61
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 24, marginBottom: 16 }}>
      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, color: "var(--hw-blue)", textTransform: "uppercase", letterSpacing: "4px", marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

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
    width: "100%", boxSizing: "border-box", padding: "10px 12px",
    border: "1px solid #DDDDDD", borderRadius: 10, fontSize: 14, outline: "none",
    fontFamily: "system-ui, sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "#888", display: "block", marginBottom: 5,
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F5F5F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#888", fontSize: 15 }}>Loading...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", background: "#F5F5F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Link Not Found</div>
          <div style={{ fontSize: 14, color: "#888" }}>This advance form link is invalid or has expired.</div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#F5F5F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 440, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u2705"}</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Thank You!</div>
          <div style={{ fontSize: 15, color: "#888", lineHeight: 1.6 }}>
            Advance information received for <strong>{show?.artistName}</strong> at <strong>{show?.venue}</strong>.
            The tour manager has been notified.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F2", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "2px solid #111111" }}>
          <div className="brand-title" style={{ margin: 0, fontSize: 28, marginBottom: 4 }}>TOURROUTER.</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em" }}>Advance Information Request</div>
        </div>

        {/* Show info card */}
        <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{show?.artistName}</div>
          <div style={{ fontSize: 15, color: "#666", marginBottom: 2 }}>{show?.date}</div>
          <div style={{ fontSize: 15, color: "#666" }}>{show?.venue}{show?.city ? `, ${show.city}` : ""}{show?.country ? ` \u2014 ${show.country}` : ""}</div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fff0f0", border: "1px solid #ffcccc", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#c00" }}>
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
            width: "100%", padding: "14px 24px", borderRadius: 10,
            border: "1px solid #111", background: "#111", color: "#fff",
            fontWeight: 900, fontSize: 15, cursor: submitting ? "wait" : "pointer",
            opacity: submitting ? 0.6 : 1, marginTop: 8,
          }}
        >{submitting ? "Submitting..." : "Submit Advance Information"}</button>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "#aaa" }}>
          Powered by TourRouter
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 24, marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useProductBranding } from "@/lib/tourrouter/ProductBrandingContext";

type Contact = {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  markets: string | null;
  anonymous_flag_count: number;
  private_notes: string | null;
  relationship_rating: number | null;
  my_flag: boolean;
  my_flag_notes: string | null;
  tags: string | null;
  last_contact_date: string | null;
  account_contact_id: string | null;
};

const ROLES = ["Promoter", "Agent", "Manager", "Production", "TM", "BM", "Venue", "Label", "Publicist", "Attorney", "Other"];
const FILTER_ROLES = ["All", "Promoter", "Agent", "Manager", "Production", "Venue", "Other"];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onChange(n)}
          style={{ cursor: "pointer", fontSize: 18, color: n <= value ? "#f0c040" : "#ddd" }}
        >{n <= value ? "\u2605" : "\u2606"}</span>
      ))}
    </div>
  );
}

export default function ContactsPage() {
  const branding = useProductBranding();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [addingContact, setAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", company: "", role: "Promoter", email: "", phone: "" });
  const [flagging, setFlagging] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchContacts = useCallback(async (q: string, role: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role && role !== "All") params.set("role", role);
    params.set("limit", "50");
    try {
      const resp = await fetch(`/api/tourrouter/contacts?${params}`);
      if (resp.ok) {
        const data = await resp.json();
        setContacts(data.contacts || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContacts("", "All");
  }, [fetchContacts]);

  function onSearchChange(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchContacts(val, roleFilter), 300);
  }

  function onRoleFilter(role: string) {
    setRoleFilter(role);
    fetchContacts(search, role);
  }

  function expandRow(contact: Contact) {
    if (expandedId === contact.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(contact.id);
    setEditForm({
      name: contact.name || "",
      company: contact.company || "",
      role: contact.role || "",
      email: contact.email || "",
      phone: contact.phone || "",
      website: contact.website || "",
      private_notes: contact.private_notes || "",
      relationship_rating: contact.relationship_rating || 0,
      tags: contact.tags || "",
      last_contact_date: contact.last_contact_date || "",
    });
  }

  async function saveContact(contactId: string) {
    setSaving(true);
    try {
      await fetch(`/api/tourrouter/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setContacts((prev) => prev.map((c) =>
        c.id === contactId ? { ...c, ...editForm } as Contact : c
      ));
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function removeContact(contactId: string) {
    if (!confirm("Remove this contact from your list? (The shared record will remain for other teams.)")) return;
    await fetch(`/api/tourrouter/contacts/${contactId}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    setExpandedId(null);
  }

  async function flagContact(contactId: string) {
    if (!confirm("Flag this contact? This is anonymous — other teams will see the flag count but not who flagged.")) return;
    setFlagging(contactId);
    try {
      const resp = await fetch(`/api/tourrouter/contacts/${contactId}/flag`, { method: "POST" });
      if (resp.ok) {
        const data = await resp.json();
        setContacts((prev) => prev.map((c) =>
          c.id === contactId ? { ...c, my_flag: true, anonymous_flag_count: data.flagCount ?? (c.anonymous_flag_count + 1) } : c
        ));
      }
    } catch { /* ignore */ }
    setFlagging(null);
  }

  async function addContact() {
    if (!newContact.name.trim()) return;
    const resp = await fetch("/api/tourrouter/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newContact),
    });
    if (resp.ok) {
      setNewContact({ name: "", company: "", role: "Promoter", email: "", phone: "" });
      setAddingContact(false);
      fetchContacts(search, roleFilter);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "8px 10px",
    border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none",
  };

  return (
    <div className="fade-in" style={{ minHeight: "100vh", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/dashboard" style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>&larr; {branding.name}</Link>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h1 className="brand-title" style={{ margin: 0, marginBottom: 4, paddingBottom: 8 }}>{branding.name}</h1>
              <div style={{ borderBottom: "2px solid #111", marginBottom: 6, maxWidth: 200 }} />
              <div className="brand-title" style={{ margin: 0, fontSize: "360%" }}>CONTACTS</div>
            </div>
            <button
              onClick={() => setAddingContact(!addingContact)}
              style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
            >+ Add Contact</button>
          </div>
        </div>

        {/* Add Contact Form */}
        {addingContact && (
          <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>New Contact</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 1fr 1fr", gap: 10, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Name *</label>
                <input value={newContact.name} onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))} placeholder="Full name" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Company</label>
                <input value={newContact.company} onChange={(e) => setNewContact((p) => ({ ...p, company: e.target.value }))} placeholder="Company" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Role</label>
                <select value={newContact.role} onChange={(e) => setNewContact((p) => ({ ...p, role: e.target.value }))} style={{ ...inputStyle, background: "#fff" }}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Email</label>
                <input value={newContact.email} onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" type="email" style={inputStyle} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Phone</label>
                  <input value={newContact.phone} onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" style={inputStyle} />
                </div>
                <button onClick={addContact} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", alignSelf: "end" }}>Add</button>
                <button onClick={() => setAddingContact(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #DDDDDD", background: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", alignSelf: "end" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: 12 }}>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search contacts by name or company..."
            style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "1px solid #DDDDDD", borderRadius: 14, fontSize: 14, outline: "none", background: "#fff" }}
          />
        </div>

        {/* Role filters */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {FILTER_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => onRoleFilter(role)}
              style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer",
                border: roleFilter === role ? "1px solid #111" : "1px solid #DDDDDD",
                background: roleFilter === role ? "#111" : "#fff",
                color: roleFilter === role ? "#fff" : "#888",
              }}
            >{role}</button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#888" }}>Loading...</div>
        ) : contacts.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#888", marginBottom: 12 }}>No contacts yet</div>
            <div style={{ fontSize: 13, color: "#aaa" }}>Add contacts manually or drop a contact list document to import them automatically.</div>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Name", "Company", "Role", "Email", "Phone", "Rating", "Flags"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "2px solid #DDDDDD", background: "#fafaf8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <ContactRow
                    key={c.id}
                    contact={c}
                    expanded={expandedId === c.id}
                    onToggle={() => expandRow(c)}
                    editForm={editForm}
                    onEditChange={(k, v) => setEditForm((prev) => ({ ...prev, [k]: v }))}
                    onSave={() => saveContact(c.id)}
                    onRemove={() => removeContact(c.id)}
                    onFlag={() => flagContact(c.id)}
                    saving={saving}
                    flagging={flagging === c.id}
                    StarRating={StarRating}
                    inputStyle={inputStyle}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ContactRow({
  contact: c, expanded, onToggle, editForm, onEditChange, onSave, onRemove, onFlag, saving, flagging, StarRating, inputStyle,
}: {
  contact: Contact;
  expanded: boolean;
  onToggle: () => void;
  editForm: Record<string, unknown>;
  onEditChange: (key: string, value: unknown) => void;
  onSave: () => void;
  onRemove: () => void;
  onFlag: () => void;
  saving: boolean;
  flagging: boolean;
  StarRating: React.ComponentType<{ value: number; onChange: (v: number) => void }>;
  inputStyle: React.CSSProperties;
}) {
  const flagCount = c.anonymous_flag_count || 0;

  return (
    <>
      <tr
        onClick={onToggle}
        style={{ cursor: "pointer", borderBottom: expanded ? "none" : "1px solid #f0f0f0" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f8f8f6"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
      >
        <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>
          {c.name}
          {c.my_flag && <span style={{ marginLeft: 6, fontSize: 10, color: "#c0392b" }}>(flagged)</span>}
        </td>
        <td style={{ padding: "10px 14px", fontSize: 13, color: "#666" }}>{c.company || "\u2014"}</td>
        <td style={{ padding: "10px 14px", fontSize: 12 }}>
          {c.role && <span style={{ padding: "2px 8px", borderRadius: 4, background: "#f0f0f0", fontSize: 10, fontWeight: 700 }}>{c.role}</span>}
        </td>
        <td style={{ padding: "10px 14px", fontSize: 12, color: "#888" }}>{c.email || "\u2014"}</td>
        <td style={{ padding: "10px 14px", fontSize: 12, color: "#888" }}>{c.phone || "\u2014"}</td>
        <td style={{ padding: "10px 14px" }}>
          {c.relationship_rating ? (
            <span style={{ fontSize: 14, color: "#f0c040" }}>
              {"\u2605".repeat(c.relationship_rating)}{"\u2606".repeat(5 - c.relationship_rating)}
            </span>
          ) : <span style={{ color: "#ddd", fontSize: 14 }}>{"\u2606".repeat(5)}</span>}
        </td>
        <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: "monospace" }}>
          {flagCount > 0 && (
            <span style={{
              padding: "2px 8px", borderRadius: 4, fontWeight: 700, fontSize: 11,
              background: flagCount >= 3 ? "#ffebee" : "#fff3e0",
              color: flagCount >= 3 ? "#c0392b" : "#b35c00",
            }}>{flagCount}</span>
          )}
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr>
          <td colSpan={7} style={{ padding: "0 14px 16px", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ background: "#fafaf8", borderRadius: 10, padding: 16, marginTop: 4 }}>
              {/* Shared fields */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", marginBottom: 8 }}>Contact Info</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Name</label>
                  <input value={String(editForm.name || "")} onChange={(e) => onEditChange("name", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Company</label>
                  <input value={String(editForm.company || "")} onChange={(e) => onEditChange("company", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Role</label>
                  <input value={String(editForm.role || "")} onChange={(e) => onEditChange("role", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Email</label>
                  <input value={String(editForm.email || "")} onChange={(e) => onEditChange("email", e.target.value)} type="email" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Phone</label>
                  <input value={String(editForm.phone || "")} onChange={(e) => onEditChange("phone", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Website</label>
                  <input value={String(editForm.website || "")} onChange={(e) => onEditChange("website", e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Private fields */}
              <div style={{ borderTop: "1px solid #e0e0da", paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", marginBottom: 8 }}>
                  Private Notes <span style={{ fontWeight: 400, textTransform: "none" }}>&mdash; only visible to your team</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Rating</label>
                    <StarRating value={Number(editForm.relationship_rating) || 0} onChange={(v) => onEditChange("relationship_rating", v)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Tags</label>
                    <input value={String(editForm.tags || "")} onChange={(e) => onEditChange("tags", e.target.value)} placeholder="e.g. reliable, slow-pay" style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Notes</label>
                  <textarea value={String(editForm.private_notes || "")} onChange={(e) => onEditChange("private_notes", e.target.value)} placeholder="Private notes about this contact..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Last Contact Date</label>
                  <input type="date" value={String(editForm.last_contact_date || "")} onChange={(e) => onEditChange("last_contact_date", e.target.value)} style={{ ...inputStyle, width: 180 }} />
                </div>
              </div>

              {/* Flag warning */}
              {c.anonymous_flag_count >= 3 && (
                <div style={{ marginTop: 12, padding: "8px 12px", background: "#ffebee", borderRadius: 8, fontSize: 12, color: "#c0392b", fontWeight: 600 }}>
                  This contact has been flagged by multiple teams
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button onClick={onSave} disabled={saving} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", opacity: saving ? 0.5 : 1 }}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                {!c.my_flag && (
                  <button onClick={onFlag} disabled={flagging} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #c0392b", background: "#fff", color: "#c0392b", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    {flagging ? "Flagging..." : "Flag Contact"}
                  </button>
                )}
                {c.my_flag && (
                  <span style={{ padding: "8px 12px", fontSize: 12, color: "#c0392b", fontWeight: 600 }}>Flagged</span>
                )}
                <button onClick={onRemove} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #DDDDDD", background: "#fff", color: "#888", fontWeight: 700, fontSize: 12, cursor: "pointer", marginLeft: "auto" }}>
                  Remove from My Contacts
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

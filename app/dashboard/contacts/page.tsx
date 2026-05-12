"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";


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
          style={{ cursor: "pointer", fontSize: 18, color: n <= value ? "var(--hw-crimson)" : "var(--hw-text-muted)" }}
        >{n <= value ? "\u2605" : "\u2606"}</span>
      ))}
    </div>
  );
}

export default function ContactsPage() {

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
    border: "3px solid var(--hw-border-strong)", borderRadius: 0, fontSize: 15, fontFamily: "var(--hw-font-body)", outline: "none",
    background: "var(--hw-bg-surface)", color: "var(--hw-text)",
  };

  return (
    <div className="fade-in" style={{ minHeight: "100vh", padding: "32px 24px 80px", background: "transparent" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/dashboard" style={{ fontSize: 13, fontFamily: "var(--hw-font-mono)", fontWeight: 700, color: "var(--hw-text-muted)", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>&larr; HWY61</Link>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h1 className="brand-title" style={{ margin: 0, marginBottom: 4, paddingBottom: 8 }}>HWY61</h1>
              <div style={{ borderBottom: "3px solid var(--hw-border-strong)", marginBottom: 6, maxWidth: 200 }} />
              <div className="brand-title" style={{ margin: 0, fontSize: "360%" }}>CONTACTS</div>
            </div>
            <button
              onClick={() => setAddingContact(!addingContact)}
              style={{ padding: "10px 20px", borderRadius: 0, border: "3px solid var(--hw-border-strong)", background: "var(--hw-action-primary)", color: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-display)", fontWeight: 800, fontSize: 13, cursor: "pointer", textTransform: "uppercase", letterSpacing: 3 }}
            >+ Add Contact</button>
          </div>
        </div>

        {/* Add Contact Form */}
        {addingContact && (
          <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", borderRadius: 0, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontFamily: "var(--hw-font-display)", fontWeight: 700, marginBottom: 12, color: "var(--hw-text)", textTransform: "uppercase", letterSpacing: 3 }}>New Contact</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 1fr 1fr", gap: 10, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 11, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", display: "block", marginBottom: 4 }}>Name *</label>
                <input value={newContact.name} onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))} placeholder="Full name" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", display: "block", marginBottom: 4 }}>Company</label>
                <input value={newContact.company} onChange={(e) => setNewContact((p) => ({ ...p, company: e.target.value }))} placeholder="Company" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", display: "block", marginBottom: 4 }}>Role</label>
                <select value={newContact.role} onChange={(e) => setNewContact((p) => ({ ...p, role: e.target.value }))} style={{ ...inputStyle, background: "var(--hw-bg-surface)" }}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", display: "block", marginBottom: 4 }}>Email</label>
                <input value={newContact.email} onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" type="email" style={inputStyle} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", display: "block", marginBottom: 4 }}>Phone</label>
                  <input value={newContact.phone} onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" style={inputStyle} />
                </div>
                <button onClick={addContact} style={{ padding: "8px 14px", borderRadius: 0, border: "3px solid var(--hw-border-strong)", background: "var(--hw-action-primary)", color: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-display)", fontWeight: 700, fontSize: 12, cursor: "pointer", alignSelf: "end", textTransform: "uppercase", letterSpacing: 3 }}>Add</button>
                <button onClick={() => setAddingContact(false)} style={{ padding: "8px 14px", borderRadius: 0, border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-display)", fontWeight: 700, fontSize: 12, cursor: "pointer", alignSelf: "end", color: "var(--hw-text-secondary)", textTransform: "uppercase", letterSpacing: 3 }}>Cancel</button>
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
            style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "3px solid var(--hw-border-strong)", borderRadius: 0, fontSize: 15, fontFamily: "var(--hw-font-body)", outline: "none", background: "var(--hw-bg-surface)", color: "var(--hw-text)" }}
          />
        </div>

        {/* Role filters */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {FILTER_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => onRoleFilter(role)}
              style={{
                padding: "5px 14px", borderRadius: 0, fontSize: 11, fontFamily: "var(--hw-font-display)", fontWeight: 700, cursor: "pointer",
                textTransform: "uppercase", letterSpacing: 3,
                border: roleFilter === role ? "3px solid var(--hw-border-strong)" : "3px solid var(--hw-border-strong)",
                background: roleFilter === role ? "var(--hw-crimson)" : "var(--hw-bg-surface)",
                color: roleFilter === role ? "var(--hw-bg-surface)" : "var(--hw-text-muted)",
              }}
            >{role}</button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--hw-text-muted)", fontFamily: "var(--hw-font-mono)" }}>Loading...</div>
        ) : contacts.length === 0 ? (
          <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", borderRadius: 0, padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontFamily: "var(--hw-font-display)", fontWeight: 700, color: "var(--hw-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 3 }}>No contacts yet</div>
            <div style={{ fontSize: 13, fontFamily: "var(--hw-font-body)", color: "var(--hw-text-muted)" }}>Add contacts manually or drop a contact list document to import them automatically.</div>
          </div>
        ) : (
          <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", borderRadius: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Name", "Company", "Role", "Email", "Phone", "Rating", "Flags"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontFamily: "var(--hw-font-display)", fontWeight: 700, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: 3, borderBottom: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)" }}>{h}</th>
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
        style={{ cursor: "pointer", borderBottom: expanded ? "none" : "1px solid var(--hw-border-strong)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--hw-bg-surface)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <td style={{ padding: "10px 14px", fontSize: 13, fontFamily: "var(--hw-font-body)", fontWeight: 600, color: "var(--hw-text)" }}>
          {c.name}
          {c.my_flag && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--hw-crimson)" }}>(flagged)</span>}
        </td>
        <td style={{ padding: "10px 14px", fontSize: 13, fontFamily: "var(--hw-font-body)", color: "var(--hw-text-secondary)" }}>{c.company || "\u2014"}</td>
        <td style={{ padding: "10px 14px", fontSize: 12 }}>
          {c.role && <span style={{ padding: "2px 8px", borderRadius: 0, background: "var(--hw-bg-surface)", border: "2px solid var(--hw-border-strong)", fontSize: 10, fontFamily: "var(--hw-font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>{c.role}</span>}
        </td>
        <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)" }}>{c.email || "\u2014"}</td>
        <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)" }}>{c.phone || "\u2014"}</td>
        <td style={{ padding: "10px 14px" }}>
          {c.relationship_rating ? (
            <span style={{ fontSize: 14, color: "var(--hw-crimson)" }}>
              {"\u2605".repeat(c.relationship_rating)}{"\u2606".repeat(5 - c.relationship_rating)}
            </span>
          ) : <span style={{ color: "var(--hw-text-muted)", fontSize: 14 }}>{"\u2606".repeat(5)}</span>}
        </td>
        <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: "var(--hw-font-mono)" }}>
          {flagCount > 0 && (
            <span style={{
              padding: "2px 8px", borderRadius: 0, fontWeight: 700, fontSize: 11,
              border: "2px solid var(--hw-border-strong)",
              background: flagCount >= 3 ? "var(--hw-crimson)" : "var(--hw-bg-surface)",
              color: flagCount >= 3 ? "var(--hw-bg-surface)" : "var(--hw-crimson)",
            }}>{flagCount}</span>
          )}
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr>
          <td colSpan={7} style={{ padding: "0 14px 16px", borderBottom: "1px solid var(--hw-border-strong)" }}>
            <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", borderRadius: 0, padding: 16, marginTop: 4 }}>
              {/* Shared fields */}
              <div style={{ fontSize: 11, fontFamily: "var(--hw-font-display)", fontWeight: 700, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 8 }}>Contact Info</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 10, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", display: "block", marginBottom: 2 }}>Name</label>
                  <input value={String(editForm.name || "")} onChange={(e) => onEditChange("name", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", display: "block", marginBottom: 2 }}>Company</label>
                  <input value={String(editForm.company || "")} onChange={(e) => onEditChange("company", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", display: "block", marginBottom: 2 }}>Role</label>
                  <input value={String(editForm.role || "")} onChange={(e) => onEditChange("role", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", display: "block", marginBottom: 2 }}>Email</label>
                  <input value={String(editForm.email || "")} onChange={(e) => onEditChange("email", e.target.value)} type="email" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", display: "block", marginBottom: 2 }}>Phone</label>
                  <input value={String(editForm.phone || "")} onChange={(e) => onEditChange("phone", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", display: "block", marginBottom: 2 }}>Website</label>
                  <input value={String(editForm.website || "")} onChange={(e) => onEditChange("website", e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Private fields */}
              <div style={{ borderTop: "3px solid var(--hw-border-strong)", paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 11, fontFamily: "var(--hw-font-display)", fontWeight: 700, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 8 }}>
                  Private Notes <span style={{ fontWeight: 400, textTransform: "none", fontFamily: "var(--hw-font-body)", letterSpacing: 0 }}>&mdash; only visible to your team</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", display: "block", marginBottom: 2 }}>Rating</label>
                    <StarRating value={Number(editForm.relationship_rating) || 0} onChange={(v) => onEditChange("relationship_rating", v)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", display: "block", marginBottom: 2 }}>Tags</label>
                    <input value={String(editForm.tags || "")} onChange={(e) => onEditChange("tags", e.target.value)} placeholder="e.g. reliable, slow-pay" style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 10, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", display: "block", marginBottom: 2 }}>Notes</label>
                  <textarea value={String(editForm.private_notes || "")} onChange={(e) => onEditChange("private_notes", e.target.value)} placeholder="Private notes about this contact..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", display: "block", marginBottom: 2 }}>Last Contact Date</label>
                  <input type="date" value={String(editForm.last_contact_date || "")} onChange={(e) => onEditChange("last_contact_date", e.target.value)} style={{ ...inputStyle, width: 180 }} />
                </div>
              </div>

              {/* Flag warning */}
              {c.anonymous_flag_count >= 3 && (
                <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--hw-crimson)", borderRadius: 0, fontSize: 12, fontFamily: "var(--hw-font-body)", color: "var(--hw-bg-surface)", fontWeight: 600, border: "3px solid var(--hw-border-strong)" }}>
                  This contact has been flagged by multiple teams
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button onClick={onSave} disabled={saving} style={{ padding: "8px 16px", borderRadius: 0, border: "3px solid var(--hw-border-strong)", background: "var(--hw-action-primary)", color: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-display)", fontWeight: 700, fontSize: 12, cursor: "pointer", opacity: saving ? 0.5 : 1, textTransform: "uppercase", letterSpacing: 3 }}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                {!c.my_flag && (
                  <button onClick={onFlag} disabled={flagging} style={{ padding: "8px 16px", borderRadius: 0, border: "3px solid var(--hw-crimson)", background: "var(--hw-bg-surface)", color: "var(--hw-crimson)", fontFamily: "var(--hw-font-display)", fontWeight: 700, fontSize: 12, cursor: "pointer", textTransform: "uppercase", letterSpacing: 3 }}>
                    {flagging ? "Flagging..." : "Flag Contact"}
                  </button>
                )}
                {c.my_flag && (
                  <span style={{ padding: "8px 12px", fontSize: 12, fontFamily: "var(--hw-font-display)", color: "var(--hw-crimson)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 3 }}>Flagged</span>
                )}
                <button onClick={onRemove} style={{ padding: "8px 16px", borderRadius: 0, border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text-muted)", fontFamily: "var(--hw-font-display)", fontWeight: 700, fontSize: 12, cursor: "pointer", marginLeft: "auto", textTransform: "uppercase", letterSpacing: 3 }}>
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

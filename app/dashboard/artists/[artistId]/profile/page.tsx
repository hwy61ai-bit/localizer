/**
 * Master Artist Profile Page
 *
 * Full business record for an artist — 10 collapsible sections.
 * Progressive entry: open any section, fill what you have, auto-saves.
 * Located at /dashboard/artists/[artistId]/profile
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  PROFILE_SECTIONS,
  type ArtistProfile,
  type BusinessEntity,
  type KeyContact,
  type TaxCompliance,
  type InsuranceInfo,
  type InsurancePolicy,
  type TechnicalProduction,
  type HospitalityRider,
  type PromoMarketing,
  type MerchDefaults,
  type VehiclesEquipment,
  type RosterEntry,
} from '@/lib/tourrouter/artistProfileTypes';

// ─── Styles ──────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  maxWidth: 900, margin: '0 auto', padding: '24px 16px',
  fontFamily: "'DM Sans', sans-serif",
};
const headerStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 24,
};
const sectionCardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #DDDDDD', borderRadius: 14,
  marginBottom: 12, overflow: 'hidden',
};
const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '14px 20px', cursor: 'pointer', userSelect: 'none' as const,
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15, fontWeight: 700, color: '#1a1a18',
};
const sectionBodyStyle: React.CSSProperties = {
  padding: '0 20px 20px',
};
const fieldRowStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8,
  alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f0f0ec',
};
const labelStyle: React.CSSProperties = {
  fontSize: 13, color: '#888880', fontWeight: 500,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 10px', border: '1px solid #e0e0da',
  borderRadius: 6, fontSize: 13, background: '#fff',
};
const selectStyle: React.CSSProperties = {
  ...inputStyle,
};
const textareaStyle: React.CSSProperties = {
  ...inputStyle, minHeight: 60, resize: 'vertical' as const,
};
const savingBadge: React.CSSProperties = {
  fontSize: 11, color: '#888880', fontWeight: 400,
};
const btnStyle: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600,
  border: '1px solid #e0e0da', background: '#fff', color: '#1a1a18',
  cursor: 'pointer',
};
const primaryBtnStyle: React.CSSProperties = {
  ...btnStyle, background: '#1a1a18', color: '#fff', border: 'none',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ArtistProfilePage() {
  const params = useParams();
  const router = useRouter();
  const artistId = params?.artistId as string;

  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // ─── Fetch Artist ───────────────────────────────────────────────────

  useEffect(() => {
    if (!artistId) return;
    fetch(`/api/tourrouter/artists/${artistId}`)
      .then((r) => r.json())
      .then((data) => {
        setArtist(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [artistId]);

  // ─── Save ───────────────────────────────────────────────────────────

  const saveField = useCallback(
    (field: string, value: unknown) => {
      setArtist((prev: any) => ({ ...prev, [field]: value }));

      if (saveTimer) clearTimeout(saveTimer);
      const timer = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch(`/api/tourrouter/artists/${artistId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value }),
          });
        } catch (e) {
          console.error('Save failed:', e);
        } finally {
          setSaving(false);
        }
      }, 600);
      setSaveTimer(timer);
    },
    [artistId, saveTimer]
  );

  // ─── Section Toggle ─────────────────────────────────────────────────

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ─── Field Helpers ──────────────────────────────────────────────────

  const jsonField = (column: string, path: string, value: unknown) => {
    const current = artist?.[column] || {};
    const updated = { ...current, [path]: value };
    saveField(column, updated);
  };

  const TextField = ({ column, path, label, placeholder, type }: {
    column: string; path: string; label: string; placeholder?: string; type?: string;
  }) => {
    const val = artist?.[column]?.[path] ?? '';
    return (
      <div style={fieldRowStyle}>
        <label style={labelStyle}>{label}</label>
        <input
          style={inputStyle}
          type={type || 'text'}
          value={val}
          placeholder={placeholder}
          onChange={(e) => jsonField(column, path, e.target.value || null)}
        />
      </div>
    );
  };

  const SelectField = ({ column, path, label, options }: {
    column: string; path: string; label: string; options: Array<{ value: string; label: string }>;
  }) => {
    const val = artist?.[column]?.[path] ?? '';
    return (
      <div style={fieldRowStyle}>
        <label style={labelStyle}>{label}</label>
        <select
          style={selectStyle}
          value={val}
          onChange={(e) => jsonField(column, path, e.target.value || null)}
        >
          <option value="">Select...</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  };

  const TextAreaField = ({ column, path, label, placeholder }: {
    column: string; path: string; label: string; placeholder?: string;
  }) => {
    const val = artist?.[column]?.[path] ?? '';
    return (
      <div style={fieldRowStyle}>
        <label style={{ ...labelStyle, alignSelf: 'flex-start', paddingTop: 6 }}>{label}</label>
        <textarea
          style={textareaStyle}
          value={val}
          placeholder={placeholder}
          onChange={(e) => jsonField(column, path, e.target.value || null)}
        />
      </div>
    );
  };

  // ─── Loading / Error ────────────────────────────────────────────────

  if (loading) {
    return <div style={pageStyle}><p style={{ color: '#888880' }}>Loading artist profile...</p></div>;
  }

  if (!artist) {
    return <div style={pageStyle}><p>Artist not found.</p></div>;
  }

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a18' }}>
            {artist.name}
          </div>
          <div style={{ fontSize: 13, color: '#888880' }}>
            Master Artist Profile
            {saving && <span style={savingBadge}> &middot; Saving...</span>}
          </div>
        </div>
        <button style={btnStyle} onClick={() => router.back()}>
          &larr; Back
        </button>
      </div>

      {/* Sections */}
      {PROFILE_SECTIONS.map((section) => {
        const isOpen = openSections.has(section.key);
        return (
          <div key={section.key} style={sectionCardStyle}>
            <div style={sectionHeaderStyle} onClick={() => toggleSection(section.key)}>
              <span style={sectionTitleStyle}>
                {section.icon} {section.label}
              </span>
              <span style={{ color: '#888880', fontSize: 14 }}>
                {isOpen ? '\u25BE' : '\u25B8'}
              </span>
            </div>
            {isOpen && (
              <div style={sectionBodyStyle}>
                {renderSection(section.key, artist, saveField, jsonField, TextField, SelectField, TextAreaField)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section Renderers ──────────────────────────────────────────────────────

function renderSection(
  key: string,
  artist: any,
  saveField: (field: string, value: unknown) => void,
  jsonField: (column: string, path: string, value: unknown) => void,
  TextField: any,
  SelectField: any,
  TextAreaField: any,
) {
  switch (key) {
    case 'businessEntity':
      return (
        <>
          <TextField column="business_entity" path="legalName" label="Legal Name" placeholder="As registered" />
          <TextField column="business_entity" path="dba" label="DBA / Artist Name" />
          <SelectField column="business_entity" path="entityType" label="Entity Type" options={[
            { value: 'llc', label: 'LLC' },
            { value: 's_corp', label: 'S-Corp' },
            { value: 'c_corp', label: 'C-Corp' },
            { value: 'sole_proprietor', label: 'Sole Proprietor' },
            { value: 'partnership', label: 'Partnership' },
          ]} />
          <TextField column="business_entity" path="ein" label="EIN / Tax ID" placeholder="XX-XXXXXXX" />
          <TextField column="business_entity" path="stateOfFormation" label="State of Formation" />
          <TextField column="business_entity" path="countryOfFormation" label="Country" />
          <TextField column="business_entity" path="businessAddress" label="Business Address" />
          <TextField column="business_entity" path="mailingAddress" label="Mailing Address" />
          <TextField column="business_entity" path="businessPhone" label="Phone" />
          <TextField column="business_entity" path="businessEmail" label="Email" />
          <TextField column="business_entity" path="yearFormed" label="Year Formed" type="number" />
          <TextField column="business_entity" path="registeredAgent" label="Registered Agent" />
        </>
      );

    case 'keyContacts':
      return <KeyContactsSection artist={artist} saveField={saveField} />;

    case 'taxCompliance':
      return (
        <>
          <TextField column="tax_compliance" path="taxClassification" label="Tax Classification" />
          <TextField column="tax_compliance" path="vatNumber" label="VAT Number" />
          <TextField column="tax_compliance" path="vatCountry" label="VAT Country" />
          <TextField column="tax_compliance" path="defaultWithholdingPct" label="Default Withholding %" type="number" />
          <TextAreaField column="tax_compliance" path="notes" label="Notes" />
        </>
      );

    case 'insurance':
      return <InsuranceSection artist={artist} saveField={saveField} />;

    case 'technicalProduction':
      return (
        <>
          <TextField column="technical_production" path="fohConsolePreference" label="FOH Console" placeholder="e.g. Avid S6L, DigiCo SD12" />
          <TextField column="technical_production" path="monitorConsolePreference" label="Monitor Console" />
          <TextField column="technical_production" path="iemSystem" label="IEM System" />
          <TextAreaField column="technical_production" path="backlineRequirements" label="Backline" />
          <TextAreaField column="technical_production" path="lightingRequirements" label="Lighting" />
          <TextAreaField column="technical_production" path="videoRequirements" label="Video" />
          <TextField column="technical_production" path="powerRequirements" label="Power" />
          <TextField column="technical_production" path="stageMinWidth" label="Min Stage Width" />
          <TextField column="technical_production" path="stageMinDepth" label="Min Stage Depth" />
          <TextField column="technical_production" path="riggingNeeds" label="Rigging" />
          <TextField column="technical_production" path="sfxNeeds" label="SFX" />
          <TextField column="technical_production" path="setLength" label="Set Length (min)" type="number" />
          <TextField column="technical_production" path="changeover" label="Changeover (min)" type="number" />
          <TextAreaField column="technical_production" path="notes" label="Notes" />
        </>
      );

    case 'hospitalityRider':
      return (
        <>
          <TextAreaField column="hospitality_rider" path="dressingRoomRequirements" label="Dressing Room" />
          <TextAreaField column="hospitality_rider" path="hospitalityRequirements" label="Hospitality" />
          <TextAreaField column="hospitality_rider" path="cateringRequirements" label="Catering" />
          <TextAreaField column="hospitality_rider" path="greenRoomRequirements" label="Green Room" />
          <TextField column="hospitality_rider" path="towelCount" label="Towels" type="number" />
          <TextField column="hospitality_rider" path="buyoutAmount" label="Buyout Amount" type="number" />
          <SelectField column="hospitality_rider" path="buyoutCurrency" label="Buyout Currency" options={[
            { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' },
            { value: 'GBP', label: 'GBP' }, { value: 'CAD', label: 'CAD' },
            { value: 'AUD', label: 'AUD' },
          ]} />
          <TextAreaField column="hospitality_rider" path="dietaryNotes" label="Dietary Notes" />
          <TextAreaField column="hospitality_rider" path="alcoholPreferences" label="Alcohol" />
          <TextAreaField column="hospitality_rider" path="notes" label="Notes" />
        </>
      );

    case 'promoMarketing':
      return (
        <>
          <TextField column="promo_marketing" path="websiteUrl" label="Website" placeholder="https://" />
          <TextField column="promo_marketing" path="spotifyUrl" label="Spotify" placeholder="https://open.spotify.com/artist/..." />
          <TextField column="promo_marketing" path="instagramUrl" label="Instagram" placeholder="https://instagram.com/..." />
          <TextField column="promo_marketing" path="tiktokUrl" label="TikTok" />
          <TextField column="promo_marketing" path="youtubeUrl" label="YouTube" />
          <TextField column="promo_marketing" path="facebookUrl" label="Facebook" />
          <TextField column="promo_marketing" path="twitterUrl" label="Twitter/X" />
          <TextField column="promo_marketing" path="appleMusicUrl" label="Apple Music" />
          <TextField column="promo_marketing" path="bandcampUrl" label="Bandcamp" />
          <TextField column="promo_marketing" path="epkUrl" label="EPK URL" />
          <TextAreaField column="promo_marketing" path="bioShort" label="Short Bio" placeholder="1-2 sentences" />
          <TextAreaField column="promo_marketing" path="bioLong" label="Full Bio" />
          <TextAreaField column="promo_marketing" path="notes" label="Notes" />
        </>
      );

    case 'merchDefaults':
      return (
        <>
          <TextField column="merch_defaults" path="vendorName" label="Vendor Name" />
          <TextField column="merch_defaults" path="vendorContact" label="Vendor Contact" />
          <TextField column="merch_defaults" path="vendorEmail" label="Vendor Email" />
          <TextField column="merch_defaults" path="vendorPhone" label="Vendor Phone" />
          <TextField column="merch_defaults" path="defaultCommissionPct" label="Default Commission %" type="number" />
          <SelectField column="merch_defaults" path="settlementPreference" label="Settlement Pref" options={[
            { value: 'cash', label: 'Cash' },
            { value: 'check', label: 'Check' },
            { value: 'wire', label: 'Wire' },
          ]} />
          <TextField column="merch_defaults" path="shippingAddress" label="Shipping Address" />
          <TextAreaField column="merch_defaults" path="notes" label="Notes" />
        </>
      );

    case 'vehiclesEquipment':
      return (
        <>
          <TextField column="vehicles_equipment" path="storageLocation" label="Storage Location" />
          <TextAreaField column="vehicles_equipment" path="notes" label="Notes" placeholder="Vehicles, trailers, major equipment" />
        </>
      );

    case 'roster':
      return <RosterSection artist={artist} saveField={saveField} />;

    default:
      return <p style={{ color: '#888880', fontSize: 13 }}>Section not yet implemented.</p>;
  }
}

// ─── Key Contacts Sub-Component ─────────────────────────────────────────────

function KeyContactsSection({ artist, saveField }: { artist: any; saveField: (f: string, v: unknown) => void }) {
  const contacts: KeyContact[] = artist?.key_contacts || [];

  const addContact = () => {
    const newContact: KeyContact = {
      id: crypto.randomUUID(),
      name: '', company: null, role: 'other', roleLabel: null,
      email: null, phone: null, commissionPct: null, commissionType: null,
      contractStart: null, contractEnd: null, notes: null,
    };
    saveField('key_contacts', [...contacts, newContact]);
  };

  const updateContact = (id: string, field: keyof KeyContact, value: unknown) => {
    const updated = contacts.map((c) => c.id === id ? { ...c, [field]: value } : c);
    saveField('key_contacts', updated);
  };

  const removeContact = (id: string) => {
    saveField('key_contacts', contacts.filter((c) => c.id !== id));
  };

  const roleOptions = [
    { value: 'manager', label: 'Manager' },
    { value: 'booking_agent', label: 'Booking Agent' },
    { value: 'business_manager', label: 'Business Manager' },
    { value: 'attorney', label: 'Attorney' },
    { value: 'publicist', label: 'Publicist' },
    { value: 'label_rep', label: 'Label Rep' },
    { value: 'publisher', label: 'Publisher' },
    { value: 'co_manager', label: 'Co-Manager' },
    { value: 'sub_agent', label: 'Sub-Agent' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div>
      {contacts.map((contact) => (
        <div key={contact.id} style={{ border: '1px solid #f0f0ec', borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px 40px', gap: 8, marginBottom: 8 }}>
            <input style={inputStyle} value={contact.name} placeholder="Name" onChange={(e) => updateContact(contact.id, 'name', e.target.value)} />
            <input style={inputStyle} value={contact.company || ''} placeholder="Company" onChange={(e) => updateContact(contact.id, 'company', e.target.value || null)} />
            <select style={selectStyle} value={contact.role} onChange={(e) => updateContact(contact.id, 'role', e.target.value)}>
              {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button style={{ ...btnStyle, color: '#c0392b', padding: '4px' }} onClick={() => removeContact(contact.id)}>&times;</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 8 }}>
            <input style={inputStyle} value={contact.email || ''} placeholder="Email" onChange={(e) => updateContact(contact.id, 'email', e.target.value || null)} />
            <input style={inputStyle} value={contact.phone || ''} placeholder="Phone" onChange={(e) => updateContact(contact.id, 'phone', e.target.value || null)} />
            <input style={inputStyle} value={contact.commissionPct ?? ''} placeholder="Comm %" type="number" onChange={(e) => updateContact(contact.id, 'commissionPct', e.target.value ? parseFloat(e.target.value) : null)} />
          </div>
        </div>
      ))}
      <button style={{ ...primaryBtnStyle, fontSize: 12, padding: '6px 12px' }} onClick={addContact}>+ Add Contact</button>
    </div>
  );
}

// ─── Insurance Sub-Component ────────────────────────────────────────────────

function InsuranceSection({ artist, saveField }: { artist: any; saveField: (f: string, v: unknown) => void }) {
  const insurance: InsuranceInfo = artist?.insurance || { policies: [], notes: null };

  const addPolicy = () => {
    const newPolicy: InsurancePolicy = {
      id: crypto.randomUUID(), type: 'general_liability',
      carrier: null, policyNumber: null, coverageAmount: null,
      deductible: null, effectiveDate: null, expirationDate: null, notes: null,
    };
    saveField('insurance', { ...insurance, policies: [...insurance.policies, newPolicy] });
  };

  const updatePolicy = (id: string, field: keyof InsurancePolicy, value: unknown) => {
    const updated = insurance.policies.map((p) => p.id === id ? { ...p, [field]: value } : p);
    saveField('insurance', { ...insurance, policies: updated });
  };

  const removePolicy = (id: string) => {
    saveField('insurance', { ...insurance, policies: insurance.policies.filter((p) => p.id !== id) });
  };

  const typeOptions = [
    { value: 'general_liability', label: 'General Liability' },
    { value: 'workers_comp', label: "Workers' Comp" },
    { value: 'equipment', label: 'Equipment' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'cancellation', label: 'Cancellation' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div>
      {insurance.policies.map((policy) => (
        <div key={policy.id} style={{ border: '1px solid #f0f0ec', borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 40px', gap: 8, marginBottom: 8 }}>
            <select style={selectStyle} value={policy.type} onChange={(e) => updatePolicy(policy.id, 'type', e.target.value)}>
              {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input style={inputStyle} value={policy.carrier || ''} placeholder="Carrier" onChange={(e) => updatePolicy(policy.id, 'carrier', e.target.value || null)} />
            <input style={inputStyle} value={policy.policyNumber || ''} placeholder="Policy #" onChange={(e) => updatePolicy(policy.id, 'policyNumber', e.target.value || null)} />
            <button style={{ ...btnStyle, color: '#c0392b', padding: '4px' }} onClick={() => removePolicy(policy.id)}>&times;</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
            <input style={inputStyle} value={policy.coverageAmount ?? ''} placeholder="Coverage $" type="number" onChange={(e) => updatePolicy(policy.id, 'coverageAmount', e.target.value ? parseFloat(e.target.value) : null)} />
            <input style={inputStyle} value={policy.deductible ?? ''} placeholder="Deductible $" type="number" onChange={(e) => updatePolicy(policy.id, 'deductible', e.target.value ? parseFloat(e.target.value) : null)} />
            <input style={inputStyle} value={policy.effectiveDate || ''} placeholder="Effective" type="date" onChange={(e) => updatePolicy(policy.id, 'effectiveDate', e.target.value || null)} />
            <input style={inputStyle} value={policy.expirationDate || ''} placeholder="Expires" type="date" onChange={(e) => updatePolicy(policy.id, 'expirationDate', e.target.value || null)} />
          </div>
        </div>
      ))}
      <button style={{ ...primaryBtnStyle, fontSize: 12, padding: '6px 12px' }} onClick={addPolicy}>+ Add Policy</button>
    </div>
  );
}

// ─── Roster Sub-Component ───────────────────────────────────────────────────

function RosterSection({ artist, saveField }: { artist: any; saveField: (f: string, v: unknown) => void }) {
  const roster: RosterEntry[] = artist?.default_roster || [];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addMember = () => {
    const newMember: RosterEntry = {
      id: crypto.randomUUID(),
      legalName: '', preferredName: null, profilePhoto: null, role: '',
      dateOfBirth: null, nationalities: [], primaryLanguages: [],
      email: null, phone: null, secondaryPhone: null, preferredContactMethod: null,
      emergencyContactName: null, emergencyRelationship: null, emergencyPhone: null,
      emergencyEmail: null, bloodType: null, medicalConditions: null,
      passportNumber: null, passportCountry: null, passportExpiration: null,
      secondPassportNumber: null, visaNotes: null, knownTravelerNumber: null,
      homeAddress: null, preferredHomeAirport: null,
      seatPreference: null, flightClass: null, frequentFlier: [],
      bunkPreference: null, ownRoom: null, roomType: null,
      smokingPreference: null, floorPreference: null, canDrive: null, driversLicenseOnFile: false,
      foodAllergies: [], dietaryRestrictions: [], mealNotes: null, nonFoodAllergies: null,
      tshirtSize: null, hoodiSize: null, jacketSize: null, hatSize: null,
      shoeSize: null, genderFit: null,
      showDayRate: null, offDayRate: null, travelDayRate: null, perDiemRate: null,
      payType: null, taxWithholdingStatus: null, taxIdOnFile: false,
      cdl: false, pyroLicense: false, riggingCert: false, forkliftCert: false,
      firstAidCert: false, otherCerts: null, yearsExperience: null,
      resumeUrl: null, portfolioUrl: null,
      birthday: null, hobbies: null, dndPreferences: null, privateNotes: null,
    };
    saveField('default_roster', [...roster, newMember]);
    setExpandedId(newMember.id);
  };

  const updateMember = (id: string, field: keyof RosterEntry, value: unknown) => {
    const updated = roster.map((m) => m.id === id ? { ...m, [field]: value } : m);
    saveField('default_roster', updated);
  };

  const removeMember = (id: string) => {
    if (!confirm('Remove this person from the default roster?')) return;
    saveField('default_roster', roster.filter((m) => m.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#888880', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8, borderBottom: '1px solid #f0f0ec', paddingBottom: 4 }}>
        {title}
      </div>
      {children}
    </div>
  );

  const MemberField = ({ member, field, label, placeholder, type }: {
    member: RosterEntry; field: keyof RosterEntry; label: string; placeholder?: string; type?: string;
  }) => (
    <div style={fieldRowStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        style={inputStyle}
        type={type || 'text'}
        value={(member[field] as string | number) ?? ''}
        placeholder={placeholder}
        onChange={(e) => {
          const val = type === 'number' ? (e.target.value ? parseFloat(e.target.value) : null) : (e.target.value || null);
          updateMember(member.id, field, val);
        }}
      />
    </div>
  );

  return (
    <div>
      {roster.map((member) => {
        const isOpen = expandedId === member.id;
        return (
          <div key={member.id} style={{ border: '1px solid #e0e0da', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', background: isOpen ? '#f5f5f2' : '#fff' }}
              onClick={() => setExpandedId(isOpen ? null : member.id)}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{member.legalName || 'Unnamed'}</span>
                {member.preferredName && <span style={{ color: '#888880', fontSize: 12, marginLeft: 6 }}>({member.preferredName})</span>}
                <span style={{ color: '#888880', fontSize: 12, marginLeft: 8 }}>{member.role || 'No role'}</span>
              </div>
              <span style={{ color: '#888880' }}>{isOpen ? '\u25BE' : '\u25B8'}</span>
            </div>

            {isOpen && (
              <div style={{ padding: '0 14px 14px' }}>
                <SubSection title="Identity & Basics">
                  <MemberField member={member} field="legalName" label="Legal Name" />
                  <MemberField member={member} field="preferredName" label="Preferred Name" />
                  <MemberField member={member} field="role" label="Role" />
                  <MemberField member={member} field="dateOfBirth" label="Date of Birth" type="date" />
                </SubSection>

                <SubSection title="Contact">
                  <MemberField member={member} field="email" label="Email" />
                  <MemberField member={member} field="phone" label="Phone" />
                  <MemberField member={member} field="secondaryPhone" label="Secondary Phone" />
                </SubSection>

                <SubSection title="Emergency Contact">
                  <MemberField member={member} field="emergencyContactName" label="Name" />
                  <MemberField member={member} field="emergencyRelationship" label="Relationship" />
                  <MemberField member={member} field="emergencyPhone" label="Phone" />
                </SubSection>

                <SubSection title="Travel Documents">
                  <MemberField member={member} field="passportNumber" label="Passport #" />
                  <MemberField member={member} field="passportCountry" label="Country" />
                  <MemberField member={member} field="passportExpiration" label="Expiration" type="date" />
                  <MemberField member={member} field="knownTravelerNumber" label="Known Traveler #" />
                  <MemberField member={member} field="preferredHomeAirport" label="Home Airport" placeholder="e.g. ATX, LAX" />
                </SubSection>

                <SubSection title="Travel Preferences">
                  <MemberField member={member} field="seatPreference" label="Seat Pref" placeholder="aisle / window" />
                  <MemberField member={member} field="bunkPreference" label="Bunk Pref" placeholder="top / bottom" />
                </SubSection>

                <SubSection title="Dietary & Health">
                  <MemberField member={member} field="mealNotes" label="Meal Notes" />
                  <MemberField member={member} field="nonFoodAllergies" label="Allergies" />
                </SubSection>

                <SubSection title="Apparel">
                  <MemberField member={member} field="tshirtSize" label="T-Shirt" placeholder="S/M/L/XL/XXL" />
                  <MemberField member={member} field="shoeSize" label="Shoe Size" />
                </SubSection>

                <SubSection title="Pay & Financial">
                  <MemberField member={member} field="showDayRate" label="Show Day Rate" type="number" />
                  <MemberField member={member} field="offDayRate" label="Off Day Rate" type="number" />
                  <MemberField member={member} field="travelDayRate" label="Travel Day Rate" type="number" />
                  <MemberField member={member} field="perDiemRate" label="Per Diem" type="number" />
                </SubSection>

                <div style={{ marginTop: 16, textAlign: 'right' as const }}>
                  <button style={{ ...btnStyle, color: '#c0392b', borderColor: '#c0392b' }} onClick={() => removeMember(member.id)}>
                    Remove from Roster
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button style={{ ...primaryBtnStyle, fontSize: 12, padding: '6px 12px' }} onClick={addMember}>+ Add Roster Member</button>
    </div>
  );
}

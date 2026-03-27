/**
 * RosterPanel — Tour-level roster management UI
 *
 * Renders as a collapsible panel on the tour routing page (same pattern as Vehicle Settings).
 * Handles: add/remove roster members, assign roles, stack pay components.
 * Saves to tours_routing.tour_roster JSONB via PUT.
 *
 * Usage:
 *   <RosterPanel tourId={tourId} roster={roster} currencyRates={rates} onUpdate={handleRosterUpdate} />
 */

'use client';

import React, { useState, useCallback } from 'react';
import type {
  RosterMember,
  PayComponent,
  PayComponentType,
  DayType,
} from '@/lib/tourrouter/personnelPay';

// ─── Props ───────────────────────────────────────────────────────────────────

interface RosterPanelProps {
  tourId: string;
  roster: RosterMember[];
  onUpdate: (roster: RosterMember[]) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  'Singer', 'Guitarist', 'Bassist', 'Drummer', 'Keys', 'Multi-Instrumentalist',
  'FOH Engineer', 'Monitor Engineer', 'Lighting Director', 'Guitar Tech',
  'Drum Tech', 'Bass Tech', 'Backline Tech', 'Tour Manager', 'Production Manager',
  'Road Manager', 'Merch Manager', 'Stage Manager', 'Driver', 'Security',
  'Photographer', 'Videographer', 'VJ', 'Other',
];

const PAY_TYPE_LABELS: Record<PayComponentType, string> = {
  per_show: 'Per Show Day',
  per_week: 'Per Week',
  per_day: 'Per Day (all days)',
  flat_tour: 'Flat Tour',
  per_diem: 'Per Diem',
  pct_merch: '% of Merch Net',
  pct_net: '% of Net Income',
  base_bonus: 'Base + Bonus',
};

const DAY_TYPE_LABELS: Record<DayType, string> = {
  show_day: 'Show',
  off_day: 'Off',
  travel_day: 'Travel',
  load_in_day: 'Load-In',
};

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SEK', 'CHF', 'JPY', 'NZD', 'MXN'];

// ─── Component ───────────────────────────────────────────────────────────────

export default function RosterPanel({
  tourId,
  roster,
  onUpdate,
}: RosterPanelProps) {
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newCategory, setNewCategory] = useState<'band' | 'crew'>('band');

  // ─── Save to API ──────────────────────────────────────────────────────

  const saveRoster = useCallback(
    async (updated: RosterMember[]) => {
      setSaving(true);
      try {
        await fetch(`/api/tourrouter/tours/${tourId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tour_roster: updated }),
        });
        onUpdate(updated);
      } catch (e) {
        console.error('Roster save failed:', e);
      } finally {
        setSaving(false);
      }
    },
    [tourId, onUpdate]
  );

  // ─── Add Member ──────────────────────────────────────────────────────

  const addMember = () => {
    if (!newName.trim() || !newRole.trim()) return;

    const member: RosterMember = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      role: newRole.trim(),
      roleCategory: newCategory,
      payComponents: [
        {
          type: 'per_show',
          amount: 0,
          currency: 'USD',
          appliesTo: ['show_day'],
        },
      ],
      isActive: true,
    };

    const updated = [...roster, member];
    saveRoster(updated);
    setNewName('');
    setNewRole('');
    setAddingNew(false);
    setEditingMemberId(member.id);
  };

  // ─── Remove Member ───────────────────────────────────────────────────

  const removeMember = (id: string) => {
    const updated = roster.filter((m) => m.id !== id);
    saveRoster(updated);
    if (editingMemberId === id) setEditingMemberId(null);
  };

  // ─── Toggle Active ───────────────────────────────────────────────────

  const toggleActive = (id: string) => {
    const updated = roster.map((m) =>
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    saveRoster(updated);
  };

  // ─── Update Member Field ─────────────────────────────────────────────

  const updateMember = (id: string, field: keyof RosterMember, value: unknown) => {
    const updated = roster.map((m) =>
      m.id === id ? { ...m, [field]: value } : m
    );
    saveRoster(updated);
  };

  // ─── Pay Component Handlers ──────────────────────────────────────────

  const addPayComponent = (memberId: string) => {
    const member = roster.find((m) => m.id === memberId);
    if (!member) return;

    const newComp: PayComponent = {
      type: 'per_show',
      amount: 0,
      currency: 'USD',
      appliesTo: ['show_day'],
    };

    const updated = roster.map((m) =>
      m.id === memberId
        ? { ...m, payComponents: [...m.payComponents, newComp] }
        : m
    );
    saveRoster(updated);
  };

  const removePayComponent = (memberId: string, compIndex: number) => {
    const updated = roster.map((m) =>
      m.id === memberId
        ? { ...m, payComponents: m.payComponents.filter((_, i) => i !== compIndex) }
        : m
    );
    saveRoster(updated);
  };

  const updatePayComponent = (
    memberId: string,
    compIndex: number,
    field: keyof PayComponent,
    value: unknown
  ) => {
    const updated = roster.map((m) => {
      if (m.id !== memberId) return m;
      const comps = [...m.payComponents];
      comps[compIndex] = { ...comps[compIndex], [field]: value };

      // Auto-set appliesTo based on type
      if (field === 'type') {
        const type = value as PayComponentType;
        if (type === 'per_show') comps[compIndex].appliesTo = ['show_day'];
        else if (type === 'per_day') comps[compIndex].appliesTo = ['show_day', 'off_day', 'travel_day', 'load_in_day'];
        else if (type === 'per_diem') comps[compIndex].appliesTo = ['show_day', 'off_day', 'travel_day', 'load_in_day'];
        else if (type === 'flat_tour') comps[compIndex].appliesTo = [];
        else if (type === 'pct_merch') comps[compIndex].appliesTo = [];
        else if (type === 'pct_net') comps[compIndex].appliesTo = [];
      }

      return { ...m, payComponents: comps };
    });
    saveRoster(updated);
  };

  // ─── Styles ──────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    border: '1px solid #e0e0da', borderRadius: 8, padding: 12,
    marginBottom: 8, background: '#fff',
  };
  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, cursor: 'pointer',
  };
  const nameStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: '#1a1a18' };
  const roleStyle: React.CSSProperties = { fontSize: 12, color: '#888880' };
  const tagStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-block', padding: '2px 6px', borderRadius: 4,
    fontSize: 10, fontWeight: 600,
    background: active ? '#e8f5e9' : '#fce4ec',
    color: active ? '#1a6b3c' : '#c0392b',
    marginLeft: 8,
  });
  const categoryTagStyle = (cat: 'band' | 'crew'): React.CSSProperties => ({
    display: 'inline-block', padding: '2px 6px', borderRadius: 4,
    fontSize: 10, fontWeight: 600,
    background: cat === 'band' ? '#e3f2fd' : '#fff3e0',
    color: cat === 'band' ? '#1a5fa6' : '#b35c00',
    marginLeft: 8,
  });
  const inputStyle: React.CSSProperties = {
    padding: '4px 8px', border: '1px solid #e0e0da', borderRadius: 4,
    fontSize: 13, background: '#fff',
  };
  const smallInputStyle: React.CSSProperties = {
    ...inputStyle, width: 90, textAlign: 'right' as const,
    fontFamily: 'DM Mono, monospace',
  };
  const selectStyle: React.CSSProperties = {
    ...inputStyle, minWidth: 120,
  };
  const btnStyle: React.CSSProperties = {
    padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600,
    border: '1px solid #e0e0da', background: '#fff', color: '#1a1a18',
    cursor: 'pointer',
  };
  const addBtnStyle: React.CSSProperties = {
    ...btnStyle, background: '#1a6b3c', color: '#fff', border: 'none',
  };
  const dangerBtnStyle: React.CSSProperties = {
    ...btnStyle, color: '#c0392b', borderColor: '#c0392b',
  };
  const compRowStyle: React.CSSProperties = {
    display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0',
    borderBottom: '1px solid #f0f0ec', flexWrap: 'wrap' as const,
  };
  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const,
    color: '#888880', letterSpacing: '0.05em', marginTop: 12, marginBottom: 6,
  };

  // ─── Render ──────────────────────────────────────────────────────────

  const bandMembers = roster.filter((m) => m.roleCategory === 'band');
  const crewMembers = roster.filter((m) => m.roleCategory === 'crew');

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a18' }}>
          Tour Roster
          <span style={{ fontSize: 12, fontWeight: 400, color: '#888880', marginLeft: 8 }}>
            {roster.length} member{roster.length !== 1 ? 's' : ''}
          </span>
          {saving && <span style={{ fontSize: 11, color: '#888880', marginLeft: 8 }}>Saving...</span>}
        </div>
        <button style={addBtnStyle} onClick={() => setAddingNew(true)}>
          + Add Member
        </button>
      </div>

      {/* ── Add New Form ────────────────────────────────────────── */}
      {addingNew && (
        <div style={{ ...cardStyle, background: '#f5f5f2', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <input
              style={{ ...inputStyle, flex: 1, minWidth: 150 }}
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <select
              style={selectStyle}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="">Role...</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              style={{ ...selectStyle, minWidth: 80 }}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as 'band' | 'crew')}
            >
              <option value="band">Band</option>
              <option value="crew">Crew</option>
            </select>
            <button style={addBtnStyle} onClick={addMember}>Add</button>
            <button style={btnStyle} onClick={() => setAddingNew(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Band Section ────────────────────────────────────────── */}
      {bandMembers.length > 0 && (
        <>
          <div style={sectionLabel}>Band ({bandMembers.length})</div>
          {bandMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isExpanded={editingMemberId === member.id}
              onToggle={() => setEditingMemberId(editingMemberId === member.id ? null : member.id)}
              onRemove={() => removeMember(member.id)}
              onToggleActive={() => toggleActive(member.id)}
              onUpdateMember={(field, value) => updateMember(member.id, field, value)}
              onAddComponent={() => addPayComponent(member.id)}
              onRemoveComponent={(idx) => removePayComponent(member.id, idx)}
              onUpdateComponent={(idx, field, value) => updatePayComponent(member.id, idx, field, value)}
              styles={{ cardStyle, cardHeaderStyle, nameStyle, roleStyle, tagStyle, categoryTagStyle, inputStyle, smallInputStyle, selectStyle, btnStyle, dangerBtnStyle, addBtnStyle, compRowStyle, sectionLabel }}
            />
          ))}
        </>
      )}

      {/* ── Crew Section ────────────────────────────────────────── */}
      {crewMembers.length > 0 && (
        <>
          <div style={sectionLabel}>Crew ({crewMembers.length})</div>
          {crewMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isExpanded={editingMemberId === member.id}
              onToggle={() => setEditingMemberId(editingMemberId === member.id ? null : member.id)}
              onRemove={() => removeMember(member.id)}
              onToggleActive={() => toggleActive(member.id)}
              onUpdateMember={(field, value) => updateMember(member.id, field, value)}
              onAddComponent={() => addPayComponent(member.id)}
              onRemoveComponent={(idx) => removePayComponent(member.id, idx)}
              onUpdateComponent={(idx, field, value) => updatePayComponent(member.id, idx, field, value)}
              styles={{ cardStyle, cardHeaderStyle, nameStyle, roleStyle, tagStyle, categoryTagStyle, inputStyle, smallInputStyle, selectStyle, btnStyle, dangerBtnStyle, addBtnStyle, compRowStyle, sectionLabel }}
            />
          ))}
        </>
      )}

      {/* ── Empty State ─────────────────────────────────────────── */}
      {roster.length === 0 && !addingNew && (
        <div style={{ textAlign: 'center' as const, padding: 32, color: '#888880', fontSize: 14 }}>
          No roster members yet. Click "+ Add Member" to start building your touring crew.
        </div>
      )}
    </div>
  );
}

// ─── MemberCard Sub-Component ───────────────────────────────────────────────

interface MemberCardProps {
  member: RosterMember;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onToggleActive: () => void;
  onUpdateMember: (field: keyof RosterMember, value: unknown) => void;
  onAddComponent: () => void;
  onRemoveComponent: (index: number) => void;
  onUpdateComponent: (index: number, field: keyof PayComponent, value: unknown) => void;
  styles: Record<string, React.CSSProperties | ((arg: any) => React.CSSProperties)>;
}

function MemberCard({
  member,
  isExpanded,
  onToggle,
  onRemove,
  onToggleActive,
  onUpdateMember,
  onAddComponent,
  onRemoveComponent,
  onUpdateComponent,
  styles: s,
}: MemberCardProps) {
  const cardStyle = s.cardStyle as React.CSSProperties;
  const cardHeaderStyle = s.cardHeaderStyle as React.CSSProperties;
  const nameStyle = s.nameStyle as React.CSSProperties;
  const roleStyle = s.roleStyle as React.CSSProperties;
  const tagFn = s.tagStyle as (active: boolean) => React.CSSProperties;
  const catTagFn = s.categoryTagStyle as (cat: 'band' | 'crew') => React.CSSProperties;
  const inputStyle = s.inputStyle as React.CSSProperties;
  const smallInputStyle = s.smallInputStyle as React.CSSProperties;
  const selectStyle = s.selectStyle as React.CSSProperties;
  const btnStyle = s.btnStyle as React.CSSProperties;
  const dangerBtnStyle = s.dangerBtnStyle as React.CSSProperties;
  const addBtnStyle = s.addBtnStyle as React.CSSProperties;
  const compRowStyle = s.compRowStyle as React.CSSProperties;
  const sectionLabel = s.sectionLabel as React.CSSProperties;

  const totalPay = member.payComponents.reduce((sum, c) => {
    if (c.type === 'pct_merch' || c.type === 'pct_net') return sum; // can't preview % types
    return sum + c.amount;
  }, 0);

  return (
    <div style={{ ...cardStyle, opacity: member.isActive ? 1 : 0.5 }}>
      {/* ── Header ────────────────────────────────────────────── */}
      <div style={cardHeaderStyle} onClick={onToggle}>
        <div>
          <span style={nameStyle}>{member.name}</span>
          <span style={catTagFn(member.roleCategory)}>{member.roleCategory}</span>
          <span style={tagFn(member.isActive)}>{member.isActive ? 'Active' : 'Inactive'}</span>
          <div style={roleStyle}>{member.role} &middot; {member.payComponents.length} pay component{member.payComponents.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ fontSize: 13, color: '#888880' }}>
          {isExpanded ? '\u25BE' : '\u25B8'}
        </div>
      </div>

      {/* ── Expanded Detail ───────────────────────────────────── */}
      {isExpanded && (
        <div style={{ paddingTop: 8 }}>
          {/* Member fields */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' as const }}>
            <input
              style={{ ...inputStyle, flex: 1, minWidth: 140 }}
              value={member.name}
              onChange={(e) => onUpdateMember('name', e.target.value)}
              placeholder="Name"
            />
            <select
              style={selectStyle}
              value={member.role}
              onChange={(e) => onUpdateMember('role', e.target.value)}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              style={{ ...selectStyle, minWidth: 80 }}
              value={member.roleCategory}
              onChange={(e) => onUpdateMember('roleCategory', e.target.value)}
            >
              <option value="band">Band</option>
              <option value="crew">Crew</option>
            </select>
          </div>

          {/* Pay Components */}
          <div style={sectionLabel}>
            Pay Components
            <button
              style={{ ...addBtnStyle, marginLeft: 8, padding: '2px 8px', fontSize: 11 }}
              onClick={onAddComponent}
            >
              + Add
            </button>
          </div>

          {member.payComponents.map((comp, idx) => (
            <div key={idx} style={compRowStyle}>
              <select
                style={{ ...selectStyle, minWidth: 140 }}
                value={comp.type}
                onChange={(e) => onUpdateComponent(idx, 'type', e.target.value)}
              >
                {Object.entries(PAY_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>

              <input
                style={smallInputStyle}
                type="text"
                placeholder={comp.type.startsWith('pct_') ? '%' : '$'}
                value={comp.amount || ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value.replace(/,/g, ''));
                  if (!isNaN(val)) onUpdateComponent(idx, 'amount', val);
                }}
              />

              <select
                style={{ ...selectStyle, minWidth: 70, fontSize: 12 }}
                value={comp.currency}
                onChange={(e) => onUpdateComponent(idx, 'currency', e.target.value)}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Day type checkboxes for applicable types */}
              {['per_show', 'per_day', 'per_diem', 'base_bonus'].includes(comp.type) && (
                <div style={{ display: 'flex', gap: 4, fontSize: 11, color: '#888880' }}>
                  {(Object.entries(DAY_TYPE_LABELS) as [DayType, string][]).map(([dt, label]) => (
                    <label key={dt} style={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={comp.appliesTo?.includes(dt) ?? false}
                        onChange={(e) => {
                          const current = comp.appliesTo || [];
                          const updated = e.target.checked
                            ? [...current, dt]
                            : current.filter((d) => d !== dt);
                          onUpdateComponent(idx, 'appliesTo', updated);
                        }}
                        style={{ width: 12, height: 12 }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              )}

              {/* Bonus fields for base_bonus */}
              {comp.type === 'base_bonus' && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#888880' }}>Bonus:</span>
                  <input
                    style={{ ...smallInputStyle, width: 70 }}
                    placeholder="$"
                    value={comp.bonusAmount || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                      onUpdateComponent(idx, 'bonusAmount', val);
                    }}
                  />
                  <select
                    style={{ ...selectStyle, minWidth: 100, fontSize: 11 }}
                    value={comp.bonusCondition || ''}
                    onChange={(e) => onUpdateComponent(idx, 'bonusCondition', e.target.value)}
                  >
                    <option value="">Condition...</option>
                    <option value="sellout">At Sellout</option>
                    <option value="per_show_threshold">Tickets Threshold</option>
                  </select>
                  {comp.bonusCondition === 'per_show_threshold' && (
                    <input
                      style={{ ...smallInputStyle, width: 60 }}
                      placeholder="tix"
                      value={comp.bonusThreshold || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        onUpdateComponent(idx, 'bonusThreshold', val);
                      }}
                    />
                  )}
                </div>
              )}

              <button
                style={{ ...dangerBtnStyle, padding: '2px 6px', fontSize: 11 }}
                onClick={() => onRemoveComponent(idx)}
              >
                &times;
              </button>
            </div>
          ))}

          {member.payComponents.length === 0 && (
            <div style={{ fontSize: 12, color: '#888880', padding: '8px 0' }}>
              No pay components. Click "+ Add" to set up compensation.
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
            <button style={btnStyle} onClick={onToggleActive}>
              {member.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button style={dangerBtnStyle} onClick={() => {
              if (confirm(`Remove ${member.name} from the roster?`)) onRemove();
            }}>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

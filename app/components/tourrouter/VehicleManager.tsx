/**
 * VehicleManager — Multi-vehicle management for tours
 *
 * Replaces the single vehicle settings grid with a multi-vehicle system.
 * Each vehicle has its own specs (fuel type, MPG, passengers, cargo, owned/rented).
 * Searchable vehicle database with autocomplete.
 *
 * Saves to tours_routing.tour_vehicles JSONB array.
 *
 * Usage:
 *   <VehicleManager tourId={tourId} vehicles={vehicles} onUpdate={handleVehiclesUpdate} />
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  searchVehicles,
  getVehicleById,
  VEHICLE_CATEGORY_LABELS,
  type VehicleSpec,
  type VehicleCategory,
} from '@/lib/tourrouter/vehicleDatabase';
import type { TourVehicle } from '@/lib/tourrouter/vehicleTypes';

// ─── Types ───────────────────────────────────────────────────────────────────

export type { TourVehicle } from '@/lib/tourrouter/vehicleTypes';

interface VehicleManagerProps {
  vehicles: TourVehicle[];
  defaultFuelPrice: number;
  onSave: (vehicles: TourVehicle[]) => Promise<void> | void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VehicleManager({
  vehicles,
  defaultFuelPrice,
  onSave,
}: VehicleManagerProps) {
  const [addingNew, setAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VehicleSpec[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search as user types
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setSearchResults(searchVehicles(searchQuery, 8));
      setShowDropdown(true);
    } else {
      setSearchResults(searchVehicles('', 8));
    }
  }, [searchQuery]);

  // ─── Save ──────────────────────────────────────────────────────────

  const saveVehicles = useCallback(
    async (updated: TourVehicle[]) => {
      setSaving(true);
      try {
        await onSave(updated);
      } catch (e) {
        console.error('Vehicle save failed:', e);
      } finally {
        setSaving(false);
      }
    },
    [onSave]
  );

  // ─── Add from Database ────────────────────────────────────────────

  const addFromDatabase = (spec: VehicleSpec) => {
    const newVehicle: TourVehicle = {
      id: crypto.randomUUID(),
      vehicleDbId: spec.id,
      label: `${spec.make} ${spec.model}`,
      make: spec.make,
      model: spec.model,
      category: spec.category,
      fuelType: spec.fuelType,
      mpg: spec.mpg,
      passengers: spec.passengers,
      cargo: spec.cargo,
      ownership: 'rented',
      fuelPricePerGallon: defaultFuelPrice,
      notes: spec.notes || '',
      isActive: true,
    };
    const updated = [...vehicles, newVehicle];
    saveVehicles(updated);
    setAddingNew(false);
    setSearchQuery('');
    setShowDropdown(false);
    setEditingId(newVehicle.id);
  };

  // ─── Add Custom ───────────────────────────────────────────────────

  const addCustomVehicle = () => {
    const newVehicle: TourVehicle = {
      id: crypto.randomUUID(),
      vehicleDbId: null,
      label: searchQuery.trim() || 'Custom Vehicle',
      make: '',
      model: searchQuery.trim() || '',
      category: 'van',
      fuelType: 'gasoline',
      mpg: 15,
      passengers: 5,
      cargo: '',
      ownership: 'rented',
      fuelPricePerGallon: defaultFuelPrice,
      notes: '',
      isActive: true,
    };
    const updated = [...vehicles, newVehicle];
    saveVehicles(updated);
    setAddingNew(false);
    setSearchQuery('');
    setShowDropdown(false);
    setEditingId(newVehicle.id);
  };

  // ─── Remove ───────────────────────────────────────────────────────

  const removeVehicle = (id: string) => {
    const updated = vehicles.filter((v) => v.id !== id);
    saveVehicles(updated);
    if (editingId === id) setEditingId(null);
  };

  // ─── Update Field ─────────────────────────────────────────────────

  const updateVehicle = (id: string, field: keyof TourVehicle, value: unknown) => {
    const updated = vehicles.map((v) =>
      v.id === id ? { ...v, [field]: value } : v
    );
    saveVehicles(updated);
  };

  // ─── Styles ───────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    border: '3px solid var(--hw-border-strong)', padding: 12,
    marginBottom: 8, background: 'var(--hw-bg-surface)',
  };
  const inputStyle: React.CSSProperties = {
    padding: '6px 10px', border: '3px solid var(--hw-border-strong)', boxSizing: 'border-box',
    fontFamily: 'var(--hw-font-body)', fontSize: 13,
    background: 'var(--hw-bg-surface)', outline: 'none',
  };
  const smallInputStyle: React.CSSProperties = {
    ...inputStyle, width: 80, textAlign: 'right' as const,
    fontFamily: 'var(--hw-font-mono)', fontSize: 13,
  };
  const selectStyle: React.CSSProperties = {
    ...inputStyle, minWidth: 100, appearance: 'none' as const,
  };
  const btnStyle: React.CSSProperties = {
    padding: '4px 10px',
    fontFamily: 'var(--hw-font-mono)', fontSize: 9, fontWeight: 700,
    letterSpacing: '1.5px', textTransform: 'uppercase' as const,
    border: '2px solid var(--hw-border-strong)', background: 'var(--hw-bg-surface)',
    color: 'var(--hw-text)', cursor: 'pointer', transition: 'var(--hw-ease)',
  };
  const addBtnStyle: React.CSSProperties = {
    ...btnStyle, background: 'var(--hw-crimson)', color: '#fff',
    border: '2px solid var(--hw-crimson)',
  };
  const dangerBtnStyle: React.CSSProperties = {
    ...btnStyle, color: 'var(--hw-crimson)', borderColor: 'var(--hw-crimson)',
  };
  const catTag = (cat: VehicleCategory): React.CSSProperties => ({
    display: 'inline-block', padding: '3px 8px',
    fontFamily: 'var(--hw-font-mono)', fontSize: 9, fontWeight: 700,
    letterSpacing: '2px', textTransform: 'uppercase' as const,
    background: 'rgba(0,0,0,0.04)', color: 'var(--hw-text-muted)',
    border: '2px solid var(--hw-border)', marginLeft: 6,
  });
  const dropdownStyle: React.CSSProperties = {
    position: 'absolute' as const, top: '100%', left: 0, right: 0,
    background: 'var(--hw-bg-surface)', border: '3px solid var(--hw-border-strong)',
    boxShadow: 'var(--hw-shadow-lg)', maxHeight: 320,
    overflowY: 'auto' as const, zIndex: 100,
  };
  const dropdownItemStyle: React.CSSProperties = {
    padding: '10px 12px', cursor: 'pointer',
    borderBottom: '2px solid var(--hw-border)', fontSize: 13,
    transition: 'var(--hw-ease)',
  };

  // ─── Fuel cost summary ────────────────────────────────────────────

  const activeVehicles = vehicles.filter((v) => v.isActive);
  const totalPassengers = activeVehicles.reduce((sum, v) => sum + v.passengers, 0);

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <span style={{ fontFamily: 'var(--hw-font-display)', fontSize: 22, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--hw-text)' }}>VEHICLES</span>
          <span style={{ fontFamily: 'var(--hw-font-mono)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--hw-text-muted)', marginLeft: 12 }}>
            {activeVehicles.length} active &middot; {totalPassengers} total seats
          </span>
          {saving && <span style={{ fontFamily: 'var(--hw-font-mono)', fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--hw-text-muted)', marginLeft: 8 }}>SAVING...</span>}
        </div>
        <button style={addBtnStyle} onClick={() => setAddingNew(true)}>
          + ADD VEHICLE
        </button>
      </div>

      {/* ── Search + Add ────────────────────────────────────────── */}
      {addingNew && (
        <div ref={searchRef} style={{ position: 'relative' as const, marginBottom: 16 }}>
          <input
            style={{ ...inputStyle, width: '100%', padding: '8px 12px', fontSize: 14 }}
            placeholder="Search vehicles... (e.g. Sprinter, Ford E-350, sleeper bus)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            autoFocus
          />
          {showDropdown && (
            <div style={dropdownStyle}>
              {searchResults.map((spec) => (
                <div
                  key={spec.id}
                  style={dropdownItemStyle}
                  onClick={() => addFromDatabase(spec)}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'var(--hw-crimson-ghost)'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'var(--hw-bg-surface)'; }}
                >
                  <div style={{ fontFamily: 'var(--hw-font-body)', fontWeight: 500, color: 'var(--hw-text)' }}>
                    {spec.make} {spec.model}
                    <span style={catTag(spec.category)}>
                      {VEHICLE_CATEGORY_LABELS[spec.category]}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--hw-font-mono)', fontSize: 10, letterSpacing: '1px', color: 'var(--hw-text-muted)', marginTop: 2 }}>
                    {spec.fuelType} &middot; {spec.mpg} MPG &middot; {spec.passengers} pax
                    {spec.notes && ` &middot; ${spec.notes}`}
                  </div>
                </div>
              ))}
              <div
                style={{ ...dropdownItemStyle, borderBottom: 'none', fontFamily: 'var(--hw-font-mono)', fontSize: 11, letterSpacing: '1px', color: 'var(--hw-crimson)', fontWeight: 700 }}
                onClick={addCustomVehicle}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'var(--hw-crimson-ghost)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'var(--hw-bg-surface)'; }}
              >
                + Add custom vehicle{searchQuery ? `: "${searchQuery}"` : ''}
              </div>
            </div>
          )}
          <div style={{ marginTop: 4 }}>
            <button style={btnStyle} onClick={() => { setAddingNew(false); setSearchQuery(''); setShowDropdown(false); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Vehicle Cards ───────────────────────────────────────── */}
      {vehicles.map((vehicle) => {
        const isExpanded = editingId === vehicle.id;
        return (
          <div key={vehicle.id} style={{ ...cardStyle, opacity: vehicle.isActive ? 1 : 0.5 }}>
            {/* Card header */}
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setEditingId(isExpanded ? null : vehicle.id)}
            >
              <div>
                <span style={{ fontFamily: 'var(--hw-font-display)', fontSize: 18, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--hw-text)' }}>
                  {vehicle.label}
                </span>
                <span style={catTag(vehicle.category)}>
                  {VEHICLE_CATEGORY_LABELS[vehicle.category]}
                </span>
                <span style={{ fontFamily: 'var(--hw-font-mono)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--hw-text-muted)', marginLeft: 8 }}>
                  {vehicle.mpg} MPG &middot; {vehicle.passengers} pax &middot; {vehicle.fuelType}
                  &middot; {vehicle.ownership}
                </span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--hw-text-muted)' }}>
                {isExpanded ? '\u25BE' : '\u25B8'}
              </span>
            </div>

            {/* Expanded edit form */}
            {isExpanded && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                <div>
                  <div style={{ fontFamily: 'var(--hw-font-mono)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'var(--hw-text-muted)', marginBottom: 4 }}>Label</div>
                  <input
                    style={{ ...inputStyle, width: '100%' }}
                    value={vehicle.label}
                    onChange={(e) => updateVehicle(vehicle.id, 'label', e.target.value)}
                    placeholder="e.g. Band Van"
                  />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--hw-font-mono)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'var(--hw-text-muted)', marginBottom: 4 }}>Category</div>
                  <select
                    style={{ ...selectStyle, width: '100%' }}
                    value={vehicle.category}
                    onChange={(e) => updateVehicle(vehicle.id, 'category', e.target.value)}
                  >
                    {Object.entries(VEHICLE_CATEGORY_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--hw-font-mono)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'var(--hw-text-muted)', marginBottom: 4 }}>Fuel Type</div>
                  <select
                    style={{ ...selectStyle, width: '100%' }}
                    value={vehicle.fuelType}
                    onChange={(e) => updateVehicle(vehicle.id, 'fuelType', e.target.value)}
                  >
                    <option value="gasoline">Gasoline</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--hw-font-mono)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'var(--hw-text-muted)', marginBottom: 4 }}>Ownership</div>
                  <select
                    style={{ ...selectStyle, width: '100%' }}
                    value={vehicle.ownership}
                    onChange={(e) => updateVehicle(vehicle.id, 'ownership', e.target.value)}
                  >
                    <option value="rented">Rented</option>
                    <option value="owned">Owned</option>
                    <option value="leased">Leased</option>
                    <option value="provided">Provided</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--hw-font-mono)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'var(--hw-text-muted)', marginBottom: 4 }}>MPG</div>
                  <input
                    style={{ ...smallInputStyle, width: '100%' }}
                    type="number"
                    value={vehicle.mpg}
                    onChange={(e) => updateVehicle(vehicle.id, 'mpg', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--hw-font-mono)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'var(--hw-text-muted)', marginBottom: 4 }}>Passengers</div>
                  <input
                    style={{ ...smallInputStyle, width: '100%' }}
                    type="number"
                    value={vehicle.passengers}
                    onChange={(e) => updateVehicle(vehicle.id, 'passengers', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--hw-font-mono)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'var(--hw-text-muted)', marginBottom: 4 }}>Fuel $/gal</div>
                  <input
                    style={{ ...smallInputStyle, width: '100%' }}
                    type="number"
                    step="0.01"
                    value={vehicle.fuelPricePerGallon}
                    onChange={(e) => updateVehicle(vehicle.id, 'fuelPricePerGallon', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--hw-font-mono)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'var(--hw-text-muted)', marginBottom: 4 }}>Make / Model</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                      value={vehicle.make}
                      onChange={(e) => updateVehicle(vehicle.id, 'make', e.target.value)}
                      placeholder="Make"
                    />
                    <input
                      style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                      value={vehicle.model}
                      onChange={(e) => updateVehicle(vehicle.id, 'model', e.target.value)}
                      placeholder="Model"
                    />
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontFamily: 'var(--hw-font-mono)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'var(--hw-text-muted)', marginBottom: 4 }}>Notes</div>
                  <input
                    style={{ ...inputStyle, width: '100%' }}
                    value={vehicle.notes}
                    onChange={(e) => updateVehicle(vehicle.id, 'notes', e.target.value)}
                    placeholder="e.g. Rental from Bandago, pickup in Nashville"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  <button
                    style={btnStyle}
                    onClick={() => updateVehicle(vehicle.id, 'isActive', !vehicle.isActive)}
                  >
                    {vehicle.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    style={dangerBtnStyle}
                    onClick={() => {
                      if (confirm(`Remove ${vehicle.label}?`)) removeVehicle(vehicle.id);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Empty State ─────────────────────────────────────────── */}
      {vehicles.length === 0 && !addingNew && (
        <div style={{ textAlign: 'center' as const, padding: 32, border: '3px dashed var(--hw-border-light)' }}>
          <div style={{ fontFamily: 'var(--hw-font-display)', fontSize: 24, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--hw-text)', marginBottom: 8 }}>NO VEHICLES</div>
          <div style={{ fontFamily: 'var(--hw-font-body)', fontSize: 14, fontWeight: 300, color: 'var(--hw-text-muted)' }}>Click &quot;+ Add Vehicle&quot; and search for your touring vehicle.</div>
        </div>
      )}
    </div>
  );
}

/**
 * Master Artist Profile — Type Definitions
 *
 * 10 sections covering the full business and touring operation.
 * Stored as JSONB columns on the artists table.
 * Progressive entry — nothing required except artist name + one roster member.
 *
 * Usage:
 *   import type { ArtistProfile, BusinessEntity, RosterEntry } from '@/lib/tourrouter/artistProfileTypes';
 */

// ─── Section A: Business Entity ─────────────────────────────────────────────

export interface BusinessEntity {
  legalName: string | null;
  dba: string | null;
  entityType: 'llc' | 's_corp' | 'c_corp' | 'sole_proprietor' | 'partnership' | null;
  ein: string | null;
  stateOfFormation: string | null;
  countryOfFormation: string | null;
  businessAddress: string | null;
  mailingAddress: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  yearFormed: number | null;
  registeredAgent: string | null;
}

// ─── Section B: Key Contacts & Representation ───────────────────────────────

export interface KeyContact {
  id: string;
  name: string;
  company: string | null;
  role: 'manager' | 'booking_agent' | 'business_manager' | 'attorney' | 'publicist' | 'label_rep' | 'publisher' | 'co_manager' | 'sub_agent' | 'other';
  roleLabel: string | null;
  email: string | null;
  phone: string | null;
  commissionPct: number | null;
  commissionType: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  notes: string | null;
}

// ─── Section C: Tax & Compliance ────────────────────────────────────────────

export interface TaxCompliance {
  w9OnFile: boolean;
  w9Date: string | null;
  taxClassification: string | null;
  stateTaxIds: Array<{ state: string; taxId: string }>;
  vatNumber: string | null;
  vatCountry: string | null;
  defaultWithholdingPct: number | null;
  notes: string | null;
}

// ─── Section D: Insurance ───────────────────────────────────────────────────

export interface InsuranceInfo {
  policies: InsurancePolicy[];
  notes: string | null;
}

export interface InsurancePolicy {
  id: string;
  type: 'general_liability' | 'workers_comp' | 'equipment' | 'vehicle' | 'cancellation' | 'other';
  carrier: string | null;
  policyNumber: string | null;
  coverageAmount: number | null;
  deductible: number | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  notes: string | null;
}

// ─── Section E: Technical Production ────────────────────────────────────────

export interface TechnicalProduction {
  stagePlotUrl: string | null;
  inputListUrl: string | null;
  techRiderUrl: string | null;
  fohConsolePreference: string | null;
  monitorConsolePreference: string | null;
  iemSystem: string | null;
  backlineRequirements: string | null;
  lightingRequirements: string | null;
  videoRequirements: string | null;
  powerRequirements: string | null;
  stageMinWidth: string | null;
  stageMinDepth: string | null;
  riggingNeeds: string | null;
  sfxNeeds: string | null;
  changeover: number | null;
  setLength: number | null;
  notes: string | null;
}

// ─── Section F: Hospitality & Rider ─────────────────────────────────────────

export interface HospitalityRider {
  riderUrl: string | null;
  dressingRoomRequirements: string | null;
  hospitalityRequirements: string | null;
  cateringRequirements: string | null;
  greenRoomRequirements: string | null;
  towelCount: number | null;
  buyoutAmount: number | null;
  buyoutCurrency: string | null;
  dietaryNotes: string | null;
  alcoholPreferences: string | null;
  notes: string | null;
}

// ─── Section G: Promo & Marketing ───────────────────────────────────────────

export interface PromoMarketing {
  pressPhotoUrls: string[];
  oneSheetUrl: string | null;
  bioShort: string | null;
  bioLong: string | null;
  websiteUrl: string | null;
  spotifyUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  appleMusicUrl: string | null;
  bandcampUrl: string | null;
  epkUrl: string | null;
  logoUrl: string | null;
  fontName: string | null;
  brandColors: string[];
  notes: string | null;
}

// ─── Section H: Merch Defaults ──────────────────────────────────────────────

export interface MerchDefaults {
  vendorName: string | null;
  vendorContact: string | null;
  vendorEmail: string | null;
  vendorPhone: string | null;
  defaultCommissionPct: number | null;
  settlementPreference: 'cash' | 'check' | 'wire' | null;
  shippingAddress: string | null;
  inventoryItems: MerchItem[];
  notes: string | null;
}

export interface MerchItem {
  id: string;
  name: string;
  category: 'shirt' | 'hoodie' | 'hat' | 'poster' | 'vinyl' | 'cd' | 'sticker' | 'other';
  sizes: string[];
  wholesaleCost: number | null;
  retailPrice: number | null;
  imageUrl: string | null;
}

// ─── Section I: Vehicles & Equipment ────────────────────────────────────────

export interface VehiclesEquipment {
  vehicles: ProfileVehicle[];
  trailers: ProfileVehicle[];
  majorEquipment: EquipmentItem[];
  storageLocation: string | null;
  notes: string | null;
}

export interface ProfileVehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  plate: string | null;
  vin: string | null;
  ownership: 'owned' | 'leased' | 'rented';
  insuranceInfo: string | null;
}

export interface EquipmentItem {
  id: string;
  name: string;
  value: number | null;
  serialNumber: string | null;
  notes: string | null;
}

// ─── Section J: Roster ──────────────────────────────────────────────────────

export interface RosterEntry {
  id: string;

  // J1: Identity & Basics
  legalName: string;
  preferredName: string | null;
  profilePhoto: string | null;
  role: string;
  dateOfBirth: string | null;
  nationalities: string[];
  primaryLanguages: string[];

  // J2: Contact
  email: string | null;
  phone: string | null;
  secondaryPhone: string | null;
  preferredContactMethod: 'call' | 'text' | 'whatsapp' | 'signal' | 'email' | null;

  // J3: Emergency Contact
  emergencyContactName: string | null;
  emergencyRelationship: string | null;
  emergencyPhone: string | null;
  emergencyEmail: string | null;
  bloodType: string | null;
  medicalConditions: string | null;

  // J4: Travel Documents
  passportNumber: string | null;
  passportCountry: string | null;
  passportExpiration: string | null;
  secondPassportNumber: string | null;
  visaNotes: string | null;
  knownTravelerNumber: string | null;
  homeAddress: string | null;
  preferredHomeAirport: string | null;

  // J5: Travel Preferences
  seatPreference: 'aisle' | 'middle' | 'window' | null;
  flightClass: 'coach' | 'premium_economy' | 'business' | 'first' | null;
  frequentFlier: Array<{ airline: string; number: string }>;
  bunkPreference: 'top' | 'bottom' | 'front' | 'back' | null;
  ownRoom: boolean | null;
  roomType: 'king' | 'double_queen' | 'suite' | 'accessible' | null;
  smokingPreference: 'non_smoking' | 'smoking' | null;
  floorPreference: 'high' | 'low' | null;
  canDrive: boolean | null;
  driversLicenseOnFile: boolean;

  // J6: Dietary & Health
  foodAllergies: string[];
  dietaryRestrictions: string[];
  mealNotes: string | null;
  nonFoodAllergies: string | null;

  // J7: Apparel & Swag
  tshirtSize: string | null;
  hoodiSize: string | null;
  jacketSize: string | null;
  hatSize: string | null;
  shoeSize: string | null;
  genderFit: 'mens' | 'womens' | 'unisex' | null;

  // J8: Pay & Financial (TM/BM eyes only)
  showDayRate: number | null;
  offDayRate: number | null;
  travelDayRate: number | null;
  perDiemRate: number | null;
  payType: 'w2' | '1099' | 'invoice' | 'international_wire' | null;
  taxWithholdingStatus: string | null;
  taxIdOnFile: boolean;

  // J9: Skills & Credentials
  cdl: boolean;
  pyroLicense: boolean;
  riggingCert: boolean;
  forkliftCert: boolean;
  firstAidCert: boolean;
  otherCerts: string | null;
  yearsExperience: number | null;
  resumeUrl: string | null;
  portfolioUrl: string | null;

  // J10: Personal Preferences
  birthday: string | null;
  hobbies: string | null;
  dndPreferences: string | null;
  privateNotes: string | null;
}

// ─── Full Profile (all sections) ────────────────────────────────────────────

export interface ArtistProfile {
  businessEntity: BusinessEntity | null;
  keyContacts: KeyContact[];
  taxCompliance: TaxCompliance | null;
  insurance: InsuranceInfo | null;
  technicalProduction: TechnicalProduction | null;
  hospitalityRider: HospitalityRider | null;
  promoMarketing: PromoMarketing | null;
  merchDefaults: MerchDefaults | null;
  vehiclesEquipment: VehiclesEquipment | null;
  roster: RosterEntry[];
}

// ─── Section Labels ─────────────────────────────────────────────────────────

export const PROFILE_SECTIONS = [
  { key: 'businessEntity', label: 'Business Entity', icon: '🏢' },
  { key: 'keyContacts', label: 'Key Contacts & Representation', icon: '📇' },
  { key: 'taxCompliance', label: 'Tax & Compliance', icon: '📋' },
  { key: 'insurance', label: 'Insurance', icon: '🛡️' },
  { key: 'technicalProduction', label: 'Technical Production', icon: '🎛️' },
  { key: 'hospitalityRider', label: 'Hospitality & Rider', icon: '🍽️' },
  { key: 'promoMarketing', label: 'Promo & Marketing', icon: '📸' },
  { key: 'merchDefaults', label: 'Merch Defaults', icon: '👕' },
  { key: 'vehiclesEquipment', label: 'Vehicles & Equipment', icon: '🚐' },
  { key: 'roster', label: 'Roster', icon: '👥' },
] as const;

// ─── SQL Migration (run in Supabase SQL Editor) ─────────────────────────────
//
// ALTER TABLE artists ADD COLUMN IF NOT EXISTS business_entity jsonb;
// ALTER TABLE artists ADD COLUMN IF NOT EXISTS key_contacts jsonb DEFAULT '[]'::jsonb;
// ALTER TABLE artists ADD COLUMN IF NOT EXISTS tax_compliance jsonb;
// ALTER TABLE artists ADD COLUMN IF NOT EXISTS insurance jsonb;
// ALTER TABLE artists ADD COLUMN IF NOT EXISTS technical_production jsonb;
// ALTER TABLE artists ADD COLUMN IF NOT EXISTS hospitality_rider jsonb;
// ALTER TABLE artists ADD COLUMN IF NOT EXISTS promo_marketing jsonb;
// ALTER TABLE artists ADD COLUMN IF NOT EXISTS merch_defaults jsonb;
// ALTER TABLE artists ADD COLUMN IF NOT EXISTS vehicles_equipment jsonb;
// ALTER TABLE artists ADD COLUMN IF NOT EXISTS default_roster jsonb DEFAULT '[]'::jsonb;
//
// Note: default_roster and default_commissions may already exist from Phase 2 migrations.
// The IF NOT EXISTS clause handles this safely.

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import posthog from "posthog-js";
import Link from "next/link";
import { useParams } from "next/navigation";
import IntakeDropZone from "../IntakeDropZone";
import SettlementPanel from "./SettlementPanel";
import RosterPanel from "./RosterPanel";
import VehicleManager from "@/app/components/tourrouter/VehicleManager";
import {
  getRoadKm,
  estimateDriveHours,
  fmtHours,
  fmtUSD,
  fmtDist,
  formatDateDisplay,
  legCountry,
  isImperialCountry,
  getAirport,
  buildFlightLinks,
  calcTourFinancials,
  calcFuelCostMultiVehicle,
  prefetchDriveData,
  buildDriveDataKey,
  type TourShow,
  type FinancialResults,
  type VehicleType,
  type DriveDataMap,
  COMMISSION_TYPE_LABELS,
  type CommissionType,
  VEHICLE_MPG,
  VEHICLE_L100,
  toUSD,
  formatOfferDisplay,
  TOURING_CURRENCIES,
  type AirportInfo,
} from "@/lib/tourrouter";
import { cacheKey as geoCacheKey } from "@/lib/tourrouter/geocoding-shared";
import type { Commission } from "@/lib/tourrouter/commissions";
import type { TourVehicle } from "@/lib/tourrouter/vehicleTypes";
import { useFeatureFlags } from "@/lib/tourrouter/FeatureFlagContext";

import "./tour-detail.css";

// ── Types ────────────────────────────────────────────────────

type TourData = {
  id: string;
  name: string;
  artist_id: string | null;
  vehicle_type: VehicleType | null;
  mpg: number | null;
  pax: number | null;
  fuel_price_usd: number | null;
  flight_threshold_h: number | null;
  blanket_show_amount: number | null;
  blanket_off_amount: number | null;
  blanket_show_label: string | null;
  blanket_off_label: string | null;
  currency_rates: Record<string, number> | null;
  leg_choices: Record<string, string> | null;
  localizer_tour_id: string | null;
  advance_config: { initialSendDays?: number; followup1Days?: number; followup2Days?: number; finalNudgeDays?: number; enabled?: boolean } | null;
  tour_roster: Record<string, unknown>[] | null;
  tour_vehicles: Record<string, unknown>[] | null;
  tour_commissions: Commission[] | null;
  lodging_defaults: Record<string, unknown> | null;
  hotel_budget_override: number | null;
};

type ShowRow = {
  id: string;
  sort_order: number;
  date_iso: string | null;
  event: string | null;
  city: string | null;
  country: string | null;
  country_norm: string | null;
  venue: string | null;
  offer_display: string | null;
  offer_amount: number;
  offer_currency: string;
  capacity: number | null;
  status: string | null;
  is_off: boolean;
  doors: string | null;
  showtime: string | null;
  onstage: string | null;
  curfew: string | null;
  load_in_time: string | null;
  soundcheck_time: string | null;
  venue_wifi_name: string | null;
  venue_wifi_password: string | null;
  parking_notes: string | null;
  venue_notes: string | null;
  backline_notes: string | null;
  hospitality_notes: string | null;
  merch: string | null;
  backend: string | null;
  promoter: string | null;
  notes: string | null;
  support: string | null;
  hotel_cost_actual: number | null;
  hotel_rate: number | null;
  hotel_rooms: number | null;
  hotel_checkin: string | null;
  hotel_checkout: string | null;
  advance_status: string | null;
  advance_sent_at: string | null;
  advance_form_token: string | null;
  advance_form_submitted_at: string | null;
  advance_form_submitted_by: string | null;
  advance_recipient_email: string | null;
  deal?: Record<string, unknown> | null;
  settlement?: Record<string, unknown> | null;
};

type LegInfo = {
  km: number | null;
  driveH: number | null;
  fuelCost: number | null;
  distStr: string;
  legCtry: string;
  dayGap: number;
  fromCity: string;
  toCity: string;
};

// ── Airport lookup helper (map-first, sync fallback) ─────────
function lookupAirport(
  city: string | null | undefined,
  country: string | null | undefined,
  map: Map<string, AirportInfo>
): AirportInfo | null {
  if (city && country) {
    const fromMap = map.get(geoCacheKey(city, country));
    if (fromMap) return fromMap;
  }
  return getAirport(city, country);
}

// ── Drawer field helpers ─────────────────────────────────────

const DRAWER_SECTIONS = [
  {
    title: "Show Info",
    fields: [
      { key: "date_iso", label: "Date", type: "date" },
      { key: "event", label: "Event Name" },
      { key: "venue", label: "Venue" },
      { key: "city", label: "City" },
      { key: "country", label: "Country" },
    ],
  },
  {
    title: "Financials",
    fields: [
      { key: "offer_amount", label: "Offer Amount", type: "number" },
      { key: "offer_currency", label: "Currency" },
      { key: "status", label: "Status" },
      { key: "billing", label: "Billing" },
      { key: "backend", label: "Backend / Deal Terms" },
    ],
  },
  {
    title: "Schedule",
    fields: [
      { key: "load_in_time", label: "Load In" },
      { key: "soundcheck_time", label: "Sound Check" },
      { key: "doors", label: "Doors" },
      { key: "showtime", label: "Showtime" },
      { key: "onstage", label: "Onstage" },
      { key: "curfew", label: "Curfew" },
      { key: "age_limit", label: "Age Limit" },
    ],
  },
  {
    title: "Venue Info",
    fields: [
      { key: "venue_wifi_name", label: "WiFi Network" },
      { key: "venue_wifi_password", label: "WiFi Password" },
      { key: "parking_notes", label: "Parking" },
      { key: "venue_notes", label: "Venue Notes" },
      { key: "backline_notes", label: "Backline Notes" },
      { key: "hospitality_notes", label: "Hospitality Notes" },
    ],
  },
  {
    title: "Contacts",
    fields: [
      { key: "promoter", label: "Promoter" },
      { key: "promoter_contact", label: "Promoter Contact" },
      { key: "production_contact", label: "Production Contact" },
    ],
  },
  {
    title: "Hotel",
    fields: [
      { key: "hotel_name", label: "Hotel Name" },
      { key: "hotel_address", label: "Hotel Address" },
      { key: "hotel_checkin", label: "Check-in" },
      { key: "hotel_checkout", label: "Check-out" },
      { key: "hotel_rooms", label: "Rooms", type: "number" },
      { key: "hotel_rate", label: "Rate ($)", type: "number" },
      { key: "hotel_currency", label: "Currency" },
      { key: "hotel_confirmation", label: "Confirmation #" },
      { key: "hotel_notes", label: "Notes" },
    ],
  },
  {
    title: "Support & Merch",
    fields: [
      { key: "support", label: "Support / Opener" },
      { key: "merch", label: "Merch Deal" },
    ],
  },
  {
    title: "Notes",
    fields: [
      { key: "notes", label: "Notes" },
    ],
  },
];

// ── Component ────────────────────────────────────────────────

export default function RouteTourPage() {
  const { tourId } = useParams<{ tourId: string }>();
  const flags = useFeatureFlags();

  const [tour, setTour] = useState<TourData | null>(null);
  const [shows, setShows] = useState<ShowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [legChoices, setLegChoices] = useState<Record<number, string>>({});
  const [financials, setFinancials] = useState<FinancialResults | null>(null);
  const [legs, setLegs] = useState<(LegInfo | null)[]>([]);
  const [driveData, setDriveData] = useState<DriveDataMap>({});
  const [coordsMap, setCoordsMap] = useState<Map<string, [number, number]>>(new Map());
  const [airportMap, setAirportMap] = useState<Map<string, AirportInfo>>(new Map());
  const [flightPriceCache, setFlightPriceCache] = useState<Record<string, number>>({});
  const flightPriceCacheRef = useRef<Record<string, number>>({});
  // Keep ref in sync with state
  flightPriceCacheRef.current = flightPriceCache;

  // Drawer
  const [drawerShow, setDrawerShow] = useState<ShowRow | null>(null);
  const [drawerIdx, setDrawerIdx] = useState(-1);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Advancing
  const [advanceEmail, setAdvanceEmail] = useState("");
  const [advanceName, setAdvanceName] = useState("");
  const [advanceSending, setAdvanceSending] = useState(false);
  const [advanceMsg, setAdvanceMsg] = useState("");

  // Push to Localizer
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ localizerTourId: string; eventCount: number; status: string } | null>(null);

  // Add Show modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShow, setNewShow] = useState({ date_iso: "", venue: "", city: "", country: "", offer_amount: "", offer_currency: "USD", event: "" });
  const [addingSaving, setAddingSaving] = useState(false);

  // City autocomplete
  type CitySuggestion = { name: string; state: string; country: string; lat: number; lng: number; iata_code: string | null };
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [cityHighlight, setCityHighlight] = useState(-1);
  const cityDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const cityAbortRef = useRef<AbortController | null>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  const ISO_TO_DISPLAY: Record<string, string> = {
    US: "USA", CA: "Canada", MX: "Mexico", GB: "UK", IE: "Ireland",
    DE: "Germany", FR: "France", NL: "Netherlands", BE: "Belgium",
    AT: "Austria", CH: "Switzerland", CZ: "Czech Republic", PL: "Poland",
    HU: "Hungary", DK: "Denmark", SE: "Sweden", NO: "Norway", FI: "Finland",
    IT: "Italy", ES: "Spain", PT: "Portugal", LU: "Luxembourg",
    BR: "Brazil", AR: "Argentina", CL: "Chile", CO: "Colombia",
    PE: "Peru", EC: "Ecuador", UY: "Uruguay", JP: "Japan",
    AU: "Australia", NZ: "New Zealand",
  };

  function handleCityInput(value: string) {
    setNewShow((p) => ({ ...p, city: value }));
    setCityHighlight(-1);

    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);

    if (!value.trim()) {
      setCitySuggestions([]);
      setCityDropdownOpen(false);
      return;
    }

    cityDebounceRef.current = setTimeout(() => {
      cityAbortRef.current?.abort();
      cityAbortRef.current = new AbortController();

      fetch(`/api/tourrouter/geocode?q=${encodeURIComponent(value.trim())}&limit=8`, {
        signal: cityAbortRef.current.signal,
      })
        .then((r) => r.json())
        .then((data) => {
          const results: CitySuggestion[] = data.cities || [];
          setCitySuggestions(results);
          setCityDropdownOpen(true);
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setCitySuggestions([]);
          setCityDropdownOpen(false);
        });
    }, 250);
  }

  function selectCity(suggestion: CitySuggestion) {
    setNewShow((p) => ({
      ...p,
      city: suggestion.state ? `${suggestion.name}, ${suggestion.state}` : suggestion.name,
      country: ISO_TO_DISPLAY[suggestion.country] || suggestion.country,
    }));
    setCitySuggestions([]);
    setCityDropdownOpen(false);
  }

  function handleCityKeyDown(e: React.KeyboardEvent) {
    if (!cityDropdownOpen || citySuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCityHighlight((h) => Math.min(h + 1, citySuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCityHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && cityHighlight >= 0) {
      e.preventDefault();
      selectCity(citySuggestions[cityHighlight]);
    } else if (e.key === "Escape") {
      setCityDropdownOpen(false);
    }
  }

  // Close city dropdown on click outside
  useEffect(() => {
    if (!cityDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [cityDropdownOpen]);

  // Delete show
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Settings panel
  const [showSettings, setShowSettings] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [showLegacyVehicle, setShowLegacyVehicle] = useState(false);
  const [blanketDetail, setBlanketDetail] = useState(false);
  const [showCommissions, setShowCommissions] = useState(false);

  // Drawer save indicator
  const [drawerSaved, setDrawerSaved] = useState(false);
  const [settlementOpen, setSettlementOpen] = useState(false);

  // Guest List
  type GuestEntry = { id: string; guest_name: string; plus_ones: number; pass_type: string; status: string; notes: string | null };
  const [guests, setGuests] = useState<GuestEntry[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [addingGuest, setAddingGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: "", plusOnes: 0, passType: "Guest", notes: "" });

  // ── Fetch ──────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/tourrouter/tours/${tourId}`)
      .then((r) => r.json())
      .then((data) => {
        setTour(data.tour);
        setShows(data.shows || []);
        // Restore leg_choices from tour settings
        if (data.tour?.leg_choices) {
          const restored: Record<number, string> = {};
          for (const [k, v] of Object.entries(data.tour.leg_choices)) {
            restored[parseInt(k)] = v as string;
          }
          setLegChoices(restored);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tourId]);

  // ── Auto-populate currency_rates if empty ────────────────────
  const ratesFetchedRef = useRef(false);
  useEffect(() => {
    if (!tour || ratesFetchedRef.current) return;
    const hasRates = tour.currency_rates && Object.keys(tour.currency_rates).length > 0;
    if (hasRates) return;
    ratesFetchedRef.current = true;
    fetch("/api/tourrouter/currency-rates")
      .then((r) => r.json())
      .then((data) => {
        if (data.rates && Object.keys(data.rates).length > 0) {
          setTour((prev) => prev ? { ...prev, currency_rates: data.rates } : prev);
          fetch(`/api/tourrouter/tours/${tourId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currency_rates: data.rates }),
          });
        }
      })
      .catch(() => {});
  }, [tour, tourId]);

  // ── Prefetch Mapbox drive data ───────────────────────────────

  useEffect(() => {
    if (shows.length < 2) return;
    const showPairs = shows.map((s) => ({ city: s.city || "", country: s.country || "", isOff: s.is_off }));
    prefetchDriveData(showPairs).then(setDriveData);
  }, [shows]);

  // ── Prefetch geo coordinates + airports ─────────────────────

  useEffect(() => {
    if (!shows.length) return;
    const showPairs = shows
      .filter((s) => s.city && s.country)
      .map((s) => ({ city: s.city!, country: s.country! }));
    if (showPairs.length === 0) return;

    fetch("/api/tourrouter/geocode/prefetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shows: showPairs }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.coords) {
          const newCoordsMap = new Map<string, [number, number]>();
          for (const [k, v] of Object.entries(data.coords)) {
            newCoordsMap.set(k, v as [number, number]);
          }
          setCoordsMap(newCoordsMap);
        }
        if (data.airports) {
          const newAirportMap = new Map<string, AirportInfo>();
          for (const [k, v] of Object.entries(
            data.airports as Record<string, { iata: string; coords: [number, number] | null }>
          )) {
            newAirportMap.set(k, { iata: v.iata, coords: v.coords ?? undefined });
          }
          setAirportMap(newAirportMap);
        }
      })
      .catch(() => {});
  }, [shows]);

  // ── Compute legs & financials ──────────────────────────────

  const compute = useCallback(() => {
    if (!shows.length || !tour) return;

    const rates = tour.currency_rates || {};
    const vehicleType = tour.vehicle_type || "van";
    const vehicleCount = 1;
    const tourVehicles = (tour.tour_vehicles as unknown as TourVehicle[] | undefined) ?? [];
    const pax = tour.pax || 4;
    const flightThreshold = tour.flight_threshold_h || 6;

    // Build leg info
    const legInfos: (LegInfo | null)[] = shows.map((s, i) => {
      if (i === 0) return null;
      const prev = shows[i - 1];
      const driveKey = buildDriveDataKey(prev.city || "", s.city || "");
      const cached = driveData[driveKey];
      const km = cached ? cached.distanceKm : getRoadKm(prev.city, prev.country, s.city, s.country);
      const driveH = cached ? cached.driveHours : (km ? estimateDriveHours(km) : null);
      // CRITICAL: legCtry not legCountry
      const legCtry = legCountry(prev.country, s.country);
      const distStr = km ? fmtDist(km, legCtry === "usa" ? "usa" : "europe") : "?";
      let dayGap = 0;
      if (prev.date_iso && s.date_iso) {
        const d1 = new Date(prev.date_iso);
        const d2 = new Date(s.date_iso);
        dayGap = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      }
      // Fuel cost for this leg
      let fuelCost: number | null = null;
      if (km) {
        if (tourVehicles.some(v => v.isActive)) {
          fuelCost = calcFuelCostMultiVehicle(km, prev.country, s.country, tourVehicles, rates);
        } else {
          const lc = legCtry;
          if (lc === "usa") {
            const mpgVal = VEHICLE_MPG[vehicleType] || 20;
            const miles = km * 0.6214;
            const pricePerGal = tour.fuel_price_usd || 3.50;
            fuelCost = (miles / mpgVal) * pricePerGal;
          } else {
            const l100 = VEHICLE_L100[vehicleType] || 11.8;
            const litres = (km / 100) * l100;
            const eurRate = rates["EUR"] || 1.09;
            const pricePerLitre = 1.65 * eurRate;
            fuelCost = litres * (tour.fuel_price_usd ? tour.fuel_price_usd / 3.785 : pricePerLitre);
          }
        }
      }
      return { km, driveH, fuelCost, distStr, legCtry, dayGap, fromCity: prev.city || "?", toCity: s.city || "?" };
    });
    setLegs(legInfos);

    // Build TourShow array for calcTourFinancials
    const tourShows: TourShow[] = shows.map((s) => ({
      date: s.date_iso ? new Date(s.date_iso + "T00:00:00") : null,
      event: s.event || "",
      city: s.city || "",
      country: s.country || "",
      countryNorm: s.country_norm || "",
      venue: s.venue || "",
      offer: {
        amount: s.offer_amount || 0,
        currency: s.offer_currency || "USD",
        display: s.offer_display || "",
      },
      usd: 0,
      capacity: s.capacity || 0,
      status: s.status || "",
      isOff: s.is_off,
      backend: s.backend || undefined,
      doors: s.doors || undefined,
      showtime: s.showtime || undefined,
      merch: s.merch || undefined,
      notes: s.notes || undefined,
      support: s.support || undefined,
      promoter: s.promoter || undefined,
      hotelCostActual: s.hotel_cost_actual || null,
      hotelRate: s.hotel_rate || null,
      hotelRooms: s.hotel_rooms || null,
      hotelCheckin: s.hotel_checkin || null,
      hotelCheckout: s.hotel_checkout || null,
    }));

    // SINGLE SOURCE OF TRUTH: calcTourFinancials
    const fin = calcTourFinancials({
      tourShows,
      legChoices,
      showExpenses: {},
      rates,
      pax,
      flightThreshold,
      blanketShowAmt: tour.blanket_show_amount || 0,
      blanketOffAmt: tour.blanket_off_amount || 0,
      blanketShowLabel: tour.blanket_show_label || "Band Pay",
      blanketOffLabel: tour.blanket_off_label || "Hotel + Per Diem",
      vehicleType,
      vehicleCount,
      fuelPriceOverride: tour.fuel_price_usd || null,
      tourVehicles,
      flightPriceCache,
      driveData,
      coordsMap,
      airportMap,
      lodgingDefaults: (tour.lodging_defaults as any) || null,
      hotelBudgetOverride: tour.hotel_budget_override || null,
    });
    setFinancials(fin);
  }, [shows, tour, legChoices, driveData, flightPriceCache, coordsMap, airportMap]);

  useEffect(() => { compute(); }, [compute]);

  // ── Flight price fetch ─────────────────────────────────────

  async function fetchFlightPrice(fromIata: string, toIata: string, date: string, pax: number) {
    const safePax = Math.max(pax || 1, 1);
    const key = `${fromIata}-${toIata}-${date}-${safePax}pax`;
    console.log("[FlightPrice] fetching:", key);
    // Use ref to avoid stale closure — state may not be current when called from toggleLeg
    if (flightPriceCacheRef.current[key] !== undefined) {
      console.log("[FlightPrice] already cached:", key);
      return;
    }
    try {
      const res = await fetch("/api/tourrouter/flight-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: fromIata, destination: toIata, date, pax: safePax }),
      });
      const data = await res.json();
      console.log("[FlightPrice] response:", key, data);
      if (data.price_usd) {
        setFlightPriceCache(prev => ({ ...prev, [key]: data.price_usd }));
      }
    } catch (e) {
      console.error("Flight price fetch failed:", e);
    }
  }

  // ── Leg choice toggle ──────────────────────────────────────

  function toggleLeg(idx: number, choice: string) {
    const next = { ...legChoices, [idx]: choice };
    setLegChoices(next);
    // Debounce save to API
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/tourrouter/tours/${tourId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leg_choices: next }),
      });
    }, 800);

    // Fetch flight price when toggling to fly
    if (choice === "fly" && idx > 0) {
      const prevShow = shows[idx - 1];
      const thisShow = shows[idx];
      const fromAP = lookupAirport(prevShow?.city, prevShow?.country, airportMap);
      const toAP = lookupAirport(thisShow?.city, thisShow?.country, airportMap);
      console.log("[toggleLeg] fly idx:", idx, "from:", prevShow?.city, "→", fromAP, "to:", thisShow?.city, "→", toAP);
      if (fromAP && toAP && thisShow?.date_iso) {
        fetchFlightPrice(fromAP.iata, toAP.iata, thisShow.date_iso, tour?.pax || 4);
      }
    }
  }

  // ── Drawer ─────────────────────────────────────────────────

  function openDrawer(idx: number) {
    const s = shows[idx];
    setDrawerShow({ ...s });
    setDrawerIdx(idx);
    setAdvanceEmail(s.advance_recipient_email || "");
    setAdvanceName("");
    setAdvanceMsg("");
    setGuests([]);
    setAddingGuest(false);
    if (!s.is_off) fetchGuests(s.id);
  }

  function closeDrawer() {
    setDrawerShow(null);
    setDrawerIdx(-1);
    setAdvanceEmail("");
    setAdvanceName("");
    setAdvanceMsg("");
  }

  async function sendAdvance(emailType: string = "initial") {
    if (!drawerShow || !advanceEmail.trim()) return;
    setAdvanceSending(true);
    setAdvanceMsg("");
    try {
      const resp = await fetch("/api/tourrouter/advance/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId: drawerShow.id,
          recipientEmail: advanceEmail.trim(),
          recipientName: advanceName.trim(),
          emailType,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        setAdvanceMsg(err.error || "Send failed");
      } else {
        const data = await resp.json();
        setAdvanceMsg("Advance sent!");
        // Update local show
        setShows((prev) => prev.map((s) =>
          s.id === drawerShow.id ? { ...s, advance_status: "sent", advance_sent_at: new Date().toISOString(), advance_form_token: data.token, advance_recipient_email: advanceEmail.trim() } : s
        ));
        setDrawerShow((prev) => prev ? { ...prev, advance_status: "sent", advance_sent_at: new Date().toISOString(), advance_form_token: data.token, advance_recipient_email: advanceEmail.trim() } : null);
      }
    } catch {
      setAdvanceMsg("Send failed");
    }
    setAdvanceSending(false);
  }

  // ── Guest list ─────────────────────────────────────────────

  async function fetchGuests(showId: string) {
    setGuestLoading(true);
    const resp = await fetch(`/api/tourrouter/guest-list?showId=${showId}`);
    if (resp.ok) {
      const data = await resp.json();
      setGuests(data.entries);
    }
    setGuestLoading(false);
  }

  async function addGuest() {
    if (!drawerShow || !newGuest.name.trim()) return;
    const resp = await fetch("/api/tourrouter/guest-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showId: drawerShow.id, guestName: newGuest.name, plusOnes: newGuest.plusOnes, passType: newGuest.passType, notes: newGuest.notes }),
    });
    if (resp.ok) {
      const data = await resp.json();
      setGuests((prev) => [...prev, data.entry]);
      setNewGuest({ name: "", plusOnes: 0, passType: "Guest", notes: "" });
      setAddingGuest(false);
    }
  }

  async function updateGuestStatus(entryId: string, status: string) {
    const resp = await fetch(`/api/tourrouter/guest-list/${entryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (resp.ok) {
      setGuests((prev) => prev.map((g) => g.id === entryId ? { ...g, status } : g));
    }
  }

  async function deleteGuest(entryId: string) {
    await fetch(`/api/tourrouter/guest-list/${entryId}`, { method: "DELETE" });
    setGuests((prev) => prev.filter((g) => g.id !== entryId));
  }

  // ── Push to Localizer ────────────────────────────────────────

  async function pushToLocalizer() {
    setPushing(true);
    setPushResult(null);
    try {
      const resp = await fetch(`/api/tourrouter/tours/${tourId}/push-to-localizer`, {
        method: "POST",
      });
      if (!resp.ok) {
        const err = await resp.json();
        setPushResult({ localizerTourId: "", eventCount: 0, status: "error: " + (err.error || "Failed") });
        setPushing(false);
        return;
      }
      const data = await resp.json();
      setPushResult(data);
      // Update local tour state
      setTour((prev) => prev ? { ...prev, localizer_tour_id: data.localizerTourId } : prev);
    } catch {
      setPushResult({ localizerTourId: "", eventCount: 0, status: "error: Push failed" });
    }
    setPushing(false);
  }

  // ── Add Show ─────────────────────────────────────────────────

  async function saveNewShow() {
    setAddingSaving(true);
    try {
      const resp = await fetch(`/api/tourrouter/tours/${tourId}/shows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shows: [{
            date_iso: newShow.date_iso || null,
            event: newShow.event || null,
            venue: newShow.venue || null,
            city: newShow.city || null,
            country: newShow.country || null,
            offer_amount: parseFloat(newShow.offer_amount) || 0,
            offer_currency: newShow.offer_currency || "USD",
            offer_display: formatOfferDisplay(parseFloat(newShow.offer_amount) || 0, newShow.offer_currency),
            is_off: false,
            sort_order: shows.length,
          }],
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const added: ShowRow[] = data.shows || [];
        setShows((prev) => [...prev, ...added].sort((a, b) =>
          (a.date_iso || "").localeCompare(b.date_iso || "")
        ));
        posthog.capture("show_added");
        setShowAddModal(false);
        setNewShow({ date_iso: "", venue: "", city: "", country: "", offer_amount: "", offer_currency: "USD", event: "" });
      }
    } catch { /* ignore */ }
    setAddingSaving(false);
  }

  // ── Delete Show ──────────────────────────────────────────────

  async function deleteShow(showId: string) {
    try {
      const resp = await fetch(`/api/tourrouter/tours/${tourId}/shows/${showId}`, { method: "DELETE" });
      if (resp.ok) {
        setShows((prev) => prev.filter((s) => s.id !== showId));
        if (drawerShow?.id === showId) closeDrawer();
      }
    } catch { /* ignore */ }
    setDeleteConfirmId(null);
  }

  // ── Tour Settings ────────────────────────────────────────────

  function updateTourSetting(key: string, value: unknown) {
    setTour((prev) => prev ? { ...prev, [key]: value } : prev);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/tourrouter/tours/${tourId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    }, 600);
  }

  function updateDrawerField(key: string, value: string) {
    if (!drawerShow) return;
    const numFields = ["capacity", "offer_amount", "hotel_rooms", "hotel_rate", "hotel_block_size", "hotel_block_rate", "hotel_attrition_pct", "deposit_amount"];
    const boolFields = ["hotel_block"];
    const parsed: unknown = boolFields.includes(key) ? !!value : numFields.includes(key) ? (parseFloat(value) || 0) : value;
    let updated = { ...drawerShow, [key]: parsed };
    // Regenerate offer_display when offer fields change
    let putBody: Record<string, unknown> = { [key]: parsed };
    if (key === "offer_amount" || key === "offer_currency") {
      const newDisplay = formatOfferDisplay(
        key === "offer_amount" ? (parsed as number) : (drawerShow.offer_amount as number),
        key === "offer_currency" ? (parsed as string) : (drawerShow.offer_currency as string),
      );
      updated = { ...updated, offer_display: newDisplay };
      putBody.offer_display = newDisplay;
    }
    setDrawerShow(updated);
    setDrawerSaved(false);
    // Debounce save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/tourrouter/tours/${tourId}/shows/${drawerShow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(putBody),
      }).then(() => {
        setShows((prev) => prev.map((s, i) => i === drawerIdx ? { ...s, ...updated } : s));
        setDrawerSaved(true);
        setTimeout(() => setDrawerSaved(false), 1500);
      });
    }, 600);
  }

  function toggleSection(title: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  }

  // ── Helpers ────────────────────────────────────────────────

  function driveColorBg(h: number | null): string {
    if (h === null) return "transparent";
    if (h > 6) return "var(--hw-red-ghost)";
    if (h > 4) return "var(--hw-amber-ghost)";
    return "var(--hw-green-ghost)";
  }

  function driveColor(h: number | null): string {
    if (h === null) return "var(--hw-text-muted)";
    if (h > 6) return "var(--hw-crimson)";
    if (h > 4) return "var(--hw-amber)";
    return "var(--hw-green)";
  }

  function statusDot(status: string | null): { color: string; label: string; variant: "confirmed" | "pending" | "error" } {
    if (!status) return { color: "var(--hw-border)", label: "", variant: "pending" };
    const s = status.toLowerCase();
    if (s.includes("confirm")) return { color: "var(--hw-green)", label: "Confirmed", variant: "confirmed" };
    if (s.includes("cancel")) return { color: "var(--hw-crimson)", label: "Cancelled", variant: "error" };
    return { color: "var(--hw-amber)", label: "Pending", variant: "pending" };
  }

  function formatShowDate(dateStr: string | null): string {
    if (!dateStr) return "\u2014";
    const d = new Date(dateStr + "T00:00:00");
    return formatDateDisplay(d);
  }

  // ── Nav ────────────────────────────────────────────────────

  const navItems = [
    { num: 1, label: "Import", href: `/dashboard/routing/${tourId}/import`, active: false },
    { num: 2, label: "Route", href: `/dashboard/routing/${tourId}`, active: true },
    ...(flags.financeLayer ? [{ num: 3, label: "Financials", href: `/dashboard/routing/${tourId}/financials`, active: false }] : []),
    { num: flags.financeLayer ? 4 : 3, label: "Export", href: `/dashboard/routing/${tourId}/export`, active: false },
  ];

  const f = financials;
  const flightThreshold = tour?.flight_threshold_h || 6;

  // ── Stat cards ─────────────────────────────────────────────

  const totalDriveH = legs.reduce((sum, leg) => {
    if (!leg) return sum;
    const idx = legs.indexOf(leg);
    if (legChoices[idx] === "fly") return sum;
    return sum + (leg.driveH || 0);
  }, 0);

  const drivingLegs = legs.filter((leg, idx) => leg && legChoices[idx] !== "fly" && leg.driveH !== null);
  const avgDriveH = drivingLegs.length ? drivingLegs.reduce((s, l) => s + (l!.driveH || 0), 0) / drivingLegs.length : 0;
  const longestDriveH = drivingLegs.length ? Math.max(...drivingLegs.map((l) => l!.driveH || 0)) : 0;
  const brutalLegs = drivingLegs.filter((l) => (l!.driveH || 0) > 6).length;

  const statCards = [
    { label: "Total Shows", value: f ? String(f.showDayCount) : "\u2014" },
    { label: "Off Days", value: f ? String(f.offDayCount) : "\u2014" },
    { label: f?.imperialTour ? "Total Miles" : "Total KM", value: f ? (f.imperialTour ? Math.round(f.totalKm * 0.6214).toLocaleString() : Math.round(f.totalKm).toLocaleString()) : "\u2014" },
    { label: "Total Drive", value: totalDriveH ? fmtHours(totalDriveH) : "\u2014" },
    { label: "Est. Fuel", value: f ? fmtUSD(f.totalFuel) : "\u2014", color: "var(--hw-crimson)" },
    { label: "Avg Drive", value: avgDriveH ? fmtHours(avgDriveH) : "\u2014" },
    { label: "Longest Drive", value: longestDriveH ? fmtHours(longestDriveH) : "\u2014", color: longestDriveH > 6 ? "var(--hw-crimson)" : undefined },
    { label: "Brutal Legs >6h", value: String(brutalLegs), color: brutalLegs > 0 ? "var(--hw-amber)" : undefined },
  ];

  // ── Show options for intake drop zone ─────────────────────
  const intakeShowOptions = shows.filter((s) => !s.is_off).map((s) => ({
    id: s.id,
    label: [formatShowDate(s.date_iso), s.city, s.venue].filter(Boolean).join(" \u2014 "),
  }));

  function reloadTour() {
    fetch(`/api/tourrouter/tours/${tourId}`)
      .then((r) => r.json())
      .then((data) => { setTour(data.tour); setShows(data.shows || []); });
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <IntakeDropZone tourId={tourId} showId={drawerShow?.id} shows={intakeShowOptions} onSaved={reloadTour}>
    <>
    <div className="fade-in td-page" style={{ minHeight: "100vh", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "3px solid var(--hw-border-strong)" }}>
          <Link href={tour?.artist_id ? `/dashboard/artists/${tour.artist_id}` : "/dashboard"} style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>&larr; {tour?.artist_id ? "BACK TO ARTIST" : "BACK TO DASHBOARD"}</Link>
          <div className="td-header-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, letterSpacing: "4px", color: "var(--hw-crimson)", margin: 0, marginBottom: 4, paddingBottom: 8 }}>HWY61</h1>
              <div style={{ borderBottom: "3px solid var(--hw-border-strong)", marginBottom: 6 }} />
              <div className="td-tour-name" style={{ fontFamily: "var(--hw-font-display)", fontSize: 48, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", margin: 0 }}>{loading ? "\u2014" : tour?.name?.toUpperCase() || "TOUR"}</div>
            </div>
            <div className="td-nav" style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div className="td-nav-pills" style={{ display: "flex", flexDirection: "column", gap: 6, background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 8 }}>
                {navItems.map((item) => (
                  <Link
                    key={item.num}
                    href={item.href}
                    style={{
                      padding: "10px 18px",
                      border: item.active ? "3px solid var(--hw-border-strong)" : "3px solid transparent",
                      background: item.active ? "var(--hw-bg-invert)" : "var(--hw-bg-surface)",
                      color: item.active ? "var(--hw-text-invert)" : "var(--hw-text)",
                      textDecoration: "none",
                      fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: item.active ? 700 : 400,
                      letterSpacing: "1.5px", textTransform: "uppercase",
                    }}
                  >{item.num}. {item.label}</Link>
                ))}
              </div>
            </div>
            {/* Push to Localizer */}
            {shows.length > 0 && (
              <div className="td-push-col" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <button
                  onClick={pushToLocalizer}
                  disabled={pushing}
                  style={{
                    padding: "10px 20px",
                    border: "3px solid var(--hw-green)",
                    background: "var(--hw-green)", color: "var(--hw-text-invert)",
                    fontFamily: "var(--hw-font-display)", fontSize: 14, letterSpacing: "2px", textTransform: "uppercase",
                    cursor: pushing ? "wait" : "pointer",
                    opacity: pushing ? 0.4 : 1,
                  }}
                >{pushing ? "PUSHING..." : tour?.localizer_tour_id ? "UPDATE LOCALIZER \u2192" : "PUSH TO LOCALIZER \u2192"}</button>
                {pushResult && !pushResult.status.startsWith("error") && (
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, letterSpacing: "1px", textTransform: "uppercase" }}>
                    <span style={{ color: "var(--hw-green)", fontWeight: 700 }}>{pushResult.eventCount} shows {pushResult.status}</span>
                    {pushResult.localizerTourId && (
                      <Link href={`/dashboard/tours/${pushResult.localizerTourId}`} style={{ marginLeft: 8, color: "var(--hw-blue)", textDecoration: "none", fontWeight: 700 }}>Open in Localizer &rarr;</Link>
                    )}
                  </div>
                )}
                {pushResult && pushResult.status.startsWith("error") && (
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-crimson)" }}>{pushResult.status}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="td-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
          {statCards.map((card) => (
            <div key={card.label} style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: "14px 16px" }}>
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, fontWeight: 400, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>{card.label}</div>
              <div className="td-stat-value" style={{ fontFamily: "var(--hw-font-display)", fontSize: 24, letterSpacing: "1px", color: card.color || "var(--hw-text)" }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Settings Panel */}
        {showSettings && tour && (
          <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 14, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase" }}>Tour Settings</div>
              <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--hw-text-muted)" }}>&times;</button>
            </div>
            {flags.multiVehicle && <VehicleManager
              vehicles={(tour?.tour_vehicles || []) as never[]}
              defaultFuelPrice={tour?.fuel_price_usd || 3.50}
              onSave={async (updated) => {
                setTour((prev) => prev ? { ...prev, tour_vehicles: updated as unknown as Record<string, unknown>[] } : prev);
                await fetch(`/api/tourrouter/tours/${tourId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tour_vehicles: updated }),
                });
              }}
            />}

            {/* Legacy single-vehicle settings — show only if no multi-vehicle config */}
            {(!tour.tour_vehicles || tour.tour_vehicles.length === 0) && (
              <div style={{ borderTop: "3px solid var(--hw-border-strong)", marginTop: 12, paddingTop: 8 }}>
                <div onClick={() => setShowLegacyVehicle(!showLegacyVehicle)} style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", cursor: "pointer", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: showLegacyVehicle ? 10 : 0 }}>
                  {showLegacyVehicle ? "Hide" : "Show"} legacy single-vehicle settings {showLegacyVehicle ? "\u25bc" : "\u25b6"}
                </div>
                {showLegacyVehicle && (
                  <div className="td-settings-grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                    <div>
                      <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Vehicle</label>
                      <select value={tour.vehicle_type || "van"} onChange={(e) => { const v = e.target.value; updateTourSetting("vehicle_type", v); const mpgDefaults: Record<string, number> = { van: 18, e350: 14, minibus: 12, bus: 6, truck: 10, car: 28 }; if (mpgDefaults[v]) updateTourSetting("mpg", mpgDefaults[v]); }} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", background: "var(--hw-bg-surface)", outline: "none" }}>
                        {["van", "e350", "minibus", "bus", "truck", "car"].map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Passengers</label>
                      <input type="number" value={tour.pax ?? 4} onChange={(e) => updateTourSetting("pax", parseInt(e.target.value) || 1)} min={1} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>MPG</label>
                      <input type="number" value={tour.mpg ?? ""} onChange={(e) => updateTourSetting("mpg", parseFloat(e.target.value) || null)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} placeholder="Auto" />
                    </div>
                    <div>
                      <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Fuel $/gal</label>
                      <input type="number" value={tour.fuel_price_usd ?? 3.50} onChange={(e) => updateTourSetting("fuel_price_usd", parseFloat(e.target.value) || null)} step="0.01" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Fly threshold (h)</label>
                      <input type="number" value={tour.flight_threshold_h ?? 6} onChange={(e) => updateTourSetting("flight_threshold_h", parseInt(e.target.value) || 6)} min={1} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Blanket Expenses */}
            <div style={{ borderTop: "3px solid var(--hw-border-strong)", paddingTop: 16, marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 14, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>Blanket Expenses</div>
                <button
                  onClick={() => setBlanketDetail(!blanketDetail)}
                  style={{ padding: "4px 10px", fontSize: 13, fontWeight: 600, fontFamily: "var(--hw-font-display)", letterSpacing: "2px", textTransform: "uppercase", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", cursor: "pointer" }}
                >
                  {blanketDetail ? "Summary View" : "Detail View"}
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 1fr 120px", gap: 8, alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", marginBottom: 2, letterSpacing: "1.5px", textTransform: "uppercase" }}>Show Day Label</div>
                  <input
                    style={{ width: "100%", boxSizing: "border-box", padding: "4px 8px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }}
                    value={tour?.blanket_show_label || ""}
                    placeholder="e.g. Band Pay"
                    onChange={(e) => updateTourSetting("blanket_show_label", e.target.value)}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", marginBottom: 2, letterSpacing: "1.5px", textTransform: "uppercase" }}>$/Show Day</div>
                  <input
                    style={{ width: "100%", boxSizing: "border-box", padding: "4px 8px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-mono)", textAlign: "right" as const, outline: "none" }}
                    type="number"
                    value={tour?.blanket_show_amount || ""}
                    placeholder="0"
                    onChange={(e) => updateTourSetting("blanket_show_amount", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", marginBottom: 2, letterSpacing: "1.5px", textTransform: "uppercase" }}>Off Day Label</div>
                  <input
                    style={{ width: "100%", boxSizing: "border-box", padding: "4px 8px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }}
                    value={tour?.blanket_off_label || ""}
                    placeholder="e.g. Hotel + Per Diem"
                    onChange={(e) => updateTourSetting("blanket_off_label", e.target.value)}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", marginBottom: 2, letterSpacing: "1.5px", textTransform: "uppercase" }}>$/Off Day</div>
                  <input
                    style={{ width: "100%", boxSizing: "border-box", padding: "4px 8px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-mono)", textAlign: "right" as const, outline: "none" }}
                    type="number"
                    value={tour?.blanket_off_amount || ""}
                    placeholder="0"
                    onChange={(e) => updateTourSetting("blanket_off_amount", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {blanketDetail && (
                <div style={{ marginTop: 12, background: "var(--hw-bg)", padding: 12 }}>
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, fontWeight: 600, color: "var(--hw-text-muted)", marginBottom: 8, letterSpacing: "1.5px", textTransform: "uppercase" }}>BREAKDOWN</div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                    <span>{tour?.blanket_show_label || "Show Day"} &times; {financials?.showDayCount || 0} show days</span>
                    <span style={{ fontFamily: "var(--hw-font-mono)" }}>${((tour?.blanket_show_amount || 0) * (financials?.showDayCount || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                    <span>{tour?.blanket_off_label || "Off Day"} &times; {financials?.offDayCount || 0} off days</span>
                    <span style={{ fontFamily: "var(--hw-font-mono)" }}>${((tour?.blanket_off_amount || 0) * (financials?.offDayCount || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, fontWeight: 700, borderTop: "3px solid var(--hw-border-strong)", marginTop: 4 }}>
                    <span>Total Blanket Expenses</span>
                    <span style={{ fontFamily: "var(--hw-font-mono)" }}>${(((tour?.blanket_show_amount || 0) * (financials?.showDayCount || 0)) + ((tour?.blanket_off_amount || 0) * (financials?.offDayCount || 0))).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {tour?.tour_roster && tour.tour_roster.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 13, fontFamily: "var(--hw-font-mono)", color: "var(--hw-amber)", padding: "4px 8px", background: "var(--hw-amber-ghost)" }}>
                      Note: You have a roster with {tour.tour_roster.length} member(s). When roster pay components are set, they replace blanket amounts in the financial calculations.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Commissions */}
            {flags.commissions && <div style={{ borderTop: "3px solid var(--hw-border-strong)", paddingTop: 16, marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showCommissions ? 12 : 0 }}>
                <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 14, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }} onClick={() => setShowCommissions(!showCommissions)}>
                  Commissions {showCommissions ? "\u25bc" : "\u25b6"}
                </div>
                {showCommissions && (
                  <button
                    onClick={() => {
                      const newC: Commission = {
                        id: crypto.randomUUID(),
                        type: "agent_pct" as CommissionType,
                        label: "",
                        recipientName: "",
                        recipientCompany: null,
                        percentage: null,
                        flatAmount: null,
                        flatPeriod: null,
                        currency: "USD",
                        isActive: true,
                        notes: null,
                      };
                      const updated = [...(tour?.tour_commissions || []), newC];
                      updateTourSetting("tour_commissions", updated);
                    }}
                    style={{ padding: "4px 12px", border: "3px solid var(--hw-bg-invert)", background: "var(--hw-bg-invert)", color: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-display)", fontSize: 13, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}
                  >+ Add Commission</button>
                )}
              </div>
              {showCommissions && (
                <div>
                  {(tour?.tour_commissions || []).length === 0 && (
                    <div style={{ fontSize: 12, fontFamily: "var(--hw-font-body)", color: "var(--hw-text-muted)", padding: "8px 0" }}>No commissions configured</div>
                  )}
                  {(tour?.tour_commissions || []).map((c, idx) => {
                    const isPct = ["agent_pct", "manager_pct_gross", "manager_pct_net", "bm_pct_gross", "co_manager_pct", "subagent_pct"].includes(c.type);
                    const isFlat = ["bm_flat_monthly", "label_support"].includes(c.type);
                    const isCustom = c.type === "custom";

                    function updateCommission(field: string, value: unknown) {
                      const updated = [...(tour?.tour_commissions || [])];
                      updated[idx] = { ...updated[idx], [field]: value };
                      updateTourSetting("tour_commissions", updated);
                    }

                    function removeCommission() {
                      const updated = (tour?.tour_commissions || []).filter((_, i) => i !== idx);
                      updateTourSetting("tour_commissions", updated);
                    }

                    return (
                      <div key={c.id} className="td-commission-row" style={{ display: "grid", gridTemplateColumns: "1fr 140px 1fr 100px 60px 40px 30px", gap: 6, alignItems: "end", marginBottom: 8, padding: "8px 0", borderBottom: "3px solid var(--hw-border)" }}>
                        <div>
                          <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)", marginBottom: 2, letterSpacing: "1.5px", textTransform: "uppercase" }}>Label</div>
                          <input value={c.label || ""} onChange={(e) => updateCommission("label", e.target.value)} placeholder="e.g. Booking Agent" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "3px solid var(--hw-border-strong)", fontSize: 12, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                        </div>
                        <div>
                          <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)", marginBottom: 2, letterSpacing: "1.5px", textTransform: "uppercase" }}>Type</div>
                          <select value={c.type} onChange={(e) => updateCommission("type", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "6px 4px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", background: "var(--hw-bg-surface)", outline: "none" }}>
                            {Object.entries(COMMISSION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)", marginBottom: 2, letterSpacing: "1.5px", textTransform: "uppercase" }}>Recipient</div>
                          <input value={c.recipientName || ""} onChange={(e) => updateCommission("recipientName", e.target.value)} placeholder="Name" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "3px solid var(--hw-border-strong)", fontSize: 12, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                        </div>
                        <div>
                          {(isPct || isCustom) && (
                            <>
                              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)", marginBottom: 2, letterSpacing: "1.5px", textTransform: "uppercase" }}>%</div>
                              <input type="number" step="0.1" value={c.percentage ?? ""} onChange={(e) => updateCommission("percentage", parseFloat(e.target.value) || null)} placeholder="10" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "3px solid var(--hw-border-strong)", fontSize: 12, fontFamily: "var(--hw-font-mono)", outline: "none" }} />
                            </>
                          )}
                          {(isFlat || isCustom) && !isPct && (
                            <>
                              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)", marginBottom: 2, letterSpacing: "1.5px", textTransform: "uppercase" }}>$ Flat</div>
                              <input type="number" value={c.flatAmount ?? ""} onChange={(e) => updateCommission("flatAmount", parseFloat(e.target.value) || null)} placeholder="0" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "3px solid var(--hw-border-strong)", fontSize: 12, fontFamily: "var(--hw-font-mono)", outline: "none" }} />
                            </>
                          )}
                        </div>
                        <div>
                          {isFlat && (
                            <>
                              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)", marginBottom: 2, letterSpacing: "1.5px", textTransform: "uppercase" }}>Period</div>
                              <select value={c.flatPeriod || "monthly"} onChange={(e) => updateCommission("flatPeriod", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "6px 2px", border: "3px solid var(--hw-border-strong)", fontSize: 12, fontFamily: "var(--hw-font-body)", background: "var(--hw-bg-surface)", outline: "none" }}>
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                                <option value="per_tour">Per Tour</option>
                              </select>
                            </>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 2 }}>
                          <input type="checkbox" checked={c.isActive} onChange={(e) => updateCommission("isActive", e.target.checked)} title="Active" style={{ width: 14, height: 14, accentColor: "var(--hw-crimson)" }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 2 }}>
                          <button onClick={removeCommission} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--hw-text-muted)", padding: 0 }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--hw-crimson)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--hw-text-muted)"; }}>&times;</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>}

            {/* Advance Settings */}
            {flags.advancing && <div style={{ borderTop: "3px solid var(--hw-border-strong)", marginTop: 16, paddingTop: 16 }}>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 12, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>Advance Automation</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                <div>
                  <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Initial (days before)</label>
                  <input type="number" value={tour.advance_config?.initialSendDays ?? 21} onChange={(e) => updateTourSetting("advance_config", { ...tour.advance_config, initialSendDays: parseInt(e.target.value) || 21 })} min={1} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Follow-up 1 (days)</label>
                  <input type="number" value={tour.advance_config?.followup1Days ?? 5} onChange={(e) => updateTourSetting("advance_config", { ...tour.advance_config, followup1Days: parseInt(e.target.value) || 5 })} min={1} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Follow-up 2 (days)</label>
                  <input type="number" value={tour.advance_config?.followup2Days ?? 5} onChange={(e) => updateTourSetting("advance_config", { ...tour.advance_config, followup2Days: parseInt(e.target.value) || 5 })} min={1} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Final nudge (days before)</label>
                  <input type="number" value={tour.advance_config?.finalNudgeDays ?? 3} onChange={(e) => updateTourSetting("advance_config", { ...tour.advance_config, finalNudgeDays: parseInt(e.target.value) || 3 })} min={1} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", padding: "8px 0" }}>
                    <input type="checkbox" checked={tour.advance_config?.enabled !== false} onChange={(e) => updateTourSetting("advance_config", { ...tour.advance_config, enabled: e.target.checked })} style={{ width: 16, height: 16, accentColor: "var(--hw-crimson)" }} />
                    <span style={{ fontWeight: 600 }}>Enabled</span>
                  </label>
                </div>
              </div>
            </div>}
          </div>
        )}

        {/* Action bar */}
        <div className="td-actions" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ padding: "8px 16px", border: "3px solid var(--hw-action-primary)", background: "var(--hw-action-primary)", color: "var(--hw-text-invert)", fontFamily: "var(--hw-font-display)", fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer", transition: "var(--hw-ease)" }}
          >+ ADD SHOW</button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{ padding: "8px 16px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text-secondary)", fontFamily: "var(--hw-font-display)", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", transition: "var(--hw-ease)" }}
          >{showSettings ? "HIDE SETTINGS" : "TOUR SETTINGS"}</button>
          {flags.personnelPay && <button
            onClick={() => setShowRoster(!showRoster)}
            style={{ padding: "8px 16px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text-secondary)", fontFamily: "var(--hw-font-display)", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", transition: "var(--hw-ease)" }}
          >{showRoster ? "HIDE ROSTER" : "ROSTER"}</button>}
        </div>

        {/* Roster Panel */}
        {flags.personnelPay && showRoster && (
          <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 16, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>Tour Roster & Pay</div>
              <button onClick={() => setShowRoster(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--hw-text-muted)" }}>&times;</button>
            </div>
            <RosterPanel
              tourId={tourId}
              roster={(tour?.tour_roster || []) as never[]}
              onUpdate={(updated) => setTour((prev) => prev ? { ...prev, tour_roster: updated as unknown as Record<string, unknown>[] } : prev)}
            />
          </div>
        )}

        {/* Empty state */}
        {!loading && shows.length === 0 && (
          <div style={{ background: "var(--hw-bg-surface)", border: "3px dashed var(--hw-border-light)", padding: 48, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 24, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", marginBottom: 12 }}>NO SHOWS IMPORTED YET</div>
            <Link href={`/dashboard/routing/${tourId}/import`} style={{ display: "inline-block", padding: "14px 28px", border: "3px solid var(--hw-action-primary)", background: "var(--hw-action-primary)", color: "var(--hw-text-invert)", textDecoration: "none", fontFamily: "var(--hw-font-display)", fontSize: 16, letterSpacing: "3px", textTransform: "uppercase" }}>IMPORT SHOWS</Link>
          </div>
        )}

        {/* Route Table */}
        {shows.length > 0 && (
          <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", overflow: "hidden" }}>
            {/* Table header */}
            <p style={{
              fontFamily: "var(--hw-font-mono)",
              fontSize: 13,
              letterSpacing: "1px",
              color: "var(--hw-text-muted)",
              margin: "10px 12px 8px 12px",
              textTransform: "uppercase" as const,
            }}>
              Tip — click any show to edit details in the side drawer
            </p>
            <div className="td-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--hw-bg-invert)" }}>
                    {["#", "Date", "Event / Venue", "City", "Country", "Offer", "USD", "Status", "Cap", "Adv", ""].map((h) => (
                      <th key={h || "del"} style={{ padding: "12px 12px", textAlign: "left", fontFamily: "var(--hw-font-mono)", fontSize: 12, fontWeight: 700, color: "var(--hw-text-invert)", textTransform: "uppercase", letterSpacing: "2px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {consolidateShows(shows).map((s, i) => {
                    // Map back to original index for legs/choices
                    const origIdx = shows.findIndex((orig) => orig.id === s.id);
                    const leg = origIdx > 0 ? legs[origIdx] : null;
                    const flying = legChoices[origIdx] === "fly";
                    const suggestFly = leg && leg.driveH !== null && leg.driveH > flightThreshold;
                    const showNum = shows.slice(0, origIdx + 1).filter((x) => !x.is_off).length;
                    const sd = statusDot(s.status);
                    const fromAP = origIdx > 0 ? lookupAirport(shows[origIdx - 1].city, shows[origIdx - 1].country, airportMap) : null;
                    const toAP = lookupAirport(s.city, s.country, airportMap);

                    return (
                      <LegAndShowRow
                        key={s.id}
                        show={s}
                        showNum={showNum}
                        index={origIdx}
                        leg={leg}
                        flying={flying}
                        suggestFly={!!suggestFly}
                        fromAP={fromAP}
                        toAP={toAP}
                        sd={sd}
                        flightThreshold={flightThreshold}
                        onToggleLeg={toggleLeg}
                        onClickRow={openDrawer}
                        driveColorBg={driveColorBg}
                        driveColor={driveColor}
                        formatShowDate={formatShowDate}
                        onDelete={(id) => setDeleteConfirmId(id)}
                        flightPriceCache={flightPriceCache}
                        pax={tour?.pax || 4}
                        dateIso={s.date_iso}
                        currencyRates={tour?.currency_rates || {}}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* ══════ Slide Drawer ══════ */}
      {drawerShow !== null && (
        <>
          <div onClick={closeDrawer} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 900 }} />
          <div className="td-drawer" style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: 460, maxWidth: "90vw",
            background: "var(--hw-bg-surface)", zIndex: 901, overflowY: "auto",
            borderLeft: "3px solid var(--hw-border-strong)",
            boxShadow: "var(--hw-shadow-xl)",
            animation: "slideIn 0.25s ease-out",
          }}>
            <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
            {/* Drawer header */}
            <div className="td-drawer-header" style={{ padding: "20px 24px", borderBottom: "3px solid var(--hw-border-strong)", position: "sticky", top: 0, background: "var(--hw-bg-surface)", zIndex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", marginBottom: 4 }}>{drawerShow.venue || drawerShow.event || "SHOW DETAIL"}</div>
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>
                    {[formatShowDate(drawerShow.date_iso), drawerShow.city, drawerShow.country].filter(Boolean).join(" \u00b7 ")}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {drawerSaved && <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-green)" }}>SAVED</span>}
                  <a
                    href={`/api/tourrouter/tours/${tourId}/export/advance?showId=${drawerShow.id}`}
                    download
                    style={{ padding: "4px 10px", border: "2px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", textDecoration: "none", cursor: "pointer" }}
                  >ADVANCE</a>
                  <a
                    href={`/api/tourrouter/tours/${tourId}/export/daysheet?showId=${drawerShow.id}`}
                    download
                    style={{ padding: "4px 10px", border: "2px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", textDecoration: "none", cursor: "pointer" }}
                  >DAY SHEET</a>
                  <button onClick={closeDrawer} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--hw-text-muted)", padding: "4px 8px" }}>&times;</button>
                </div>
              </div>
            </div>
            {/* Drawer sections */}
            <div style={{ padding: "0 24px 24px" }}>
              {DRAWER_SECTIONS.slice(0, 2).map((section) => {
                const collapsed = collapsedSections.has(section.title);
                return (
                  <div key={section.title} style={{ borderBottom: "2px solid var(--hw-border)" }}>
                    <div
                      onClick={() => toggleSection(section.title)}
                      style={{ padding: "14px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, textTransform: "uppercase", letterSpacing: "2px", color: "var(--hw-text-muted)" }}>{section.title}</div>
                      <span style={{ fontSize: 12, color: "var(--hw-text-muted)" }}>{collapsed ? "\u25b6" : "\u25bc"}</span>
                    </div>
                    {!collapsed && (
                      <div style={{ paddingBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {section.fields.map((field) => (
                          <div key={field.key} style={{ gridColumn: ["notes", "backend", "hotel_notes", "hotel_address", "parking_notes", "venue_notes", "backline_notes", "hospitality_notes"].includes(field.key) ? "1 / -1" : undefined }}>
                            <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", display: "block", marginBottom: 6 }}>{field.label}</label>
                            {field.key === "offer_currency" ? (
                              <select
                                value={String((drawerShow as Record<string, unknown>)[field.key] ?? "USD")}
                                onChange={(e) => updateDrawerField(field.key, e.target.value)}
                                style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 13, background: "var(--hw-bg-surface)", outline: "none" }}
                              >
                                {TOURING_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                            ) : (
                              <input
                                value={String((drawerShow as Record<string, unknown>)[field.key] ?? "")}
                                onChange={(e) => updateDrawerField(field.key, e.target.value)}
                                type={field.type || "text"}
                                style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 13, outline: "none" }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Guest List Section */}
              {flags.guestList && drawerShow && !drawerShow.is_off && (
                <div style={{ borderBottom: "3px solid var(--hw-border)" }}>
                  <div
                    onClick={() => toggleSection("Guest List")}
                    style={{ padding: "14px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, textTransform: "uppercase", letterSpacing: "2px", color: "var(--hw-text-muted)" }}>Guest List</div>
                      {guests.length > 0 && (
                        <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, fontWeight: 700, padding: "2px 8px", background: "var(--hw-bg)", color: "var(--hw-text-secondary)" }}>
                          {guests.reduce((s, g) => s + 1 + g.plus_ones, 0)} total
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "var(--hw-text-muted)" }}>{collapsedSections.has("Guest List") ? "\u25b6" : "\u25bc"}</span>
                  </div>
                  {!collapsedSections.has("Guest List") && (
                    <div style={{ paddingBottom: 14 }}>
                      {/* Guest list cutoff */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Guest List Cutoff</label>
                        <input
                          type="datetime-local"
                          value={String((drawerShow as Record<string, unknown>).guest_list_cutoff ?? "")}
                          onChange={(e) => updateDrawerField("guest_list_cutoff", e.target.value)}
                          style={{ padding: "6px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 12, fontFamily: "var(--hw-font-body)", outline: "none" }}
                        />
                      </div>

                      {guestLoading ? (
                        <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)" }}>Loading...</div>
                      ) : (
                        <>
                          {guests.length > 0 && (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 10 }}>
                              <thead>
                                <tr>
                                  {["Name", "Party", "Pass", "Notes", "Status", ""].map((h) => (
                                    <th key={h} style={{ padding: "4px 6px", textAlign: "left", fontFamily: "var(--hw-font-mono)", fontSize: 12, fontWeight: 700, color: "var(--hw-text-muted)", letterSpacing: "1.5px", textTransform: "uppercase", borderBottom: "3px solid var(--hw-border-strong)" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {guests.map((g) => {
                                  const stColor = g.status === "confirmed" ? "var(--hw-green)" : g.status === "declined" ? "var(--hw-crimson)" : "var(--hw-amber)";
                                  const stBg = g.status === "confirmed" ? "var(--hw-green-ghost)" : g.status === "declined" ? "var(--hw-red-ghost)" : "var(--hw-amber-ghost)";
                                  return (
                                    <tr key={g.id} style={{ borderBottom: "2px solid var(--hw-border)" }}>
                                      <td style={{ padding: "5px 6px", fontWeight: 600 }}>{g.guest_name}</td>
                                      <td style={{ padding: "5px 6px", fontFamily: "var(--hw-font-mono)" }}>{1 + g.plus_ones}</td>
                                      <td style={{ padding: "5px 6px" }}>{g.pass_type}</td>
                                      <td style={{ padding: "5px 6px", fontSize: 13, color: "var(--hw-text-muted)", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={g.notes || ""}>{g.notes || "\u2014"}</td>
                                      <td style={{ padding: "5px 6px" }}>
                                        <select
                                          value={g.status}
                                          onChange={(e) => updateGuestStatus(g.id, e.target.value)}
                                          style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, fontWeight: 700, padding: "2px 4px", border: "none", background: stBg, color: stColor, cursor: "pointer", outline: "none" }}
                                        >
                                          {["pending", "confirmed", "declined"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                        </select>
                                      </td>
                                      <td style={{ padding: "5px 6px" }}>
                                        <button onClick={() => deleteGuest(g.id)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "var(--hw-text-muted)", padding: "2px 4px" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--hw-crimson)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--hw-text-muted)"; }}>&times;</button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}

                          {addingGuest ? (
                            <div className="td-guest-add-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 6, alignItems: "end" }}>
                              <div>
                                <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)", display: "block", marginBottom: 2, letterSpacing: "1.5px", textTransform: "uppercase" }}>Name</label>
                                <input value={newGuest.name} onChange={(e) => setNewGuest((p) => ({ ...p, name: e.target.value }))} placeholder="Guest name" onKeyDown={(e) => e.key === "Enter" && addGuest()} style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "3px solid var(--hw-border-strong)", fontSize: 12, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                              </div>
                              <div style={{ width: 44 }}>
                                <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)", display: "block", marginBottom: 2, letterSpacing: "1.5px", textTransform: "uppercase" }}>Party</label>
                                <input type="number" value={newGuest.plusOnes} onChange={(e) => setNewGuest((p) => ({ ...p, plusOnes: parseInt(e.target.value) || 0 }))} min={0} style={{ width: "100%", boxSizing: "border-box", padding: "6px 4px", border: "3px solid var(--hw-border-strong)", fontSize: 12, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                              </div>
                              <div style={{ width: 80 }}>
                                <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)", display: "block", marginBottom: 2, letterSpacing: "1.5px", textTransform: "uppercase" }}>Pass</label>
                                <select value={newGuest.passType} onChange={(e) => setNewGuest((p) => ({ ...p, passType: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "6px 4px", border: "3px solid var(--hw-border-strong)", fontSize: 12, fontFamily: "var(--hw-font-body)", background: "var(--hw-bg-surface)", outline: "none" }}>
                                  {["Guest", "VIP", "Photo", "Working", "Will Call"].map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={addGuest} style={{ padding: "6px 12px", border: "3px solid var(--hw-bg-invert)", background: "var(--hw-bg-invert)", color: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-display)", fontSize: 13, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}>Add</button>
                                <button onClick={() => setAddingGuest(false)} style={{ padding: "6px 12px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-display)", fontSize: 13, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}>Cancel</button>
                              </div>
                              <div style={{ gridColumn: "1 / -1" }}>
                                <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)", display: "block", marginBottom: 2, letterSpacing: "1.5px", textTransform: "uppercase" }}>Notes</label>
                                <input value={newGuest.notes} onChange={(e) => setNewGuest((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "3px solid var(--hw-border-strong)", fontSize: 12, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setAddingGuest(true)} style={{ padding: "6px 14px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-display)", fontSize: 13, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}>+ Add Guest</button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Remaining drawer sections */}
              {DRAWER_SECTIONS.slice(2).map((section) => {
                const collapsed = collapsedSections.has(section.title);
                return (
                  <div key={section.title} style={{ borderBottom: "2px solid var(--hw-border)" }}>
                    <div
                      onClick={() => toggleSection(section.title)}
                      style={{ padding: "14px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, textTransform: "uppercase", letterSpacing: "2px", color: "var(--hw-text-muted)" }}>{section.title}</div>
                      <span style={{ fontSize: 12, color: "var(--hw-text-muted)" }}>{collapsed ? "\u25b6" : "\u25bc"}</span>
                    </div>
                    {!collapsed && (
                      <div style={{ paddingBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {section.fields.map((field) => (
                          <div key={field.key} style={{ gridColumn: ["notes", "backend", "hotel_notes", "hotel_address", "parking_notes", "venue_notes", "backline_notes", "hospitality_notes"].includes(field.key) ? "1 / -1" : undefined }}>
                            <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", display: "block", marginBottom: 6 }}>{field.label}</label>
                            {field.key === "offer_currency" ? (
                              <select
                                value={String((drawerShow as Record<string, unknown>)[field.key] ?? "USD")}
                                onChange={(e) => updateDrawerField(field.key, e.target.value)}
                                style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 13, background: "var(--hw-bg-surface)", outline: "none" }}
                              >
                                {TOURING_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                            ) : (
                              <input
                                value={String((drawerShow as Record<string, unknown>)[field.key] ?? "")}
                                onChange={(e) => updateDrawerField(field.key, e.target.value)}
                                type={field.type || "text"}
                                style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 13, outline: "none" }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Hotel Block (conditional fields) */}
              {drawerShow && !collapsedSections.has("Hotel") && (
                <div style={{ paddingBottom: 14, marginTop: -10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "8px 0" }}>
                    <input
                      type="checkbox"
                      checked={!!(drawerShow as Record<string, unknown>).hotel_block}
                      onChange={(e) => updateDrawerField("hotel_block", e.target.checked ? "true" : "")}
                      style={{ width: 16, height: 16, accentColor: "var(--hw-crimson)" }}
                    />
                    <span style={{ fontWeight: 600 }}>Room Block</span>
                  </label>
                  {!!(drawerShow as Record<string, unknown>).hotel_block && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6, paddingLeft: 24 }}>
                      <div>
                        <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Block Size</label>
                        <input type="number" value={String((drawerShow as Record<string, unknown>).hotel_block_size ?? "")} onChange={(e) => updateDrawerField("hotel_block_size", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Block Rate ($)</label>
                        <input type="number" value={String((drawerShow as Record<string, unknown>).hotel_block_rate ?? "")} onChange={(e) => updateDrawerField("hotel_block_rate", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Cutoff Date</label>
                        <input value={String((drawerShow as Record<string, unknown>).hotel_cutoff_date ?? "")} onChange={(e) => updateDrawerField("hotel_cutoff_date", e.target.value)} placeholder="e.g. 2026-05-01" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Attrition %</label>
                        <input type="number" value={String((drawerShow as Record<string, unknown>).hotel_attrition_pct ?? "")} onChange={(e) => updateDrawerField("hotel_attrition_pct", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Settlement Section */}
              {flags.settlement && drawerShow && !drawerShow.is_off && (
                <div style={{ borderBottom: "3px solid var(--hw-border)", padding: "0 0 14px" }}>
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, textTransform: "uppercase", letterSpacing: "2px", color: "var(--hw-text-muted)", padding: "14px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => setSettlementOpen(!settlementOpen)}>
                    Settlement
                    <span style={{ fontSize: 12, color: "var(--hw-text-muted)" }}>{settlementOpen ? "\u25bc" : "\u25b6"}</span>
                  </div>
                  {settlementOpen && (
                    <SettlementPanel
                      show={{
                        id: drawerShow.id,
                        event: drawerShow.event || "",
                        date_iso: drawerShow.date_iso || "",
                        city: drawerShow.city || "",
                        venue: drawerShow.venue || "",
                        offer_amount: drawerShow.offer_amount || 0,
                        offer_currency: drawerShow.offer_currency || "USD",
                        deal: (drawerShow.deal as Record<string, unknown>) as never || null,
                        settlement: (drawerShow.settlement as Record<string, unknown>) as never || null,
                      }}
                      tourId={tourId}
                      currencyRates={tour?.currency_rates || {}}
                      onUpdate={(field, value) => {
                        setDrawerShow((prev) => prev ? { ...prev, [field]: value } : prev);
                      }}
                    />
                  )}
                </div>
              )}

              {/* Deposits Section */}
              {flags.depositTracking && drawerShow && !drawerShow.is_off && (
                <div style={{ borderBottom: "3px solid var(--hw-border)" }}>
                  <div
                    onClick={() => toggleSection("Deposits")}
                    style={{ padding: "14px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, textTransform: "uppercase", letterSpacing: "2px", color: "var(--hw-text-muted)" }}>Deposits</div>
                      {(() => {
                        const ds = String((drawerShow as Record<string, unknown>).deposit_status || "");
                        if (!ds) return null;
                        const c = ds === "Received" ? "var(--hw-green)" : ds === "Returned" ? "var(--hw-crimson)" : ds === "Requested" ? "var(--hw-amber)" : "var(--hw-text-muted)";
                        return <span style={{ width: 7, height: 7, borderRadius: "50%", background: c, display: "inline-block" }} />;
                      })()}
                    </div>
                    <span style={{ fontSize: 12, color: "var(--hw-text-muted)" }}>{collapsedSections.has("Deposits") ? "\u25b6" : "\u25bc"}</span>
                  </div>
                  {!collapsedSections.has("Deposits") && (
                    <div style={{ paddingBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Amount</label>
                        <input type="number" value={String((drawerShow as Record<string, unknown>).deposit_amount ?? "")} onChange={(e) => updateDrawerField("deposit_amount", e.target.value)} placeholder="0" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Currency</label>
                        <input value={String((drawerShow as Record<string, unknown>).deposit_currency ?? "USD")} onChange={(e) => updateDrawerField("deposit_currency", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Status</label>
                        {(() => {
                          const val = String((drawerShow as Record<string, unknown>).deposit_status || "Not Received");
                          const dotColor = val === "Received" ? "var(--hw-green)" : val === "Returned" ? "var(--hw-crimson)" : val === "Requested" ? "var(--hw-amber)" : "var(--hw-text-muted)";
                          return (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                              <select value={val} onChange={(e) => updateDrawerField("deposit_status", e.target.value)} style={{ flex: 1, padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", background: "var(--hw-bg-surface)", outline: "none" }}>
                                {["Not Received", "Requested", "Received", "Returned"].map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Collected By</label>
                        <input value={String((drawerShow as Record<string, unknown>).deposit_collected_by ?? "")} onChange={(e) => updateDrawerField("deposit_collected_by", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Notes</label>
                        <input value={String((drawerShow as Record<string, unknown>).deposit_notes ?? "")} onChange={(e) => updateDrawerField("deposit_notes", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Advancing Section */}
              {flags.advancing && drawerShow && !drawerShow.is_off && (() => {
                const as = drawerShow.advance_status || "not_started";
                const statusColor = as === "confirmed" ? "var(--hw-green)" : as.includes("escalated") || as.includes("bounced") ? "var(--hw-crimson)" : as.includes("followup") || as.includes("final") ? "var(--hw-amber)" : as === "sent" ? "var(--hw-blue)" : "var(--hw-text-muted)";
                const statusBg = as === "confirmed" ? "var(--hw-green-ghost)" : as.includes("escalated") || as.includes("bounced") ? "var(--hw-red-ghost)" : as.includes("followup") || as.includes("final") ? "var(--hw-amber-ghost)" : as === "sent" ? "var(--hw-blue-ghost)" : "var(--hw-bg)";
                const statusLabel = as.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                const isPaused = !!(drawerShow as Record<string, unknown>).advance_auto_stop;

                return (
                <div style={{ borderBottom: "3px solid var(--hw-border)" }}>
                  <div
                    onClick={() => toggleSection("Advancing")}
                    style={{ padding: "14px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, textTransform: "uppercase", letterSpacing: "2px", color: "var(--hw-text-muted)" }}>Advancing</div>
                      <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, fontWeight: 700, padding: "2px 8px", background: statusBg, color: statusColor }}>{statusLabel}</span>
                      {isPaused && <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, fontWeight: 700, padding: "2px 8px", background: "var(--hw-bg)", color: "var(--hw-text-muted)" }}>Paused</span>}
                    </div>
                    <span style={{ fontSize: 12, color: "var(--hw-text-muted)" }}>{collapsedSections.has("Advancing") ? "\u25b6" : "\u25bc"}</span>
                  </div>
                  {!collapsedSections.has("Advancing") && (
                    <div style={{ paddingBottom: 14 }}>
                      {/* Timeline */}
                      {drawerShow.advance_sent_at && (
                        <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)", marginBottom: 4 }}>
                          Last sent: {new Date(drawerShow.advance_sent_at).toLocaleDateString()} to {drawerShow.advance_recipient_email}
                        </div>
                      )}
                      {drawerShow.advance_form_submitted_at && (
                        <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-green)", marginBottom: 4, fontWeight: 600 }}>
                          Form submitted: {new Date(drawerShow.advance_form_submitted_at).toLocaleDateString()}
                          {drawerShow.advance_form_submitted_by ? ` by ${drawerShow.advance_form_submitted_by}` : ""}
                        </div>
                      )}

                      {/* Controls */}
                      <div style={{ display: "flex", gap: 6, marginBottom: 10, marginTop: 8 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer" }}>
                          <input type="checkbox" checked={isPaused} onChange={(e) => updateDrawerField("advance_auto_stop", e.target.checked ? "true" : "")} style={{ accentColor: "var(--hw-crimson)" }} />
                          Pause auto-advance
                        </label>
                        {as !== "confirmed" && (
                          <button
                            onClick={() => updateDrawerField("advance_status", "confirmed")}
                            style={{ padding: "4px 12px", border: "3px solid var(--hw-green)", background: "var(--hw-bg-surface)", color: "var(--hw-green)", fontFamily: "var(--hw-font-display)", fontWeight: 700, fontSize: 13, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", marginLeft: 8 }}
                          >Mark Confirmed</button>
                        )}
                      </div>

                      {/* Send form */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <div>
                          <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Recipient Email</label>
                          <input value={advanceEmail || drawerShow.advance_recipient_email || ""} onChange={(e) => setAdvanceEmail(e.target.value)} placeholder="promoter@venue.com" type="email" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                        </div>
                        <div>
                          <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Recipient Name</label>
                          <input value={advanceName} onChange={(e) => setAdvanceName(e.target.value)} placeholder="Contact name" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-body)", outline: "none" }} />
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <button onClick={() => sendAdvance(drawerShow.advance_sent_at ? "followup" : "initial")} disabled={advanceSending || !(advanceEmail.trim() || drawerShow.advance_recipient_email)} style={{ padding: "8px 16px", border: "3px solid var(--hw-bg-invert)", background: "var(--hw-bg-invert)", color: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-display)", fontWeight: 700, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", opacity: advanceSending ? 0.5 : 1 }}>
                          {advanceSending ? "Sending..." : drawerShow.advance_sent_at ? "Resend / Follow-up" : "Send Now"}
                        </button>
                        {drawerShow.advance_sent_at && (
                          <button onClick={() => sendAdvance("final")} disabled={advanceSending} style={{ padding: "8px 16px", border: "3px solid var(--hw-crimson)", background: "var(--hw-bg-surface)", color: "var(--hw-crimson)", fontFamily: "var(--hw-font-display)", fontWeight: 700, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}>Final Request</button>
                        )}
                        {advanceMsg && <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: advanceMsg.includes("failed") ? "var(--hw-crimson)" : "var(--hw-green)", fontWeight: 600 }}>{advanceMsg}</span>}
                      </div>

                      {/* Advance form link */}
                      {drawerShow.advance_form_token && (
                        <div style={{ marginTop: 10 }}>
                          <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", display: "block", marginBottom: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>Advance Form Link</label>
                          <div style={{ display: "flex", gap: 6 }}>
                            <input readOnly value={`${window.location.origin}/advance/${drawerShow.advance_form_token}`} style={{ flex: 1, padding: "6px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", outline: "none" }} />
                            <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/advance/${drawerShow.advance_form_token}`)} style={{ padding: "6px 12px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-display)", fontSize: 13, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}>Copy</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* ══════ Add Show Modal ══════ */}
      {showAddModal && (
        <>
          <div onClick={() => setShowAddModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 900 }} />
          <div className="td-add-modal" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 480, maxWidth: "90vw", background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 0, zIndex: 901, boxShadow: "var(--hw-shadow-xl)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "3px solid var(--hw-border-strong)" }}>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase" }}>ADD SHOW</div>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--hw-text-muted)" }}>&times;</button>
            </div>
            <div className="td-add-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: 24 }}>
              <div>
                <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", display: "block", marginBottom: 6 }}>Date</label>
                <input type="date" value={newShow.date_iso} onChange={(e) => setNewShow((p) => ({ ...p, date_iso: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 15, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", display: "block", marginBottom: 6 }}>Event Name</label>
                <input value={newShow.event} onChange={(e) => setNewShow((p) => ({ ...p, event: e.target.value }))} placeholder="Show name" style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 15, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", display: "block", marginBottom: 6 }}>Venue</label>
                <input value={newShow.venue} onChange={(e) => setNewShow((p) => ({ ...p, venue: e.target.value }))} placeholder="Venue name" style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 15, outline: "none" }} />
              </div>
              <div ref={cityDropdownRef} style={{ position: "relative" }}>
                <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", display: "block", marginBottom: 6 }}>City</label>
                <input
                  value={newShow.city}
                  onChange={(e) => handleCityInput(e.target.value)}
                  onKeyDown={handleCityKeyDown}
                  onFocus={() => { if (citySuggestions.length > 0) setCityDropdownOpen(true); }}
                  placeholder="City"
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-activedescendant={cityHighlight >= 0 ? `city-option-${cityHighlight}` : undefined}
                  style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 15, outline: "none" }}
                />
                {cityDropdownOpen && (
                  <div role="listbox" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, maxHeight: 240, overflowY: "auto", background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", borderTop: "none", boxShadow: "var(--hw-shadow-lg)" }}>
                    {citySuggestions.length === 0 ? (
                      <div style={{ padding: "10px 16px", fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>No matches</div>
                    ) : citySuggestions.map((s, idx) => (
                      <div
                        key={`${s.name}-${s.state}-${s.country}`}
                        id={`city-option-${idx}`}
                        role="option"
                        aria-selected={idx === cityHighlight}
                        onClick={() => selectCity(s)}
                        onMouseEnter={() => setCityHighlight(idx)}
                        style={{
                          padding: "10px 16px", cursor: "pointer",
                          background: idx === cityHighlight ? "var(--hw-crimson-ghost)" : "var(--hw-bg-surface)",
                          borderTop: idx > 0 ? "1px solid var(--hw-border)" : undefined,
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}
                      >
                        <span style={{ fontFamily: "var(--hw-font-body)", fontSize: 14 }}>
                          <span style={{ fontWeight: 500 }}>{s.name}</span>
                          {s.state && <span style={{ color: "var(--hw-text-muted)", fontWeight: 300 }}>, {s.state}</span>}
                          <span style={{ color: "var(--hw-text-muted)", fontWeight: 300 }}>, {ISO_TO_DISPLAY[s.country] || s.country}</span>
                        </span>
                        {s.iata_code && (
                          <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, letterSpacing: "1px", color: "var(--hw-text-secondary)", background: "var(--hw-bg)", padding: "2px 6px", border: "1px solid var(--hw-border)" }}>{s.iata_code}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", display: "block", marginBottom: 6 }}>Country</label>
                <input value={newShow.country} onChange={(e) => setNewShow((p) => ({ ...p, country: e.target.value }))} placeholder="USA" style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 15, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", display: "block", marginBottom: 6 }}>Offer Amount</label>
                <input type="number" value={newShow.offer_amount} onChange={(e) => setNewShow((p) => ({ ...p, offer_amount: e.target.value }))} placeholder="0" style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-mono)", fontSize: 15, outline: "none", textAlign: "right" }} />
              </div>
              <div>
                <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", display: "block", marginBottom: 6 }}>Currency</label>
                <select value={newShow.offer_currency} onChange={(e) => setNewShow((p) => ({ ...p, offer_currency: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 15, background: "var(--hw-bg-surface)", outline: "none", appearance: "none" }}>
                  {TOURING_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="td-add-modal-actions" style={{ padding: "16px 24px", display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "3px solid var(--hw-border-strong)", background: "var(--hw-bg)" }}>
              <button onClick={() => setShowAddModal(false)} style={{ padding: "8px 16px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-display)", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}>CANCEL</button>
              <button onClick={saveNewShow} disabled={addingSaving} style={{ padding: "8px 20px", border: "3px solid var(--hw-crimson)", background: "var(--hw-crimson)", color: "var(--hw-text-invert)", fontFamily: "var(--hw-font-display)", fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer", opacity: addingSaving ? 0.4 : 1 }}>{addingSaving ? "SAVING..." : "ADD SHOW"}</button>
            </div>
          </div>
        </>
      )}

      {/* ══════ Delete Confirmation ══════ */}
      {deleteConfirmId && (
        <>
          <div onClick={() => setDeleteConfirmId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 900 }} />
          <div className="td-delete-modal" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 360, background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", boxShadow: "var(--hw-shadow-xl)", zIndex: 901 }}>
            <div style={{ padding: "20px 24px", borderBottom: "3px solid var(--hw-border-strong)" }}>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase" }}>DELETE SHOW</div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 15, fontWeight: 300, color: "var(--hw-text-secondary)", marginBottom: 20 }}>Are you sure? This cannot be undone.</div>
            </div>
            <div style={{ padding: "16px 24px", display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "3px solid var(--hw-border-strong)", background: "var(--hw-bg)" }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ padding: "8px 16px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-display)", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}>CANCEL</button>
              <button onClick={() => deleteShow(deleteConfirmId)} style={{ padding: "8px 20px", border: "3px solid var(--hw-crimson)", background: "var(--hw-crimson)", color: "var(--hw-text-invert)", fontFamily: "var(--hw-font-display)", fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer" }}>DELETE</button>
            </div>
          </div>
        </>
      )}
    </>
    </IntakeDropZone>
  );
}

// ── Sub-component for leg + show row ─────────────────────────

type ConsolidatedShow = ShowRow & { offDayCount?: number; offDateEnd?: string };

function consolidateShows(showList: ShowRow[]): ConsolidatedShow[] {
  const result: ConsolidatedShow[] = [];
  let i = 0;
  while (i < showList.length) {
    if (showList[i].is_off) {
      let count = 1;
      const startIdx = i;
      while (i + count < showList.length && showList[i + count].is_off) {
        count++;
      }
      if (count > 5) {
        const endDate = showList[i + count - 1].date_iso || undefined;
        result.push({ ...showList[i], offDayCount: count, offDateEnd: endDate });
      } else {
        for (let j = 0; j < count; j++) {
          result.push(showList[startIdx + j]);
        }
      }
      i += count;
    } else {
      result.push(showList[i]);
      i++;
    }
  }
  return result;
}

function LegAndShowRow({
  show, showNum, index, leg, flying, suggestFly, fromAP, toAP, sd,
  flightThreshold, onToggleLeg, onClickRow, driveColorBg, driveColor, formatShowDate,
  onDelete, flightPriceCache, pax, dateIso, currencyRates,
}: {
  show: ConsolidatedShow;
  showNum: number;
  index: number;
  leg: LegInfo | null;
  flying: boolean;
  suggestFly: boolean;
  fromAP: ReturnType<typeof getAirport>;
  toAP: ReturnType<typeof getAirport>;
  sd: { color: string; label: string; variant: string };
  flightThreshold: number;
  onToggleLeg: (idx: number, choice: string) => void;
  onClickRow: (idx: number) => void;
  driveColorBg: (h: number | null) => string;
  driveColor: (h: number | null) => string;
  formatShowDate: (d: string | null) => string;
  onDelete: (id: string) => void;
  flightPriceCache: Record<string, number>;
  pax: number;
  dateIso: string | null;
  currencyRates: Record<string, number>;
}) {
  const hasAP = fromAP && toAP;
  const links = hasAP ? buildFlightLinks(fromAP.iata, toAP.iata) : null;

  return (
    <>
      {/* Drive leg row */}
      {leg && (
        <tr>
          <td colSpan={11} style={{ padding: 0, borderBottom: "3px solid var(--hw-border-strong)" }}>
            <div style={{
              padding: "8px 16px 8px 28px",
              background: driveColorBg(flying ? null : leg.driveH),
              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              fontSize: 12, color: "var(--hw-text-secondary)",
            }}>
              <span style={{ fontWeight: 600 }}>{leg.fromCity} &rarr; {leg.toCity}</span>
              {leg.dayGap > 1 && <span style={{ color: "var(--hw-text-muted)" }}>(+{leg.dayGap - 1} day{leg.dayGap > 2 ? "s" : ""})</span>}
              {leg.driveH !== null && !flying && (
                <span style={{ fontWeight: 700, color: driveColor(leg.driveH) }}>{fmtHours(leg.driveH)}</span>
              )}
              {!flying && <span style={{ color: "var(--hw-text-muted)" }}>{leg.distStr}</span>}
              {leg.driveH !== null && leg.driveH > 6 && !flying && (
                <span style={{ background: "var(--hw-crimson)", color: "var(--hw-text-invert)", padding: "2px 10px", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>BRUTAL</span>
              )}

              {/* Drive / Fly toggle */}
              <div style={{ display: "flex", gap: 0, marginLeft: 8 }}>
                <button
                  onClick={() => onToggleLeg(index, "drive")}
                  style={{
                    padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    fontFamily: "var(--hw-font-mono)", letterSpacing: "1.5px", textTransform: "uppercase",
                    border: "2px solid var(--hw-border-strong)",
                    background: !flying ? "var(--hw-bg-invert)" : "var(--hw-bg-surface)",
                    color: !flying ? "var(--hw-text-invert)" : "var(--hw-text-muted)",
                  }}
                >DRIVE</button>
                <button
                  onClick={() => onToggleLeg(index, "fly")}
                  style={{
                    padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    fontFamily: "var(--hw-font-mono)", letterSpacing: "1.5px", textTransform: "uppercase",
                    border: "2px solid var(--hw-border-strong)", marginLeft: -2,
                    background: flying ? "var(--hw-bg-invert)" : "var(--hw-bg-surface)",
                    color: flying ? "var(--hw-text-invert)" : "var(--hw-text-muted)",
                  }}
                >FLY</button>
              </div>

              {/* Flight cost info — only shown when flying */}
              {flying && hasAP && dateIso && (() => {
                const costStyle = { fontFamily: "var(--hw-font-mono)", fontSize: 13 };
                const safePax = Math.max(pax || 1, 1);
                const priceKey = `${fromAP.iata}-${toAP.iata}-${dateIso}-${safePax}pax`;
                const flightPrice = flightPriceCache[priceKey];
                if (flightPrice !== undefined) {
                  const diff = leg.fuelCost !== null ? flightPrice - leg.fuelCost : null;
                  const priceLabel = pax && pax > 1
                    ? `${fmtUSD(flightPrice)} flights (${pax} pax)`
                    : `${fmtUSD(flightPrice)}/person`;
                  return (
                    <span style={costStyle}>
                      <span style={{ color: "var(--hw-text)" }}>{priceLabel}</span>
                      {diff !== null && diff > 0 && <span style={{ color: "var(--hw-crimson)", marginLeft: 6 }}>({fmtUSD(diff)} more)</span>}
                      {diff !== null && diff <= 0 && <span style={{ color: "var(--hw-green)", marginLeft: 6 }}>({fmtUSD(Math.abs(diff))} savings)</span>}
                    </span>
                  );
                }
                return <span style={{ ...costStyle, color: "var(--hw-text-muted)" }}>fetching price...</span>;
              })()}

              {suggestFly && !flying && (
                <span style={{ fontSize: 13, color: "var(--hw-amber)" }}>Long drive — consider flying</span>
              )}

              {/* Flight info when flying */}
              {flying && hasAP && (
                <span style={{ fontSize: 13 }}>
                  {fromAP.iata} &rarr; {toAP.iata}
                  {links && (
                    <span style={{ marginLeft: 8 }}>
                      <a href={links.google} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hw-blue)", marginRight: 6, textDecoration: "none" }}>Google</a>
                      <a href={links.skyscanner} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hw-blue)", marginRight: 6, textDecoration: "none" }}>Skyscanner</a>
                      <a href={links.kiwi} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hw-blue)", textDecoration: "none" }}>Kiwi</a>
                    </span>
                  )}
                </span>
              )}
            </div>
          </td>
        </tr>
      )}

      {/* Show row */}
      <tr
        onClick={() => onClickRow(index)}
        style={{
          cursor: "pointer",
          background: show.is_off ? "var(--hw-bg-warm)" : "var(--hw-bg-surface)",
          color: show.is_off ? "var(--hw-text-muted)" : "var(--hw-text)",
          borderTop: "2px solid var(--hw-border)",
          transition: "var(--hw-ease)",
        }}
        onMouseEnter={(e) => { if (!show.is_off) (e.currentTarget as HTMLElement).style.background = "var(--hw-crimson-ghost)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = show.is_off ? "var(--hw-bg-warm)" : "var(--hw-bg-surface)"; }}
      >
        <td style={{ padding: "12px 12px", fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)" }}>
          {show.is_off ? "\u2014" : showNum}
        </td>
        <td style={{ padding: "12px 12px", fontFamily: "var(--hw-font-mono)", fontSize: 12, whiteSpace: "nowrap", color: "var(--hw-text)", fontWeight: 500 }}>
          {show.is_off && show.offDayCount && show.offDayCount > 1 && show.offDateEnd
            ? formatShowDate(show.date_iso) + " \u2013 " + formatShowDate(show.offDateEnd)
            : formatShowDate(show.date_iso)}
        </td>
        <td style={{ padding: "12px 12px" }}>
          <div style={{ fontFamily: "var(--hw-font-body)", fontWeight: 500, fontSize: 14, color: "var(--hw-text)" }}>{show.is_off ? <em style={{ fontStyle: "italic", opacity: 0.7 }}>{show.offDayCount && show.offDayCount > 1 ? `OFF \u00B7 ${show.offDayCount} DAYS` : "OFF DAY"}</em> : (show.venue || show.event || "\u2014")}</div>
          {show.venue && show.event && show.venue !== show.event && <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 13, fontWeight: 300, color: "var(--hw-text-secondary)" }}>{show.event}</div>}
        </td>
        <td style={{ padding: "12px 12px", fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-secondary)" }}>{show.city || "\u2014"}</td>
        <td style={{ padding: "12px 12px", fontFamily: "var(--hw-font-body)", fontSize: 13, fontWeight: 300, color: "var(--hw-text-secondary)", textTransform: "uppercase" }}>{show.country || "\u2014"}</td>
        <td style={{ padding: "12px 12px", fontFamily: "var(--hw-font-mono)", fontSize: 13, textAlign: "right" }}>
          {show.is_off ? "\u2014" : (show.offer_display || "\u2014")}
        </td>
        <td style={{ padding: "12px 12px", fontFamily: "var(--hw-font-mono)", fontSize: 13, textAlign: "right", color: show.offer_amount ? "var(--hw-green)" : "var(--hw-text-muted)" }}>
          {show.is_off ? "\u2014" : (show.offer_amount ? fmtUSD(toUSD({ amount: show.offer_amount, currency: show.offer_currency }, currencyRates)) : "\u2014")}
        </td>
        <td style={{ padding: "12px 12px" }}>
          {sd.label && (
            <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", padding: "4px 10px", border: "2px solid", borderColor: sd.color, color: sd.color, background: sd.variant === "confirmed" ? "var(--hw-green-ghost)" : sd.variant === "error" ? "var(--hw-red-ghost)" : "var(--hw-amber-ghost)" }}>
              {sd.label}
            </span>
          )}
        </td>
        <td style={{ padding: "12px 12px", fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text)" }}>
          {show.capacity ? show.capacity.toLocaleString() : "\u2014"}
        </td>
        <td style={{ padding: "12px 8px", textAlign: "center" }}>
          {!show.is_off && show.advance_status === "submitted" && (
            <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1px", padding: "3px 8px", background: "var(--hw-green-ghost)", color: "var(--hw-green)", border: "2px solid var(--hw-green-border)" }}>DONE</span>
          )}
          {!show.is_off && show.advance_status && show.advance_status.includes("sent") && show.advance_status !== "submitted" && (
            <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1px", padding: "3px 8px", background: "var(--hw-blue-ghost)", color: "var(--hw-blue)", border: "2px solid var(--hw-blue)" }}>SENT</span>
          )}
        </td>
        <td style={{ padding: "12px 4px", textAlign: "center" }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(show.id); }}
            title="Delete show"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--hw-text-muted)", padding: "2px 6px", transition: "var(--hw-ease)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--hw-crimson)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--hw-text-muted)"; }}
          >&times;</button>
        </td>
      </tr>
    </>
  );
}

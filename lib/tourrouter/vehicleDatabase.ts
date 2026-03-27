/**
 * Touring Vehicle Database
 *
 * Master list of vehicles commonly used on music tours worldwide.
 * Covers USA, Canada, Mexico, Europe, UK, Ireland, Australia, New Zealand, Japan.
 * Each entry includes make, model, fuel type, MPG/L100km, passenger capacity, cargo notes.
 *
 * Usage:
 *   import { VEHICLE_DATABASE, searchVehicles } from '@/lib/tourrouter/vehicleDatabase';
 */

export interface VehicleSpec {
  id: string;
  make: string;
  model: string;
  category: VehicleCategory;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  mpg: number;           // miles per gallon (converted from L/100km for non-US)
  passengers: number;    // max passenger capacity
  cargo: string;         // cargo description
  region: string[];      // where this vehicle is commonly found
  notes?: string;
}

export type VehicleCategory =
  | 'van'           // passenger vans (Sprinter, Transit, E-series)
  | 'suv'           // SUVs and crossovers
  | 'car'           // sedan / rental car
  | 'minibus'       // 15-25 passenger
  | 'sleeper_bus'   // tour bus with bunks
  | 'coach'         // full-size coach
  | 'box_truck'     // cargo truck (no passengers)
  | 'semi'          // 18-wheeler / lorry
  | 'trailer'       // trailer (towed, no engine)
  | 'rv'            // recreational vehicle / motorhome
  | 'pickup'        // pickup truck
  | 'other';

export const VEHICLE_DATABASE: VehicleSpec[] = [
  // ─── Passenger Vans (USA / Canada) ─────────────────────────────────
  {
    id: 'sprinter-144',
    make: 'Mercedes-Benz', model: 'Sprinter 2500 (144" WB)',
    category: 'van', fuelType: 'diesel', mpg: 18, passengers: 5,
    cargo: '319 cu ft cargo behind seats', region: ['usa', 'canada'],
  },
  {
    id: 'sprinter-170',
    make: 'Mercedes-Benz', model: 'Sprinter 2500 (170" WB)',
    category: 'van', fuelType: 'diesel', mpg: 17, passengers: 5,
    cargo: '488 cu ft cargo, extended wheelbase', region: ['usa', 'canada'],
  },
  {
    id: 'sprinter-crew',
    make: 'Mercedes-Benz', model: 'Sprinter Crew Van',
    category: 'van', fuelType: 'diesel', mpg: 17, passengers: 8,
    cargo: 'Rear cargo + 5 crew seats behind driver row', region: ['usa', 'canada'],
  },
  {
    id: 'sprinter-passenger',
    make: 'Mercedes-Benz', model: 'Sprinter Passenger Van',
    category: 'van', fuelType: 'diesel', mpg: 16, passengers: 15,
    cargo: 'Minimal — passenger config', region: ['usa', 'canada'],
    notes: 'Common band van for 6-10 person tours',
  },
  {
    id: 'ford-transit-250',
    make: 'Ford', model: 'Transit 250 (Medium Roof)',
    category: 'van', fuelType: 'gasoline', mpg: 15, passengers: 5,
    cargo: '283 cu ft', region: ['usa', 'canada'],
  },
  {
    id: 'ford-transit-350hd',
    make: 'Ford', model: 'Transit 350 HD (High Roof, Extended)',
    category: 'van', fuelType: 'gasoline', mpg: 13, passengers: 5,
    cargo: '487 cu ft, extended length', region: ['usa', 'canada'],
  },
  {
    id: 'ford-transit-passenger',
    make: 'Ford', model: 'Transit Passenger Van (350 XLT)',
    category: 'van', fuelType: 'gasoline', mpg: 14, passengers: 15,
    cargo: 'Minimal — full passenger config', region: ['usa', 'canada'],
  },
  {
    id: 'ford-e350',
    make: 'Ford', model: 'E-350 Super Duty',
    category: 'van', fuelType: 'gasoline', mpg: 12, passengers: 15,
    cargo: 'Classic 15-passenger van', region: ['usa', 'canada'],
    notes: 'The workhorse indie tour van. Being phased out for Transit.',
  },
  {
    id: 'ford-e450-cutaway',
    make: 'Ford', model: 'E-450 Cutaway',
    category: 'box_truck', fuelType: 'gasoline', mpg: 10, passengers: 3,
    cargo: '14-16ft box, 5000+ lb payload', region: ['usa', 'canada'],
    notes: 'Commonly used as band gear truck',
  },
  {
    id: 'chevy-express-3500',
    make: 'Chevrolet', model: 'Express 3500 Passenger',
    category: 'van', fuelType: 'gasoline', mpg: 12, passengers: 15,
    cargo: '15-passenger config', region: ['usa', 'canada'],
  },
  {
    id: 'ram-promaster-3500',
    make: 'Ram', model: 'ProMaster 3500 (High Roof, Extended)',
    category: 'van', fuelType: 'gasoline', mpg: 14, passengers: 5,
    cargo: '463 cu ft, FWD — easier to drive', region: ['usa', 'canada'],
  },
  {
    id: 'nissan-nv-3500',
    make: 'Nissan', model: 'NV 3500 Passenger',
    category: 'van', fuelType: 'gasoline', mpg: 13, passengers: 12,
    cargo: '12-passenger config', region: ['usa', 'canada'],
  },

  // ─── Tour Buses (USA / Canada) ─────────────────────────────────────
  {
    id: 'prevost-h3',
    make: 'Prevost', model: 'H3-45',
    category: 'sleeper_bus', fuelType: 'diesel', mpg: 6, passengers: 12,
    cargo: '12 bunks, front lounge, back lounge, 8 bays under', region: ['usa', 'canada'],
    notes: 'Industry standard tour bus. ~$1,200-2,500/day rental.',
  },
  {
    id: 'prevost-x3',
    make: 'Prevost', model: 'X3-45',
    category: 'sleeper_bus', fuelType: 'diesel', mpg: 6, passengers: 12,
    cargo: 'Double-decker style, more headroom', region: ['usa', 'canada'],
  },
  {
    id: 'mci-j4500',
    make: 'MCI', model: 'J4500',
    category: 'sleeper_bus', fuelType: 'diesel', mpg: 6, passengers: 12,
    cargo: '12 bunks standard, convertible to 8 for more lounge', region: ['usa', 'canada'],
  },
  {
    id: 'eagle-bus',
    make: 'Eagle', model: 'Eagle 15/20',
    category: 'sleeper_bus', fuelType: 'diesel', mpg: 5, passengers: 10,
    cargo: 'Vintage converted bus', region: ['usa', 'canada'],
    notes: 'Older coaches, cheaper rental, less reliable. $600-900/day.',
  },
  {
    id: 'neoplan-skyliner',
    make: 'Neoplan', model: 'Skyliner',
    category: 'sleeper_bus', fuelType: 'diesel', mpg: 5, passengers: 16,
    cargo: 'Double-decker, 16 bunks', region: ['usa', 'canada', 'europe'],
  },

  // ─── Cargo Trucks (USA / Canada) ───────────────────────────────────
  {
    id: 'freightliner-m2',
    make: 'Freightliner', model: 'M2 106 (26ft Box)',
    category: 'box_truck', fuelType: 'diesel', mpg: 8, passengers: 3,
    cargo: '26ft box, liftgate, 14,000 lb payload', region: ['usa', 'canada'],
    notes: 'Common for mid-level production tours',
  },
  {
    id: 'isuzu-npr-hd',
    make: 'Isuzu', model: 'NPR-HD (16ft Box)',
    category: 'box_truck', fuelType: 'diesel', mpg: 12, passengers: 3,
    cargo: '16ft box, liftgate', region: ['usa', 'canada'],
    notes: 'Good for club/theater level gear',
  },
  {
    id: 'penske-26ft',
    make: 'Penske/Budget', model: '26ft Rental Truck',
    category: 'box_truck', fuelType: 'gasoline', mpg: 8, passengers: 3,
    cargo: '26ft box, may or may not have liftgate', region: ['usa', 'canada'],
    notes: 'One-way rental. Check for liftgate availability.',
  },
  {
    id: 'semi-53',
    make: 'Various', model: '53ft Semi Trailer + Tractor',
    category: 'semi', fuelType: 'diesel', mpg: 6, passengers: 2,
    cargo: '53ft trailer, full production', region: ['usa', 'canada'],
    notes: 'Arena/amphitheater level. Requires CDL driver.',
  },
  {
    id: 'semi-48',
    make: 'Various', model: '48ft Semi Trailer + Tractor',
    category: 'semi', fuelType: 'diesel', mpg: 6, passengers: 2,
    cargo: '48ft trailer', region: ['usa', 'canada'],
  },

  // ─── Trailers (towed) ─────────────────────────────────────────────
  {
    id: 'enclosed-6x12',
    make: 'Various', model: '6x12 Enclosed Trailer',
    category: 'trailer', fuelType: 'gasoline', mpg: 0, passengers: 0,
    cargo: '6x12ft enclosed, ~2000 lb capacity', region: ['usa', 'canada'],
    notes: 'Towed by van or SUV. MPG reduction ~3-5 mpg on tow vehicle.',
  },
  {
    id: 'enclosed-7x16',
    make: 'Various', model: '7x16 Enclosed Trailer',
    category: 'trailer', fuelType: 'gasoline', mpg: 0, passengers: 0,
    cargo: '7x16ft enclosed, ~3500 lb capacity', region: ['usa', 'canada'],
    notes: 'Larger gear trailer. Needs heavy-duty tow vehicle.',
  },
  {
    id: 'open-utility',
    make: 'Various', model: 'Open Utility Trailer (5x8)',
    category: 'trailer', fuelType: 'gasoline', mpg: 0, passengers: 0,
    cargo: '5x8ft open, ~1500 lb capacity', region: ['usa', 'canada'],
  },

  // ─── European Vehicles ────────────────────────────────────────────
  {
    id: 'sprinter-eu',
    make: 'Mercedes-Benz', model: 'Sprinter 316 CDI (EU)',
    category: 'van', fuelType: 'diesel', mpg: 25, passengers: 9,
    cargo: '9-seat crew van, EU spec', region: ['europe', 'uk'],
  },
  {
    id: 'vw-crafter',
    make: 'Volkswagen', model: 'Crafter',
    category: 'van', fuelType: 'diesel', mpg: 24, passengers: 9,
    cargo: '9-seat, common EU tour van', region: ['europe', 'uk'],
  },
  {
    id: 'ford-transit-eu',
    make: 'Ford', model: 'Transit Custom (EU)',
    category: 'van', fuelType: 'diesel', mpg: 28, passengers: 6,
    cargo: '6-seat crew van, EU spec', region: ['europe', 'uk', 'ireland'],
  },
  {
    id: 'fiat-ducato',
    make: 'Fiat', model: 'Ducato Maxi',
    category: 'van', fuelType: 'diesel', mpg: 25, passengers: 9,
    cargo: 'Standard EU/UK tour van', region: ['europe', 'uk'],
  },
  {
    id: 'iveco-daily',
    make: 'Iveco', model: 'Daily Minibus',
    category: 'minibus', fuelType: 'diesel', mpg: 20, passengers: 19,
    cargo: '19-seat minibus', region: ['europe'],
  },
  {
    id: 'setra-s515',
    make: 'Setra', model: 'S 515 HD',
    category: 'coach', fuelType: 'diesel', mpg: 7, passengers: 48,
    cargo: 'Full-size European coach', region: ['europe'],
  },
  {
    id: 'nightliner-eu',
    make: 'Various', model: 'European Nightliner (Sleeper Bus)',
    category: 'sleeper_bus', fuelType: 'diesel', mpg: 6, passengers: 12,
    cargo: '12 bunks, front/back lounge, EU spec', region: ['europe', 'uk'],
    notes: 'Typically Setra, VDL, or Van Hool chassis',
  },
  {
    id: 'eu-splitter',
    make: 'Various', model: 'European Splitter Van (LWB)',
    category: 'van', fuelType: 'diesel', mpg: 22, passengers: 5,
    cargo: 'Split cargo/passenger, long wheelbase', region: ['europe', 'uk'],
    notes: 'Front seats for band, rear cargo for gear. Most common EU indie setup.',
  },
  {
    id: 'eu-lorry-7t',
    make: 'Various', model: '7.5 Tonne Lorry',
    category: 'box_truck', fuelType: 'diesel', mpg: 15, passengers: 3,
    cargo: '7.5t box truck, tail lift', region: ['europe', 'uk'],
    notes: 'Drivable on standard EU license (under 7.5t)',
  },
  {
    id: 'eu-artic',
    make: 'Various', model: 'Articulated Lorry (40ft)',
    category: 'semi', fuelType: 'diesel', mpg: 7, passengers: 2,
    cargo: '40ft trailer, arena level', region: ['europe', 'uk'],
  },

  // ─── UK / Ireland Specific ────────────────────────────────────────
  {
    id: 'ford-transit-uk',
    make: 'Ford', model: 'Transit (UK RHD)',
    category: 'van', fuelType: 'diesel', mpg: 28, passengers: 6,
    cargo: 'Right-hand drive, standard UK tour van', region: ['uk', 'ireland'],
  },
  {
    id: 'luton-van',
    make: 'Various', model: 'Luton Box Van',
    category: 'box_truck', fuelType: 'diesel', mpg: 22, passengers: 3,
    cargo: 'Box body over cab, tail lift, UK rental standard', region: ['uk', 'ireland'],
  },

  // ─── Australia / New Zealand ──────────────────────────────────────
  {
    id: 'toyota-hiace-au',
    make: 'Toyota', model: 'HiAce (AU)',
    category: 'van', fuelType: 'diesel', mpg: 26, passengers: 12,
    cargo: '12-seat commuter, very common AU tour van', region: ['australia', 'nz'],
  },
  {
    id: 'toyota-coaster',
    make: 'Toyota', model: 'Coaster',
    category: 'minibus', fuelType: 'diesel', mpg: 16, passengers: 21,
    cargo: '21-seat minibus', region: ['australia', 'nz', 'japan'],
  },
  {
    id: 'isuzu-nqr-au',
    make: 'Isuzu', model: 'NQR 450 (AU)',
    category: 'box_truck', fuelType: 'diesel', mpg: 18, passengers: 3,
    cargo: 'Medium truck, pantech body', region: ['australia', 'nz'],
  },

  // ─── Japan ────────────────────────────────────────────────────────
  {
    id: 'toyota-hiace-jp',
    make: 'Toyota', model: 'HiAce Super GL (JP)',
    category: 'van', fuelType: 'diesel', mpg: 28, passengers: 10,
    cargo: '10-seat, RHD, narrow body for Japanese roads', region: ['japan'],
  },

  // ─── Mexico / Latin America ───────────────────────────────────────
  {
    id: 'sprinter-mx',
    make: 'Mercedes-Benz', model: 'Sprinter (MX)',
    category: 'van', fuelType: 'diesel', mpg: 18, passengers: 9,
    cargo: '9-seat, common for Mexico/LatAm tours', region: ['mexico', 'south_america'],
  },

  // ─── SUVs / Cars (short runs, fly dates) ──────────────────────────
  {
    id: 'suburban',
    make: 'Chevrolet', model: 'Suburban',
    category: 'suv', fuelType: 'gasoline', mpg: 16, passengers: 8,
    cargo: 'Large SUV, airport runs and short hops', region: ['usa', 'canada'],
  },
  {
    id: 'expedition',
    make: 'Ford', model: 'Expedition MAX',
    category: 'suv', fuelType: 'gasoline', mpg: 17, passengers: 8,
    cargo: 'Full-size SUV', region: ['usa', 'canada'],
  },
  {
    id: 'rental-midsize',
    make: 'Various', model: 'Midsize Rental Car',
    category: 'car', fuelType: 'gasoline', mpg: 30, passengers: 5,
    cargo: 'Standard rental, fly dates', region: ['usa', 'canada', 'europe', 'australia'],
  },
  {
    id: 'rental-fullsize',
    make: 'Various', model: 'Full-Size Rental Car',
    category: 'car', fuelType: 'gasoline', mpg: 26, passengers: 5,
    cargo: 'Full-size rental', region: ['usa', 'canada', 'europe', 'australia'],
  },
  {
    id: 'rental-minivan',
    make: 'Various', model: 'Minivan Rental (Sienna/Pacifica)',
    category: 'van', fuelType: 'gasoline', mpg: 22, passengers: 7,
    cargo: 'Rental minivan, good for small tours', region: ['usa', 'canada'],
  },

  // ─── Pickups ──────────────────────────────────────────────────────
  {
    id: 'f150',
    make: 'Ford', model: 'F-150 (Crew Cab)',
    category: 'pickup', fuelType: 'gasoline', mpg: 20, passengers: 5,
    cargo: '5.5-6.5ft bed, tow capacity 10,000+ lb', region: ['usa', 'canada'],
    notes: 'Often used to tow gear trailer',
  },
  {
    id: 'f250',
    make: 'Ford', model: 'F-250 Super Duty',
    category: 'pickup', fuelType: 'diesel', mpg: 15, passengers: 5,
    cargo: 'Heavy-duty, 8ft bed, tow 15,000+ lb', region: ['usa', 'canada'],
  },
  {
    id: 'ram-2500',
    make: 'Ram', model: '2500 (Cummins Diesel)',
    category: 'pickup', fuelType: 'diesel', mpg: 16, passengers: 5,
    cargo: 'Heavy-duty tow vehicle', region: ['usa', 'canada'],
  },

  // ─── RVs / Motorhomes ────────────────────────────────────────────
  {
    id: 'rv-class-c',
    make: 'Various', model: 'Class C Motorhome (25-30ft)',
    category: 'rv', fuelType: 'gasoline', mpg: 10, passengers: 6,
    cargo: 'Sleeps 6, built-in kitchen/bath', region: ['usa', 'canada'],
    notes: 'Budget alternative to a tour bus. $150-300/day rental.',
  },
  {
    id: 'rv-class-a',
    make: 'Various', model: 'Class A Motorhome (32-40ft)',
    category: 'rv', fuelType: 'diesel', mpg: 8, passengers: 6,
    cargo: 'Sleeps 6-8, full amenities', region: ['usa', 'canada'],
    notes: 'Larger RV option. $250-500/day rental.',
  },
];

// ─── Search ─────────────────────────────────────────────────────────────────

/**
 * Search the vehicle database by make, model, or category.
 * Returns matching vehicles sorted by relevance.
 */
export function searchVehicles(query: string, maxResults: number = 10): VehicleSpec[] {
  if (!query || query.trim().length === 0) return VEHICLE_DATABASE.slice(0, maxResults);

  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);

  const scored = VEHICLE_DATABASE.map((v) => {
    const searchText = `${v.make} ${v.model} ${v.category} ${v.region.join(' ')} ${v.notes || ''}`.toLowerCase();
    let score = 0;

    for (const word of words) {
      if (searchText.includes(word)) score += 10;
      if (v.make.toLowerCase().startsWith(word)) score += 20;
      if (v.model.toLowerCase().includes(word)) score += 15;
      if (v.category === word) score += 25;
    }

    return { vehicle: v, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.vehicle);
}

/**
 * Get a vehicle by ID.
 */
export function getVehicleById(id: string): VehicleSpec | undefined {
  return VEHICLE_DATABASE.find((v) => v.id === id);
}

/**
 * Get category label for display.
 */
export const VEHICLE_CATEGORY_LABELS: Record<VehicleCategory, string> = {
  van: 'Van',
  suv: 'SUV',
  car: 'Car',
  minibus: 'Minibus',
  sleeper_bus: 'Sleeper Bus',
  coach: 'Coach',
  box_truck: 'Box Truck',
  semi: 'Semi / Lorry',
  trailer: 'Trailer',
  rv: 'RV / Motorhome',
  pickup: 'Pickup',
  other: 'Other',
};

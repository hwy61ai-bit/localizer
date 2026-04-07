-- Multi-vehicle financials integration (April 7, 2026)
-- tour_vehicles: per-tour vehicle array (was previously written to by VehicleManager but column was missing)
-- vehicles_equipment: master artist fleet template, copied into tour_vehicles on tour creation

ALTER TABLE tours_routing
ADD COLUMN IF NOT EXISTS tour_vehicles jsonb DEFAULT '[]'::jsonb;

ALTER TABLE artists
ADD COLUMN IF NOT EXISTS vehicles_equipment jsonb DEFAULT '[]'::jsonb;

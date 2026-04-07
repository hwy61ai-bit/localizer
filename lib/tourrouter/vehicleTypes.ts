import type { VehicleCategory } from './vehicleDatabase';

export interface TourVehicle {
  id: string;
  vehicleDbId: string | null;
  label: string;
  make: string;
  model: string;
  category: VehicleCategory;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  mpg: number;
  passengers: number;
  cargo: string;
  ownership: 'owned' | 'leased' | 'rented' | 'provided';
  fuelPricePerGallon: number;
  notes: string;
  isActive: boolean;
}

// Barrel file — re-export everything from tourrouter modules

export {
  CITY_COORDS,
  CITY_COUNTRY,
  CITY_AIRPORTS,
  AIRPORT_COORDS,
  VEHICLE_MPG,
  VEHICLE_L100,
  detectCountry,
  type VehicleType,
} from './constants';

export {
  isImperialCountry,
  legCountry,
  getCityCoords,
  haversine,
  getRoadKm,
  estimateDriveHours,
  fmtHours,
  formatDateDisplay,
  buildDriveDataKey,
  prefetchDriveData,
  type DriveDataMap,
} from './geography';

export {
  getRate,
  toUSD,
  fmtUSD,
  fmtDist,
  formatOfferDisplay,
  TOURING_CURRENCIES,
  type OfferObj,
  type RateProvider,
} from './currency';

export {
  parseDate,
  parseOffer,
  cellStr,
  normalizeCountry,
  type ParsedOffer,
} from './parsers';

export {
  calcTourFinancials,
  calcFuelCostMultiVehicle,
  type TourShow,
  type FinancialParams,
  type FinancialResults,
} from './financials';

export {
  getAirport,
  buildFlightLinks,
  type AirportInfo,
  type FlightLinks,
} from './flights';

export {
  buildExportRows,
  type ExportRow,
  type BuildExportRowsParams,
} from './exports';

export {
  FIELD_ALIASES,
  MAPPER_FIELDS,
  bestGuess,
  autoMapHeaders,
  type MapperField,
} from './columnMapper';

export { calculateShowIncome, verifySettlement } from './calculateShowIncome';

export { calculatePersonnelCosts, determineDayType, type RosterMember, type PayComponent, type TourStats, type PersonnelCostResult } from './personnelPay';

export { calculateCommissions, canSeeCommissions, stripCommissionDetails, type Commission, type CommissionResult, type CommissionType, COMMISSION_TYPE_LABELS } from './commissions';

export {
  DIY_FLAGS,
  TOURROUTER_FLAGS,
  getFlags,
  getFlagsFromHeader,
  type FeatureFlags,
} from './featureFlags';

// billingGate is server-only (uses next/headers via supabaseServer)
// Import directly: import { checkTourRouterAccess } from '@/lib/tourrouter/billingGate'

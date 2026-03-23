// Barrel file — re-export everything from tourrouter modules

export {
  CITY_COORDS,
  CITY_AIRPORTS,
  AIRPORT_COORDS,
  VEHICLE_MPG,
  VEHICLE_L100,
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
} from './geography';

export {
  getRate,
  toUSD,
  fmtUSD,
  fmtDist,
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

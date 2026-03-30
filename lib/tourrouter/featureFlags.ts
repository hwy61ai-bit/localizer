// ============================================================
// Feature Flags — DIY vs TourRouter
// ============================================================

export const DIY_FLAGS = {
  aiIntake: true,
  advancing: false,
  settlement: false,
  financeLayer: false,
  personnelPay: false,
  guestList: false,
  multiTour: false,
  multiVehicle: false,
  dealTypes: false,
  contactIntelligence: false,
  crewAccess: false,
  advanceSheetPdf: false,
  depositTracking: false,
  commissions: false,
  shareableReports: false,
} as const;

export const TOURROUTER_FLAGS = {
  aiIntake: true,
  advancing: true,
  settlement: true,
  financeLayer: true,
  personnelPay: true,
  guestList: true,
  multiTour: true,
  multiVehicle: true,
  dealTypes: true,
  contactIntelligence: true,
  crewAccess: true,
  advanceSheetPdf: true,
  depositTracking: true,
  commissions: true,
  shareableReports: true,
} as const;

export type FeatureFlags = { [K in keyof typeof TOURROUTER_FLAGS]: boolean };

export function getFlags(isDiy: boolean): FeatureFlags {
  return isDiy ? { ...DIY_FLAGS } : { ...TOURROUTER_FLAGS };
}

/**
 * Server-side: check the x-hwy61-diy header set by middleware.
 * Use in API routes: const flags = getFlagsFromHeader(req.headers.get("x-hwy61-diy"));
 */
export function getFlagsFromHeader(headerValue: string | null): FeatureFlags {
  return getFlags(headerValue === "1");
}

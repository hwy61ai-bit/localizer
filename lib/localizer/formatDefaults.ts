/**
 * Default overlay config for a render format. Shared by the template editor
 * (initial state for formats with no saved overlay_config) and the canvas
 * renderer (lib/clientRender.ts merges a missing/partial config over this so
 * venue/date/city always exist).
 *
 * Positions are fractions of the canvas; sizes are px at output resolution.
 * One block serves every image format: default text sits bottom-centered and
 * sizes read the same relative to canvas height on Square (1080 tall) and
 * Facebook Event Cover (1005 tall).
 */

export type DefaultAlign = "left" | "center" | "right";
export type DefaultFieldConfig = { x: number; y: number; size: number; align?: DefaultAlign };

export type DefaultFormatConfig = {
  fontFamily: string;
  textColor: string;
  showBandName: boolean;
  showVenue: boolean;
  showCity: boolean;
  showDate: boolean;
  bandSize: number;
  shortDate: boolean;
  allCaps: boolean;
  date: DefaultFieldConfig;
  venue: DefaultFieldConfig;
  city: DefaultFieldConfig;
};

export const DEFAULT_FORMAT: DefaultFormatConfig = {
  fontFamily: "Oswald",
  textColor: "ffffff",
  showBandName: false,
  showVenue: true,
  showCity: true,
  showDate: true,
  bandSize: 48,
  shortDate: true,
  allCaps: true,
  date:  { x: 0.5, y: 0.91, size: 28, align: "center" },
  venue: { x: 0.5, y: 0.76, size: 36, align: "center" },
  city:  { x: 0.5, y: 0.84, size: 28, align: "center" },
};

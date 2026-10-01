/**
 * Default overlay config for a render format. Shared by the template editor
 * (initial state for formats with no saved overlay_config) and the canvas
 * renderer (lib/clientRender.ts merges a missing/partial config over this so
 * venue/date/city always exist).
 *
 * Positions are fractions of the canvas; sizes are px at output resolution.
 * DEFAULT_FORMAT serves every image format except Vertical: default text sits
 * bottom-centered and sizes read the same relative to canvas height on Square
 * (1080 tall) and Facebook Event Cover (1005 tall). Vertical layers
 * VERTICAL_DEFAULTS on top (see below); use defaultFormatFor(key).
 */

import type { DateFormatKey } from "@/lib/localizer/dateFormat";

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
  dateFormat: DateFormatKey;
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
  dateFormat: "ordinal",
  allCaps: true,
  date:  { x: 0.5, y: 0.91, size: 28, align: "center" },
  venue: { x: 0.5, y: 0.76, size: 36, align: "center" },
  city:  { x: 0.5, y: 0.84, size: 28, align: "center" },
};

/**
 * Vertical (1080x1920, 9:16) overrides. Story/Reels UI covers roughly the top
 * 14% and bottom 20% of the frame, so every element starts inside
 * y 0.14–0.80; the venue/city/date block sits around y .61–.70. Sizes match
 * Square's because both canvases are 1080 wide. Optional elements (band,
 * opener, logo, custom text, sponsor logos) are positioned here too because
 * their generic fallbacks (y 0.08 / 0.88 / 0.92) land under the Story UI.
 */
export const SAFE_AREA_VERTICAL = { top: 0.14, bottom: 0.80 } as const;

export const VERTICAL_DEFAULTS: Pick<DefaultFormatConfig, "date" | "venue" | "city"> & {
  band: DefaultFieldConfig;
  opener: DefaultFieldConfig;
  logo: DefaultFieldConfig;
  customText1: DefaultFieldConfig;
  customText2: DefaultFieldConfig;
  sponsorLogo1: DefaultFieldConfig;
  sponsorLogo2: DefaultFieldConfig;
} = {
  customText1:  { x: 0.5,  y: 0.17,  size: 48, align: "center" },
  logo:         { x: 0.5,  y: 0.27,  size: 80, align: "center" },
  customText2:  { x: 0.5,  y: 0.50,  size: 48, align: "center" },
  band:         { x: 0.5,  y: 0.555, size: 80, align: "center" },
  venue:        { x: 0.5,  y: 0.61,  size: 36, align: "center" },
  city:         { x: 0.5,  y: 0.655, size: 28, align: "center" },
  date:         { x: 0.5,  y: 0.70,  size: 28, align: "center" },
  opener:       { x: 0.5,  y: 0.745, size: 40, align: "center" },
  sponsorLogo1: { x: 0.35, y: 0.785, size: 44, align: "center" },
  sponsorLogo2: { x: 0.65, y: 0.785, size: 44, align: "center" },
};

/** Full default config for a format key (Vertical gets its safe-area block). */
export function defaultFormatFor(formatKey: string) {
  return formatKey === "vertical" ? { ...DEFAULT_FORMAT, ...VERTICAL_DEFAULTS } : DEFAULT_FORMAT;
}

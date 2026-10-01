/**
 * Show-date formatting for every render path (canvas, print PDF, video URLs,
 * editor preview). Pure — safe to import from client and server.
 *
 * Dates are built from YYYY-MM-DD components with new Date(y, m - 1, d)
 * (CLAUDE.md non-negotiable #1) and read back with local getters, so the
 * output never depends on the runtime's timezone.
 */

export type DateFormatKey = "ordinal" | "long" | "slash" | "dot" | "slash_year" | "dow_slash";

// Ordinal month table — mixed abbreviations are intentional and match
// historical poster output ("MARCH", "JUNE", "JULY", "SEPT").
// Declared before DATE_FORMAT_OPTIONS, which calls formatShowDate at load.
const ORDINAL_MONTHS = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Dropdown labels are real output for a fixed sample date (a Friday).
const LABEL_SAMPLE_DATE = "2026-10-02";

export const DATE_FORMAT_OPTIONS: { key: DateFormatKey; label: string }[] = (
  ["ordinal", "long", "slash", "dot", "slash_year", "dow_slash"] as DateFormatKey[]
).map((key) => ({ key, label: formatShowDate(LABEL_SAMPLE_DATE, key) }));

const DATE_FORMAT_KEYS = new Set<string>(DATE_FORMAT_OPTIONS.map((o) => o.key));

function ordinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return "TH";
  switch (n % 10) {
    case 1: return "ST";
    case 2: return "ND";
    case 3: return "RD";
    default: return "TH";
  }
}

function parseIsoDate(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate ?? "");
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

export function formatShowDate(isoDate: string, key: DateFormatKey): string {
  const d = parseIsoDate(isoDate);
  if (!d) return isoDate;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  switch (key) {
    case "long":
      return `${LONG_MONTHS[month - 1]} ${day}, ${year}`;
    case "slash":
      return `${month}/${day}`;
    case "dot":
      return `${month}.${day}`;
    case "slash_year":
      return `${month}/${day}/${String(year % 100).padStart(2, "0")}`;
    case "dow_slash":
      return `${WEEKDAYS[d.getDay()]} ${month}/${day}`;
    case "ordinal":
    default:
      return `${ORDINAL_MONTHS[month - 1].toUpperCase()} ${day}${ordinalSuffix(day)}`;
  }
}

/**
 * The one place the legacy-boolean fallback lives:
 * valid dateFormat → it; shortDate === false → "long"; otherwise "ordinal".
 */
export function resolveDateFormat(
  cfg: { dateFormat?: unknown; shortDate?: unknown } | null | undefined,
): DateFormatKey {
  const key = cfg?.dateFormat;
  if (typeof key === "string" && DATE_FORMAT_KEYS.has(key)) return key as DateFormatKey;
  if (cfg?.shortDate === false) return "long";
  return "ordinal";
}

/**
 * Video formats inherit the story (4:5) date format unless their own config
 * says otherwise. Legacy rule was `video.shortDate || story.shortDate`:
 * an explicit dateFormat on the video config wins; shortDate === true stays
 * ordinal (the left side of the old `||`); everything else defers to the
 * story config through resolveDateFormat.
 */
export function resolveVideoDateFormat(
  videoCfg: { dateFormat?: unknown; shortDate?: unknown } | null | undefined,
  storyCfg: { dateFormat?: unknown; shortDate?: unknown } | null | undefined,
): DateFormatKey {
  if (videoCfg?.dateFormat) return resolveDateFormat(videoCfg);
  if (videoCfg?.shortDate === true) return "ordinal";
  return resolveDateFormat(storyCfg ?? {});
}

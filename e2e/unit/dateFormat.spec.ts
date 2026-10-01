import { test, expect } from "@playwright/test";
import { formatShowDate, resolveDateFormat, DATE_FORMAT_OPTIONS } from "../../lib/localizer/dateFormat";

// 2026-10-02 is a Friday.
test("formatShowDate: all 6 keys on a fixed date", () => {
  expect(formatShowDate("2026-10-02", "ordinal")).toBe("OCT 2ND");
  expect(formatShowDate("2026-10-02", "long")).toBe("October 2, 2026");
  expect(formatShowDate("2026-10-02", "slash")).toBe("10/2");
  expect(formatShowDate("2026-10-02", "dot")).toBe("10.2");
  expect(formatShowDate("2026-10-02", "slash_year")).toBe("10/2/26");
  expect(formatShowDate("2026-10-02", "dow_slash")).toBe("FRI 10/2");
  expect(DATE_FORMAT_OPTIONS.map((o) => o.key)).toEqual(["ordinal", "long", "slash", "dot", "slash_year", "dow_slash"]);
});

test("resolveDateFormat fallback rules", () => {
  expect(resolveDateFormat({ dateFormat: "dot", shortDate: false })).toBe("dot"); // dateFormat wins
  expect(resolveDateFormat({ dateFormat: "dot", shortDate: true })).toBe("dot");
  expect(resolveDateFormat({ shortDate: false })).toBe("long");
  expect(resolveDateFormat({ shortDate: true })).toBe("ordinal");
  expect(resolveDateFormat({})).toBe("ordinal");
  expect(resolveDateFormat(null)).toBe("ordinal");
  expect(resolveDateFormat({ dateFormat: "nope", shortDate: false })).toBe("long"); // invalid key ignored
});

import { test, expect } from "@playwright/test";
import { FORMATS } from "../../lib/localizer/formats";

test("format catalog: dimensions and labels", () => {
  const expected = {
    square:    { w: 1080, h: 1080, label: "Square" },
    story:     { w: 1080, h: 1350, label: "Feed/Grid (4:5)" },
    vertical:  { w: 1080, h: 1920, label: "Vertical" },
    landscape: { w: 1920, h: 1005, label: "Facebook Event Cover" },
    print:     { w: 3300, h: 5100, label: "Print Poster" },
  } as const;
  for (const [key, want] of Object.entries(expected)) {
    const def = FORMATS[key as keyof typeof expected];
    expect({ w: def.w, h: def.h, label: def.label }, key).toEqual(want);
  }
});

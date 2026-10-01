import { test, expect, type Page, type Locator } from "@playwright/test";
import { readSeed } from "../env";

// Read lazily: test files are collected before the setup project writes seed.json.
const seed = () => readSeed();

// Tab order as rendered by TemplateEditor (row 1 images, row 2 videos).
const TAB_KEYS = ["square", "story", "vertical", "landscape", "print", "yt_shorts", "tiktok"] as const;

type Box = { x: number; y: number; width: number; height: number };

async function box(locator: Locator): Promise<Box> {
  const b = await locator.boundingBox();
  if (!b) throw new Error("element has no bounding box (not visible)");
  return b;
}

function expectSameBox(actual: Box, expected: Box, what: string) {
  for (const k of ["x", "y", "width", "height"] as const) {
    expect(Math.abs(actual[k] - expected[k]), `${what}: ${k} moved (${expected[k]} → ${actual[k]})`).toBeLessThanOrEqual(0.5);
  }
}

/** Wait for web fonts and finite CSS animations (e.g. the editor's fade-in) to finish before measuring. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const finite = document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(finite.map((a) => a.finished.catch(() => undefined)));
  });
}

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

test("dashboard loads; artist page shows Localizer content with no tab bar", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("E2E Test Artist").first()).toBeVisible();

  await page.goto(`/dashboard/artists/${seed().artistId}`);
  await expect(page.getByText("E2E Test Tour").first()).toBeVisible(); // Localizer tours list
  await expect(page.getByRole("button", { name: /^(TourRouter|Localizer)$/i })).toHaveCount(0);
  await expect(page.getByText("NO ACTIVE SUBSCRIPTION")).toHaveCount(0);
});

test("template editor: tabs clickable, layout stable across tab switches, 6 date formats, no console errors", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto(`/dashboard/tours/${seed().tourId}/template`);

  const tabs = TAB_KEYS.map((k) => page.getByTestId(`format-tab-${k}`));
  const actionBox = page.getByTestId("editor-action-box");
  await expect(tabs[0]).toBeVisible();
  await expect(actionBox).toBeVisible();

  const dateSelect = page.getByTestId("date-format-select");
  await expect(dateSelect.locator("option")).toHaveCount(6);

  await settle(page);
  const baselineTabs = await Promise.all(tabs.map(box));
  const baselineAction = await box(actionBox);

  for (const [i, key] of TAB_KEYS.entries()) {
    await tabs[i].click();
    await expect(tabs[i], `tab ${key} should become active`).toHaveAttribute("aria-pressed", "true");
    await settle(page);
    for (const [j, other] of TAB_KEYS.entries()) {
      expectSameBox(await box(tabs[j]), baselineTabs[j], `tab ${other} after activating ${key}`);
    }
    expectSameBox(await box(actionBox), baselineAction, `sidebar action box after activating ${key}`);
  }

  expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([]);
});

test("assets page: 7 cards with expected labels, each with a description", async ({ page }) => {
  await page.goto(`/dashboard/tours/${seed().tourId}/assets`);
  const cards = page.getByTestId("asset-card");
  await expect(cards).toHaveCount(7);
  await expect(page.getByTestId("asset-card-label")).toHaveText([
    "Square", "Feed/Grid (4:5)", "Vertical", "Facebook Event Cover", "Print Poster", "Square Video", "Vertical Video",
  ]);
  for (let i = 0; i < 7; i++) {
    await expect(cards.nth(i).getByTestId("asset-card-description")).toHaveText(/\S/);
  }
});

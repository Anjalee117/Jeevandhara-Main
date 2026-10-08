import { test, expect } from "@playwright/test";
test("landing enters functional dashboard", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "ENTER JEEVANDHARA", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Good to grow, Pratham." }),
  ).toBeVisible();
  await expect(page.getByText("₹2,450")).toBeVisible();
  await page.screenshot({
    path: `test-results/dashboard-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("voice query detects crop intent and routes to analysis", async ({
  page,
}) => {
  await page.goto("/voice");
  await page
    .getByLabel("Your question")
    .fill("What should I do for my tomato crop?");
  await page.getByRole("button", { name: "ANALYZE QUESTION" }).click();
  await expect(page.getByText("Crop Advisory", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "ANALYZE CROP" }).click();
  await expect(
    page.getByRole("heading", { name: "Tomato image analysis" }),
  ).toBeVisible();
});
test("farm changes persist and update connected modules", async ({ page }) => {
  await page.goto("/farm");
  await page.getByLabel("Crop", { exact: true }).selectOption("Ragi");
  await page.getByLabel("Farmer name").fill("Asha");
  await page.getByRole("button", { name: "SAVE FARM" }).click();
  await expect(page.getByRole("status")).toContainText("Farm saved");
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Good to grow, Asha." }),
  ).toBeVisible();
  await expect(page.getByText("Ragi", { exact: true }).first()).toBeVisible();
  await page.goto("/market");
  await expect(page.getByLabel("Select crop")).toHaveValue("Ragi");
  await page.goto("/actions");
  await page.getByRole("button", { name: "TODAY", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Inspect ragi plants for stress and pest activity",
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Action planner", exact: true }),
  ).toBeVisible();
});
test("schemes search filters eligibility and explanation", async ({ page }) => {
  await page.goto("/schemes");
  await page.getByLabel("Search schemes").fill("Precision");
  await expect(
    page.getByRole("heading", {
      name: "Precision Irrigation Assistance",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Crop", { exact: true }).selectOption("Tomato");
  await page.getByRole("button", { name: "OPEN / CHECK ELIGIBILITY" }).click();
  await page
    .getByRole("button", { name: "CHECK ELIGIBILITY", exact: true })
    .click();
  await expect(page.getByText("ELIGIBLE", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "WHY AM I ELIGIBLE?" }).click();
  await expect(page.getByRole("dialog")).toContainText("Farm size");
});
test("crop upload preview analysis creates action", async ({ page }) => {
  await page.goto("/crop-health");
  await page.getByLabel("Upload crop image").setInputFiles({
    name: "leaf.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.getByAltText("Uploaded crop preview")).toBeVisible();
  await page.getByRole("button", { name: "ANALYZE CROP", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Possible Early Blight (illustrative)" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "CREATE ACTION" }).click();
  await page.goto("/actions");
  await page.getByRole("button", { name: "TODAY", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Inspect Tomato for crop stress" }),
  ).toBeVisible();
});
test("sensor simulation changes and alert acknowledges to history", async ({
  page,
}) => {
  await page.goto("/threats");
  await page.getByLabel("Live simulation").check();
  await expect(page.getByText("28.7°C", { exact: true })).toBeVisible({
    timeout: 8000,
  });
  await page.getByRole("button", { name: "SIMULATE EVENT" }).click();
  await expect(
    page.getByText("Motion detected by PIR", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ACKNOWLEDGE ALERT" }).click();
  await expect(
    page.getByText(
      "No active alerts. Simulate an event to test the full alert flow.",
    ),
  ).toBeVisible();
  await expect(page.getByText(/Acknowledged ·/)).toBeVisible();
});
test("completed actions persist in history", async ({ page }) => {
  await page.goto("/actions");
  await page.getByRole("button", { name: "COMPLETE", exact: true }).click();
  await expect(
    page.getByText("✓ Delay irrigation; inspect drainage"),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("✓ Delay irrigation; inspect drainage"),
  ).toBeVisible();
});
test("notifications navigate and mark read", async ({ page }) => {
  await page.goto("/notifications");
  await page
    .getByRole("link", { name: "Rain outlook: check field drainage" })
    .click();
  await expect(page).toHaveURL(/\/weather$/);
  await page.goto("/notifications");
  await expect(page.getByText("2 UNREAD", { exact: true })).toBeVisible();
});
test("language switch changes major dashboard labels", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByLabel("Language", { exact: true }).selectOption("kn");
  await expect(
    page.getByRole("heading", { name: "ನಮಸ್ಕಾರ, Pratham." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "ನಮಸ್ಕಾರ, Pratham." }),
  ).toBeVisible();
});
test("market chart comparison and recommendation", async ({ page }) => {
  await page.goto("/market");
  await page.getByLabel("Select crop").selectOption("Onion");
  await expect(
    page.getByRole("heading", { name: "Onion / 7-period price trend" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "COMPARE MARKETS" }).click();
  await expect(
    page.getByRole("cell", { name: "Chikkaballapur" }),
  ).toBeVisible();
  await page.getByLabel("Market question").fill("Where should I sell onions?");
  await page
    .getByRole("button", { name: "ASK JEEVANDHARA", exact: true })
    .click();
  await expect(
    page.getByText(/strongest illustrative return for Onion/),
  ).toBeVisible();
});
test("all routes load without runtime errors or horizontal overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "dashboard",
    "voice",
    "farm",
    "schemes",
    "crop-health",
    "market",
    "weather",
    "threats",
    "actions",
    "knowledge",
    "notifications",
    "settings",
    "system",
    "context",
  ]) {
    await page.goto("/" + route);
    await expect(page.locator("main")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  }
  expect(errors).toEqual([]);
});

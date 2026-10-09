import { test, expect } from "@playwright/test";
const forecast = (rain = 85) => ({
  current: { temperature_2m: 24, relative_humidity_2m: 88, wind_speed_10m: 12 },
  daily: {
    time: ["2026-10-09", "2026-10-10"],
    temperature_2m_max: [27, 28],
    precipitation_probability_max: [rain, 40],
  },
});
test("live weather updates dashboard, alerts and actions", async ({ page }) => {
  await page.route("https://api.open-meteo.com/**", (r) =>
    r.fulfill({ json: forecast() }),
  );
  await page.goto("/weather");
  await expect(page.getByText("Live weather", { exact: true })).toBeVisible();
  await expect(page.locator(".stats-grid .stat strong").first()).toHaveText(
    "24°C",
  );
  await page.goto("/dashboard");
  await expect(page.locator(".stats-grid .stat strong").nth(1)).toHaveText(
    "24°C",
  );
  await expect(page.locator(".project-modules a")).toHaveCount(3);
  await page.goto("/notifications");
  await expect(page.getByRole("link", { name: "Rain alert" })).toBeVisible();
  await page.goto("/actions");
  await expect(
    page.getByRole("heading", { name: "Delay irrigation; inspect drainage" }),
  ).toBeVisible();
});
test("phone readings persist and do not fabricate a forecast", async ({
  page,
}) => {
  await page.route("https://api.open-meteo.com/**", (r) => r.abort());
  await page.goto("/weather");
  await page.locator(".phone-weather summary").click();
  for (const [label, value] of [
    ["Temperature (°C)", "39"],
    ["Humidity (%)", "40"],
    ["Rain probability (%)", "5"],
    ["Wind (km/h)", "8"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole("button", { name: "Save weather reading" }).click();
  await expect(
    page.getByText("Phone weather reading", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".stats-grid .stat strong").first()).toHaveText(
    "39°C",
  );
  await expect(
    page.getByText(
      "Refresh live weather to see the forecast. Phone readings contain current values only.",
    ),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".stats-grid .stat strong").first()).toHaveText(
    "39°C",
  );
  await page.goto("/notifications");
  await expect(
    page.getByRole("link", { name: "High temperature alert" }),
  ).toBeVisible();
  await page.goto("/actions");
  await expect(
    page.getByRole("heading", {
      name: "Protect young plants from heat",
    }),
  ).toBeVisible();
});
test("failed live weather stays identifiable and can be retried", async ({
  page,
}) => {
  let fail = true;
  await page.route("https://api.open-meteo.com/**", (r) =>
    fail ? r.abort() : r.fulfill({ json: forecast(10) }),
  );
  await page.goto("/weather");
  await expect(page.locator(".weather-controls .error")).toContainText(
    "Weather service is unavailable",
  );
  await expect(page.getByText("Sample weather", { exact: true })).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "Refresh weather" }).click();
  await expect(page.getByText("Live weather", { exact: true })).toBeVisible();
});

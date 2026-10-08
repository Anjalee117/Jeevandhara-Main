import { test, expect } from "@playwright/test";
import fs from "node:fs";
const routes = [
  "dashboard",
  "farm",
  "voice",
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
];
for (const language of ["hi", "kn"])
  test(`${language}: all route content is localized`, async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/dashboard");
    await page.locator(".topbar select").selectOption(language);
    const missing: Record<string, string[]> = {};
    for (const route of routes) {
      await page.goto("/" + route);
      await expect(page.locator("html")).toHaveAttribute("lang", language);
      if (route !== "dashboard") {
        await expect(page.locator(".module-scope")).toHaveCount(1);
        await page.locator(".module-scope summary").click();
        await expect(page.locator(".module-scope dd")).toHaveCount(2);
      }
      const text = await page.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
        );
        const items: string[] = [];
        while (walker.nextNode()) {
          const parent = walker.currentNode.parentElement;
          if (
            !parent ||
            parent.closest("script,style,[data-preserve-text]") ||
            !parent.getClientRects().length
          )
            continue;
          const text = walker.currentNode.textContent?.trim() ?? "";
          if (/[A-Za-z]/.test(text)) items.push(text);
        }
        for (const node of document.querySelectorAll(
          "input[placeholder],textarea[placeholder]",
        )) {
          const placeholder = node.getAttribute("placeholder") ?? "";
          if (/[A-Za-z]/.test(placeholder)) items.push(placeholder);
        }
        return items;
      });
      const unexpected = text.filter((value) =>
        /[A-Za-z]/.test(
          value.replace(
            /JEEVANDHARA|Anjalee|DHT22|ESP32-CAM|PIR|RAG|°C|English|\bPM\b|\bAM\b/g,
            "",
          ),
        ),
      );
      if (unexpected.length) missing[route] = [...new Set(unexpected)];
      if (route === "dashboard")
        await page.screenshot({
          path: `test-results/dashboard-${language}-${test.info().project.name}.png`,
          fullPage: true,
        });
    }
    fs.writeFileSync(
      `test-results/localization-${language}-${test.info().project.name}.json`,
      JSON.stringify(missing, null, 2),
    );
    expect(missing).toEqual({});
  });

import { translate, type Language } from "../lib/i18n";
import type { Page } from "@playwright/test";
async function untranslated(page: Page) {
  return page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    const missing: string[] = [];
    while (walker.nextNode()) {
      const parent = walker.currentNode.parentElement;
      if (
        !parent ||
        parent.closest("script,style,[data-preserve-text]") ||
        !parent.getClientRects().length
      )
        continue;
      const value = walker.currentNode.textContent?.trim() ?? "";
      if (
        /[A-Za-z]/.test(
          value.replace(
            /JEEVANDHARA|Anjalee|DHT22|ESP32-CAM|PIR|RAG|°C|English|\bPM\b|\bAM\b/g,
            "",
          ),
        )
      )
        missing.push(value);
    }
    return [...new Set(missing)];
  });
}
for (const language of ["hi", "kn"] as Language[])
  test(`${language}: interactive results, explanations and search stay localized`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    const t = (text: string) => translate(language, text);
    await page.goto("/dashboard");
    await page.locator(".topbar select").selectOption(language);
    await page.locator(".action-row button").first().click();
    expect(await untranslated(page)).toEqual([]);
    await page
      .getByRole("button", { name: t("Close dialog"), exact: true })
      .click();
    await page.goto("/farm");
    await page.getByLabel(t("Crop"), { exact: true }).selectOption("Ragi");
    await page
      .getByRole("button", { name: t("SAVE FARM"), exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      t("Farm saved. All modules now use your updated context."),
    );
    await page.goto("/dashboard");
    await expect(page.locator(".stat strong").first()).toHaveText(
      language === "hi" ? "रागी" : "ರಾಗಿ",
    );
    expect(await untranslated(page)).toEqual([]);
    await page.goto("/schemes");
    await page
      .getByLabel(t("Search schemes"))
      .fill(t("Precision Irrigation Assistance"));
    await page
      .getByRole("button", { name: t("OPEN / CHECK ELIGIBILITY") })
      .click();
    await page
      .getByRole("button", { name: t("CHECK ELIGIBILITY"), exact: true })
      .click();
    await expect(page.getByText(t("ELIGIBLE"), { exact: true })).toBeVisible();
    await page.getByRole("button", { name: t("WHY AM I ELIGIBLE?") }).click();
    expect(await untranslated(page)).toEqual([]);
    await page
      .getByRole("button", { name: t("Close dialog"), exact: true })
      .click();
    await page.goto("/crop-health");
    await page.getByLabel(t("Upload crop image")).setInputFiles({
      name: "crop.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await page
      .getByRole("button", { name: t("ANALYZE CROP"), exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: t("Possible leaf stress (illustrative)"),
      }),
    ).toBeVisible();
    expect(await untranslated(page)).toEqual([]);
    await page
      .getByRole("button", { name: t("CREATE ACTION"), exact: true })
      .click();
    await page.goto("/market");
    await expect(page.getByLabel(t("Select crop"))).toHaveValue("Ragi");
    await page.getByRole("button", { name: t("COMPARE MARKETS") }).click();
    await page
      .getByLabel(t("Market question"))
      .fill(t("Where should I sell my ragi?"));
    await page
      .getByRole("button", { name: t("ASK JEEVANDHARA"), exact: true })
      .click();
    expect(await untranslated(page)).toEqual([]);
    await page.getByRole("button", { name: t("WHY?"), exact: true }).click();
    expect(await untranslated(page)).toEqual([]);
    await page
      .getByRole("button", { name: t("Close dialog"), exact: true })
      .click();
    await page.goto("/threats");
    await page.getByRole("button", { name: t("SIMULATE EVENT") }).click();
    expect(await untranslated(page)).toEqual([]);
    await page.getByRole("button", { name: t("ACKNOWLEDGE ALERT") }).click();
    expect(await untranslated(page)).toEqual([]);
    await page.goto("/actions");
    await page.getByRole("button", { name: t("TODAY"), exact: true }).click();
    await page
      .getByRole("button", { name: t("WHY?"), exact: true })
      .last()
      .click();
    expect(await untranslated(page)).toEqual([]);
    await page
      .getByRole("button", { name: t("Close dialog"), exact: true })
      .click();
    await page
      .getByRole("button", { name: t("SNOOZE"), exact: true })
      .first()
      .click();
    expect(await untranslated(page)).toEqual([]);
    await page.goto("/knowledge");
    await page
      .getByLabel(t("Search knowledge"))
      .fill(t("Planning irrigation before rainfall"));
    await expect(
      page.getByRole("heading", {
        name: t("Planning irrigation before rainfall"),
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.locator(".card-grid .panel").first().getByRole("heading"),
    ).toHaveText(t("Planning irrigation before rainfall"));
    await page
      .locator(".card-grid .panel")
      .first()
      .getByRole("button", { name: t("VIEW SOURCE") })
      .click();
    expect(await untranslated(page)).toEqual([]);
  });

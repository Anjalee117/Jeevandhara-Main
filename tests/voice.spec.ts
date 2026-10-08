import { test, expect } from "@playwright/test";
async function mockSpeech(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, any>;
    class SpeechMock {
      lang = "";
      continuous = false;
      interimResults = false;
      onstart?: () => void;
      onaudiostart?: () => void;
      onresult?: (e: any) => void;
      onend?: () => void;
      onerror?: (e: any) => void;
      constructor() {
        w.testSpeech = this;
      }
      start() {
        this.onstart?.();
        this.onaudiostart?.();
      }
      stop() {
        this.onend?.();
      }
      abort() {
        this.onend?.();
      }
    }
    w.SpeechRecognition = SpeechMock;
  });
}
for (const [lang, locale, question] of [
  ["en", "en-IN", "Is rain expected tomorrow?"],
  ["hi", "hi-IN", "क्या कल बारिश होगी?"],
  ["kn", "kn-IN", "ನಾಳೆ ಮಳೆ ಬರುತ್ತದೆಯೇ?"],
]) {
  test(`${lang} microphone events show live transcript then weather intent`, async ({
    page,
  }) => {
    await mockSpeech(page);
    await page.goto("/voice?start=1");
    expect(await page.evaluate(() => Boolean((window as any).testSpeech))).toBe(
      false,
    );
    await page.locator(".topbar select").selectOption(lang);
    await page.locator(".big-mic").click();
    expect(
      await page.evaluate(() => ({
        lang: (window as any).testSpeech.lang,
        interim: (window as any).testSpeech.interimResults,
      })),
    ).toEqual({ lang: locale, interim: true });
    await page.evaluate((q) => {
      const r = Object.assign([{ transcript: q }], { isFinal: false });
      (window as any).testSpeech.onresult({ results: [r] });
    }, question);
    await expect(page.locator("textarea")).toHaveValue(question);
    await expect(page.locator(".result-list")).toHaveCount(0);
    await page.evaluate((q) => {
      const s = (window as any).testSpeech;
      s.onresult({
        results: [Object.assign([{ transcript: q }], { isFinal: true })],
      });
      s.onend();
    }, question);
    await expect(page.locator(".result-list")).toBeVisible();
    await expect(page.locator(".result-list dd").first()).toHaveText(question);
    await expect(page.locator(".result-list dd").nth(2)).toHaveText(
      lang === "hi" ? "मौसम" : lang === "kn" ? "ಹವಾಮಾನ" : "Weather",
    );
    await expect(page.locator(".big-mic")).toBeEnabled();
  });
}
test("permission and network failures recover on retry; stop without speech is explained", async ({
  page,
}) => {
  await mockSpeech(page);
  await page.goto("/voice");
  for (const [error, text] of [
    ["not-allowed", "Microphone permission was denied"],
    ["network", "could not connect"],
  ]) {
    await page.locator(".big-mic").click();
    await page.evaluate((e) => {
      const s = (window as any).testSpeech;
      s.onerror({ error: e });
      s.onend();
    }, error);
    await expect(page.locator(".error[role=alert]")).toContainText(text);
    await expect(page.locator(".result-list")).toHaveCount(0);
  }
  await page.locator(".big-mic").click();
  await page.locator(".big-mic").click();
  await expect(page.locator(".error[role=alert]")).toContainText("No final transcript");
});
test("unsupported recognition still offers an explicitly labelled sample intent demo", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).SpeechRecognition = undefined;
    (window as any).webkitSpeechRecognition = undefined;
  });
  await page.goto("/voice");
  await page.locator(".big-mic").click();
  await expect(page.locator(".error[role=alert]")).toContainText(
    "Speech recognition is unavailable",
  );
  await page.getByRole("button", { name: "RUN SAMPLE INTENT DEMO" }).click();
  await expect(page.locator(".result-list dd").nth(2)).toHaveText("Weather");
});

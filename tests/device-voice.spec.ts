import { test, expect } from "@playwright/test";
import path from "node:path";

test.use({
  launchOptions: {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--use-file-for-fake-audio-capture=" +
        path.resolve("tests/fixtures/weather-question.wav"),
    ],
  },
});

async function mockWorker(
  page: import("@playwright/test").Page,
  failFirst = false,
) {
  await page.addInitScript((failFirst) => {
    const w = window as unknown as Record<string, any>;
    const OriginalWorker = window.Worker;
    let attempts = 0;
    w.Worker = class {
      onmessage?: (event: any) => void;
      onerror?: () => void;
      constructor(url: string, options: WorkerOptions) {
        if (url !== "/speech-worker.js")
          return new OriginalWorker(url, options);
      }
      postMessage(data: any) {
        w.capturedSpeech = {
          length: data.audio.length,
          language: data.language,
          signal: data.audio.some((v: number) => Math.abs(v) > 0.002),
        };
        attempts++;
        setTimeout(
          () =>
            this.onmessage?.({
              data:
                attempts === 1 && failFirst
                  ? { type: "error", detail: "model unavailable" }
                  : { type: "result", text: "Is rain expected tomorrow?" },
            }),
          20,
        );
      }
      terminate() {}
    };
  }, failFirst);
}

test("device recording sends real captured PCM audio to transcription and routes intent", async ({
  page,
}) => {
  await mockWorker(page);
  await page.goto("/voice");
  await expect(page.locator(".content select")).toHaveValue("device");
  await page.locator(".big-mic").click();
  await expect(page.locator(".voice-stage")).toContainText("Recording —");
  await page.waitForTimeout(1500);
  await page.locator(".big-mic").click();
  await expect(page.locator(".result-list dd").nth(2)).toHaveText("Weather");
  await expect(page.locator("audio")).toHaveAttribute("src", /^blob:/);
  const captured = await page.evaluate(() => (window as any).capturedSpeech);
  expect(captured.length).toBeGreaterThan(16000);
  expect(captured.signal).toBe(true);
  expect(captured.language).toBe("en");
});

test("model failure preserves recording and retries without another recording", async ({
  page,
}) => {
  await mockWorker(page, true);
  await page.goto("/voice");
  await page.locator(".big-mic").click();
  await expect(page.locator(".voice-stage")).toContainText("Recording —");
  await page.waitForTimeout(1500);
  await page.locator(".big-mic").click();
  await expect(page.locator(".error")).toContainText("recording is preserved");
  await expect(page.locator("audio")).toBeVisible();
  await page.getByRole("button", { name: "Retry transcription" }).click();
  await expect(page.locator(".result-list dd").nth(2)).toHaveText("Weather");
});

test("device microphone denial explains site permission settings", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Denied", "NotAllowedError");
    };
  });
  await page.goto("/voice");
  await page.locator(".big-mic").click();
  await expect(page.locator(".error")).toContainText(
    "Microphone permission was denied",
  );
  await expect(page.locator(".big-mic")).toBeEnabled();
});

test("real device model transcribes recorded weather question", async ({
  page,
}) => {
  test.skip(
    process.env.RUN_DEVICE_MODEL_TEST !== "1",
    "Opt-in real model download and inference check",
  );
  test.setTimeout(240000);
  await page.goto("/voice");
  await page.locator(".big-mic").click();
  await expect(page.locator(".voice-stage")).toContainText("Recording —");
  await page.waitForTimeout(6000);
  await page.locator(".big-mic").click();
  // A first model fetch can fail independently of microphone capture.
  // Exercise the preserved-recording retry before checking actual inference.
  for (let attempt = 0; attempt < 2; attempt++) {
    await Promise.race([
      page.locator(".result-list").waitFor({ timeout: 100000 }),
      page.locator(".error").waitFor({ timeout: 100000 }),
    ]);
    if (await page.locator(".result-list").isVisible()) break;
    if (attempt === 0)
      await page.getByRole("button", { name: "Retry transcription" }).click();
  }
  await expect(page.locator(".result-list")).toBeVisible();
  await expect(page.locator(".result-list dd").first()).toContainText(
    /rain expected tomorrow/i,
  );
  await expect(page.locator(".result-list dd").nth(2)).toHaveText("Weather");
});

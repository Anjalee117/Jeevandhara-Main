import { pipeline, env } from "/vendor/transformers-3.8.1.min.js";

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;
let transcriber;
let running = false;
self.onmessage = async ({ data }) => {
  if (running) return;
  running = true;
  try {
    if (!transcriber) {
      self.postMessage({ type: "loading" });
      transcriber = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-base",
        {
          device: "wasm",
          dtype: "q8",
          progress_callback: (progress) => {
            if (progress.status === "progress")
              self.postMessage({
                type: "progress",
                progress: Math.round(progress.progress),
              });
          },
        },
      );
    }
    self.postMessage({ type: "transcribing" });
    const result = await transcriber(data.audio, {
      language:
        { en: "english", hi: "hindi", kn: "kannada" }[data.language] ||
        "english",
      task: "transcribe",
      chunk_length_s: 30,
      stride_length_s: 5,
      max_new_tokens: 128,
      condition_on_prev_tokens: false,
    });
    self.postMessage({ type: "result", text: result.text.trim() });
  } catch (error) {
    transcriber = undefined;
    self.postMessage({ type: "error", detail: String(error) });
  } finally {
    running = false;
  }
};

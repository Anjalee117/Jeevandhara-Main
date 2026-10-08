"use client";
import { Localized } from "@/components/localization";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowRight, Mic } from "lucide-react";
import { Farm } from "@/types";
import { voiceService } from "@/services";
import { Badge, Panel, Empty, Field } from "@/components/ui";
import { speechLocale, translate } from "@/lib/i18n";
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onnomatch: (() => void) | null;
  onresult:
    | ((event: {
        results: ArrayLike<
          ArrayLike<{ transcript: string }> & { isFinal: boolean }
        >;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
export function Voice({
  farm,
  spoken,
  record,
  addAction,
}: {
  farm: Farm;
  spoken: boolean;
  record: (q: string) => void;
  addAction: (t: string, r: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("Ready when you are");
  const starting = useRef(false);
  const failed = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof voiceService.analyzeSpeech>
  > | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const queryRef = useRef("");
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    setSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    starting.current = false;
    setRecording(false);
    setStatus("Ready when you are");
    return () => {
      if (recognition.current) {
        recognition.current.onend = null;
        recognition.current.onresult = null;
        recognition.current.onerror = null;
        recognition.current.onstart = null;
        recognition.current.onaudiostart = null;
        recognition.current.onspeechstart = null;
        recognition.current.onnomatch = null;
        recognition.current.abort();
      }
      window.speechSynthesis?.cancel();
    };
  }, [farm.language]);
  async function analyze(text = query) {
    setError("");
    setBusy(true);
    try {
      const r = await voiceService.analyzeSpeech(text);
      setResult(r);
      setStatus("Transcript received");
      record(r.transcript);
      if (spoken && window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(
          translate(farm.language, r.recommendation),
        );
        u.lang = speechLocale(farm.language);
        window.speechSynthesis.speak(u);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function start() {
    setError("");
    if (recording || starting.current) {
      setStatus("Finishing transcription…");
      recognition.current?.stop();
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const R = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!R) {
      setError(
        "Speech recognition is unavailable. Open this page in Chrome or Edge, or use the typed intent demo below.",
      );
      return;
    }
    if (!window.isSecureContext) {
      setError(
        "Microphone access requires HTTPS or localhost. Open the secure website and try again.",
      );
      return;
    }
    try {
      window.speechSynthesis?.cancel();
      const r = new R();
      r.lang = speechLocale(farm.language);
      r.continuous = false;
      r.interimResults = true;
      queryRef.current = "";
      failed.current = false;
      starting.current = true;
      setQuery("");
      setResult(null);
      setRecording(true);
      setStatus("Waiting for microphone permission…");
      r.onstart = () => {
        starting.current = false;
        setStatus("Listening — speak your question");
      };
      r.onaudiostart = () => setStatus("Microphone connected — speak now");
      r.onspeechstart = () => setStatus("Speech detected — transcribing…");
      r.onresult = (event) => {
        const results = Array.from(event.results);
        const text = results
          .map((item) => item[0].transcript)
          .join(" ")
          .trim();
        setQuery(text);
        queryRef.current = results
          .filter((item) => item.isFinal)
          .map((item) => item[0].transcript)
          .join(" ")
          .trim();
        setStatus(
          queryRef.current
            ? "Transcript received"
            : "Speech detected — transcribing…",
        );
      };
      const fail = (message: string) => {
        failed.current = true;
        starting.current = false;
        setRecording(false);
        setStatus("Voice session ended");
        setError(message);
      };
      r.onnomatch = () =>
        fail("Speech was not understood. Speak clearly and try again.");
      r.onerror = (event) => {
        const messages: Record<string, string> = {
          "not-allowed":
            "Microphone permission was denied. Allow microphone access in your browser site settings, then try again.",
          "service-not-allowed":
            "The browser speech service is blocked. Open this page in Chrome or Edge and allow microphone access.",
          "audio-capture":
            "No working microphone was found. Connect a microphone and check your device input settings.",
          "no-speech":
            "No speech was detected. Check your microphone and speak after tapping the microphone button.",
          network:
            "The browser speech service could not connect. Check your internet connection and try again.",
          "language-not-supported":
            "This browser speech service does not support the selected language. Try another language or use the typed intent demo.",
          aborted:
            "Voice capture was stopped. Tap the microphone to try again.",
        };
        fail(
          messages[event.error] ||
            "Speech recognition failed. Try again or use the typed intent demo below.",
        );
      };
      r.onend = () => {
        starting.current = false;
        setRecording(false);
        recognition.current = null;
        if (failed.current) return;
        if (queryRef.current) {
          setStatus("Transcript received — analyzing intent…");
          void analyze(queryRef.current);
        } else {
          setStatus("Ready when you are");
          setError(
            "No final transcript was received. Tap the microphone and speak again, or analyze the text below.",
          );
        }
      };
      recognition.current = r;
      // Start directly in the click gesture: browsers own microphone permission and capture.
      r.start();
    } catch {
      starting.current = false;
      setRecording(false);
      setStatus("Voice session ended");
      setError(
        "Speech recognition could not start. Check microphone permissions and try again.",
      );
    }
  }
  return (
    <Localized>
      {
        <div className="two-columns">
          <Panel title="Ask your farm" label="DEMO INTENT ENGINE">
            <p>
              Speak naturally in Hindi, English or Kannada. Recognition uses
              your browser; intent analysis uses local demo rules.
            </p>
            <div className={`voice-stage ${recording ? "recording" : ""}`}>
              <button
                className="big-mic"
                onClick={start}
                disabled={busy}
                aria-label={recording ? "Stop recording" : "Start speaking"}
              >
                <Mic size={36} />
              </button>
              <div className="waveform">
                {Array.from({ length: 19 }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      height: `${12 + ((i * 17) % 45)}px`,
                      animationDelay: `${i * 0.07}s`,
                    }}
                  />
                ))}
              </div>
              <span className="mono" role="status" aria-live="polite">
                {status}
              </span>
            </div>
            <p className="muted" role="status" aria-live="polite">
              {recording
                ? "Tap the microphone to stop. Your words appear below as you speak."
                : "Tap the microphone and allow access. Speak a question; the final transcript is analyzed automatically."}
            </p>
            {supported === false && (
              <div className="info-banner">
                Voice recognition is unavailable in this browser. You can type
                your query or use a supported browser.
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void analyze();
              }}
            >
              <Field label="Your question">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What should I do for my tomato crop?"
                  required
                />
              </Field>
              <button className="button green" disabled={busy || recording}>
                {busy ? "Analyzing…" : "ANALYZE QUESTION"}{" "}
                <ArrowRight size={16} />
              </button>
            </form>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="button-row">
              <button
                type="button"
                className="button"
                disabled={recording || busy}
                onClick={() => {
                  const text = translate(
                    farm.language,
                    "Is rain expected tomorrow?",
                  );
                  setQuery(text);
                  void analyze(text);
                }}
              >
                RUN SAMPLE INTENT DEMO
              </button>
            </div>
            <p className="muted">
              The sample demo uses prepared text. Live transcription uses your
              browser speech service and may require internet access.
            </p>
            <div className="sample-queries">
              <span className="mono">TRY A QUESTION</span>
              {[
                "What schemes are available for me?",
                "Is rain expected tomorrow?",
                "Something is moving near my farm.",
                "ನನ್ನ ಟೊಮೇಟೊ ಬೆಳೆಗೆ ಏನು ಮಾಡಬೇಕು?",
                "क्या कल बारिश होगी?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuery(translate(farm.language, q))}
                >
                  {q} ↗
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Understanding & recommendation" label="AI ASSISTED">
            {result ? (
              <>
                <dl className="result-list">
                  {[
                    ["TRANSCRIPT", result.transcript],
                    ["NORMALIZED QUERY", result.normalized],
                    ["INTENT", result.intent],
                    [
                      "CONFIDENCE",
                      `${result.confidence}% · rule match estimate`,
                    ],
                    [
                      "ROUTED TO",
                      result.route === "crop-health"
                        ? "Crop Health + Action Planner"
                        : result.route,
                    ],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd data-preserve-text={k === "TRANSCRIPT" || undefined}>
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
                <Badge tone="yellow">DEMO RESULT</Badge>
                <h3>{translate(farm.language, result.recommendation)}</h3>
                <p className="muted">
                  Evidence: keyword rules and your saved {farm.crop} farm
                  context.
                </p>
                <div className="button-row">
                  <Link href={`/${result.route}`} className="button green">
                    {result.route === "crop-health"
                      ? "ANALYZE CROP"
                      : "OPEN MODULE"}{" "}
                    <ArrowUpRight size={16} />
                  </Link>
                  <button
                    className="button"
                    onClick={() =>
                      addAction(
                        result.recommendation,
                        `Voice intent: ${result.intent}; crop: ${farm.crop}`,
                      )
                    }
                  >
                    CREATE ACTION
                  </button>
                  <button
                    className="text-link"
                    onClick={() => {
                      setResult(null);
                      setQuery("");
                    }}
                  >
                    Ask again
                  </button>
                </div>
              </>
            ) : (
              <Empty>
                Your transcript, detected intent and recommended next action
                will appear here.
              </Empty>
            )}
          </Panel>
        </div>
      }
    </Localized>
  );
}

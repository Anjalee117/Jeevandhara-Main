"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowRight, Mic, Check } from "lucide-react";
import { Farm, Action } from "@/types";
import { voiceService } from "@/services";
import { Badge, Panel, Empty, Field } from "@/components/ui";
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
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
    return () => {
      if (recognition.current) {
        recognition.current.onend = null;
        recognition.current.stop();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);
  async function analyze(text = query) {
    setError("");
    setBusy(true);
    try {
      const r = await voiceService.analyzeSpeech(text);
      setResult(r);
      record(r.transcript);
      if (spoken && window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(r.recommendation);
        u.lang = farm.language === "kn" ? "kn-IN" : "en-IN";
        window.speechSynthesis.speak(u);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function start() {
    setError("");
    if (recording) {
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
        "Voice recognition is unavailable in this browser. You can type your query or use a supported browser.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      const r = new R();
      r.lang = farm.language === "kn" ? "kn-IN" : "en-IN";
      r.continuous = false;
      r.interimResults = false;
      queryRef.current = "";
      r.onresult = (e) => {
        const text = Array.from(e.results)
          .map((x) => x[0].transcript)
          .join(" ");
        queryRef.current = text;
        setQuery(text);
      };
      r.onerror = (e) => {
        queryRef.current = "";
        setError(
          `Speech recognition: ${e.error}. You can type your question below.`,
        );
        setRecording(false);
      };
      r.onend = () => {
        setRecording(false);
        if (queryRef.current) void analyze(queryRef.current);
      };
      recognition.current = r;
      r.start();
      setRecording(true);
    } catch {
      setError(
        "Microphone access failed. Check browser permissions or type your question.",
      );
    }
  }
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("start") === "1") {
      const timer = setTimeout(() => void start(), 200);
      return () => clearTimeout(timer);
    }
  }, []);
  return (
    <div className="two-columns">
      <Panel title="Ask your farm" label="DEMO INTENT ENGINE">
        <p>
          Speak naturally in Kannada or English. Recognition uses your browser;
          intent analysis uses local demo rules.
        </p>
        <div className={`voice-stage ${recording ? "recording" : ""}`}>
          <button
            className="big-mic"
            onClick={start}
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
          <span className="mono">
            {recording ? "LISTENING — TAP TO STOP" : "READY WHEN YOU ARE"}
          </span>
        </div>
        {supported === false && (
          <div className="info-banner">
            Voice recognition is unavailable in this browser. You can type your
            query or use a supported browser.
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
            {busy ? "Analyzing…" : "ANALYZE QUESTION"} <ArrowRight size={16} />
          </button>
        </form>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="sample-queries">
          <span className="mono">TRY A QUESTION</span>
          {[
            "What schemes are available for me?",
            "Is rain expected tomorrow?",
            "Something is moving near my farm.",
            "ನನ್ನ ಟೊಮೇಟೊ ಬೆಳೆಗೆ ಏನು ಮಾಡಬೇಕು?",
          ].map((q) => (
            <button key={q} onClick={() => setQuery(q)}>
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
                ["CONFIDENCE", `${result.confidence}% · rule match estimate`],
                [
                  "ROUTED TO",
                  result.route === "crop-health"
                    ? "Crop Health + Action Planner"
                    : result.route,
                ],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <Badge tone="yellow">DEMO RESULT</Badge>
            <h3>{result.recommendation}</h3>
            <p className="muted">
              Evidence: keyword rules and your saved {farm.crop} farm context.
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
            Your transcript, detected intent and recommended next action will
            appear here.
          </Empty>
        )}
      </Panel>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { Localized } from "@/components/localization";
import type { Language } from "@/lib/i18n";

export function DeviceVoice({
  language,
  onTranscript,
}: {
  language: Language;
  onTranscript: (text: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Tap the microphone to record");
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const worker = useRef<Worker | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const session = useRef(0);
  const pending = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);
  const retryBlob = useRef<Blob | null>(null);
  const onText = useRef(onTranscript);
  onText.current = onTranscript;

  function releaseMicrophone() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (interval.current) clearInterval(interval.current);
    interval.current = null;
    pending.current = false;
  }
  useEffect(() => {
    return () => {
      session.current++;
      if (recorder.current) {
        recorder.current.onstop = null;
        recorder.current.ondataavailable = null;
        recorder.current.onerror = null;
        if (recorder.current.state !== "inactive") recorder.current.stop();
      }
      releaseMicrophone();
      worker.current?.terminate();
      worker.current = null;
      void audioContext.current?.close().catch(() => {});
    };
  }, []);
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function transcribe(blob: Blob, captureSession: number) {
    setBusy(true);
    setError("");
    setStatus("Preparing recorded audio…");
    let context: AudioContext | null = null;
    try {
      context = new AudioContext();
      audioContext.current = context;
      const decoded = await context.decodeAudioData(await blob.arrayBuffer());
      await context.close();
      audioContext.current = null;
      if (session.current !== captureSession) return;
      const mono = new Float32Array(decoded.length);
      for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
        const samples = decoded.getChannelData(ch);
        for (let i = 0; i < samples.length; i++)
          mono[i] += samples[i] / decoded.numberOfChannels;
      }
      const rms = Math.sqrt(
        mono.reduce((total, value) => total + value * value, 0) / mono.length,
      );
      if (decoded.duration < 0.3 || rms < 0.002) throw new Error("silence");
      const offline = new OfflineAudioContext(
        1,
        Math.ceil(decoded.duration * 16000),
        16000,
      );
      const source = offline.createBufferSource();
      const buffer = offline.createBuffer(1, mono.length, decoded.sampleRate);
      buffer.copyToChannel(mono, 0);
      source.buffer = buffer;
      source.connect(offline.destination);
      source.start();
      const audio = (await offline.startRendering()).getChannelData(0).slice();
      if (session.current !== captureSession) return;
      if (!worker.current) {
        worker.current = new Worker("/speech-worker.js", { type: "module" });
      }
      const w = worker.current;
      w.onmessage = ({ data }) => {
        if (session.current !== captureSession) return;
        if (data.type === "loading")
          setStatus("Loading the speech model for the first time…");
        if (data.type === "progress")
          setStatus("Downloading speech model: " + data.progress + "%");
        if (data.type === "transcribing")
          setStatus("Transcribing on your device…");
        if (data.type === "result") {
          setBusy(false);
          if (!data.text) {
            setError(
              "No speech was understood. Listen to your recording and try again.",
            );
            setStatus("Ready to record again");
            return;
          }
          setStatus("Transcript received");
          onText.current(data.text);
        }
        if (data.type === "error") {
          setBusy(false);
          setStatus("Ready to record again");
          setError(
            "Device transcription could not load or run. Your recording is preserved; retry transcription or type your question.",
          );
        }
      };
      w.onerror = () => {
        if (session.current !== captureSession) return;
        setBusy(false);
        setError(
          "Device transcription could not load or run. Your recording is preserved; retry transcription or type your question.",
        );
        w.terminate();
        worker.current = null;
      };
      w.postMessage({ audio, language }, [audio.buffer]);
    } catch (e) {
      if (context && context.state !== "closed")
        void context.close().catch(() => {});
      if (audioContext.current === context) audioContext.current = null;
      if (session.current !== captureSession) return;
      setBusy(false);
      setStatus("Ready to record again");
      setError(
        (e as Error).message === "silence"
          ? "No clear audio was captured. Check the recording and your microphone, then try again."
          : "The recording could not be decoded. Try recording again in a supported browser.",
      );
    }
  }
  async function start() {
    if (recording) {
      recorder.current?.stop();
      setStatus("Preparing recorded audio…");
      return;
    }
    if (pending.current || busy) return;
    setError("");
    if (
      !navigator.mediaDevices?.getUserMedia ||
      !window.MediaRecorder ||
      !window.AudioContext
    ) {
      setError(
        "This browser cannot record audio. Open the secure site in Chrome, Edge or Safari.",
      );
      return;
    }
    const captureSession = ++session.current;
    pending.current = true;
    setBusy(true);
    setStatus("Waiting for microphone permission…");
    try {
      window.speechSynthesis?.cancel();
      const captured = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (session.current !== captureSession) {
        captured.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = captured;
      const r = new MediaRecorder(captured);
      recorder.current = r;
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onerror = () => {
        r.onstop = null;
        releaseMicrophone();
        setRecording(false);
        setBusy(false);
        setError(
          "Audio recording failed. Check your microphone and try again.",
        );
      };
      r.onstop = () => {
        releaseMicrophone();
        setRecording(false);
        const blob = new Blob(chunks, { type: r.mimeType });
        retryBlob.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        void transcribe(blob, captureSession);
      };
      r.start();
      setSeconds(0);
      setBusy(false);
      setRecording(true);
      setStatus("Recording — tap the microphone to finish");
      let elapsed = 0;
      interval.current = setInterval(() => {
        elapsed++;
        setSeconds(elapsed);
        if (elapsed >= 20 && r.state === "recording") r.stop();
      }, 1000);
    } catch (e) {
      releaseMicrophone();
      if (session.current !== captureSession) return;
      setBusy(false);
      setStatus("Ready to record again");
      setError(
        (e as Error).name === "NotAllowedError"
          ? "Microphone permission was denied. Allow microphone access in your browser site settings, then try again."
          : "No working microphone was found. Connect a microphone and check your device input settings.",
      );
    }
  }
  function cancel() {
    session.current++;
    releaseMicrophone();
    void audioContext.current?.close().catch(() => {});
    audioContext.current = null;
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
    setStatus("Ready to record again");
    setError("");
  }
  return (
    <Localized>
      <div className="device-recorder">
        <div className={"voice-stage " + (recording ? "recording" : "")}>
          <button
            type="button"
            className="big-mic"
            disabled={busy}
            onClick={() => void start()}
            aria-label={recording ? "Stop recording" : "Start speaking"}
          >
            <Mic size={36} />
          </button>
          <span className="mono" role="status" aria-live="polite">
            {status}
          </span>
          {recording && <span>{seconds} / 20 s</span>}
        </div>
        <p className="voice-hint">
          Record your question, then tap the microphone to stop.
        </p>
        <details className="voice-help">
          <summary>How transcription works</summary>
          <p className="muted">
            Record a short question, then tap stop. Transcription runs on this
            device. The first use downloads a speech model and can take a few
            minutes.
          </p>
        </details>
        {audioUrl && (
          <div>
            <p>Listen to your recording</p>
            <audio
              controls
              src={audioUrl}
              aria-label="Recorded microphone audio"
              style={{ width: "100%" }}
            />
          </div>
        )}
        {busy && (
          <button type="button" className="text-link" onClick={cancel}>
            Cancel transcription
          </button>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {error && retryBlob.current && !busy && !recording && (
          <button
            type="button"
            className="button"
            onClick={() => void transcribe(retryBlob.current!, session.current)}
          >
            Retry transcription
          </button>
        )}
      </div>
    </Localized>
  );
}

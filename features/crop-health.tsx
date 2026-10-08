"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { Farm } from "@/types";
import { cropHealthService } from "@/services";
import { Badge, Panel, Empty } from "@/components/ui";
export function CropHealth({
  farm,
  addAction,
}: {
  farm: Farm;
  addAction: (t: string, r: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof cropHealthService.analyzeImage>
  > | null>(null);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function choose(f?: File) {
    setResult(null);
    setError("");
    if (!f) return;
    if (!f.type.startsWith("image/") || f.size > 10485760) {
      setError("Upload a valid image smaller than 10 MB.");
      return;
    }
    setFile(f);
  }
  async function analyze() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () =>
          reject(
            new Error(
              "Unable to analyze this image. Please try another image.",
            ),
          );
        image.src = preview;
      });
      setResult(await cropHealthService.analyzeImage(file, farm));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="two-columns">
      <Panel title={`${farm.crop} image analysis`} label="DEMO MODEL">
        <p>
          Upload a leaf or plant image. The demo returns an illustrative result
          for your selected crop.
        </p>
        <div
          className="upload-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            choose(e.dataTransfer.files[0]);
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Uploaded crop preview"
              onError={() =>
                setError("This image cannot be previewed. Try a JPEG or PNG.")
              }
            />
          ) : (
            <>
              <Upload size={32} />
              <h3>Drop your crop image here</h3>
              <p>JPEG, PNG or other browser-supported image · Max 10 MB</p>
            </>
          )}
          <label className="button">
            {file ? "REPLACE IMAGE" : "CHOOSE IMAGE"}
            <input
              aria-label="Upload crop image"
              type="file"
              accept="image/*"
              onChange={(e) => choose(e.target.files?.[0])}
            />
          </label>
        </div>
        {file && (
          <p>
            {file.name}{" "}
            <button
              className="text-link"
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
            >
              Remove image ×
            </button>
          </p>
        )}
        <button
          className="button green"
          disabled={!file || busy || !preview}
          onClick={analyze}
        >
          {busy ? "Analyzing image…" : "ANALYZE CROP"}
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </Panel>
      <Panel title="Analysis result" label="AI ASSISTED">
        {result ? (
          <>
            <Badge tone="yellow">ATTENTION REQUIRED · DEMO RESULT</Badge>
            <h2>{result.condition}</h2>
            <p>Crop: {result.crop}</p>
            <p>Illustrative confidence: {result.confidence}%</p>
            <p>{result.recommendation}</p>
            <div className="evidence">
              Evidence: uploaded file validation + fixed crop-aware mock
              response. No disease detection model is connected.
            </div>
            <button
              className="button green"
              onClick={() =>
                addAction(
                  `Inspect ${farm.crop} for crop stress`,
                  result.recommendation,
                )
              }
            >
              CREATE ACTION
            </button>
          </>
        ) : (
          <Empty>Upload and analyze an image to see the demo result.</Empty>
        )}
      </Panel>
    </div>
  );
}

"use client";
import { ProjectModel } from "@/components/project-model";
import { Localized } from "@/components/localization";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { Farm } from "@/types";
import { cropHealthService } from "@/services";
import { Badge, Panel, Empty } from "@/components/ui";

const SUPPORTED_CROPS = [
  "Apple",
  "Banana",
  "Blueberry",
  "Cherry",
  "Grape",
  "Peach",
  "Strawberry",
];

function readableCondition(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function CropHealth({
  farm,
  addAction,
}: {
  farm: Farm;
  addAction: (t: string, r: string) => void;
}) {
  const farmCrop = SUPPORTED_CROPS.find(
    (crop) => crop.toLowerCase() === farm.crop.toLowerCase(),
  );
  const [selectedCrop, setSelectedCrop] = useState(farmCrop ?? "");
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
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
      f.size > 10 * 1024 * 1024
    ) {
      setError("Upload a JPEG, PNG, or WebP image smaller than 10 MB.");
      return;
    }
    setFile(f);
  }

  async function analyze() {
    if (!file || !selectedCrop) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error("This file is not a readable crop image."));
        image.src = preview;
      });
      setResult(await cropHealthService.analyzeImage(file, selectedCrop));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const accepted = result?.status === "candidate_found" && result.prediction;

  return (
    <Localized>
      {
        <div className="two-columns">
          <Panel title="Fruit plant image analysis" label="RESEARCH MODEL">
            <ProjectModel kind="disease" />
            <p>
              Upload a clear leaf or plant photo. This calibrated research model
              returns a condition candidate or an explicit uncertain result.
            </p>
            {!farmCrop && (
              <div className="info-banner">
                {`Your saved farm crop, ${farm.crop}, is not supported by this model. Select the fruit plant shown in this photo.`}{" "}
                <Link href="/farm">Update the farm profile.</Link>
              </div>
            )}
            <div className="field">
              <label htmlFor="photo-crop">Plant shown in photo</label>
              <select
                id="photo-crop"
                value={selectedCrop}
                onChange={(event) => {
                  setSelectedCrop(event.target.value);
                  setResult(null);
                }}
              >
                <option value="">Select a supported fruit plant</option>
                {SUPPORTED_CROPS.map((crop) => (
                  <option value={crop} key={crop}>
                    {crop}
                  </option>
                ))}
              </select>
            </div>
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
                    setError(
                      "This image cannot be previewed. Try another file.",
                    )
                  }
                />
              ) : (
                <>
                  <Upload size={32} />
                  <h3>Drop your crop image here</h3>
                  <p>JPEG, PNG or WebP · Max 10 MB</p>
                </>
              )}
              <label className="button">
                {file ? "REPLACE IMAGE" : "CHOOSE IMAGE"}
                <input
                  aria-label="Upload crop image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => choose(e.target.files?.[0])}
                />
              </label>
            </div>
            {file && (
              <p>
                <span data-preserve-text>{file.name}</span>{" "}
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
              disabled={!file || !selectedCrop || busy || !preview}
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
                <Badge tone={accepted ? "green" : "yellow"}>
                  {accepted
                    ? "CONDITION CANDIDATE"
                    : "UNCERTAIN — REVIEW NEEDED"}
                </Badge>
                {accepted ? (
                  <>
                    <h2>{readableCondition(accepted.condition)}</h2>
                    <p>{`Plant: ${readableCondition(accepted.crop)}`}</p>
                    <p>{`Calibrated confidence: ${accepted.confidence}%`}</p>
                    <p>{result.recommendation}</p>
                  </>
                ) : (
                  <>
                    <h2>No reliable condition candidate</h2>
                    <p>{result.uncertaintyReason}</p>
                    <p>
                      Retake the photo in natural light with one affected leaf
                      filling most of the frame, or ask a local expert.
                    </p>
                  </>
                )}
                <div className="evidence">
                  <strong>Top model candidates</strong>
                  <ol className="model-candidates">
                    {result.candidates.map((candidate) => (
                      <li key={candidate.label}>
                        {readableCondition(candidate.crop)} —{" "}
                        {readableCondition(candidate.condition)} (
                        {candidate.confidence}%)
                      </li>
                    ))}
                  </ol>
                  <p>{`Model: ${result.modelVersion} · acceptance threshold ${result.confidenceThreshold}%`}</p>
                </div>
                <p className="error" role="note">
                  {result.disclaimer}
                </p>
                {accepted && (
                  <button
                    className="button green"
                    onClick={() =>
                      addAction(
                        `Inspect ${selectedCrop} for ${readableCondition(accepted.condition)}`,
                        result.recommendation,
                      )
                    }
                  >
                    CREATE INSPECTION ACTION
                  </button>
                )}
              </>
            ) : (
              <Empty>
                Select the fruit plant, upload a photo, and analyze it to see a
                calibrated research result.
              </Empty>
            )}
          </Panel>
        </div>
      }
    </Localized>
  );
}

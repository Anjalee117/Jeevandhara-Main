"use client";
import { useState } from "react";
import { Localized } from "@/components/localization";
import { Field } from "@/components/ui";
import type { WeatherReading } from "@/services/weather";
export function WeatherControls({
  reading,
  loading,
  error,
  refresh,
  manual,
}: {
  reading: WeatherReading | null;
  loading: boolean;
  error: string;
  refresh: (c?: { latitude: number; longitude: number }) => Promise<void>;
  manual: (v: {
    temperature: number;
    humidity: number;
    rain: number;
    wind: number;
  }) => void;
}) {
  const [values, setValues] = useState({
    temperature: "",
    humidity: "",
    rain: "",
    wind: "",
  });
  const [geoError, setGeoError] = useState("");
  return (
    <Localized>
      <section className="weather-controls">
        <div className="toolbar">
          <span>
            {loading
              ? "Updating weather…"
              : reading?.source === "live"
                ? "Live weather"
                : reading?.source === "manual"
                  ? "Phone weather reading"
                  : "Sample weather"}
          </span>
          <button
            className="button green"
            disabled={loading}
            onClick={() => void refresh()}
          >
            Refresh weather
          </button>
          <button
            className="button"
            disabled={loading}
            onClick={() => {
              setGeoError("");
              if (!navigator.geolocation) {
                setGeoError(
                  "Device location is unavailable. Use your saved farm location.",
                );
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (p) =>
                  void refresh({
                    latitude: p.coords.latitude,
                    longitude: p.coords.longitude,
                  }),
                () =>
                  setGeoError(
                    "Location permission failed. Use your saved farm location.",
                  ),
                { timeout: 10000 },
              );
            }}
          >
            Use device location
          </button>
        </div>
        {reading && (
          <p className="muted">
            <span data-preserve-text>{reading.resolvedLocation}</span> ·{" "}
            {new Date(reading.updatedAt).toLocaleString()} ·{" "}
            {reading.source === "live" ? (
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
              >
                Open-Meteo
              </a>
            ) : (
              "Entered from your phone"
            )}
          </p>
        )}
        {(error || geoError) && (
          <p className="error" role="alert">
            {error || geoError}
          </p>
        )}
        <details className="phone-weather">
          <summary>Enter phone weather reading</summary>
          <p>
            Copy the current values from your phone weather app. Other apps
            cannot be read automatically by this website.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              manual(
                Object.fromEntries(
                  Object.entries(values).map(([k, v]) => [k, Number(v)]),
                ) as {
                  temperature: number;
                  humidity: number;
                  rain: number;
                  wind: number;
                },
              );
            }}
          >
            <div className="form-grid">
              {[
                ["temperature", "Temperature (°C)", -60, 60],
                ["humidity", "Humidity (%)", 0, 100],
                ["rain", "Rain probability (%)", 0, 100],
                ["wind", "Wind (km/h)", 0, 300],
              ].map(([key, label, min, max]) => (
                <Field key={key} label={String(label)}>
                  <input
                    type="number"
                    step="0.1"
                    min={Number(min)}
                    max={Number(max)}
                    required
                    value={values[key as keyof typeof values]}
                    onChange={(e) =>
                      setValues({ ...values, [String(key)]: e.target.value })
                    }
                  />
                </Field>
              ))}
            </div>
            <button className="button green">Save weather reading</button>
          </form>
        </details>
      </section>
    </Localized>
  );
}

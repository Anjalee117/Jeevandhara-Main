"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Farm } from "@/types";
import {
  fetchWeather,
  weatherRecommendation,
  type WeatherReading,
} from "@/services/weather";
const key = (location: string) =>
  "jeevandhara-weather:" + location.toLowerCase().trim();
export function useWeather(farm: Farm, enabled: boolean) {
  const [reading, setReading] = useState<WeatherReading | null>(null);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const save = useCallback((r: WeatherReading) => {
    setReading(r);
    try {
      localStorage.setItem(key(r.location), JSON.stringify(r));
    } catch {}
  }, []);
  const refresh = useCallback(
    async (coordinates?: { latitude: number; longitude: number }) => {
      controller.current?.abort();
      const c = new AbortController();
      controller.current = c;
      setLoading(true);
      setError("");
      const timeout = setTimeout(() => c.abort(), 15000);
      try {
        const r = await fetchWeather(farm, c.signal, coordinates);
        if (!c.signal.aborted) save(r);
      } catch (e) {
        if (controller.current === c)
          setError(
            c.signal.aborted
              ? "Weather refresh timed out. Retry or enter your phone weather reading."
              : /^(Weather service|Location not found)/.test(
                    (e as Error).message,
                  )
                ? (e as Error).message
                : "Weather service is unavailable. Retry or enter your phone weather reading.",
          );
      } finally {
        clearTimeout(timeout);
        if (controller.current === c) setLoading(false);
      }
    },
    [farm.location, save],
  );
  useEffect(() => {
    controller.current?.abort();
    controller.current = null;
    setLoading(false);
    setReading(null);
    setError("");
    let cached: WeatherReading | null = null;
    try {
      cached = JSON.parse(localStorage.getItem(key(farm.location)) || "null");
    } catch {}
    if (
      cached &&
      cached.location === farm.location &&
      [cached.temperature, cached.humidity, cached.rain, cached.wind].every(
        Number.isFinite,
      ) &&
      Array.isArray(cached.days)
    ) {
      setReading(cached);
      if (
        cached.source === "manual" ||
        Date.now() - Date.parse(cached.updatedAt) < 900000
      )
        return;
    }
    if (enabled) void refresh();
    return () => {
      controller.current?.abort();
      controller.current = null;
    };
  }, [farm.location, enabled, refresh]);
  useEffect(() => {
    if (!enabled || reading?.source === "manual") return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 900000);
    return () => clearInterval(timer);
  }, [enabled, reading?.source, refresh]);
  const manual = (v: {
    temperature: number;
    humidity: number;
    rain: number;
    wind: number;
  }) => {
    controller.current?.abort();
    controller.current = null;
    setLoading(false);
    setError("");
    save({
      ...v,
      location: farm.location,
      resolvedLocation: farm.location,
      days: [],
      source: "manual",
      updatedAt: new Date().toISOString(),
      recommendation: weatherRecommendation(v.rain, v.wind, v.temperature),
    });
  };
  return {
    reading: reading?.location === farm.location ? reading : null,
    loading,
    error,
    refresh,
    manual,
  };
}

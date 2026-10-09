import type { Farm } from "@/types";
export type WeatherReading = {
  location: string;
  resolvedLocation: string;
  temperature: number;
  humidity: number;
  rain: number;
  wind: number;
  days: { day: string; temp: number; rain: number }[];
  recommendation: string;
  source: "live" | "manual";
  updatedAt: string;
};
export function weatherRecommendation(
  rain: number,
  wind: number,
  temperature: number,
) {
  if (wind >= 40)
    return "Strong winds expected. Secure equipment and avoid spraying.";
  if (temperature >= 38)
    return "High temperature. Check soil moisture and protect young plants.";
  return rain >= 60
    ? "Delay irrigation and check drainage before expected rainfall."
    : "Check soil moisture before deciding whether to irrigate.";
}
async function json(url: string, signal: AbortSignal) {
  const r = await fetch(url, { signal });
  if (!r.ok)
    throw Error(
      "Weather service is unavailable. Retry or enter your phone weather reading.",
    );
  return r.json();
}
export async function fetchWeather(
  farm: Farm,
  signal: AbortSignal,
  coordinates?: { latitude: number; longitude: number },
): Promise<WeatherReading> {
  let point = coordinates,
    resolvedLocation = "Device location";
  if (!point) {
    if (farm.location.trim().toLowerCase() === "bengaluru rural") {
      point = { latitude: 13.28, longitude: 77.61 };
      resolvedLocation = "Bengaluru Rural";
    } else {
      const data = await json(
        "https://geocoding-api.open-meteo.com/v1/search?" +
          new URLSearchParams({
            name: farm.location,
            count: "1",
            countryCode: "IN",
            language: "en",
            format: "json",
          }),
        signal,
      );
      const place = data.results?.[0];
      if (!place)
        throw Error(
          "Location not found. Edit your farm location or use device location.",
        );
      point = { latitude: place.latitude, longitude: place.longitude };
      resolvedLocation = place.name;
    }
  }
  const data = await json(
    "https://api.open-meteo.com/v1/forecast?" +
      new URLSearchParams({
        latitude: String(point.latitude),
        longitude: String(point.longitude),
        current: "temperature_2m,relative_humidity_2m,wind_speed_10m",
        daily: "temperature_2m_max,precipitation_probability_max",
        timezone: "auto",
        forecast_days: "7",
      }),
    signal,
  );
  const c = data.current,
    d = data.daily;
  if (
    !c ||
    !d ||
    !Array.isArray(d.time) ||
    !Array.isArray(d.temperature_2m_max) ||
    !Array.isArray(d.precipitation_probability_max) ||
    ![
      c.temperature_2m,
      c.relative_humidity_2m,
      c.wind_speed_10m,
      d.precipitation_probability_max?.[0],
    ].every(Number.isFinite)
  )
    throw Error(
      "Weather service returned incomplete data. Retry or enter a reading.",
    );
  const temperature = c.temperature_2m,
    wind = c.wind_speed_10m,
    rain = d.precipitation_probability_max[0];
  return {
    location: farm.location,
    resolvedLocation,
    temperature,
    humidity: c.relative_humidity_2m,
    wind,
    rain,
    days: d.time.map((_: string, i: number) => ({
      day: ["Today", "Tomorrow", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"][
        i
      ],
      temp: d.temperature_2m_max[i],
      rain: d.precipitation_probability_max[i],
    })),
    source: "live",
    updatedAt: new Date().toISOString(),
    recommendation: weatherRecommendation(rain, wind, temperature),
  };
}

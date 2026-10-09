import type { DiseaseModelOutput } from "@/types/model-contracts";
import { Farm, Action, Scheme, ThreatEvent } from "@/types";
import { schemes, documents, demoState, crops } from "@/data/demo";
import { translate, type Language } from "@/lib/i18n";
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 350));
export const farmerService = {
  getDemoFarm: () => structuredClone(demoState.farm),
  validate(farm: Farm) {
    if (!farm.name.trim() || !farm.location.trim() || farm.size <= 0)
      throw new Error("Enter a name, location and a positive farm size.");
    if (farm.harvest < farm.sowing)
      throw new Error("Harvest date must be after sowing.");
    return farm;
  },
};
export const weatherService = {
  getForecast(farm: Farm) {
    const seed = [...farm.location].reduce((a, c) => a + c.charCodeAt(0), 0);
    return {
      location: farm.location,
      temperature: 27 + (seed % 4),
      humidity: 65 + (seed % 9),
      rain: 78 + (seed % 8),
      wind: 9 + (seed % 6),
      days: Array.from({ length: 7 }, (_, i) => ({
        day: ["Today", "Tomorrow", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"][
          i
        ],
        temp: 26 + ((seed + i) % 6),
        rain: i < 2 ? 82 : 30 + ((seed + i * 13) % 50),
      })),
      recommendation:
        "Delay irrigation and check drainage before expected rainfall.",
    };
  },
};
export const marketService = {
  getPrices(crop: string) {
    const base: Record<string, number> = {
      Tomato: 2450,
      Ragi: 3850,
      Jowar: 3100,
      Onion: 2200,
      Potato: 1950,
    };
    const price = base[crop] ?? 2500;
    return {
      crop,
      price,
      previous: price - 180,
      demand: "High",
      trend: "Rising",
      history: [
        price - 420,
        price - 350,
        price - 390,
        price - 200,
        price - 240,
        price - 180,
        price,
      ],
      markets: [
        { name: "Bengaluru APMC", price, distance: 32 },
        { name: "Doddaballapur", price: price - 90, distance: 14 },
        { name: "Chikkaballapur", price: price + 110, distance: 48 },
      ],
    };
  },
  recommend(crop: string) {
    const m = this.getPrices(crop).markets;
    const best = [...m].sort(
      (a, b) => b.price - b.distance * 7 - (a.price - a.distance * 7),
    )[0];
    return `${best.name} offers the strongest illustrative return for ${crop}: ₹${best.price}/quintal, ${best.distance} km away. Distance cost proxy: ₹7/km per quintal. Verify actual quotes and transport costs.`;
  },
};
export const schemeService = {
  getSchemes: () => schemes,
  checkEligibility(
    scheme: Scheme,
    input: {
      size: number;
      crop: string;
      state: string;
      irrigation: string;
      category: string;
    },
  ) {
    const factors = [
      {
        label: "Farm size",
        matched: input.size > 0 && input.size <= scheme.maxSize,
        detail: `${input.size} acres; maximum ${scheme.maxSize}`,
      },
      {
        label: "Crop",
        matched: scheme.crop === "All" || scheme.crop === input.crop,
        detail: input.crop,
      },
      {
        label: "Location",
        matched: scheme.state === input.state,
        detail: input.state,
      },
      {
        label: "Irrigation",
        matched:
          scheme.irrigation === "All" || scheme.irrigation === input.irrigation,
        detail: input.irrigation,
      },
      {
        label: "Farmer category",
        matched:
          scheme.category === "All" || scheme.category === input.category,
        detail: input.category || "Not supplied",
      },
    ];
    return {
      status:
        !input.category ||
        !input.state ||
        !input.crop ||
        !input.irrigation ||
        !input.size
          ? "MORE INFORMATION REQUIRED"
          : factors.every((x) => x.matched)
            ? "ELIGIBLE"
            : "NOT ELIGIBLE",
      factors,
    };
  },
};
export const knowledgeService = {
  search(query: string, category = "All", language: Language = "en") {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return documents
      .filter((d) => category === "All" || d.category === category)
      .map((d) => ({
        ...d,
        relevance: words.length
          ? Math.round(
              (100 *
                words.filter((w) =>
                  (
                    d.title +
                    " " +
                    d.text +
                    " " +
                    d.category +
                    " " +
                    translate(language, d.title) +
                    " " +
                    translate(language, d.text) +
                    " " +
                    translate(language, d.category)
                  )
                    .toLowerCase()
                    .includes(w),
                ).length) /
                words.length,
            )
          : 100,
      }))
      .filter((d) => d.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);
  },
  getEvidence(id: string) {
    return documents.find((d) => d.id === id);
  },
};
export const actionPlannerService = {
  generateActions(
    farm: Farm,
    weather = weatherService.getForecast(farm),
  ): Action[] {
    return [
      {
        id: `rain-${farm.crop}-${farm.location}`,
        title:
          weather.wind >= 40
            ? "Secure equipment; avoid spraying"
            : weather.temperature >= 38
              ? "Protect young plants from heat"
              : weather.rain >= 60
                ? "Delay irrigation; inspect drainage"
                : "Check soil moisture before irrigation",
        priority:
          weather.rain >= 60 || weather.wind >= 40 || weather.temperature >= 38
            ? "HIGH"
            : "MEDIUM",
        reason: `Rain probability ${weather.rain}%. ${farm.crop}, ${farm.soil}, ${farm.irrigation} irrigation.`,
        confidence: 88,
        source: "Weather + farm profile",
        time: "NOW",
        status: "active",
      },
      {
        id: `crop-${farm.crop}`,
        title: `Inspect ${farm.crop.toLowerCase()} ${farm.crop === "Tomato" ? "leaves for disease symptoms" : "plants for stress and pest activity"}`,
        priority: "MEDIUM",
        reason: `${farm.crop} is in the ${farm.stage.toLowerCase()} stage. Regular visual inspection helps identify changes.`,
        confidence: 87,
        source: "Demo field guide + farm profile",
        time: "TODAY",
        status: "active",
      },
      {
        id: `market-${farm.crop}`,
        title: `Compare ${farm.crop.toLowerCase()} markets before selling`,
        priority: "MEDIUM",
        reason: `Demo price increased ₹180/quintal. Compare distance and transportation costs.`,
        confidence: 82,
        source: "Mock market data",
        time: "THIS WEEK",
        status: "active",
      },
      {
        id: "scheme-review",
        title: "Review scheme eligibility and deadlines",
        priority: "LOW",
        reason:
          "Illustrative irrigation assistance closes October 30, 2026. Verify real schemes with the department.",
        confidence: 95,
        source: "Demo scheme catalog",
        time: "THIS WEEK",
        status: "active",
      },
    ];
  },
  create(title: string, reason: string): Action {
    return {
      id: crypto.randomUUID(),
      title,
      reason,
      priority: "MEDIUM",
      confidence: 87,
      source: "Demo analysis + farmer request",
      time: "TODAY",
      status: "active",
    };
  },
};
export const cropHealthService = {
  async analyzeImage(file: File, farm: Farm): Promise<DiseaseModelOutput> {
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024)
      throw new Error("Upload an image smaller than 10 MB.");
    await wait();
    return {
      crop: farm.crop,
      condition:
        farm.crop === "Tomato"
          ? "Possible Early Blight (illustrative)"
          : "Possible leaf stress (illustrative)",
      confidence: 87,
      recommendation: `Inspect nearby ${farm.crop.toLowerCase()} plants and monitor changes. This fixed demo result does not diagnose the uploaded image.`,
    };
  },
};
export const voiceService = {
  async transcribe(transcript: string) {
    return transcript.trim();
  },
  normalizeDialect(text: string) {
    if (/ಟೊಮೇಟೊ/.test(text)) return "What should I do for my tomato crop?";
    return text;
  },
  detectIntent(text: string) {
    const rules: [string, RegExp, string, string][] = [
      [
        "Government Scheme",
        /scheme|subsidy|ಯೋಜನೆ|योजना|सब्सिडी/i,
        "schemes",
        "Review schemes and check structured eligibility.",
      ],
      [
        "Market Price",
        /price|sell|market|ಬೆಲೆ|कीमत|भाव|बाज़ार|बाजार|बेच/i,
        "market",
        "Compare nearby markets and transport costs.",
      ],
      [
        "Weather",
        /rain|weather|ಮಳೆ|बारिश|वर्षा|मौसम/i,
        "weather",
        "Review rainfall and check field drainage.",
      ],
      [
        "Farm Threat",
        /moving|motion|intrud|threat|animal|घुसपैठ|जानवर|खतरा/i,
        "threats",
        "Review sensor readings and verify activity.",
      ],
      [
        "Irrigation",
        /irrigat|water|ನೀರು|सिंचाई|पानी/i,
        "weather",
        "Check rainfall and soil moisture before irrigating.",
      ],
      [
        "Crop Disease",
        /disease|blight|spot|yellow|ರೋಗ|रोग|बीमारी|पीले|धब्बे/i,
        "crop-health",
        "Inspect leaves and upload a crop image.",
      ],
      [
        "Crop Advisory",
        /crop|tomato|ragi|ಬೆಳೆ|ಟೊಮೇಟೊ|फसल|टमाटर|रागी/i,
        "crop-health",
        "Inspect crop leaves and upload an image for further analysis.",
      ],
    ];
    const rule = rules.find((r) => r[1].test(text));
    return {
      intent: rule?.[0] ?? "General Agriculture",
      confidence: rule ? 94 : 72,
      route: rule?.[2] ?? "knowledge",
      recommendation:
        rule?.[3] ??
        "Search the knowledge library for relevant field guidance.",
    };
  },
  async analyzeSpeech(text: string) {
    await wait();
    if (!text.trim()) throw new Error("Speak or type a question first.");
    const transcript = await this.transcribe(text);
    const normalized = this.normalizeDialect(transcript);
    return { transcript, normalized, ...this.detectIntent(normalized) };
  },
};
export const iotService = {
  getDevices() {
    return [
      "ESP32-CAM",
      "PIR",
      "Ultrasonic",
      "Soil Moisture",
      "DHT22",
      "mmWave Radar",
      "LoRa Node",
    ].map((name, i) => ({
      name,
      status: i === 6 ? "OFFLINE" : "ONLINE",
      signal: 90 - i * 4,
      battery: 94 - i * 5,
      reading: [
        "Standby",
        "CLEAR",
        "218 cm",
        "42%",
        "28.4°C / 68%",
        "NORMAL",
        "No signal",
      ][i],
    }));
  },
  getSensorData(tick = 0) {
    return {
      temperature: (28.4 + Math.sin(tick) * 0.3).toFixed(1),
      humidity: 68 + Math.round(Math.sin(tick) * 2),
      moisture: 42 + Math.round(Math.cos(tick) * 2),
      pir: tick % 7 === 4 ? "MOTION" : "CLEAR",
      radar: tick % 7 === 4 ? "ACTIVITY" : "NORMAL",
    };
  },
};
export const threatService = {
  getSensorStatus: () => iotService.getDevices(),
  simulateEvent(): ThreatEvent {
    return {
      id: crypto.randomUUID(),
      state: "ALERT",
      time: new Date().toISOString(),
      acknowledged: false,
      steps: [
        "Motion detected by PIR",
        "Simulated camera verification",
        "Possible intrusion: unverified",
        "Alert generated for farmer review",
      ],
    };
  },
};
export const notificationService = {
  create(title: string, type: string, route: string) {
    return { id: crypto.randomUUID(), title, type, route, read: false };
  },
  getDemoNotifications: () => structuredClone(demoState.notifications),
};
export const systemService = {
  getStatus: () =>
    [
      "Voice Engine",
      "Scheme Engine",
      "Crop Health Model",
      "Market Service",
      "Weather Service",
      "RAG",
      "Farmer Context",
      "IoT Gateway",
      "Action Planner",
    ].map((name, i) => ({
      name,
      status: i === 7 ? "SIMULATION" : i === 6 || i === 8 ? "LOCAL" : "DEMO",
    })),
};
export { crops };

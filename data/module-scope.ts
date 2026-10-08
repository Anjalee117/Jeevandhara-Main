export const moduleScope: Record<string, { now: string; later: string }> = {
  voice: {
    now: "Microphone recording, speech transcription and a farm intent demo.",
    later: "Sarvam speech integration and recognition of Kannada dialects.",
  },
  farm: {
    now: "Edit your crop, farm size, location, irrigation and soil details.",
    later: "Save farm data securely with Firebase and Firestore.",
  },
  context: {
    now: "Your context updates when you change farm or crop information.",
    later: "A persistent farmer profile and richer AI context.",
  },
  schemes: {
    now: "Search demo schemes and check eligibility with a questionnaire.",
    later: "Live government scheme data with RAG search.",
  },
  "crop-health": {
    now: "Upload and preview a crop image with an illustrative analysis result.",
    later: "Connect an actual crop disease model or analysis API.",
  },
  market: {
    now: "Explore demo crop prices, charts and market comparisons.",
    later: "Live market prices from market APIs.",
  },
  weather: {
    now: "View a demo weather dashboard for your saved farm location.",
    later: "Live forecasts from a weather API.",
  },
  threats: {
    now: "Simulated ESP32 readings, changing sensor values and alerts.",
    later: "Connect real ESP32 and LoRa devices through MQTT.",
  },
  actions: {
    now: "Prioritized demo actions based on farm, weather and crop information.",
    later: "An AI Farm Action Planner with personalized recommendations.",
  },
  knowledge: {
    now: "Search agricultural knowledge and demo documents.",
    later: "RAG search backed by a vector database.",
  },
  notifications: {
    now: "Review notifications, priority alerts and read status.",
    later: "A real notification service for timely alerts.",
  },
  settings: {
    now: "Manage language, farmer preferences, consent and demo device settings.",
    later: "Firebase authentication and account settings.",
  },
  system: {
    now: "Check the current demo, local and simulated service status.",
    later: "Health checks for connected APIs and real services.",
  },
};

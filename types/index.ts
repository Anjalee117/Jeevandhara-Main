export type Farm = {
  name: string;
  location: string;
  size: number;
  crop: string;
  variety: string;
  stage: string;
  soil: string;
  irrigation: string;
  sowing: string;
  harvest: string;
  language: "en" | "kn";
};
export type Action = {
  id: string;
  title: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  confidence: number;
  source: string;
  time: "NOW" | "TODAY" | "THIS WEEK";
  status: "active" | "completed" | "snoozed";
  snoozedUntil?: number;
};
export type Notice = {
  id: string;
  title: string;
  type: string;
  route: string;
  read: boolean;
};
export type ThreatEvent = {
  id: string;
  state: "WATCH" | "ALERT" | "NORMAL";
  time: string;
  acknowledged: boolean;
  steps: string[];
};
export type AppState = {
  farm: Farm;
  actions: Action[];
  notifications: Notice[];
  events: ThreatEvent[];
  interactions: string[];
  settings: { spokenResponses: boolean; compact: boolean };
};
export type Scheme = {
  id: string;
  name: string;
  department: string;
  benefit: string;
  maxSize: number;
  crop: string;
  state: string;
  irrigation: string;
  category: string;
  deadline: string;
  source: string;
  updated: string;
};

import type { Farm, Scheme } from "@/types";
/** Percent confidences are 0–100. Map each project model's response at the adapter boundary. */
export type DiseaseModelOutput = {
  crop: string;
  condition: string;
  confidence: number;
  recommendation: string;
};
export type ThreatModelOutput = {
  id: string;
  time: string;
  state: "WATCH" | "ALERT" | "NORMAL";
  steps: string[];
};
export type SchemeModelOutput = {
  schemes: Scheme[];
  eligibility: { eligible: boolean; reasons: string[] };
  sources: string[];
};
export interface ProjectModelAdapters {
  disease: (image: File, farm: Farm) => Promise<DiseaseModelOutput>;
  threat: (
    readings: Record<string, number | string>,
    farm: Farm,
  ) => Promise<ThreatModelOutput>;
  schemes: (query: string, farm: Farm) => Promise<SchemeModelOutput>;
}

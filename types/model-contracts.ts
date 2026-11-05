import type { Farm, Scheme } from "@/types";
/** Percent confidences are 0–100 unless a type explicitly says otherwise. */
export type FruitDiseaseCandidate = {
  label: string;
  crop: string;
  condition: string;
  confidence: number;
};
export type DiseaseModelOutput = {
  modelVersion: string;
  researchOnly: true;
  status: "candidate_found" | "uncertain" | "crop_mismatch";
  expectedCrop: string;
  prediction: FruitDiseaseCandidate | null;
  candidates: FruitDiseaseCandidate[];
  confidenceThreshold: number;
  uncertaintyReason: string | null;
  recommendation: string;
  disclaimer: string;
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
  disease: (image: File, expectedCrop: string) => Promise<DiseaseModelOutput>;
  threat: (
    readings: Record<string, number | string>,
    farm: Farm,
  ) => Promise<ThreatModelOutput>;
  schemes: (query: string, farm: Farm) => Promise<SchemeModelOutput>;
}

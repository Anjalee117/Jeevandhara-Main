import { AppState } from "@/types";
import { demoState } from "@/data/demo";
export interface StateRepository {
  load(): AppState;
  save(state: AppState): void;
  reset(): AppState;
}
export const storage: StateRepository = {
  load() {
    const value = localStorage.getItem("jeevandhara-v1");
    if (!value) return structuredClone(demoState);
    const parsed = JSON.parse(value);
    if (
      !parsed.farm ||
      !Array.isArray(parsed.actions) ||
      !Array.isArray(parsed.notifications) ||
      !Array.isArray(parsed.events) ||
      !Array.isArray(parsed.interactions) ||
      !parsed.settings
    )
      throw new Error(
        "Saved demo data is invalid. Load the demo farm to reset it.",
      );
    // Migrate the original demo name without resetting customized farm records.
    if (parsed.farm.name === "Pratham") parsed.farm.name = demoState.farm.name;
    return parsed;
  },
  save(state) {
    localStorage.setItem("jeevandhara-v1", JSON.stringify(state));
  },
  reset() {
    const state = structuredClone(demoState);
    this.save(state);
    return state;
  },
};

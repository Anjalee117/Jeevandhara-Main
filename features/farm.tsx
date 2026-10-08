"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Farm } from "@/types";
import { crops } from "@/services";
import { Panel, Field } from "@/components/ui";
export function FarmForm({
  farm,
  save,
}: {
  farm: Farm;
  save: (f: Farm) => void;
}) {
  const [draft, setDraft] = useState(farm);
  useEffect(() => setDraft(farm), [farm]);
  const change = (key: keyof Farm, value: string) =>
    setDraft({ ...draft, [key]: key === "size" ? Number(value) : value });
  return (
    <Panel title="Farm profile" label="SHARED CONTEXT">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(draft);
        }}
      >
        <div className="form-grid">
          {[
            ["name", "Farmer name"],
            ["location", "Location"],
            ["size", "Farm size (acres)"],
            ["variety", "Crop variety"],
            ["sowing", "Sowing date"],
            ["harvest", "Expected harvest"],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                required
                type={
                  key === "size"
                    ? "number"
                    : ["sowing", "harvest"].includes(key)
                      ? "date"
                      : "text"
                }
                min={key === "size" ? "0.1" : undefined}
                step={key === "size" ? "0.1" : undefined}
                value={draft[key as keyof Farm]}
                onChange={(e) => change(key as keyof Farm, e.target.value)}
              />
            </Field>
          ))}
          {[
            ["crop", "Crop", crops],
            [
              "stage",
              "Crop stage",
              ["Sowing", "Vegetative", "Flowering", "Fruiting", "Harvest"],
            ],
            [
              "soil",
              "Soil type",
              ["Red Soil", "Black Soil", "Loamy Soil", "Sandy Soil"],
            ],
            [
              "irrigation",
              "Irrigation",
              ["Drip", "Sprinkler", "Rainfed", "Flood"],
            ],
            ["language", "Preferred language", ["en", "kn"]],
          ].map(([key, label, options]) => (
            <Field key={key as string} label={label as string}>
              <select
                value={draft[key as keyof Farm]}
                onChange={(e) => change(key as keyof Farm, e.target.value)}
              >
                {(options as string[]).map((v) => (
                  <option key={v} value={v}>
                    {v === "en" ? "English" : v === "kn" ? "ಕನ್ನಡ" : v}
                  </option>
                ))}
              </select>
            </Field>
          ))}
        </div>
        <div className="form-footer">
          <p>
            Saving updates the dashboard, market, crop health and action
            planner.
          </p>
          <button className="button green" type="submit">
            SAVE FARM <Check size={17} />
          </button>
        </div>
      </form>
    </Panel>
  );
}

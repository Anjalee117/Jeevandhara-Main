"use client";
import { ProjectModel } from "@/components/project-model";
import { Localized } from "@/components/localization";
import Link from "next/link";
import { translate } from "@/lib/i18n";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Farm, Scheme } from "@/types";
import { schemeService, crops } from "@/services";
import { Badge, Panel, Empty, Field } from "@/components/ui";
export function Schemes({
  farm,
  explain,
}: {
  farm: Farm;
  explain: (m: { title: string; body: React.ReactNode }) => void;
}) {
  const [search, setSearch] = useState("");
  const [crop, setCrop] = useState("All");
  const [category, setCategory] = useState("All");
  const [irrigation, setIrrigation] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [size, setSize] = useState("");
  const [selected, setSelected] = useState<Scheme | null>(null);
  const [input, setInput] = useState({
    size: farm.size,
    crop: farm.crop,
    state: "Karnataka",
    irrigation: farm.irrigation,
    category: "Smallholder",
  });
  const [result, setResult] = useState<ReturnType<
    typeof schemeService.checkEligibility
  > | null>(null);
  const list = schemeService
    .getSchemes()
    .filter(
      (s) =>
        (s.name + " " + translate(farm.language, s.name))
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (crop === "All" || s.crop === "All" || s.crop === crop) &&
        (category === "All" ||
          s.category === "All" ||
          s.category === category) &&
        (irrigation === "All" ||
          s.irrigation === "All" ||
          s.irrigation === irrigation) &&
        (stateFilter === "All" || s.state === stateFilter) &&
        (!size || s.maxSize >= Number(size)),
    );
  return (
    <Localized>
      {
        <>
          <ProjectModel kind="schemes" />
          <div className="info-banner">
            ILLUSTRATIVE SCHEMES / Names, benefits, deadlines and criteria are
            fictional demo data.
          </div>
          <Panel title="Discover support for your farm">
            <div className="filters">
              <Field label="Search schemes">
                <input
                  placeholder="Search schemes"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Field>
              <Field label="Crop">
                <select value={crop} onChange={(e) => setCrop(e.target.value)}>
                  {["All", ...crops].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Farmer type">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {["All", "Smallholder", "Commercial"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="State">
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                >
                  {["All", "Karnataka", "Tamil Nadu"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Irrigation">
                <select
                  value={irrigation}
                  onChange={(e) => setIrrigation(e.target.value)}
                >
                  {["All", "Drip", "Rainfed", "Sprinkler"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Farm size (acres)">
                <input
                  type="number"
                  min="0"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="Any size"
                />
              </Field>
            </div>
          </Panel>
          <div className="card-grid">
            {list.map((s) => (
              <Panel key={s.id}>
                <Badge>APPLICATION NOT STARTED</Badge>
                <h2>{s.name}</h2>
                <p>{s.department}</p>
                <p>{s.benefit}</p>
                <dl className="farm-details">
                  <div>
                    <dt>Criteria</dt>
                    <dd>
                      Up to {s.maxSize} acres · {s.crop}
                    </dd>
                  </div>
                  <div>
                    <dt>Deadline</dt>
                    <dd>{s.deadline}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{s.updated}</dd>
                  </div>
                </dl>
                <p className="muted">{s.source}</p>
                <button
                  className="button"
                  onClick={() => {
                    setSelected(s);
                    setResult(null);
                  }}
                >
                  OPEN / CHECK ELIGIBILITY <ArrowUpRight size={15} />
                </button>
              </Panel>
            ))}
          </div>
          {!list.length && <Empty>No schemes match your filters.</Empty>}
          {selected && (
            <Panel
              title={`Eligibility / ${selected.name}`}
              label="DETERMINISTIC RULES"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setResult(schemeService.checkEligibility(selected, input));
                }}
              >
                <div className="form-grid">
                  <Field label="Farm size">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={input.size}
                      onChange={(e) =>
                        setInput({ ...input, size: Number(e.target.value) })
                      }
                    />
                  </Field>
                  {(["crop", "state", "irrigation", "category"] as const).map(
                    (key) => (
                      <Field
                        key={key}
                        label={key === "category" ? "Farmer category" : key}
                      >
                        <select
                          value={input[key]}
                          onChange={(e) =>
                            setInput({ ...input, [key]: e.target.value })
                          }
                        >
                          {{
                            crop: crops,
                            state: ["Karnataka", "Tamil Nadu"],
                            irrigation: [
                              "Drip",
                              "Sprinkler",
                              "Rainfed",
                              "Flood",
                            ],
                            category: ["", "Smallholder", "Commercial"],
                          }[key].map((v) => (
                            <option key={v} value={v}>
                              {v || "Select category"}
                            </option>
                          ))}
                        </select>
                      </Field>
                    ),
                  )}
                </div>
                <button className="button green">CHECK ELIGIBILITY</button>
              </form>
              {result && (
                <div className="eligibility-result">
                  <Badge
                    tone={result.status === "ELIGIBLE" ? "green" : "yellow"}
                  >
                    {result.status}
                  </Badge>
                  <p>Eligibility evaluated using structured criteria.</p>
                  <button
                    className="button"
                    onClick={() =>
                      explain({
                        title: "Eligibility explanation",
                        body: (
                          <>
                            {result.factors.map((f) => (
                              <p key={f.label}>
                                {f.matched ? "✓" : "×"} {f.label}: {f.detail}
                              </p>
                            ))}
                            <p>
                              Illustrative criteria only; verify actual
                              requirements with official sources.
                            </p>
                          </>
                        ),
                      })
                    }
                  >
                    WHY AM I ELIGIBLE?
                  </button>
                </div>
              )}
            </Panel>
          )}
        </>
      }
    </Localized>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { knowledgeService } from "@/services";
import { Badge, Panel, Empty, Field } from "@/components/ui";
export function Knowledge({
  explain,
}: {
  explain: (m: { title: string; body: React.ReactNode }) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const list = knowledgeService.search(query, category);
  return (
    <>
      <Panel
        title="Search agricultural evidence"
        label="DEMO KNOWLEDGE / NO RAG CONNECTED"
      >
        <div className="filters">
          <Field label="Search knowledge">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search irrigation, soil, crop health…"
            />
          </Field>
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {[
                "All",
                "Crop Health",
                "Government Schemes",
                "Irrigation",
                "Soil",
                "Market",
                "Weather",
                "Pest Management",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
      </Panel>
      <div className="card-grid">
        {list.map((d) => (
          <Panel key={d.id}>
            <Badge>{d.category}</Badge>
            <h2>{d.title}</h2>
            <p>{d.text}</p>
            <p className="mono">
              {d.date} / RELEVANCE {d.relevance}%
            </p>
            <p className="muted">Source: {d.source}</p>
            <button
              className="button"
              onClick={() => {
                const source = knowledgeService.getEvidence(d.id);
                explain({
                  title: "Evidence used / source document",
                  body: (
                    <>
                      <Badge>MOCK DOCUMENT</Badge>
                      <h3>{source?.title}</h3>
                      <p>{source?.text}</p>
                      <p>
                        {source?.source} · {source?.date}
                      </p>
                    </>
                  ),
                });
              }}
            >
              VIEW SOURCE <ArrowUpRight size={15} />
            </button>
          </Panel>
        ))}
      </div>
      {!list.length && (
        <Empty>No documents found. Try another keyword or category.</Empty>
      )}
    </>
  );
}

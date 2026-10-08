"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Farm } from "@/types";
import { marketService, crops } from "@/services";
import { Badge, Panel, Field, Stat } from "@/components/ui";
export function Market({
  farm,
  explain,
}: {
  farm: Farm;
  explain: (m: { title: string; body: React.ReactNode }) => void;
}) {
  const [crop, setCrop] = useState(farm.crop);
  useEffect(() => setCrop(farm.crop), [farm.crop]);
  const [compare, setCompare] = useState(false);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [point, setPoint] = useState<number | null>(null);
  const m = marketService.getPrices(crop);
  const min = Math.min(...m.history) - 100;
  const max = Math.max(...m.history) + 100;
  return (
    <>
      <div className="toolbar">
        <Field label="Select crop">
          <select
            value={crop}
            onChange={(e) => {
              setCrop(e.target.value);
              setAnswer("");
              setPoint(null);
            }}
          >
            {crops.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Badge>MOCK PRICES / ₹ PER QUINTAL</Badge>
      </div>
      <div className="stats-grid">
        <Stat
          label="CURRENT PRICE"
          value={`₹${m.price}`}
          detail="Bengaluru APMC"
        />
        <Stat
          label="PREVIOUS PRICE"
          value={`₹${m.previous}`}
          detail="Previous demo period"
        />
        <Stat
          label="PRICE CHANGE"
          value={`+${(((m.price - m.previous) / m.previous) * 100).toFixed(1)}%`}
          detail="↑ ₹180 per quintal"
        />
        <Stat label="DEMAND / TREND" value={m.demand} detail={m.trend} />
      </div>
      <Panel title={`${crop} / 7-period price trend`} label="INTERACTIVE">
        <div className="chart">
          <svg
            viewBox="0 0 700 200"
            role="img"
            aria-label={`${crop} price trend chart`}
          >
            <path
              d={`M ${m.history.map((v, i) => `${30 + i * 105},${170 - ((v - min) / (max - min)) * 140}`).join(" L ")}`}
              fill="none"
              stroke="#34874b"
              strokeWidth="4"
            />
            {m.history.map((v, i) => (
              <circle
                key={i}
                cx={30 + i * 105}
                cy={170 - ((v - min) / (max - min)) * 140}
                r="7"
                fill={point === i ? "#151914" : "#bced78"}
                stroke="#151914"
                tabIndex={0}
                role="button"
                aria-label={`Period ${i + 1}: ₹${v}`}
                onClick={() => setPoint(i)}
                onFocus={() => setPoint(i)}
                onMouseEnter={() => setPoint(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setPoint(i);
                }}
              >
                <title>{`Period ${i + 1}: ₹${v}`}</title>
              </circle>
            ))}
          </svg>
          <div className="chart-axis">
            {m.history.map((_, i) => (
              <span key={i}>PERIOD {i + 1}</span>
            ))}
          </div>
        </div>
        <p className="mono">
          {point === null
            ? "SELECT A CHART POINT TO INSPECT PRICE"
            : `PERIOD ${point + 1} / ₹${m.history[point]} PER QUINTAL`}
        </p>
        <button className="button" onClick={() => setCompare(!compare)}>
          {compare ? "HIDE COMPARISON" : "COMPARE MARKETS"}
        </button>
        {compare && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Price / quintal</th>
                  <th>Distance</th>
                </tr>
              </thead>
              <tbody>
                {m.markets.map((x) => (
                  <tr key={x.name}>
                    <td>{x.name}</td>
                    <td>₹{x.price}</td>
                    <td>{x.distance} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Panel title="Ask Jeevandhara / market advisor">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAnswer(marketService.recommend(crop));
          }}
        >
          <Field label="Market question">
            <input
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Where should I sell my ${crop.toLowerCase()}?`}
            />
          </Field>
          <button className="button green">ASK JEEVANDHARA</button>
        </form>
        {answer && (
          <div className="evidence">
            <Badge>DEMO RESULT</Badge>
            <p>{answer}</p>
            <button
              className="button"
              onClick={() =>
                explain({
                  title: "Market decision factors",
                  body: (
                    <p>
                      Markets are ranked by demo price minus an illustrative
                      distance cost proxy (₹7/km per quintal). Crop: {crop}.
                      Source: mock market data. These are fixed demo distances,
                      not calculated from your location.
                    </p>
                  ),
                })
              }
            >
              WHY?
            </button>
          </div>
        )}
      </Panel>
    </>
  );
}

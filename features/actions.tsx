"use client";
import { Localized } from "@/components/localization";
import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { Action } from "@/types";

import { Badge, Panel, Empty } from "@/components/ui";
export function ActionPlanner({
  actions,
  complete,
  snooze,
  explain,
}: {
  actions: Action[];
  complete: (a: Action) => void;
  snooze: (a: Action) => void;
  explain: (a: Action) => void;
}) {
  const [tab, setTab] = useState("NOW");
  const selected = actions.filter(
    (a) =>
      a.time === tab &&
      (a.status === "active" ||
        (a.status === "snoozed" && (a.snoozedUntil ?? 0) <= Date.now())),
  );
  return (
    <Localized>
      {
        <>
          <div className="tabs">
            {["NOW", "TODAY", "THIS WEEK"].map((t) => (
              <button
                className={tab === t ? "selected" : ""}
                key={t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="card-grid">
            {selected.map((a) => (
              <Panel key={a.id}>
                <Badge tone={a.priority === "HIGH" ? "yellow" : ""}>
                  {a.priority} PRIORITY
                </Badge>
                <h2>{a.title}</h2>
                <p>{a.reason}</p>
                <p className="mono">
                  {a.confidence}% CONFIDENCE / {a.time} / DEMO
                </p>
                <p className="muted">Source: {a.source}</p>
                <div className="button-row">
                  <button className="button green" onClick={() => complete(a)}>
                    <Check size={16} /> COMPLETE
                  </button>
                  <button className="button" onClick={() => snooze(a)}>
                    SNOOZE
                  </button>
                  <button className="text-link" onClick={() => explain(a)}>
                    WHY?
                  </button>
                </div>
              </Panel>
            ))}
          </div>
          {!selected.length && (
            <Empty>No pending actions in this period.</Empty>
          )}
          <Panel
            title="Completed action history"
            label={`${actions.filter((a) => a.status === "completed").length} COMPLETED`}
          >
            {actions
              .filter((a) => a.status === "completed")
              .map((a) => (
                <p key={a.id}>✓ {a.title}</p>
              ))}
            {!actions.some((a) => a.status === "completed") && (
              <Empty>Complete an action to add it to your history.</Empty>
            )}
          </Panel>
          <Panel title="Snoozed for 24 hours">
            {actions
              .filter(
                (a) =>
                  a.status === "snoozed" && (a.snoozedUntil ?? 0) > Date.now(),
              )
              .map((a) => (
                <p key={a.id}>
                  {a.title} · Returns{" "}
                  {new Date(a.snoozedUntil!).toLocaleString()}
                </p>
              ))}
            {!actions.some((a) => a.status === "snoozed") && (
              <Empty>No snoozed actions.</Empty>
            )}
          </Panel>
        </>
      }
    </Localized>
  );
}

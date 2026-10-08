"use client";
import { Localized } from "@/components/localization";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Bell, X } from "lucide-react";
import { AppState, Scheme } from "@/types";

import { Badge, Panel, Empty, Field } from "@/components/ui";
export function Notifications({
  state,
  update,
}: {
  state: AppState;
  update: (p: Partial<AppState>) => void;
}) {
  const [filter, setFilter] = useState("All");
  const notices = state.notifications.filter(
    (n) => filter === "All" || n.type === filter,
  );
  return (
    <Localized>
      {
        <Panel
          title="Notification center"
          label={`${state.notifications.filter((n) => !n.read).length} UNREAD`}
        >
          <div className="toolbar">
            <Field label="Filter notifications">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {[
                  "All",
                  "Weather",
                  "Crop Health",
                  "Scheme",
                  "Market",
                  "Threat",
                  "System",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <button
              className="button"
              onClick={() =>
                update({
                  notifications: state.notifications.map((n) => ({
                    ...n,
                    read: true,
                  })),
                })
              }
            >
              Mark all as read
            </button>
            <button
              className="button"
              onClick={() => update({ notifications: [] })}
            >
              Clear all
            </button>
          </div>
          {notices.map((n) => (
            <div className={`notice ${n.read ? "read" : ""}`} key={n.id}>
              <Bell size={18} />
              <div>
                <Badge>{n.type}</Badge>
                <Link
                  href={n.route}
                  onClick={() =>
                    update({
                      notifications: state.notifications.map((x) =>
                        x.id === n.id ? { ...x, read: true } : x,
                      ),
                    })
                  }
                >
                  <h3>
                    {n.title} <ArrowUpRight size={15} />
                  </h3>
                </Link>
                <span className="mono">
                  {n.read ? "READ" : "UNREAD"} / DEMO
                </span>
              </div>
              <button
                className="text-link"
                disabled={n.read}
                onClick={() =>
                  update({
                    notifications: state.notifications.map((x) =>
                      x.id === n.id ? { ...x, read: true } : x,
                    ),
                  })
                }
              >
                Mark read
              </button>
              <button
                className="icon-button"
                aria-label={`Clear ${n.title}`}
                onClick={() =>
                  update({
                    notifications: state.notifications.filter(
                      (x) => x.id !== n.id,
                    ),
                  })
                }
              >
                <X size={17} />
              </button>
            </div>
          ))}
          {!notices.length && <Empty>No notifications in this view.</Empty>}
        </Panel>
      }
    </Localized>
  );
}

"use client";
import { Localized } from "@/components/localization";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { AppState } from "@/types";
import { notificationService, iotService, threatService } from "@/services";
import { Badge, Panel, Empty, Stat } from "@/components/ui";
export function Threats({
  state,
  update,
  notify,
}: {
  state: AppState;
  update: (p: Partial<AppState>) => void;
  notify: (s: string) => void;
}) {
  const [live, setLive] = useState(false);
  const [tick, setTick] = useState(0);
  const [timestamp, setTimestamp] = useState("Not started");
  useEffect(() => {
    if (!live) return;
    setTimestamp(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setTick((t) => t + 1);
      setTimestamp(new Date().toLocaleTimeString());
    }, 2500);
    return () => clearInterval(timer);
  }, [live]);
  const sensors = iotService.getSensorData(tick);
  const active = state.events.filter((e) => !e.acknowledged);
  return (
    <Localized>
      {
        <>
          <div className="toolbar">
            <Badge tone="yellow">
              SIMULATION MODE / NO PHYSICAL DEVICES CONNECTED
            </Badge>
            <label className="toggle-row">
              Live simulation{" "}
              <input
                type="checkbox"
                checked={live}
                onChange={(e) => setLive(e.target.checked)}
              />
            </label>
            <button
              className="button dark"
              onClick={() => {
                const event = threatService.simulateEvent();
                update({
                  events: [event, ...state.events],
                  notifications: [
                    notificationService.create(
                      "Possible intrusion: review simulated alert",
                      "Threat",
                      "/threats",
                    ),
                    ...state.notifications,
                  ],
                });
                notify("Simulated event generated. Review the timeline.");
              }}
            >
              SIMULATE EVENT
            </button>
          </div>
          <div className="stats-grid">
            <Stat
              label="TEMPERATURE"
              value={`${sensors.temperature}°C`}
              detail={`Updated: ${timestamp}`}
            />
            <Stat
              label="HUMIDITY"
              value={`${sensors.humidity}%`}
              detail="DHT22 simulation"
            />
            <Stat
              label="SOIL MOISTURE"
              value={`${sensors.moisture}%`}
              detail="Root-zone sensor simulation"
            />
            <Stat
              label="EVENT STATE"
              value={
                active.length
                  ? "ALERT"
                  : sensors.pir === "MOTION"
                    ? "WATCH"
                    : "NORMAL"
              }
              detail={`PIR: ${sensors.pir} · Radar: ${sensors.radar}`}
            />
          </div>
          <Panel title="Device registry" label="7 SIMULATED DEVICES">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Status</th>
                    <th>Signal</th>
                    <th>Battery</th>
                    <th>Last reading</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {threatService.getSensorStatus().map((d, i) => (
                    <tr key={d.name}>
                      <td>{d.name}</td>
                      <td>
                        <Badge
                          tone={d.status === "ONLINE" ? "green" : "yellow"}
                        >
                          {d.status}
                        </Badge>
                      </td>
                      <td>{d.status === "OFFLINE" ? "—" : `${d.signal}%`}</td>
                      <td>{d.battery}%</td>
                      <td>
                        {i === 1
                          ? sensors.pir
                          : i === 3
                            ? `${sensors.moisture}%`
                            : i === 4
                              ? `${sensors.temperature}°C / ${sensors.humidity}%`
                              : i === 5
                                ? sensors.radar
                                : d.reading}
                      </td>
                      <td>{timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title="Active alerts" label={`${active.length} ACTIVE`}>
            {active.length ? (
              active.map((event) => (
                <div className="event" key={event.id}>
                  <Badge tone="yellow">{event.state} · SIMULATED</Badge>
                  <p>{new Date(event.time).toLocaleString()}</p>
                  <ol>
                    {event.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  <button
                    className="button"
                    onClick={() => {
                      update({
                        events: state.events.map((e) =>
                          e.id === event.id
                            ? { ...e, acknowledged: true, state: "NORMAL" }
                            : e,
                        ),
                      });
                      notify("Alert acknowledged and moved to history.");
                    }}
                  >
                    ACKNOWLEDGE ALERT
                  </button>
                </div>
              ))
            ) : (
              <Empty>
                No active alerts. Simulate an event to test the full alert flow.
              </Empty>
            )}
          </Panel>
          <Panel title="Event history">
            {state.events
              .filter((e) => e.acknowledged)
              .map((e) => (
                <p key={e.id}>
                  <Check size={15} /> Acknowledged ·{" "}
                  {new Date(e.time).toLocaleString()} · NORMAL
                </p>
              ))}
            {!state.events.some((e) => e.acknowledged) && (
              <Empty>Acknowledged alerts will appear here.</Empty>
            )}
          </Panel>
        </>
      }
    </Localized>
  );
}

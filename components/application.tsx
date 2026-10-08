"use client";
import { ModuleScope } from "@/components/module-scope";
import { LocaleProvider, Localized } from "@/components/localization";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Activity,
  Leaf,
  Mic,
  LayoutDashboard,
  Tractor,
  Landmark,
  ScanLine,
  ChartNoAxesCombined,
  CloudRain,
  ShieldAlert,
  ListChecks,
  BookOpen,
  Bell,
  Settings,
  Server,
  Menu,
  X,
  Check,
  Volume2,
} from "lucide-react";
import { AppState, Farm, Action } from "@/types";
import { demoState } from "@/data/demo";
import { storage } from "@/lib/storage";
import { languages, translate } from "@/lib/i18n";
import {
  farmerService,
  weatherService,
  marketService,
  schemeService,
  actionPlannerService,
  notificationService,
  iotService,
  systemService,
} from "@/services";
import { Badge, Panel, Empty, Field, Stat } from "@/components/ui";
import { FarmForm } from "@/features/farm";
import { Voice } from "@/features/voice";
import { Schemes } from "@/features/schemes";
import { CropHealth } from "@/features/crop-health";
import { Market } from "@/features/market";
import { Threats } from "@/features/threats";
import { ActionPlanner } from "@/features/actions";
import { Knowledge } from "@/features/knowledge";
import { Notifications } from "@/features/notifications";
const navigation = [
  ["dashboard", "Overview", "ಅವಲೋಕನ", LayoutDashboard],
  ["voice", "Voice AI", "ಧ್ವನಿ AI", Mic],
  ["farm", "My farm", "ನನ್ನ ಕೃಷಿ", Tractor],
  ["schemes", "Government schemes", "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು", Landmark],
  ["crop-health", "Crop health", "ಬೆಳೆ ಆರೋಗ್ಯ", ScanLine],
  ["market", "Market intelligence", "ಮಾರುಕಟ್ಟೆ", ChartNoAxesCombined],
  ["weather", "Weather intelligence", "ಹವಾಮಾನ", CloudRain],
  ["threats", "Threat monitor", "ಅಪಾಯ ಮೇಲ್ವಿಚಾರಣೆ", ShieldAlert],
  ["actions", "Action planner", "ಕಾರ್ಯ ಯೋಜನೆ", ListChecks],
  ["knowledge", "Knowledge library", "ಜ್ಞಾನ ಭಂಡಾರ", BookOpen],
] as const;
export function Application({ module }: { module: string }) {
  const [state, setState] = useState<AppState>(structuredClone(demoState));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState<{
    title: string;
    body: React.ReactNode;
  } | null>(null);
  useEffect(() => {
    try {
      setState(storage.load());
    } catch (e) {
      setError((e as Error).message);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        storage.save(state);
      } catch {
        setError(
          "Unable to save locally. Browser storage may be full or disabled.",
        );
      }
  }, [state, ready]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    if (!modal) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [modal]);
  const update = (patch: Partial<AppState>) =>
    setState((prev) => ({ ...prev, ...patch }));
  const notify = (message: string) => setToast(message);
  const addAction = (title: string, reason: string) => {
    setState((prev) => ({
      ...prev,
      actions: [...prev.actions, actionPlannerService.create(title, reason)],
      notifications: [
        notificationService.create(
          "New farm action created",
          "System",
          "/actions",
        ),
        ...prev.notifications,
      ],
    }));
    notify("Action added to your planner.");
  };
  const loadDemo = () => {
    try {
      setState(storage.reset());
      setError("");
      notify("Demo farm loaded. All demo records reset.");
    } catch {
      setError("Cannot reset browser storage.");
    }
  };
  const farm = state.farm,
    weather = weatherService.getForecast(farm),
    market = marketService.getPrices(farm.crop);
  const t = (text: string, kannada?: string) =>
    translate(farm.language, text, kannada);
  useEffect(() => {
    document.documentElement.lang = farm.language;
  }, [farm.language]);
  const generated = actionPlannerService.generateActions(farm);
  const actions = [
    ...generated.map((a) =>
      state.actions.find((x) => x.id === a.id)
        ? { ...a, ...state.actions.find((x) => x.id === a.id) }
        : a,
    ),
    ...state.actions.filter((a) => !generated.some((g) => g.id === a.id)),
  ];
  const active = actions.filter(
    (a) =>
      a.status === "active" ||
      (a.status === "snoozed" && (a.snoozedUntil ?? 0) <= Date.now()),
  );
  const setAction = (action: Action, status: Action["status"]) => {
    const next = {
      ...action,
      status,
      ...(status === "snoozed" ? { snoozedUntil: Date.now() + 86400000 } : {}),
    };
    update({
      actions: [...state.actions.filter((a) => a.id !== action.id), next],
    });
    notify(
      status === "completed"
        ? "Action completed and moved to history."
        : "Action snoozed for 24 hours.",
    );
  };
  const explain = (a: Action) =>
    setModal({
      title: "Decision factors",
      body: (
        <>
          <p>{a.reason}</p>
          <div className="evidence">
            <strong>{a.confidence}% confidence · DEMO RESULT</strong>
            <p>Evidence used: {a.source}</p>
            <Link href="/knowledge">Explore evidence library →</Link>
          </div>
        </>
      ),
    });
  if (module === "landing")
    return (
      <LocaleProvider language={farm.language}>
        <Localized>
          {
            <main className="landing">
              <header className="landing-header">
                <Link href="/" className="logo">
                  <Leaf /> JEEVANDHARA<span>AGRICULTURAL INTELLIGENCE</span>
                </Link>
                <Badge tone="green">INTERACTIVE DEMO</Badge>
                <Link href="/dashboard" className="button dark">
                  Enter platform <ArrowUpRight size={17} />
                </Link>
              </header>
              <section className="hero">
                <div>
                  <p className="eyebrow">
                    VOICE-FIRST AGRICULTURAL INTELLIGENCE
                  </p>
                  <h1>
                    Speak to your farm.
                    <br />
                    <span>
                      Let intelligence
                      <br />
                      do the rest.
                    </span>
                  </h1>
                  <p className="hero-copy">
                    Jeevandhara connects farmers to agricultural knowledge,
                    government schemes, crop intelligence, markets, weather and
                    farm monitoring through a voice-first AI platform.
                  </p>
                  <div className="button-row">
                    <Link className="button green" href="/dashboard">
                      ENTER JEEVANDHARA <ArrowUpRight size={20} />
                    </Link>
                    <a className="button" href="#architecture">
                      SEE HOW IT WORKS ↓
                    </a>
                  </div>
                  <p className="mono">
                    NO LOGIN REQUIRED / HINDI + ENGLISH + KANNADA / DEMO MODE
                  </p>
                </div>
                <div className="hero-diagram">
                  <span className="mono">JEEVANDHARA / FIELD INTELLIGENCE</span>
                  <div className="field-art">
                    <div className="sun" />
                    <div className="rows" />
                    <div className="art-label">
                      13°17′ N · 77°32′ E<br />
                      BENGALURU RURAL
                    </div>
                    <div className="art-status">
                      <Activity size={18} /> FARM SIGNAL CONNECTED · DEMO
                    </div>
                  </div>
                  <div className="hero-data">
                    <span>01 / UNDERSTAND</span>
                    <span>02 / DECIDE</span>
                    <span>03 / ACT</span>
                  </div>
                </div>
              </section>
              <section id="architecture" className="architecture">
                <p className="eyebrow">ONE FARM. ONE CONNECTED SYSTEM.</p>
                <h2>From your voice to your next action.</h2>
                <div className="architecture-flow">
                  {[
                    "Farmer voice",
                    "Speech understanding",
                    "Agricultural intent",
                    "Farmer context",
                    "AI services",
                    "Decision",
                    "Action",
                  ].map((s, i) => (
                    <div key={s}>
                      <span className="mono">0{i + 1}</span>
                      <strong>{s}</strong>
                      <ArrowRight size={20} />
                    </div>
                  ))}
                </div>
                <p>
                  Working demo services, shared farmer context, transparent
                  decision factors. Ready for future AI and hardware
                  integration.
                </p>
                <Link href="/dashboard" className="button dark">
                  Explore the command center <ArrowUpRight size={16} />
                </Link>
              </section>
              <footer>
                JEEVANDHARA{" "}
                <span>Built around the farmer. Powered by context.</span>
              </footer>
            </main>
          }
        </Localized>
      </LocaleProvider>
    );
  const title =
    navigation.find((n) => n[0] === module)?.[1] ??
    (
      {
        context: "Farmer context",
        notifications: "Notifications",
        settings: "Settings",
        system: "System status",
      } as Record<string, string>
    )[module] ??
    module;
  return (
    <LocaleProvider language={farm.language}>
      <Localized>
        {
          <div className={`app ${state.settings.compact ? "compact" : ""}`}>
            <aside className={`sidebar ${menu ? "open" : ""}`}>
              <Link href="/" className="logo">
                <Leaf size={26} /> JEEVANDHARA
              </Link>
              <button
                className="mobile-close"
                onClick={() => setMenu(false)}
                aria-label="Close navigation"
              >
                <X />
              </button>
              <nav>
                {navigation.map(([path, en, ka, Icon]) => (
                  <Link
                    key={path}
                    href={`/${path}`}
                    className={module === path ? "active" : ""}
                  >
                    <Icon size={18} />
                    {t(en, ka)}
                    {module === path && <span className="nav-dot" />}
                  </Link>
                ))}
              </nav>
              <div className="nav-bottom">
                {[
                  ["context", "Farmer context", Activity],
                  ["system", "System status", Server],
                  ["settings", "Settings", Settings],
                ].map(([path, label, Icon]) => {
                  const I = Icon as typeof Activity;
                  return (
                    <Link key={path as string} href={`/${path}`}>
                      <I size={17} />
                      {t(label as string)}
                    </Link>
                  );
                })}
                <div className="sidebar-note">
                  <button onClick={loadDemo}>↻ Load demo farm</button>
                </div>
              </div>
            </aside>
            {menu && (
              <button
                className="scrim"
                onClick={() => setMenu(false)}
                aria-label="Close navigation overlay"
              />
            )}
            <div className="main-shell">
              <header className="topbar">
                <button
                  className="menu-toggle"
                  onClick={() => setMenu(true)}
                  aria-label="Open navigation"
                >
                  <Menu />
                </button>
                <div className="breadcrumb">
                  <strong>
                    {t(title, navigation.find((n) => n[0] === module)?.[2])}
                  </strong>
                </div>
                <div className="topbar-right">
                  <Badge tone="green">● {t("DEMO MODE")}</Badge>
                  <select
                    aria-label="Language"
                    value={farm.language}
                    onChange={(e) =>
                      update({
                        farm: {
                          ...farm,
                          language: e.target.value as Farm["language"],
                        },
                      })
                    }
                  >
                    {languages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <Link
                    className="notification-link"
                    href="/notifications"
                    aria-label="Notifications"
                  >
                    <Bell size={19} />
                    {state.notifications.filter((n) => !n.read).length > 0 && (
                      <i />
                    )}
                  </Link>
                  <Link
                    href="/farm"
                    className="avatar"
                    data-preserve-text
                    aria-label="Farmer profile"
                  >
                    {farm.name.slice(0, 1).toUpperCase()}
                  </Link>
                </div>
              </header>
              <main className="content">
                {!ready && <p role="status">Loading farm workspace…</p>}
                {error && (
                  <div className="error" role="alert">
                    {error}
                    <button
                      onClick={() => setError("")}
                      aria-label="Dismiss error"
                    >
                      ×
                    </button>
                  </div>
                )}
                <div className="page-header">
                  <div>
                    <h1>
                      {module === "dashboard"
                        ? farm.language === "hi"
                          ? `नमस्ते, ${farm.name}।`
                          : farm.language === "kn"
                            ? `ನಮಸ್ಕಾರ, ${farm.name}.`
                            : `Good to grow, ${farm.name}.`
                        : t(
                            title,
                            navigation.find((n) => n[0] === module)?.[2],
                          )}
                    </h1>
                  </div>
                </div>
                {module === "dashboard" && (
                  <>
                    <div className="farm-strip">
                      <span>
                        <Tractor size={18} />
                        {farm.location}
                      </span>
                      <span>{farm.size} ACRES</span>
                      <span>
                        {farm.crop.toUpperCase()} / {farm.stage.toUpperCase()}
                      </span>
                      <Link href="/farm">
                        Edit farm <ArrowUpRight size={14} />
                      </Link>
                    </div>
                    <div className="stats-grid">
                      <Stat
                        label={t("CURRENT CROP", "ಪ್ರಸ್ತುತ ಬೆಳೆ")}
                        value={farm.crop}
                        detail={`${farm.variety} · ${farm.stage}`}
                        icon={<Leaf />}
                      />
                      <Stat
                        label={t("WEATHER NOW", "ಹವಾಮಾನ")}
                        value={`${weather.temperature}°C`}
                        detail={`${weather.rain}% rain probability`}
                        icon={<CloudRain />}
                      />
                      <Stat
                        label={t("MARKET PRICE / QUINTAL")}
                        value={`₹${market.price.toLocaleString("en-IN")}`}
                        detail={`↑ ₹180 from previous · ${farm.crop}`}
                        icon={<ChartNoAxesCombined />}
                      />
                      <Stat
                        label={t("FARM STATUS")}
                        value={
                          state.events.some((e) => !e.acknowledged)
                            ? t("Alert")
                            : t("Healthy")
                        }
                        detail={`${iotService.getDevices().filter((d) => d.status === "ONLINE").length}/7 simulated devices online`}
                        icon={<ShieldAlert />}
                      />
                    </div>
                    <div className="dashboard-grid">
                      <Panel className="ask-panel">
                        <div>
                          <h2>{t("Ask Jeevandhara.", "ಜೀವನಧಾರವನ್ನು ಕೇಳಿ")}</h2>
                          <p>
                            {t("Speak naturally in Hindi, English or Kannada.")}
                            <br />
                            {t("Your farm context does the rest.")}
                          </p>
                          <div className="button-row">
                            <Link
                              href="/voice?start=1"
                              className="button green"
                            >
                              <Mic size={17} />{" "}
                              {t("START SPEAKING", "ಮಾತನಾಡಲು ಪ್ರಾರಂಭಿಸಿ")}
                            </Link>
                            <Link href="/voice" className="text-link">
                              {t("Type a question")} <ArrowUpRight size={15} />
                            </Link>
                          </div>
                        </div>
                        <Link
                          href="/voice?start=1"
                          className="mic-orbit"
                          aria-label="Start speaking"
                        >
                          <Mic size={38} />
                          <span>{t("ASK YOUR FARM")}</span>
                        </Link>
                      </Panel>
                      <Panel title={t("Your farm at a glance")} label="CONTEXT">
                        <dl className="farm-details">
                          {[
                            ["Location", farm.location],
                            ["Crop", farm.crop],
                            ["Farm size", `${farm.size} acres`],
                            ["Irrigation", farm.irrigation],
                            ["Soil", farm.soil],
                          ].map(([k, v]) => (
                            <div key={k}>
                              <dt>{t(k)}</dt>
                              <dd>{v}</dd>
                            </div>
                          ))}
                        </dl>
                        <Link href="/context" className="panel-link">
                          {t("Explore farmer context")}{" "}
                          <ArrowUpRight size={16} />
                        </Link>
                      </Panel>
                    </div>
                    <div className="dashboard-grid lower">
                      <Panel
                        title={t("Your next actions", "ನಿಮ್ಮ ಮುಂದಿನ ಕಾರ್ಯಗಳು")}
                        label={`${active.length} PENDING`}
                      >
                        {active.slice(0, 3).map((a) => (
                          <div className="action-row" key={a.id}>
                            <span
                              className={`priority-line ${a.priority.toLowerCase()}`}
                            />
                            <div>
                              <Badge
                                tone={a.priority === "HIGH" ? "yellow" : ""}
                              >
                                {a.priority}
                              </Badge>
                              <h3>{a.title}</h3>
                              <p>
                                {a.source} · {a.time}
                              </p>
                            </div>
                            <button
                              className="icon-button"
                              onClick={() => explain(a)}
                              aria-label={`Why ${a.title}`}
                            >
                              <ArrowUpRight size={18} />
                            </button>
                          </div>
                        ))}
                        <Link href="/actions" className="panel-link">
                          {t("Open action planner")} <ArrowRight size={16} />
                        </Link>
                      </Panel>
                      <Panel title={t("Field signals")} label="SIMULATION">
                        <div className="weather-signal">
                          <CloudRain size={38} />
                          <div>
                            <span className="mono">
                              {t("WEATHER ADVISORY")}
                            </span>
                            <h3>{t("Rain is on the horizon.")}</h3>
                          </div>
                          <Badge tone="yellow">WATCH</Badge>
                        </div>
                        <p className="signal-copy">{weather.recommendation}</p>
                        <div className="mini-readings">
                          <div>
                            <span>{t("RAIN PROBABILITY")}</span>
                            <strong>{weather.rain}%</strong>
                          </div>
                          <div>
                            <span>{t("SOIL MOISTURE")}</span>
                            <strong>42%</strong>
                          </div>
                        </div>
                        <Link href="/weather" className="panel-link">
                          {t("View weather intelligence")}{" "}
                          <ArrowUpRight size={16} />
                        </Link>
                        <div className="signal-footer">
                          <span className="status-dot" /> IoT gateway in
                          simulation mode{" "}
                          <Link href="/threats">View sensors →</Link>
                        </div>
                      </Panel>
                    </div>
                    <div className="bottom-note">
                      <span>
                        <Activity size={15} /> SHARED FARM CONTEXT ACTIVE
                      </span>
                      <span>
                        Demo results are illustrative. Verify real-world
                        decisions with local experts.
                      </span>
                    </div>
                  </>
                )}
                {module === "farm" && (
                  <FarmForm
                    farm={farm}
                    save={(f) => {
                      try {
                        farmerService.validate(f);
                        update({ farm: f });
                        notify(
                          "Farm saved. All modules now use your updated context.",
                        );
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  />
                )}
                {module === "voice" && (
                  <Voice
                    farm={farm}
                    spoken={state.settings.spokenResponses}
                    record={(q) =>
                      setState((prev) => ({
                        ...prev,
                        interactions: [q, ...prev.interactions].slice(0, 20),
                      }))
                    }
                    addAction={addAction}
                  />
                )}
                {module === "schemes" && (
                  <Schemes farm={farm} explain={setModal} />
                )}
                {module === "crop-health" && (
                  <CropHealth farm={farm} addAction={addAction} />
                )}
                {module === "market" && (
                  <Market farm={farm} explain={setModal} />
                )}
                {module === "weather" && (
                  <>
                    <div className="info-banner">
                      MOCK FORECAST / Generated for {farm.location}; no live
                      weather connection.
                    </div>
                    <div className="stats-grid">
                      <Stat
                        label="TEMPERATURE"
                        value={`${weather.temperature}°C`}
                        detail={farm.location}
                      />
                      <Stat
                        label="HUMIDITY"
                        value={`${weather.humidity}%`}
                        detail="Simulated relative humidity"
                      />
                      <Stat
                        label="RAIN PROBABILITY"
                        value={`${weather.rain}%`}
                        detail="Illustrative next 24 hours"
                      />
                      <Stat
                        label="WIND"
                        value={`${weather.wind} km/h`}
                        detail="Simulated wind speed"
                      />
                    </div>
                    <Panel title="7-day forecast" label="MOCK DATA">
                      <div className="forecast">
                        {weather.days.map((d) => (
                          <div key={d.day}>
                            <span>{d.day}</span>
                            <CloudRain />
                            <strong>{d.temp}°C</strong>
                            <small>{d.rain}% rain</small>
                          </div>
                        ))}
                      </div>
                    </Panel>
                    <Panel
                      title="Turn the forecast into action"
                      label="AI ASSISTED"
                    >
                      <h3>{weather.recommendation}</h3>
                      <p>
                        {farm.crop} · {farm.soil} · {farm.irrigation} irrigation
                      </p>
                      <div className="button-row">
                        <button
                          className="button green"
                          onClick={() =>
                            addAction(
                              "Check drainage before rain",
                              `${weather.rain}% demo rain probability in ${farm.location}.`,
                            )
                          }
                        >
                          Create action
                        </button>
                        <button
                          onClick={() => explain(generated[0])}
                          className="button"
                        >
                          Why?
                        </button>
                      </div>
                    </Panel>
                  </>
                )}
                {module === "threats" && (
                  <Threats state={state} update={update} notify={notify} />
                )}
                {module === "actions" && (
                  <ActionPlanner
                    actions={actions}
                    complete={(a) => setAction(a, "completed")}
                    snooze={(a) => setAction(a, "snoozed")}
                    explain={explain}
                  />
                )}
                {module === "knowledge" && <Knowledge explain={setModal} />}
                {module === "notifications" && (
                  <Notifications state={state} update={update} />
                )}
                {module === "context" && (
                  <>
                    <Panel title="Shared farmer context" label="LOCAL">
                      <div className="context-flow">
                        {[
                          "FARMER",
                          "FARM",
                          "CROP",
                          "WEATHER",
                          "MARKET",
                          "SCHEMES",
                          "ACTIONS",
                        ].map((s, i) => (
                          <div key={s}>
                            <span className="mono">
                              0{i + 1} / {s}
                            </span>
                            <strong>
                              {
                                [
                                  farm.name,
                                  `${farm.size} acres · ${farm.location}`,
                                  farm.crop,
                                  `${weather.rain}% rain`,
                                  `₹${market.price}/quintal`,
                                  `${schemeService.getSchemes().length} demo schemes`,
                                  `${active.length} active actions`,
                                ][i]
                              }
                            </strong>
                          </div>
                        ))}
                      </div>
                      <Link href="/farm" className="button">
                        Edit shared farm profile <ArrowUpRight size={16} />
                      </Link>
                    </Panel>
                    <Panel title="Previous interactions" label="LOCAL HISTORY">
                      {state.interactions.length ? (
                        state.interactions.map((q, i) => (
                          <p key={i} data-preserve-text>
                            {q}
                          </p>
                        ))
                      ) : (
                        <Empty>
                          No questions yet. Ask Jeevandhara to build your
                          interaction history.
                        </Empty>
                      )}
                    </Panel>
                    <Panel title="Known vocabulary">
                      <p>
                        Crop: {farm.crop} · Variety: {farm.variety} · Soil:{" "}
                        {farm.soil} · Irrigation: {farm.irrigation} · Language:{" "}
                        {languages.find((l) => l.code === farm.language)?.label}
                      </p>
                    </Panel>
                  </>
                )}
                {module === "settings" && (
                  <Panel title="Workspace preferences" label="SAVED LOCALLY">
                    <Field label="Preferred language">
                      <select
                        value={farm.language}
                        onChange={(e) =>
                          update({
                            farm: {
                              ...farm,
                              language: e.target.value as Farm["language"],
                            },
                          })
                        }
                      >
                        {languages.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <label className="toggle-row">
                      <span>
                        <Volume2 size={18} /> Speak voice responses using
                        browser synthesis
                      </span>
                      <input
                        type="checkbox"
                        checked={state.settings.spokenResponses}
                        onChange={(e) =>
                          update({
                            settings: {
                              ...state.settings,
                              spokenResponses: e.target.checked,
                            },
                          })
                        }
                      />
                    </label>
                    <label className="toggle-row">
                      <span>Compact dashboard spacing</span>
                      <input
                        type="checkbox"
                        checked={state.settings.compact}
                        onChange={(e) =>
                          update({
                            settings: {
                              ...state.settings,
                              compact: e.target.checked,
                            },
                          })
                        }
                      />
                    </label>
                    <button
                      className="button"
                      onClick={() =>
                        setModal({
                          title: "Reset demo workspace?",
                          body: (
                            <>
                              <p>
                                This resets your saved farm, actions, alerts,
                                settings and notifications to the demo defaults.
                              </p>
                              <button
                                className="button green"
                                onClick={() => {
                                  loadDemo();
                                  setModal(null);
                                }}
                              >
                                Load demo farm
                              </button>
                            </>
                          ),
                        })
                      }
                    >
                      Load demo farm
                    </button>
                    <p className="muted">
                      No external API keys required. Your profile stays in this
                      browser.
                    </p>
                  </Panel>
                )}
                {module === "system" && (
                  <>
                    <div className="info-banner">
                      No external AI models, government feeds or physical
                      hardware are connected.
                    </div>
                    <Panel title="Service health" label="DEMO ARCHITECTURE">
                      <div className="service-grid">
                        {systemService.getStatus().map((s) => (
                          <div key={s.name}>
                            <Activity size={20} />
                            <h3>{s.name}</h3>
                            <Badge tone="green">{s.status}</Badge>
                            <p>
                              {s.status === "LOCAL"
                                ? "Browser context and storage"
                                : s.status === "SIMULATION"
                                  ? "Generated sensor readings"
                                  : "Replaceable mock implementation"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  </>
                )}
                <ModuleScope module={module} />
              </main>
              <footer className="app-footer">
                <Link href="/system">System status ↗</Link>
              </footer>
            </div>
            <nav className="mobile-nav">
              <Link href="/dashboard">
                <LayoutDashboard size={20} />
                {t("Home")}
              </Link>
              <Link href="/voice">
                <Mic size={20} />
                {t("Voice")}
              </Link>
              <Link href="/farm">
                <Tractor size={20} />
                {t("Farm")}
              </Link>
              <Link href="/actions">
                <ListChecks size={20} />
                {t("Actions")}
              </Link>
              <button onClick={() => setMenu(true)}>
                <Menu size={20} />
                {t("More")}
              </button>
            </nav>
            {toast && (
              <div role="status" className="toast">
                <Check size={18} />
                {toast}
              </div>
            )}
            {modal && (
              <div className="modal-backdrop" onClick={() => setModal(null)}>
                <section
                  className="modal"
                  role="dialog"
                  aria-modal="true"
                  aria-label={modal.title}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="panel-heading">
                    <h2>{modal.title}</h2>
                    <button
                      autoFocus
                      onClick={() => setModal(null)}
                      aria-label="Close dialog"
                    >
                      <X />
                    </button>
                  </div>
                  {modal.body}
                </section>
              </div>
            )}
          </div>
        }
      </Localized>
    </LocaleProvider>
  );
}

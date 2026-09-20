import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Clock3,
  Globe2,
  Laptop,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  Send,
  Server,
  ShieldCheck,
  ShieldX,
  SkipForward,
  UnlockKeyhole,
  Wifi,
  X,
} from "lucide-react";
import {
  DNS_RECORDS,
  NETWORK_EDGES,
  PACKET_EVENTS,
  playbackTime,
  dnsLookup,
  edgeKey,
  reassemble,
  securityOutcome,
  shortestPath,
  splitMessage,
  transferAt,
  transferModel,
} from "./simulation";
import type { DemoDomain, DnsStation, NetworkNode } from "./simulation";
import { usePresentationEntry, usePresentationSteps } from "./presentation";
import "./labs.css";

export type LabId =
  "routing" | "dns" | "packets" | "speed" | "security" | "recap";
type LabProps = { id: LabId; motion: boolean };

/** Playback follows an elapsed monotonic clock; no assumptions about frame rate. */
function useClock(duration: number, rate = 1, enabled = true, initialTime = 0) {
  const [time, setTime] = useState(() =>
    Math.max(0, Math.min(duration, initialTime)),
  );
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);
  const [previousEnabled, setPreviousEnabled] = useState(enabled);
  const current = useRef(time);
  if (previousEnabled !== enabled) {
    setPreviousEnabled(enabled);
    if (!enabled) setPlaying(false);
  }
  useEffect(() => {
    if (!playing || !enabled) return;
    let started: number | undefined;
    const initial = current.current;
    let frame = 0;
    const tick = (now: number) => {
      // RAF's timestamp marks the frame start, which may predate effect setup.
      // Use the same frame clock for both endpoints rather than mixing clocks.
      started ??= now;
      const value = playbackTime(initial, now - started, duration, rate);
      current.current = value;
      setTime(value);
      if (value < duration) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, duration, rate, enabled, run]);
  function seek(value: number, limit = duration) {
    setPlaying(false);
    current.current = Math.max(0, Math.min(limit, value));
    setTime(current.current);
  }
  function toggle() {
    if (current.current >= duration) {
      current.current = 0;
      setTime(0);
    }
    setPlaying((value) => !value);
  }
  function start() {
    current.current = 0;
    setTime(0);
    setRun((value) => value + 1);
    setPlaying(true);
  }
  return { time, playing, seek, toggle, start };
}

function LabHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="lab-heading">
      <span className="lab-eyebrow">{label}</span>
      <h3>{title}</h3>
    </div>
  );
}
function ResetButton({
  onClick,
  label = "Эхнээс нь",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button className="lab-button lab-button-quiet" onClick={onClick}>
      <RotateCcw size={15} />
      {label}
    </button>
  );
}
function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="lab-note">
      <CircleHelp size={14} />
      <span>{children}</span>
    </p>
  );
}

const NODE_POINTS: Record<NetworkNode, [number, number]> = {
  A: [60, 155],
  B: [220, 65],
  C: [220, 245],
  D: [385, 65],
  E: [385, 245],
  F: [545, 155],
};
function RoutingLab({ motion }: { motion: boolean }) {
  const entry = usePresentationEntry();
  const [disabled, setDisabled] = useState<Set<string>>(
    () => new Set(entry === "end" ? ["B-D", "A-B", "A-C"] : []),
  );
  const path = shortestPath(NETWORK_EDGES, disabled);
  const hops = Math.max(0, path.length - 1);
  const clock = useClock(hops, 1.6, motion);
  const [sent, setSent] = useState(false);
  const routeEdges = new Set(
    path.slice(1).map((node, i) => edgeKey(path[i], node)),
  );
  const arrived = sent && clock.time >= hops && hops > 0;
  const currentHop = Math.min(Math.floor(clock.time), Math.max(0, hops - 1));
  const fraction = clock.time - currentHop;
  const from = NODE_POINTS[path[currentHop] ?? "A"];
  const to = NODE_POINTS[path[currentHop + 1] ?? "A"];
  const packet = [
    from[0] + (to[0] - from[0]) * fraction,
    from[1] + (to[1] - from[1]) * fraction,
  ];
  function changeEdge(a: NetworkNode, b: NetworkNode) {
    const key = edgeKey(a, b);
    setDisabled((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    clock.seek(0);
    setSent(false);
  }
  function send() {
    setSent(true);
    if (motion) clock.toggle();
    else clock.seek(hops);
  }
  const rerouted = path.join("-") !== "A-B-D-F";
  const cue = !path.length ? 4 : rerouted ? (sent ? 3 : 2) : sent ? 1 : 0;
  function showCue(next: number) {
    const cuts = new Set(
      next === 4 ? ["B-D", "A-B", "A-C"] : next >= 2 ? ["B-D"] : [],
    );
    const nextHops = Math.max(0, shortestPath(NETWORK_EDGES, cuts).length - 1);
    const delivered = next === 1 || next === 3;
    setDisabled(cuts);
    setSent(delivered);
    clock.seek(delivered ? nextHops : 0, nextHops);
  }
  function advanceCue() {
    if (cue === 0 || cue === 2) {
      setSent(true);
      if (motion) clock.start();
      else clock.seek(hops);
      return;
    }
    const cuts = new Set(disabled);
    if (cue === 1) cuts.add("B-D");
    else if (cue === 3) {
      cuts.add("A-B");
      cuts.add("A-C");
    }
    setDisabled(cuts);
    setSent(false);
    clock.seek(0);
  }
  usePresentationSteps({
    step: cue,
    total: 4,
    label: [
      "Үндсэн зам",
      arrived ? "Үндсэн замаар хүрлээ" : "Үндсэн замаар илгээж байна",
      "Нөөц зам",
      arrived ? "Нөөц замаар хүрлээ" : "Нөөц замаар илгээж байна",
      "Хүрэх зам алга",
    ][cue],
    nextLabel: [
      "Үндсэн замаар илгээх",
      "B–D холбоосыг таслах",
      "Нөөц замаар илгээх",
      "A-г сүлжээнээс салгах",
      "Дараагийн бүлэг",
    ][cue],
    onNext: advanceCue,
    onPrevious: () => showCue(Math.max(0, cue - 1)),
  });
  return (
    <section className="lab lab-routing" aria-label="Сүлжээний замын туршилт">
      <LabHeading label="ЗАМ СОНГОХ" title="Нэг холбоосыг таслаад үз." />
      <p className="lab-intro">
        Шугам дээр дарж холбоосыг тасал. A-аас F хүрэх зам үлдэх үү?
      </p>
      <div className="lab-route-stage">
        <svg
          viewBox="0 0 605 310"
          className="lab-network"
          aria-label="A-аас F хүрэх зургаан зангилаатай сүлжээ"
        >
          {NETWORK_EDGES.map(([a, b]) => {
            const key = edgeKey(a, b);
            const cut = disabled.has(key);
            const active = routeEdges.has(key);
            const [x1, y1] = NODE_POINTS[a];
            const [x2, y2] = NODE_POINTS[b];
            return (
              <g
                key={key}
                className={`lab-link ${cut ? "is-cut" : ""} ${active ? "is-route" : ""}`}
              >
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className="lab-link-shadow"
                />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className="lab-link-visible"
                />
                <rect
                  x={x1}
                  y={y1 - 14}
                  width={Math.hypot(x2 - x1, y2 - y1)}
                  height={28}
                  rx={14}
                  transform={`rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI} ${x1} ${y1})`}
                  className="lab-link-hit"
                  onClick={() => changeEdge(a, b)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${a}–${b} холбоосыг ${cut ? "сэргээх" : "таслах"}`}
                  aria-pressed={!cut}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      changeEdge(a, b);
                    }
                  }}
                />
                {cut ? (
                  <text
                    className="lab-cut-mark"
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 + 6}
                  >
                    ×
                  </text>
                ) : null}
              </g>
            );
          })}
          {(
            Object.entries(NODE_POINTS) as [NetworkNode, [number, number]][]
          ).map(([node, [x, y]]) => (
            <g
              key={node}
              className={`lab-node ${path.includes(node) ? "is-route" : ""}`}
            >
              <circle cx={x} cy={y + 5} r={29} className="lab-node-shadow" />
              <circle cx={x} cy={y} r={29} className="lab-node-surface" />
              <text x={x} y={y + 6}>
                {node}
              </text>
              {node === "A" || node === "F" ? (
                <text className="lab-node-caption" x={x} y={y + 55}>
                  {node === "A" ? "Илгээгч" : "Хүлээн авагч"}
                </text>
              ) : null}
            </g>
          ))}
          {sent && path.length ? (
            <g className="lab-traveler">
              <circle cx={packet[0]} cy={packet[1]} r={12} />
              <path d={`M ${packet[0] - 4} ${packet[1]} l 3 3 l 5 -6`} />
            </g>
          ) : null}
        </svg>
      </div>
      <div
        className={`lab-result ${!path.length ? "lab-result-warning" : ""}`}
        role="status"
      >
        <span className="lab-result-icon">
          {!path.length ? (
            <X size={21} />
          ) : arrived ? (
            <CheckCheck size={21} />
          ) : (
            <Wifi size={21} />
          )}
        </span>
        <div>
          <strong>
            {!path.length
              ? "Хүрэх зам алга."
              : arrived
                ? "Мэдээлэл F-д хүрлээ."
                : `${hops} холбоостой зам байна.`}
          </strong>
          <span>
            {path.length
              ? path.join(" → ")
              : "Тасарсан холбоосыг сэргээж, A-аас F хүртэл зам үүсгээрэй."}
          </span>
        </div>
      </div>
      <div className="lab-controls">
        <button
          className="lab-button lab-button-primary"
          onClick={send}
          disabled={!path.length || clock.playing}
        >
          <Send size={16} />
          {arrived ? "Дахин илгээх" : "Илгээх"}
        </button>
        <ResetButton
          onClick={() => {
            setDisabled(new Set());
            clock.seek(0);
            setSent(false);
          }}
        />
      </div>
      <Note>
        Ижил өртөгтэй холбоос бүхий загвар. Бодит сүлжээний чиглүүлэлт бодлого,
        хэмжүүрээс хамаарна.
      </Note>
    </section>
  );
}

const DNS_POSITIONS: Record<DnsStation, [number, number]> = {
  client: [11, 50],
  resolver: [43, 50],
  root: [83, 17],
  tld: [83, 50],
  authority: [83, 83],
};
const DNS_NAMES: Record<DnsStation, { name: string; sub: string }> = {
  client: { name: "Таны төхөөрөмж", sub: "DNS хүсэлт" },
  resolver: { name: "Хаяг хайгч", sub: "Resolver + кэш" },
  root: { name: "Үндэс сервер", sub: "Root" },
  tld: { name: ".example сервер", sub: "TLD" },
  authority: { name: "Эрх бүхий сервер", sub: "Authoritative" },
};
function DnsLab() {
  const entry = usePresentationEntry();
  const [domain, setDomain] = useState<DemoDomain>("school.example");
  const [cache, setCache] = useState<Partial<Record<DemoDomain, string>>>(() =>
    entry === "end" ? { "school.example": DNS_RECORDS["school.example"] } : {},
  );
  const [lookup, setLookup] = useState(() =>
    dnsLookup("school.example", cache),
  );
  const [step, setStep] = useState(entry === "end" ? 2 : 0);
  const current = lookup.steps[step - 1];
  const finished = step === lookup.steps.length;
  function begin(name: DemoDomain) {
    setDomain(name);
    setLookup(dnsLookup(name, cache));
    setStep(0);
  }
  function advance() {
    if (finished) {
      begin(domain);
      return;
    }
    const next = step + 1;
    setStep(next);
    if (next === lookup.steps.length)
      setCache((previous) => ({ ...previous, [domain]: lookup.address }));
  }
  const cue = (lookup.hit ? 8 : 0) + step;
  function showCue(next: number) {
    const address = DNS_RECORDS[domain];
    const restoredCache = { ...cache };
    if (next < 8) delete restoredCache[domain];
    else restoredCache[domain] = address;
    setCache(restoredCache);
    setLookup(dnsLookup(domain, next > 8 ? { [domain]: address } : {}));
    setStep(next > 8 ? next - 8 : next);
  }
  usePresentationSteps({
    step: cue,
    total: 10,
    label: lookup.hit
      ? `Кэшийн хүсэлт · ${step}/2`
      : `Эхний хүсэлт · ${step}/8`,
    nextLabel:
      cue === 8
        ? "Кэшээс дахин асуух"
        : cue === 9
          ? "Кэшээс хариулах"
          : cue === 10
            ? "Дараагийн бүлэг"
            : "DNS-ийн дараагийн алхам",
    onNext: () => showCue(Math.min(10, cue + 1)),
    onPrevious: () => showCue(Math.max(0, cue - 1)),
  });
  return (
    <section className="lab lab-dns" aria-label="DNS хүсэлт ба кэшийн туршилт">
      <LabHeading label="DNS" title="Нэр нь хаяг болж хувирна." />
      <p className="lab-intro">Жишээ DNS · Бодит хүсэлт илгээхгүй.</p>
      <div className="lab-dns-query">
        <Globe2 size={18} />
        <label className="lab-sr-only" htmlFor="lab-domain">
          Домэйн сонгох
        </label>
        <select
          id="lab-domain"
          value={domain}
          onChange={(event) => begin(event.target.value as DemoDomain)}
        >
          {Object.keys(DNS_RECORDS).map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <span
          className={`lab-badge ${lookup.hit || finished ? "is-warm" : ""}`}
        >
          {finished
            ? lookup.hit
              ? "Кэшээс хариулав"
              : "Хариу кэшлэгдлээ"
            : lookup.hit
              ? "Кэшэд байна"
              : "Кэшэд алга"}
        </span>
      </div>
      <div className="lab-dns-stage">
        <svg
          viewBox="0 0 600 285"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="lab-dns-arrow"
              markerWidth="7"
              markerHeight="7"
              refX="5"
              refY="3.5"
              orient="auto"
            >
              <path d="M0,0 L6,3.5 L0,7" fill="currentColor" />
            </marker>
          </defs>
          {(["client", "root", "tld", "authority"] as DnsStation[]).map(
            (station) => {
              const [x, y] = DNS_POSITIONS[station];
              return (
                <line
                  key={station}
                  x1="258"
                  y1="142.5"
                  x2={x * 6}
                  y2={y * 2.85}
                  className="lab-dns-wire"
                />
              );
            },
          )}
          {current
            ? (() => {
                const from = DNS_POSITIONS[current.from];
                const to = DNS_POSITIONS[current.to];
                const dx = (to[0] - from[0]) * 6;
                const dy = (to[1] - from[1]) * 2.85;
                const distance = Math.hypot(dx, dy);
                const inset = 64;
                return (
                  <line
                    x1={from[0] * 6 + (dx / distance) * inset}
                    y1={from[1] * 2.85 + (dy / distance) * inset}
                    x2={to[0] * 6 - (dx / distance) * inset}
                    y2={to[1] * 2.85 - (dy / distance) * inset}
                    className={`lab-dns-active ${current.kind === "query" ? "" : "is-answer"}`}
                    markerEnd="url(#lab-dns-arrow)"
                  />
                );
              })()
            : null}
        </svg>
        {(
          Object.entries(DNS_POSITIONS) as [DnsStation, [number, number]][]
        ).map(([station, [x, y]]) => (
          <div
            key={station}
            className={`lab-dns-node ${current?.from === station || current?.to === station ? "is-active" : ""} ${lookup.hit && ["root", "tld", "authority"].includes(station) ? "is-unused" : ""}`}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span className="lab-dns-node-icon">
              {station === "client" ? (
                <Laptop size={24} />
              ) : station === "resolver" ? (
                <Globe2 size={26} />
              ) : (
                <Server size={23} />
              )}
            </span>
            <strong>{DNS_NAMES[station].name}</strong>
            <small>{DNS_NAMES[station].sub}</small>
          </div>
        ))}
      </div>
      <div className="lab-result" role="status">
        <span className="lab-result-number">
          {step}/{lookup.steps.length}
        </span>
        <div>
          <strong>
            {finished
              ? `${domain} → ${lookup.address}`
              : current
                ? current.text
                : "Эхний хүсэлтийг явуулаад ажигла."}
          </strong>
          <span>
            {finished
              ? "Одоо ижил домэйныг дахин асуугаад алхмын тоог харьцуул."
              : lookup.hit
                ? "Хүчинтэй кэш байвал гадаад серверүүдээс дахин асуухгүй."
                : "Хаяг хайгч серверүүдээс тус тусад нь асууж, заалтыг дагана."}
          </span>
        </div>
      </div>
      <div className="lab-controls">
        <button className="lab-button lab-button-primary" onClick={advance}>
          {finished ? <RotateCcw size={16} /> : <ChevronRight size={18} />}
          {finished
            ? "Дахин асуух"
            : step
              ? "Дараагийн алхам"
              : "Хүсэлт эхлүүлэх"}
        </button>
        <ResetButton
          label="Кэш цэвэрлэх"
          onClick={() => {
            setCache({});
            setLookup(dnsLookup(domain, {}));
            setStep(0);
          }}
        />
        <span className="lab-cache-count">
          Кэш: {Object.keys(cache).length} нэр
        </span>
      </div>
      <Note>
        .example ба эдгээр IP нь жишээ хаяг. DNS нь вебийн агуулгыг зөөхгүй.
        Кэшийн хугацаа, завсрын заалтын кэшийг энд загварчлаагүй.
      </Note>
    </section>
  );
}

const DEMO_MESSAGE = "Сүлжээ биднийг холбоно.";
const DEMO_CHUNKS = splitMessage(DEMO_MESSAGE);
function PacketsLab({ motion }: { motion: boolean }) {
  const entry = usePresentationEntry();
  const clock = useClock(
    PACKET_EVENTS.length - 1,
    0.72,
    motion,
    entry === "end" ? 7 : 0,
  );
  const step = Math.min(
    PACKET_EVENTS.length - 1,
    Math.floor(clock.time + 0.00001),
  );
  const event = PACKET_EVENTS[step];
  const state = reassemble(DEMO_CHUNKS, event.received);
  const received = new Set<number>(event.received);
  usePresentationSteps({
    step,
    total: 7,
    label: event.caption,
    nextLabel: step < 7 ? "TCP-ийн дараагийн алхам" : "Дараагийн бүлэг",
    onNext: () => clock.seek(Math.min(7, step + 1)),
    onPrevious: () => clock.seek(Math.max(0, step - 1)),
  });
  return (
    <section
      className="lab lab-packets"
      aria-label="TCP дараалал ба автомат дахин илгээлт"
    >
      <LabHeading label="TCP" title="Ирэх дараалал ≠ унших дараалал." />
      <div className="lab-message">
        <span>Илгээх өгүүлбэр</span>
        <strong>“{DEMO_MESSAGE}”</strong>
      </div>
      <div className="lab-packet-head">
        <span>
          <Laptop size={16} /> Илгээгч
        </span>
        <span>
          <Server size={16} /> Хүлээн авагч
        </span>
      </div>
      <div className="lab-packet-grid">
        {DEMO_CHUNKS.map((chunk, index) => {
          const id = index + 1;
          const arrived = received.has(id);
          const buffered = state.buffered.includes(id);
          return (
            <div key={id} className="lab-packet-row">
              <div
                className={`lab-packet-tile lab-packet-sender ${step >= 3 && step < 7 && id === 3 ? "is-lost" : ""}`}
              >
                <b>{id.toString().padStart(2, "0")}</b>
                <span>{chunk.replace(/ /g, "·")}</span>
              </div>
              <div
                className={`lab-packet-lane ${arrived ? "is-arrived" : ""} ${step === 6 && id === 3 ? "is-retry" : ""}`}
              >
                <span>
                  {id === 3 && step >= 3 && step < 6 ? (
                    <>
                      <X size={14} /> Алдагдсан
                    </>
                  ) : id === 3 && step === 6 ? (
                    "Дахин илгээж байна"
                  ) : arrived ? (
                    <ArrowRight size={17} />
                  ) : (
                    "···"
                  )}
                </span>
              </div>
              <div
                className={`lab-packet-tile lab-packet-receiver ${arrived ? "is-filled" : ""} ${buffered ? "is-buffered" : ""}`}
              >
                <b>{id.toString().padStart(2, "0")}</b>
                <span>
                  {arrived
                    ? buffered
                      ? "Буферт"
                      : "Дарааллаар өгсөн"
                    : "Хүлээж байна"}
                </span>
                {arrived ? (
                  buffered ? (
                    <Clock3 size={14} />
                  ) : (
                    <Check size={15} />
                  )
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="lab-application">
        <span>Програмд өгсөн</span>
        <strong>{state.text || "Одоогоор хоосон"}</strong>
        <small>
          Хүлээн авсан дарааллаас үл хамааран, програмд зөв дарааллаар өгнө.
        </small>
      </div>
      <div className="lab-ack-return">
        <span>Илгээгч</span>
        <ArrowRight size={15} />
        <strong>
          {step === 0
            ? "ACK · Хүлээн авсны баталгаа"
            : state.complete
              ? "ACK · Бүх өгөгдлийг баталлаа"
              : `ACK · ${state.nextExpected}-р хэсгийн эхний байтыг хүлээнэ`}
        </strong>
        <span>Хүлээн авагч</span>
      </div>
      <div className="lab-packet-caption" aria-live="polite">
        <strong>{event.caption}</strong>
        <p>{event.detail}</p>
      </div>
      <div className="lab-controls">
        {motion ? (
          <button
            className="lab-button lab-button-primary"
            onClick={clock.toggle}
          >
            {clock.playing ? <Pause size={16} /> : <Play size={16} />}
            {clock.playing
              ? "Түр зогсоох"
              : step === 7
                ? "Дахин тоглуулах"
                : "Тоглуулах"}
          </button>
        ) : null}
        <button
          className="lab-button"
          onClick={() => clock.seek(Math.min(7, step + 1))}
          disabled={step === 7}
        >
          <SkipForward size={16} />
          Нэг алхам
        </button>
        <ResetButton onClick={() => clock.seek(0)} />
        <span className="lab-counter">
          {step + 1} / {PACKET_EVENTS.length}
        </span>
      </div>
      <Note>
        1–4 нь тайлбарлах хэсгийн дугаар; бодит TCP нь байтаар дугаарлана. Энд
        хугацаа дуусахад дахин илгээх нэг тохиолдлыг харуулав.
      </Note>
    </section>
  );
}

function formatTime(value: number) {
  return value < 1 ? `${Math.round(value * 1000)} мс` : `${value.toFixed(2)} с`;
}
function SpeedLab({ motion }: { motion: boolean }) {
  const entry = usePresentationEntry();
  const [bandwidth, setBandwidth] = useState(entry === "end" ? 20 : 10);
  const [latency, setLatency] = useState(entry === "end" ? 300 : 100);
  const [compared, setCompared] = useState(entry === "end");
  const model = transferModel(1, bandwidth, latency);
  const reference = transferModel(1, 10, 100);
  const extent = Math.max(model.lastArrival, reference.lastArrival) * 1.12;
  const slowdown = Math.max(
    1,
    5 / Math.max(model.lastArrival, reference.lastArrival),
  );
  const clock = useClock(
    Math.max(model.lastArrival, reference.lastArrival),
    1 / slowdown,
    motion,
    entry === "end" ? Math.max(model.lastArrival, reference.lastArrival) : 0,
  );
  const now = transferAt(clock.time, 1, bandwidth, latency);
  function update(value: number, setter: (value: number) => void) {
    setter(value);
    setCompared(false);
    clock.seek(0);
  }
  const scenario = latency !== 100 ? 3 : bandwidth !== 10 ? 2 : 1;
  const cue = compared ? scenario : scenario - 1;
  function compareCurrent() {
    setCompared(true);
    if (motion) clock.start();
    else clock.seek(Math.max(model.lastArrival, reference.lastArrival));
  }
  function showCue(next: number, animate = false) {
    const nextBandwidth =
      next === 3 && animate ? bandwidth : next >= 2 ? 20 : 10;
    const nextLatency = next >= 3 ? 300 : 100;
    const duration = Math.max(
      transferModel(1, nextBandwidth, nextLatency).lastArrival,
      reference.lastArrival,
    );
    setBandwidth(nextBandwidth);
    setLatency(nextLatency);
    setCompared(next > 0);
    if (next > 0 && animate && motion) clock.start();
    else clock.seek(next ? duration : 0, duration);
  }
  usePresentationSteps({
    step: cue,
    total: 3,
    label: !compared
      ? "Харьцуулах тохиргоо бэлэн"
      : [
          "Жишиг тохиргоо",
          "Жишиг дамжуулалт",
          "Зурвасын өргөнийг харьцуулж байна",
          "Тархалтын саатлыг харьцуулж байна",
        ][cue],
    nextLabel: !compared
      ? "Энэ тохиргоогоор харьцуулах"
      : [
          "Жишиг дамжуулалтыг харах",
          "20 Мбит/с болгож харьцуулах",
          "Саатлыг 300 мс болгох",
          "Дараагийн бүлэг",
        ][cue],
    onNext: () =>
      compared ? showCue(Math.min(3, cue + 1), true) : compareCurrent(),
    onPrevious: () => showCue(Math.max(0, cue - 1)),
  });
  return (
    <section
      className="lab lab-speed"
      aria-label="Зурвасын өргөн ба тархалтын саатал"
    >
      <LabHeading label="ХУРД БА СААТАЛ" title="Өргөн зам уу, богино зам уу?" />
      <div className="lab-sliders">
        <label>
          <span>
            Зурвасын өргөн <strong>{bandwidth} Мбит/с</strong>
          </span>
          <input
            aria-label="Зурвасын өргөн"
            type="range"
            min="1"
            max="100"
            value={bandwidth}
            onChange={(event) =>
              update(Number(event.target.value), setBandwidth)
            }
          />
          <small>
            1 Мбит/с <span>100 Мбит/с</span>
          </small>
        </label>
        <label>
          <span>
            Нэг чиглэлийн саатал <strong>{latency} мс</strong>
          </span>
          <input
            aria-label="Нэг чиглэлийн тархалтын саатал"
            type="range"
            min="10"
            max="300"
            step="10"
            value={latency}
            onChange={(event) => update(Number(event.target.value), setLatency)}
          />
          <small>
            10 мс <span>300 мс</span>
          </small>
        </label>
      </div>
      <div className="lab-timing-summary">
        <span>
          <small>Файлын хэмжээ</small>
          <strong>
            1 МБ <i>= 8 Мбит</i>
          </strong>
        </span>
        <span>
          <small>Бүрэн ирэх хугацаа</small>
          <strong>{formatTime(model.lastArrival)}</strong>
        </span>
      </div>
      <div className="lab-time-chart">
        <div className="lab-time-legend">
          <span>
            <i className="is-delay" /> Тархалтын саатал
          </span>
          <span>
            <i /> Өгөгдөл ирэх хугацаа
          </span>
        </div>
        {[
          { label: "Таны тохиргоо", data: model, current: true },
          {
            label: "Жишиг · 10 Мбит/с, 100 мс",
            data: reference,
            current: false,
          },
        ].map(({ label, data, current }) => (
          <div
            className={`lab-time-row ${current ? "is-current" : ""}`}
            key={label}
          >
            <div className="lab-time-row-title">
              <strong>{label}</strong>
              <span>{formatTime(data.lastArrival)}</span>
            </div>
            <div className="lab-time-track">
              <div
                className="lab-time-delay"
                style={{ width: `${(data.propagation / extent) * 100}%` }}
              />
              <div
                className="lab-time-transfer"
                style={{
                  left: `${(data.propagation / extent) * 100}%`,
                  width: `${(data.serialization / extent) * 100}%`,
                }}
              />
              <div
                className="lab-time-cursor"
                style={{ left: `${(clock.time / extent) * 100}%` }}
              />
              <span className="lab-time-start">0</span>
              <span className="lab-time-end">{formatTime(extent)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="lab-throughput">
        <div>
          <span>
            Шугамд оруулсан <b>{Math.round(now.emitted * 100)}%</b>
          </span>
          <progress
            aria-label="Шугамд оруулсан өгөгдөл"
            max="1"
            value={now.emitted}
          />
        </div>
        <div>
          <span>
            Хүлээн авсан <b>{Math.round(now.received * 100)}%</b>
          </span>
          <progress
            aria-label="Хүлээн авсан өгөгдөл"
            max="1"
            value={now.received}
          />
        </div>
      </div>
      <div className="lab-formula">
        <span>
          8 ÷ {bandwidth} + {latency} ÷ 1000
        </span>
        <strong>= {model.lastArrival.toFixed(2)} секунд</strong>
      </div>
      <div className="lab-controls">
        {motion ? (
          <button
            className="lab-button lab-button-primary"
            onClick={() => {
              setCompared(true);
              clock.toggle();
            }}
          >
            {clock.playing ? <Pause size={16} /> : <Play size={16} />}
            {clock.playing ? "Түр зогсоох" : "Харьцуулж тоглуулах"}
          </button>
        ) : (
          <button
            className="lab-button lab-button-primary"
            onClick={() => {
              setCompared(true);
              clock.seek(
                clock.time >= Math.max(model.lastArrival, reference.lastArrival)
                  ? 0
                  : clock.time +
                      Math.max(model.lastArrival, reference.lastArrival) / 5,
              );
            }}
          >
            <SkipForward size={16} />
            Нэг алхам
          </button>
        )}
        <ResetButton
          onClick={() => {
            setCompared(false);
            clock.seek(0);
          }}
        />
        <span className="lab-model-time">t = {clock.time.toFixed(2)} с</span>
      </div>
      <Note>
        Хялбаршуулсан нэг шугам: холболт үүсэх хугацаа, толгой мэдээлэл,
        дараалал, алдагдлыг тооцоогүй. Дэлгэцийн 1 с = загварын{" "}
        {(1 / slowdown).toFixed(2)} с.
      </Note>
    </section>
  );
}

function SecurityLab() {
  const entry = usePresentationEntry();
  const [https, setHttps] = useState(entry !== "end");
  const [allow443, setAllow443] = useState(entry !== "end");
  const [tested, setTested] = useState(entry === "end");
  const result = securityOutcome(https, allow443);
  const delivered = tested && result.allowed;
  const cue = !https
    ? tested
      ? 3
      : 2
    : !allow443
      ? tested
        ? 2
        : 1
      : tested
        ? 1
        : 0;
  function showCue(next: number) {
    setHttps(next < 3);
    setAllow443(next < 2);
    setTested(next > 0);
  }
  usePresentationSteps({
    step: cue,
    total: 3,
    label: tested
      ? [
          "HTTPS хүсэлт бэлэн",
          "TLS холбоог хамгаална",
          "Галт хана холболтыг хаалаа",
          "HTTP агуулга ил харагдана",
        ][cue]
      : "Хүсэлт шалгахад бэлэн",
    nextLabel: tested
      ? [
          "HTTPS хүсэлтийг явуулах",
          "443 портыг хааж шалгах",
          "HTTP хүсэлтийг шалгах",
          "Дараагийн бүлэг",
        ][cue]
      : https
        ? "HTTPS хүсэлтийг шалгах"
        : "HTTP хүсэлтийг шалгах",
    onNext: () => (tested ? showCue(Math.min(3, cue + 1)) : setTested(true)),
    onPrevious: () => showCue(Math.max(0, cue - 1)),
  });
  return (
    <section className="lab lab-security" aria-label="TLS ба галт ханын ялгаа">
      <LabHeading label="ХАМГААЛАЛТ" title="Нэвтрүүлэх үү? Нууцлах уу?" />
      <div className="lab-security-options">
        <div className="lab-segmented" aria-label="Холболтын төрөл">
          <button
            aria-pressed={https}
            className={https ? "is-selected" : ""}
            onClick={() => {
              setHttps(true);
              setTested(false);
            }}
          >
            <LockKeyhole size={15} />
            HTTPS
          </button>
          <button
            aria-pressed={!https}
            className={!https ? "is-selected" : ""}
            onClick={() => {
              setHttps(false);
              setTested(false);
            }}
          >
            <UnlockKeyhole size={15} />
            HTTP
          </button>
        </div>
        <label className="lab-toggle">
          <input
            type="checkbox"
            checked={allow443}
            onChange={(event) => {
              setAllow443(event.target.checked);
              setTested(false);
            }}
          />
          <span className="lab-toggle-track" />
          <span>443 портыг зөвшөөрөх</span>
        </label>
      </div>
      <div className="lab-security-stage">
        <div className="lab-security-endpoint">
          <span>
            <Laptop size={34} strokeWidth={1.5} />
          </span>
          <strong>Таны төхөөрөмж</strong>
          <small>
            Жишээ нууц үг
            <br />
            “demo-pass”
          </small>
        </div>
        <div className="lab-security-connection">
          <span
            className={`lab-security-payload ${delivered && https ? "is-encrypted" : ""}`}
          >
            {!tested ? (
              <>
                <Send size={17} /> Холболтын хүсэлт
              </>
            ) : !result.allowed ? (
              <>
                <ShieldX size={17} /> Холболт үүссэнгүй
              </>
            ) : https ? (
              <>
                <LockKeyhole size={17} /> Шифрлэсэн өгөгдөл
              </>
            ) : (
              <>
                <UnlockKeyhole size={17} /> “demo-pass”
              </>
            )}
          </span>
          <div className="lab-security-wire">
            <ArrowRight size={19} />
          </div>
          <small>
            {https
              ? delivered
                ? "HTTPS · TLS · 443"
                : "HTTPS хүсэлт · 443"
              : "HTTP · TLS-гүй · 80"}
          </small>
        </div>
        <div
          className={`lab-firewall ${tested && !result.allowed ? "is-blocked" : ""}`}
        >
          <span>
            {tested && !result.allowed ? (
              <ShieldX size={42} strokeWidth={1.4} />
            ) : (
              <ShieldCheck size={42} strokeWidth={1.4} />
            )}
          </span>
          <strong>Галт хана</strong>
          <small>
            80: нээлттэй
            <br />
            443: {allow443 ? "нээлттэй" : "хаалттай"}
          </small>
        </div>
        <div className="lab-security-final-arrow">
          <ArrowRight size={21} />
        </div>
        <div
          className={`lab-security-endpoint lab-security-server ${tested && result.allowed ? "is-reached" : ""}`}
        >
          <span>
            <Server size={34} strokeWidth={1.5} />
          </span>
          <strong>Веб сервер</strong>
          <small>
            {tested
              ? result.allowed
                ? "“demo-pass”"
                : "Хүсэлт ирээгүй"
              : "Хүлээж байна"}
          </small>
        </div>
      </div>
      <div
        className={`lab-result ${tested && !result.allowed ? "lab-result-warning" : ""}`}
        role="status"
      >
        <span className="lab-result-icon">
          {!tested ? (
            <CircleHelp size={21} />
          ) : result.allowed ? (
            <Check size={21} />
          ) : (
            <X size={21} />
          )}
        </span>
        <div>
          <strong>
            {!tested
              ? "Хүсэлт серверт хүрэх болов уу?"
              : result.allowed
                ? `${result.port} порт нээлттэй: хүсэлт хүрлээ.`
                : "443 порт хаалттай: холболтыг хориглолоо."}
          </strong>
          <span>
            {!tested
              ? "Холболтын төрөл ба дүрмийг сонгоод шалга."
              : !result.allowed
                ? "Портын дүрэм хүсэлтийг хаалаа. TLS холбоо үүсээгүй."
                : https
                  ? "TLS зам дахь агуулгыг хамгаална; төгсгөлийн төхөөрөмжүүд тайлж уншина."
                  : "HTTP агуулгыг зам дээрх ажиглагч унших боломжтой."}
          </span>
        </div>
      </div>
      <div className="lab-controls">
        <button
          className="lab-button lab-button-primary"
          onClick={() => setTested(true)}
        >
          <Send size={16} />
          Хүсэлтийг шалгах
        </button>
        <span className="lab-security-caption">
          Портын дүрмийн хялбаршуулсан загвар
        </span>
      </div>
      <div className="lab-security-takeaway">
        <LockKeyhole size={20} />
        <p>
          <strong>HTTPS бол сайтын үнэн зөвийн баталгаа биш.</strong>
          <span>Зөвшөөрсөн HTTPS хүсэлтэд TLS амжилттай үүссэн гэж үзэв.</span>
        </p>
      </div>
    </section>
  );
}

const QUESTIONS = [
  {
    number: "01",
    title: "Ижил домэйны хүчинтэй хариу кэшэд байвал?",
    options: [
      "Дахин үндэс серверээс эхэлнэ.",
      "Кэшээс хаягийг шууд буцаана.",
      "Вебийн бүх агуулгыг кэшээс авна.",
    ],
    correct: 1,
    reason:
      "DNS кэш нь нэрийн хариуг хадгална. Хүчинтэй хариу байвал гадаад DNS серверүүдээс дахин асуух шаардлагагүй; энэ нь веб хуудасны кэш биш.",
  },
  {
    number: "02",
    title: "①② ирсэн, ③ алдагдсан. Дараа нь ④ ирвэл?",
    options: [
      "④-ыг ③-ын оронд уншина.",
      "Бүх холболт шууд хаагдана.",
      "④-ыг буферт хадгалж, ③-ыг хүлээнэ.",
    ],
    correct: 2,
    reason:
      "TCP програмд өгөгдлийг зөв дарааллаар өгнө. Дутуу хэсэг дахин ирэх хүртэл дараагийн өгөгдлийг буферт хадгалж болно; дахин илгээлтийг протокол удирдана.",
  },
  {
    number: "03",
    title: "10 → 20 Мбит/с болговол, саатал хэвээр үед?",
    options: [
      "Файлыг шугамд оруулах хугацаа хоёр дахин багасна.",
      "Эхний битийн тархалтын саатал хоёр дахин багасна.",
      "1 МБ файл 0.5 МБ болж хувирна.",
    ],
    correct: 0,
    reason:
      "Загварт 1 МБ = 8 Мбит. 8 ÷ 10 = 0.8 секунд, 8 ÷ 20 = 0.4 секунд. Тархалтын саатал өөрчлөгдөөгүй тул эхний битийн ирэх хугацаа хэвээр.",
  },
] as const;
function RecapLab() {
  const entry = usePresentationEntry();
  const [cue, setCue] = useState(entry === "end" ? 5 : 0);
  const [answers, setAnswers] = useState<(number | undefined)[]>(() =>
    Array(3).fill(undefined),
  );
  const question = Math.floor(cue / 2);
  const revealed = cue % 2 === 1;
  const current = QUESTIONS[question];
  const selected = answers[question];
  const answeredCount = answers.filter((answer) => answer !== undefined).length;
  const score = answers.filter(
    (answer, index) => QUESTIONS[index].correct === answer,
  ).length;
  usePresentationSteps({
    step: cue,
    total: 5,
    label: `${question + 1}-р асуулт${revealed ? " · тайлбар" : ""}`,
    nextLabel: revealed
      ? question < 2
        ? "Дараагийн асуулт"
        : "Дуусгах"
      : "Тайлбарыг харуулах",
    onNext: () => setCue((previous) => Math.min(5, previous + 1)),
    onPrevious: () => setCue((previous) => Math.max(0, previous - 1)),
  });
  function answerQuestion(answer: number) {
    setAnswers((previous) =>
      previous.map((value, index) =>
        index === question && value === undefined ? answer : value,
      ),
    );
    setCue(question * 2 + 1);
  }
  return (
    <section
      className="lab lab-recap"
      aria-label="Ойлголтоо шалгах гурван асуулт"
    >
      <LabHeading label="ӨӨРИЙГӨӨ ШАЛГА" title="Дараа нь юу болох вэ?" />
      <div className="lab-quiz-progress">
        {QUESTIONS.map((item, index) => (
          <span
            key={item.number}
            className={`${question === index ? "is-current" : ""} ${answers[index] !== undefined ? (answers[index] === item.correct ? "is-correct" : "is-wrong") : ""}`}
          >
            {answers[index] === undefined ? (
              item.number
            ) : answers[index] === item.correct ? (
              <Check size={16} />
            ) : (
              <X size={16} />
            )}
          </span>
        ))}
        <small>3 жижиг таамаг. 3 гол ойлголт.</small>
      </div>
      <div className="lab-question">
        <span>АСУУЛТ {current.number}</span>
        <h4>{current.title}</h4>
      </div>
      <div className="lab-answer-options">
        {current.options.map((option, index) => (
          <button
            key={option}
            disabled={revealed || selected !== undefined}
            className={`${revealed && index === current.correct ? "is-correct" : ""} ${revealed && selected === index && index !== current.correct ? "is-wrong" : ""}`}
            onClick={() => answerQuestion(index)}
          >
            <span>{String.fromCharCode(65 + index)}</span>
            <strong>{option}</strong>
            {revealed && index === current.correct ? (
              <Check size={20} />
            ) : revealed && selected === index ? (
              <X size={20} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>
        ))}
      </div>
      {revealed ? (
        <div
          className={`lab-quiz-feedback ${selected === undefined || selected === current.correct ? "is-correct" : ""}`}
          role="status"
        >
          <strong>
            {selected === undefined
              ? "Тайлбар"
              : selected === current.correct
                ? "Зөв таамаглалаа."
                : "Учрыг нь хамт харъя."}
          </strong>
          <p>{current.reason}</p>
        </div>
      ) : (
        <p className="lab-quiz-prompt">
          <ArrowDown size={16} />
          {selected === undefined
            ? "Үр дүнг харахаасаа өмнө нэгийг сонго."
            : "Сонголтыг хадгалсан. Дараах алхмаар тайлбарыг хар."}
        </p>
      )}
      <div className="lab-controls">
        {revealed && question < 2 ? (
          <button
            className="lab-button lab-button-primary"
            onClick={() => setCue((previous) => previous + 1)}
          >
            Дараагийн асуулт <ArrowRight size={16} />
          </button>
        ) : cue === 5 ? (
          <>
            <div className="lab-score">
              <strong>
                {answeredCount ? `${score} / ${answeredCount}` : "Тайлбар"}
              </strong>
              <span>
                {answeredCount ? "сонгосон хариултаас зөв" : "Оноонд тооцоогүй"}
              </span>
            </div>
            <ResetButton
              label="Дахин шалгах"
              onClick={() => {
                setAnswers(Array(3).fill(undefined));
                setCue(0);
              }}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}

export default function Labs({ id, motion }: LabProps) {
  switch (id) {
    case "routing":
      return <RoutingLab motion={motion} />;
    case "dns":
      return <DnsLab />;
    case "packets":
      return <PacketsLab motion={motion} />;
    case "speed":
      return <SpeedLab motion={motion} />;
    case "security":
      return <SecurityLab />;
    case "recap":
      return <RecapLab />;
  }
}

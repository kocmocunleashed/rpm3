import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  ChevronRight,
  Expand,
  Gamepad2,
  Layers,
  Lightbulb,
  MousePointer2,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ScanLine,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

import type { LanState } from "./clay-scene";
import { usePresentationEntry, usePresentationSteps } from "./presentation";

const ClayScene = lazy(() => import("./clay-scene"));
export function SceneLoading() {
  return (
    <div className="scene-loading" role="status">
      <span className="loading-clay">
        <Box size={28} />
      </span>
      <span>3D үзүүлэнг бэлтгэж байна…</span>
    </div>
  );
}
const journeySteps = [
  "Spotify дээр Play дарвал сүлжээнд юу болох вэ?",
  "Дууны хүсэлт утаснаас гэрийн Wi-Fi төхөөрөмж рүү явна.",
  "Хүсэлт интернэтээр аудио үйлчилгээ / CDN-д хүрнэ.",
  "Аудионы эхний хэсгүүд ирж байна.",
  "Эхний хэсгийг тоглуулах зуур дараагийн хэсгүүд ирсээр байна.",
];
export function IntroDemo({
  motion,
  active = true,
}: {
  motion: boolean;
  active?: boolean;
}) {
  const entry = usePresentationEntry();
  const [step, setStep] = useState(entry === "end" ? 4 : 0);
  const [playing, setPlaying] = useState(entry === "end");
  const [automatic, setAutomatic] = useState(false);
  const showCue = (next: number) => {
    setAutomatic(false);
    setStep(next);
    setPlaying(next > 0);
  };
  const cueNames = [
    "Play дарахаас өмнө",
    "Гэрийн Wi-Fi",
    "Интернэт",
    "Аудио ирэх зам",
    "Буфер ба тоглуулах",
  ];
  usePresentationSteps({
    step,
    total: 4,
    label: cueNames[step],
    nextLabel: [
      "Хүсэлт илгээх",
      "Интернэтээр дамжуулах",
      "Аудио буцаах",
      "Буферээс тоглуулах",
      "Дараагийн бүлэг",
    ][step],
    onNext: () => showCue(Math.min(4, step + 1)),
    onPrevious: () => showCue(Math.max(0, step - 1)),
  });
  useEffect(() => {
    if (!playing || !automatic || !active || step >= 4) return;
    const timer = window.setTimeout(() => setStep(step + 1), 2300);
    return () => window.clearTimeout(timer);
  }, [playing, automatic, step, active]);
  const buffered = step === 4 ? 4 : 0;
  const controlsPlaying = automatic || (step === 4 && playing);
  return (
    <div className="object-demo journey-demo spotify-demo">
      <div className="scene-area">
        <Suspense fallback={<SceneLoading />}>
          <ClayScene
            kind="journey"
            stage={step}
            motion={motion}
            running={playing && active}
          />
        </Suspense>
        <span className="scene-drag">
          <MousePointer2 size={13} /> Эргүүлж хараарай
        </span>
      </div>
      <div className="demo-console compact-console">
        <div
          className="journey-progress"
          role="group"
          aria-label="Дуу хүрэх алхмууд"
        >
          {journeySteps.slice(1).map((text, i) => (
            <button
              key={text}
              aria-label={`Аяллын алхам ${i + 1}`}
              aria-current={step === i + 1 ? "step" : undefined}
              onClick={() => showCue(i + 1)}
            >
              <span className={step > i ? "filled" : ""}>
                {step > i + 1 ? <Check size={12} /> : i + 1}
              </span>
              <b>{["Хүсэлт", "Интернэт", "Буфер", "Тоглоно"][i]}</b>
              {i !== 3 && <ChevronRight size={13} />}
            </button>
          ))}
        </div>
        <p className="demo-status-line" aria-live="polite">
          {journeySteps[step]}
        </p>
        <div
          className="music-buffer"
          aria-label="Жишээ буфер: дуу бүхэлдээ ирээгүй"
        >
          <span>Буфер</span>
          <div className="buffer-blocks" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} className={i < buffered ? "received" : ""} />
            ))}
          </div>
          <b>
            {step === 4
              ? playing && active
                ? "Тоглож байна"
                : "Түр зогссон"
              : step === 3
                ? "Ирж байна"
                : "Хүлээж байна"}
          </b>
        </div>
        <div className="console-actions">
          <button
            className="button primary"
            onClick={() => {
              if (controlsPlaying) {
                setPlaying(false);
                setAutomatic(false);
              } else {
                if (step === 0) setStep(1);
                setPlaying(true);
                setAutomatic(step < 4);
              }
            }}
          >
            {controlsPlaying ? <Pause size={15} /> : <Play size={15} />}
            {controlsPlaying
              ? "Түр зогсоох"
              : step === 0
                ? "Play дарах"
                : "Үргэлжлүүлэх"}
          </button>
          <button
            className="button bare"
            disabled={step === 4}
            onClick={() => showCue(Math.min(4, step + 1))}
          >
            Дараах <ArrowRight size={15} />
          </button>
          <button
            className="button icon-only"
            aria-label="Аяллыг эхнээс нь"
            onClick={() => showCue(0)}
          >
            <RotateCcw size={16} />
          </button>
          <span className="model-caption">Дуугүй сургалтын загвар</span>
        </div>
      </div>
    </div>
  );
}

const scopes = [
  {
    code: "PAN",
    name: "Хувийн сүлжээ",
    example: "Утас Spotify-ийн дууг Bluetooth чихэвч рүү дамжуулна.",
  },
  {
    code: "LAN",
    name: "Найзуудын Counter-Strike",
    example: "Хоёр тоглогч нэг дотоод серверт холбогдоно.",
  },
  {
    code: "CAN",
    name: "Сургуулийн сүлжээ",
    example: "Хичээлийн байр, номын сан нэг сургуулийн сүлжээнд холбогдоно.",
  },
  {
    code: "MAN",
    name: "Хотын сүлжээ",
    example: "Нэг хотын номын сангийн салбарууд мэдээллээ солилцоно.",
  },
  {
    code: "WAN",
    name: "Алсын сүлжээ",
    example: "Гэрийн сүлжээнээс өөр хотын үйлчилгээний серверт хүрнэ.",
  },
];
function lanPhase(stage: number) {
  return stage <= 3 ? stage : 4 + ((stage - 4) % 3);
}
const scaleCues = [
  "LAN тоглолтын өмнө",
  "Нэгдэх хүсэлт",
  "Серверийн эхний төлөв",
  "Хоёр клиент бэлэн",
  "Тоглогчийн оролт",
  "Сервер төлөв шинэчлэх",
  "Хоёр дэлгэц шинэчлэгдэх",
  "Интернэт салгах",
  "Интернэтгүй оролт",
  "Дотоод сервер шинэчлэх",
  "Интернэтгүй тоглолт",
  "PAN",
  "CAN",
  "MAN",
  "WAN",
];
function scaleCueFor(scope: number, stage: number, online: boolean) {
  if (scope !== 1)
    return ({ 0: 11, 2: 12, 3: 13, 4: 14 } as Record<number, number>)[scope];
  const phase = lanPhase(stage);
  if (!online && stage >= 6)
    return phase === 4 ? 8 : phase === 5 ? 9 : stage >= 9 ? 10 : 7;
  return phase;
}
export function ScaleDemo({
  motion,
  active = true,
}: {
  motion: boolean;
  active?: boolean;
}) {
  const entry = usePresentationEntry();
  const [cue, setCue] = useState(entry === "end" ? 14 : 0);
  const [scope, setScope] = useState(entry === "end" ? 4 : 1);
  const [stage, setStage] = useState(0);
  const [online, setOnline] = useState(true);
  const [automatic, setAutomatic] = useState(false);
  const showCue = (next: number) => {
    setAutomatic(false);
    setCue(next);
    if (next <= 10) {
      setScope(1);
      setStage(next <= 6 ? next : next === 7 ? 6 : next - 1);
      if (next >= 7) setOnline(false);
      else if (cue >= 7) setOnline(true);
    } else {
      setScope(
        ({ 11: 0, 12: 2, 13: 3, 14: 4 } as Record<number, number>)[next],
      );
      setStage(0);
    }
  };
  usePresentationSteps({
    step: cue,
    total: 14,
    label: scaleCues[cue],
    nextLabel: cue < 14 ? scaleCues[cue + 1] : "Дараагийн бүлэг",
    onNext: () => showCue(Math.min(14, cue + 1)),
    onPrevious: () => showCue(Math.max(0, cue - 1)),
  });
  const phase = lanPhase(stage);
  const busy = [1, 2, 4, 5].includes(phase);
  const revision = Math.max(0, Math.floor((stage - 3) / 3));
  const matchState: LanState = {
    serverPosition: (revision + (phase === 5 ? 1 : 0)) % 2,
    clientPositions: [revision % 2, revision % 2],
    joined: stage >= 3,
  };
  useEffect(() => {
    if (scope !== 1 || !busy || !active || !automatic) return;
    const timer = window.setTimeout(() => {
      setStage(stage + 1);
      setCue(scaleCueFor(scope, stage + 1, online));
    }, 2100);
    return () => window.clearTimeout(timer);
  }, [scope, stage, busy, active, automatic, online]);
  const status =
    phase === 0
      ? "Бэлэн клиентүүдийг дотоод CS серверт холбоё."
      : phase === 1
        ? "Хоёр клиент нэгдэх хүсэлтээ свичээр серверт илгээнэ."
        : phase === 2
          ? "Сервер тоглолтын эхний төлөвийг хоёр клиентэд буцаана."
          : phase === 3
            ? "Нэг тоглолтод орлоо. Тоглогч 1-ийг хөдөлгөж үзээрэй."
            : phase === 4
              ? "Тоглогч 1-ийн оролт серверт очиж байна."
              : phase === 5
                ? "Сервер шинэ төлөвийг хоёр тоглогчид тарааж байна."
                : "Хоёр дэлгэцэд ижил шинэ байрлал харагдлаа.";
  return (
    <div className="object-demo scale-demo lan-demo">
      <div
        className="scope-switch"
        role="group"
        aria-label="Сүлжээний хамрах орчин"
      >
        {scopes.map((s, i) => (
          <button
            key={s.code}
            aria-pressed={scope === i}
            onClick={() => {
              setScope(i);
              setStage(0);
              setOnline(true);
              setAutomatic(false);
              setCue(scaleCueFor(i, 0, true));
            }}
          >
            {s.code}
          </button>
        ))}
      </div>
      <div className="scene-area">
        <Suspense fallback={<SceneLoading />}>
          <ClayScene
            kind="scale"
            scope={scope}
            stage={stage}
            matchState={matchState}
            motion={motion && active && (scope !== 1 || busy)}
          />
        </Suspense>
        <span className="scene-drag">
          <MousePointer2 size={13} /> Эргүүлж хараарай
        </span>
      </div>
      <div className="demo-console compact-console">
        <div className="demo-status-row">
          <strong>
            {scopes[scope].code} · {scopes[scope].name}
          </strong>
          {scope === 1 && (
            <span className="traffic-pill">Тоглолтын WAN өгөгдөл: 0</span>
          )}
        </div>
        <p className="demo-status-line" aria-live="polite">
          {scope === 1 ? status : scopes[scope].example}
        </p>
        {scope === 1 && (
          <div className="console-actions">
            <button
              className="button primary"
              disabled={busy && automatic}
              onClick={() => {
                const nextStage = stage === 0 ? 1 : stage + 1;
                setAutomatic(true);
                setStage(nextStage);
                setCue(scaleCueFor(scope, nextStage, online));
              }}
            >
              <Gamepad2 size={16} />
              {stage === 0
                ? "Тоглолтод нэгдэх"
                : busy && automatic
                  ? "Өгөгдөл солилцож байна"
                  : busy
                    ? "Солилцоог үргэлжлүүлэх"
                    : "Тоглогч 1-ийг хөдөлгөх"}
            </button>
            <button
              className="button bare"
              aria-pressed={!online}
              onClick={() => {
                setOnline(!online);
                setCue(scaleCueFor(scope, stage, !online));
              }}
            >
              {online ? <Wifi size={15} /> : <WifiOff size={15} />}
              {online ? "Интернэт салгах" : "Интернэт салгасан"}
            </button>
            <button
              className="button icon-only"
              aria-label="LAN тоглолтыг эхнээс нь"
              onClick={() => {
                setStage(0);
                setOnline(true);
                setAutomatic(false);
                setCue(0);
              }}
            >
              <RotateCcw size={15} />
            </button>
          </div>
        )}
        {scope === 1 && (
          <div className="lan-proof">
            {!online && <span>Интернэт салсан ч LAN ажиллаж байна.</span>}
            <div
              className="lan-state"
              aria-label="Тоглогч 1-ийн байрлал: сервер ба хоёр клиент"
            >
              <span>
                Сервер{" "}
                <output aria-label="Серверийн байрлал">
                  {stage < 2 ? "—" : matchState.serverPosition ? "B" : "A"}
                </output>
              </span>
              <span>
                Дэлгэц 1{" "}
                <output aria-label="Тоглогч 1-ийн байрлал">
                  {!matchState.joined
                    ? "—"
                    : matchState.clientPositions[0]
                      ? "B"
                      : "A"}
                </output>
              </span>
              <span>
                Дэлгэц 2{" "}
                <output aria-label="Тоглогч 2-ийн байрлал">
                  {!matchState.joined
                    ? "—"
                    : matchState.clientPositions[1]
                      ? "B"
                      : "A"}
                </output>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const routerParts = [
  {
    label: "Процессор",
    short: "Боловсруулна",
    text: "Пакет боловсруулах ажиллагааг удирдана.",
    icon: Box,
  },
  {
    label: "Санах ой",
    short: "Хадгална",
    text: "Програм, хүснэгт, дамжуулахыг хүлээж буй өгөгдлийг хадгална.",
    icon: Layers,
  },
  {
    label: "Ethernet порт",
    short: "Кабелиар холбоно",
    text: "Кабелиар цахилгаан дохио дамжуулж, хүлээн авна.",
    icon: ScanLine,
  },
  {
    label: "Радио хэсэг",
    short: "Wi-Fi холбоо үүсгэнэ",
    text: "Радио дохиог дамжуулж, хүлээн авах хандалтын цэгийн хэсэг.",
    icon: Wifi,
  },
];
export function HardwareDemo({ motion }: { motion: boolean }) {
  const entry = usePresentationEntry();
  const [cue, setCue] = useState(entry === "end" ? 5 : 0);
  const [explode, setExplode] = useState(entry === "end" ? 0.82 : 0),
    [part, setPart] = useState(entry === "end" ? 3 : -1),
    [reset, setReset] = useState(0);
  const showCue = (next: number) => {
    setCue(next);
    setExplode(next === 0 ? 0 : 0.82);
    setPart(next < 2 ? -1 : next - 2);
  };
  const selectPart = (next: number) => {
    setPart(next);
    setCue(next + 2);
    if (next < 2) setExplode(Math.max(0.7, explode));
  };
  const cueNames = [
    "Угсарсан төхөөрөмж",
    "Давхаргын бүтэц",
    ...routerParts.map((item) => item.label),
  ];
  usePresentationSteps({
    step: cue,
    total: 5,
    label: cueNames[cue],
    nextLabel:
      cue === 0
        ? "Давхаргыг задлах"
        : cue < 5
          ? cueNames[cue + 1]
          : "Дараагийн бүлэг",
    onNext: () => showCue(Math.min(5, cue + 1)),
    onPrevious: () => showCue(Math.max(0, cue - 1)),
  });
  const selected = part >= 0 ? routerParts[part] : null;
  return (
    <div className="object-demo hardware-demo">
      <div className="scene-area">
        <Suspense fallback={<SceneLoading />}>
          <ClayScene
            key={reset}
            kind="router"
            motion={motion}
            explode={explode}
            selectedPart={part}
            onSelect={selectPart}
          />
        </Suspense>
        <span className="scene-drag">
          <MousePointer2 size={13} /> Эд анги дээр дараарай
        </span>
        <div className="model-tools">
          <button
            className="button"
            onClick={() => showCue(explode > 0.5 ? 0 : 1)}
          >
            <Expand size={15} />
            {explode > 0.5 ? "Буцааж угсрах" : "Давхаргаар задлах"}
          </button>
          <button
            className="button icon-only"
            aria-label="3D төхөөрөмжийг сэргээх"
            onClick={() => {
              showCue(0);
              setReset(reset + 1);
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
      <div className="demo-console compact-console">
        <label className="explode-control">
          <span>
            Давхаргыг салгах<output>{Math.round(explode * 100)}%</output>
          </span>
          <input
            aria-label="Давхаргыг салгах"
            type="range"
            min="0"
            max="1"
            step=".01"
            value={explode}
            onChange={(e) => {
              const value = Number(e.target.value);
              setExplode(value);
              if (value < 0.05) {
                setPart(-1);
                setCue(0);
              } else setCue(part >= 0 ? part + 2 : 1);
            }}
          />
        </label>
        <div
          className="parts-switch"
          role="group"
          aria-label="Төхөөрөмжийн эд анги"
        >
          {routerParts.map((p, i) => (
            <button
              key={p.label}
              aria-pressed={part === i}
              onClick={() => selectPart(i)}
            >
              <p.icon size={17} />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
        <p className="demo-status-line" aria-live="polite">
          {selected ? (
            <>
              <strong>{selected.short}.</strong> {selected.text}
            </>
          ) : cue === 0 ? (
            "Гэрийн Wi-Fi төхөөрөмж дотор хэд хэдэн өөр үүрэг хамт ажиллана."
          ) : (
            "Бүрээс, үндсэн хавтан, холболтын хэсгийг салгаж харлаа."
          )}
        </p>
      </div>
    </div>
  );
}

const media = [
  {
    id: "copper" as const,
    label: "Зэс кабель",
    icon: Zap,
    title: "Цахилгаан",
    text: "Мушгиа зэс хосоор цахилгаан дохио дамжина.",
  },
  {
    id: "fiber" as const,
    label: "Шилэн кабель",
    icon: ScanLine,
    title: "Гэрэл",
    text: "Шилэн цөмөөр гэрлийн дохио чиглэн тархана.",
  },
  {
    id: "radio" as const,
    label: "Wi-Fi",
    icon: Radio,
    title: "Радио",
    text: "Хоёр тал ээлжлэн радио дохио дамжуулж, хүлээн авна.",
  },
];
export function MediaDemo({
  motion,
  active = true,
}: {
  motion: boolean;
  active?: boolean;
}) {
  const entry = usePresentationEntry();
  const [cue, setCue] = useState(entry === "end" ? 8 : 0);
  const [choice, setChoice] = useState(entry === "end" ? 2 : 0),
    [explode, setExplode] = useState(0),
    [signal, setSignal] = useState(entry === "end"),
    [leg, setLeg] = useState(entry === "end" ? 1 : 0);
  const [automatic, setAutomatic] = useState(false);
  const showCue = (next: number) => {
    setCue(next);
    setAutomatic(false);
    setChoice(Math.floor(next / 3));
    setExplode(next % 3 === 0 ? 0 : 0.85);
    setSignal(next === 2 || next === 5 || next >= 7);
    setLeg(next === 8 ? 1 : 0);
  };
  const cueNames = [
    "Зэс кабель",
    "Мушгиа хосыг харах",
    "Цахилгаан дохио",
    "Шилэн кабель",
    "Шилэн цөмийг харах",
    "Гэрлийн дохио",
    "Wi-Fi холбоо",
    "Wi-Fi хүсэлт",
    "Wi-Fi хариу",
  ];
  usePresentationSteps({
    step: cue,
    total: 8,
    label: cueNames[cue],
    nextLabel: cue < 8 ? cueNames[cue + 1] : "Дараагийн бүлэг",
    onNext: () => showCue(Math.min(8, cue + 1)),
    onPrevious: () => showCue(Math.max(0, cue - 1)),
  });
  const m = media[choice];
  useEffect(() => {
    if (!signal || !active || !automatic) return;
    const timer = window.setTimeout(() => {
      setLeg(leg + 1);
      if (choice === 2) setCue((leg + 1) % 2 === 0 ? 7 : 8);
    }, 2100);
    return () => window.clearTimeout(timer);
  }, [signal, leg, active, automatic, choice]);
  const direction =
    leg % 2 === 0 ? "Төхөөрөмж → хандалтын цэг" : "Хандалтын цэг → төхөөрөмж";
  return (
    <div className="object-demo media-demo">
      <div className="medium-switch" role="group" aria-label="Дамжуулах орчин">
        {media.map((item, i) => (
          <button
            key={item.id}
            aria-pressed={choice === i}
            onClick={() => showCue(i * 3)}
          >
            <item.icon size={17} />
            {item.label}
          </button>
        ))}
      </div>
      <div className="scene-area">
        <Suspense fallback={<SceneLoading />}>
          <ClayScene
            kind="media"
            motion={motion && active}
            medium={m.id}
            explode={explode}
            stage={signal ? leg + 1 : 0}
          />
        </Suspense>
        <span className="scene-drag">
          <MousePointer2 size={13} /> Эргүүлж хараарай
        </span>
      </div>
      <div className="demo-console compact-console">
        {choice !== 2 && (
          <label className="explode-control">
            <span>
              Кабелийг задлах<output>{Math.round(explode * 100)}%</output>
            </span>
            <input
              aria-label="Кабелийг задлах"
              type="range"
              min="0"
              max="1"
              step=".01"
              value={explode}
              onChange={(e) => {
                const value = Number(e.target.value);
                setExplode(value);
                setCue(choice * 3 + (signal ? 2 : value > 0.03 ? 1 : 0));
              }}
            />
          </label>
        )}
        <p className="demo-status-line" aria-live="polite">
          <strong>{m.title}.</strong>{" "}
          {choice === 2 && signal ? direction : m.text}
        </p>
        <div className="console-actions">
          <button
            className="button primary"
            aria-pressed={signal}
            onClick={() => {
              setSignal(!signal);
              setLeg(0);
              setAutomatic(!signal);
              setCue(
                choice === 2
                  ? signal
                    ? 6
                    : 7
                  : choice * 3 + (signal ? (explode > 0.03 ? 1 : 0) : 2),
              );
            }}
          >
            {signal ? <Pause size={14} /> : <Play size={14} />}
            {signal
              ? "Зогсоох"
              : choice === 2
                ? "Хүсэлт ба хариу"
                : "Дохиог ажиглах"}
          </button>
          <span className="model-caption">Удаашруулсан схем</span>
        </div>
      </div>
    </div>
  );
}
export function Inquiry({
  question,
  action,
}: {
  question: string;
  action: string;
}) {
  return (
    <div className="inquiry">
      <span className="inquiry-label">
        <Lightbulb size={15} /> ЭХЛЭЭД ТААМАГЛА
      </span>
      <p>{question}</p>
      <div>
        <ArrowUpRight size={16} />
        {action}
      </div>
    </div>
  );
}

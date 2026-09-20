import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CircleHelp,
  Grid2X2,
  Maximize,
  Minimize,
  Network,
  X,
} from "lucide-react";
import { slides, sources } from "./content";
import type { SlideId } from "./content";
import {
  HardwareDemo,
  IntroDemo,
  MediaDemo,
  ScaleDemo,
  SceneLoading,
} from "./demos";
import { PresentationContext } from "./presentation";
import type {
  PresentationController,
  PresentationEntry,
  PresentationMeta,
} from "./presentation";
import "./App.css";

const Labs = lazy(() => import("./labs"));
type Panel = "contents" | "notes" | "sources" | null;
const topics = [
  "Эхлэл",
  "Хамрах хүрээ",
  "Төхөөрөмж",
  "Дохио",
  "Замчлал",
  "DNS",
  "Пакет",
  "Хурд ба саатал",
  "Хамгаалалт",
  "Мэдлэгээ шалгах",
];
function fromHash() {
  const hash = window.location.hash.slice(1);
  const numeric = Number(hash);
  if (
    hash &&
    Number.isInteger(numeric) &&
    numeric >= 1 &&
    numeric <= slides.length
  )
    return numeric - 1;
  const found = slides.findIndex((s) => s.id === hash);
  return Math.max(0, found);
}
function Demo({
  id,
  motion,
  active,
}: {
  id: SlideId;
  motion: boolean;
  active: boolean;
}) {
  if (id === "intro") return <IntroDemo motion={motion} active={active} />;
  if (id === "scale") return <ScaleDemo motion={motion} active={active} />;
  if (id === "hardware") return <HardwareDemo motion={motion && active} />;
  if (id === "media") return <MediaDemo motion={motion} active={active} />;
  return (
    <Suspense fallback={<SceneLoading />}>
      <Labs id={id} motion={motion && active} />
    </Suspense>
  );
}

export default function App() {
  const [index, setIndex] = useState(fromHash);
  const [direction, setDirection] = useState(1);
  const [entry, setEntry] = useState<PresentationEntry>("start");
  const [revision, setRevision] = useState(0);
  const [cue, setCue] = useState<PresentationMeta | null>(null);
  const controller = useRef<PresentationController | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [motion, setMotion] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [visible, setVisible] = useState(!document.hidden);
  const [fullscreen, setFullscreen] = useState(
    Boolean(document.fullscreenElement),
  );
  const [notice, setNotice] = useState("");
  const modal = useRef<HTMLDialogElement>(null);
  const section = useRef<HTMLElement>(null);
  const slide = slides[index];

  const register = useCallback((current: PresentationController | null) => {
    controller.current = current;
    setCue((previous) => {
      if (!current) return null;
      const { step, total, label, nextLabel } = current;
      if (
        previous?.step === step &&
        previous.total === total &&
        previous.label === label &&
        previous.nextLabel === nextLabel
      )
        return previous;
      return { step, total, label, nextLabel };
    });
  }, []);
  const presentation = useMemo(() => ({ register, entry }), [register, entry]);

  const go = useCallback(
    (n: number, at: PresentationEntry = "start") => {
      const next = Math.min(slides.length - 1, Math.max(0, n));
      setDirection(next >= index ? 1 : -1);
      controller.current = null;
      setCue(null);
      setEntry(at);
      setRevision((value) => value + 1);
      setIndex(next);
      setPanel(null);
      window.history.replaceState(null, "", `#${slides[next].id}`);
      section.current?.scrollTo({ top: 0, behavior: "instant" });
    },
    [index],
  );
  const showExperiment = useCallback(() => {
    const main = section.current;
    const model = main?.querySelector<HTMLElement>(".experiment-stage");
    const summary = main?.querySelector<HTMLElement>(".lesson-summary");
    if (
      !main ||
      !model ||
      !summary ||
      getComputedStyle(summary).position !== "sticky"
    )
      return;
    const target =
      main.scrollTop +
      model.getBoundingClientRect().top -
      main.getBoundingClientRect().top -
      summary.getBoundingClientRect().height -
      12;
    main.scrollTo({ top: Math.max(0, target), behavior: "instant" });
  }, []);
  const advance = useCallback(() => {
    const current = controller.current;
    if (!current) return;
    if (current.step < current.total) {
      current.next();
      showExperiment();
    } else go(index === slides.length - 1 ? 0 : index + 1);
  }, [go, index, showExperiment]);
  const previous = useCallback(() => {
    const current = controller.current;
    if (!current) return;
    if (current.step > 0) {
      current.previous();
      showExperiment();
    } else if (index > 0) go(index - 1, "end");
  }, [go, index, showExperiment]);
  const nextAction = !cue
    ? "Туршилт ачаалж байна…"
    : cue.step < cue.total
      ? cue.nextLabel
      : index === slides.length - 1
        ? "Эхнээс нь танилцуулах"
        : `Дараагийн бүлэг · ${topics[index + 1]}`;

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setNotice("");
    } catch {
      setNotice(
        "Бүтэн дэлгэц нээх боломжгүй байна. Хөтчийн бүтэн дэлгэцийн тохиргоог ашиглаарай.",
      );
    }
  }, []);

  useEffect(() => {
    const hash = () => go(fromHash());
    const visibility = () => setVisible(!document.hidden);
    const full = () => setFullscreen(Boolean(document.fullscreenElement));
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => setMotion(!mq.matches);
    window.addEventListener("hashchange", hash);
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("fullscreenchange", full);
    mq.addEventListener("change", preference);
    return () => {
      window.removeEventListener("hashchange", hash);
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("fullscreenchange", full);
      mq.removeEventListener("change", preference);
    };
  }, [go]);
  useEffect(() => {
    if (panel && !modal.current?.open) modal.current?.showModal();
    if (!panel && modal.current?.open) modal.current?.close();
  }, [panel]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        panel ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (event.target as HTMLElement).closest(
          'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="slider"],[role="textbox"]',
        )
      )
        return;
      const nativeSpace =
        event.key === " " &&
        (event.target as HTMLElement).closest(
          'button,a,[role="button"],[role="checkbox"],[role="switch"]',
        );
      if (nativeSpace) return;
      const presentationKey = [
        "ArrowRight",
        "ArrowLeft",
        "PageDown",
        "PageUp",
        " ",
        "Home",
        "End",
        "f",
        "F",
      ].includes(event.key);
      if (presentationKey && event.repeat) {
        event.preventDefault();
        return;
      }
      if (
        event.key === "ArrowRight" ||
        event.key === "PageDown" ||
        (event.key === " " && !event.shiftKey)
      ) {
        event.preventDefault();
        advance();
      } else if (
        event.key === "ArrowLeft" ||
        event.key === "PageUp" ||
        (event.key === " " && event.shiftKey)
      ) {
        event.preventDefault();
        previous();
      } else if (event.key === "Home") {
        event.preventDefault();
        go(0);
      } else if (event.key === "End") {
        event.preventDefault();
        go(slides.length - 1);
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        void toggleFullscreen();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [advance, go, panel, previous, toggleFullscreen]);

  return (
    <div
      className={`studio palette-${slide.color} ${motion ? "" : "motion-off"}`}
    >
      <a
        className="skip-link"
        href="#main-screen"
        onClick={(event) => {
          event.preventDefault();
          section.current?.focus();
        }}
      >
        Хичээл рүү очих
      </a>
      <header className="studio-header">
        <button
          className="wordmark"
          onClick={() => go(0)}
          aria-label="Холбоо — эхлэл"
        >
          <span className="wordmark-object">
            <Network size={23} strokeWidth={1.8} />
          </span>
          холбоо<span className="wordmark-dot">.</span>
        </button>
        <div className="course-label">
          <span>КОМПЬЮТЕРЫН СҮЛЖЭЭ</span>
          <b>Нэг санаа. Нэг бодит жишээ.</b>
        </div>
        <div className="header-tools">
          <button
            className="hud-button sources-button"
            aria-label="Эх сурвалжууд"
            onClick={() => setPanel("sources")}
          >
            <BookOpen size={17} />
            <span>Эх сурвалж</span>
          </button>
          <button
            className="hud-button fullscreen-button"
            aria-label={fullscreen ? "Бүтэн дэлгэцээс гарах" : "Бүтэн дэлгэц"}
            onClick={toggleFullscreen}
          >
            {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            <span>{fullscreen ? "Гарах" : "Танилцуулах"}</span>
          </button>
        </div>
      </header>
      <main
        id="main-screen"
        ref={section}
        tabIndex={-1}
        className="screen-main"
      >
        {notice && (
          <div className="screen-notice" role="status">
            {notice}
            <button aria-label="Мэдэгдлийг хаах" onClick={() => setNotice("")}>
              <X size={16} />
            </button>
          </div>
        )}
        <article
          className={`presentation-screen screen-${slide.id}`}
          key={`${slide.id}-${revision}`}
          data-direction={direction}
          aria-label={`${index + 1}. ${topics[index]}`}
        >
          <header className="lesson-summary">
            <div className="lesson-kicker">
              <span className="lesson-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{topics[index]}</span>
              <button
                className="read-button"
                aria-label="Тайлбар ба баримтууд"
                onClick={() => setPanel("notes")}
              >
                <BookOpen size={15} /> Тайлбар
              </button>
            </div>
            <h1>{slide.title.replace("\n", " ")}</h1>
            <div className="lesson-takeaway">
              <span>ГОЛ САНАА</span>
              <p>
                <mark>{slide.takeaway}</mark>
              </p>
            </div>
          </header>
          <div className="lesson-example">
            <span className="example-label">БОДИТ ЖИШЭЭ</span>
            <strong>{slide.example.label}</strong>
            <p>{slide.example.text}</p>
          </div>
          <section
            className={`experiment-stage ${["intro", "scale", "hardware", "media"].includes(slide.id) ? "object-stage" : "lab-stage"}`}
            aria-label="Интерактив туршилт"
          >
            <PresentationContext.Provider value={presentation}>
              <Demo id={slide.id} motion={motion} active={visible && !panel} />
            </PresentationContext.Provider>
          </section>
        </article>
      </main>
      <footer className="presentation-footer">
        <button
          className="contents-button"
          aria-label="Бүх бүлэг"
          onClick={() => setPanel("contents")}
        >
          <Grid2X2 size={18} />
          <span>Хураангуй</span>
        </button>
        <div
          className="chapter-progress"
          role="group"
          aria-label="Бүлэг сонгох"
        >
          {slides.map((s, i) => (
            <button
              key={s.id}
              aria-label={`${i + 1}. ${topics[i]}`}
              aria-current={i === index ? "step" : undefined}
              onClick={() => go(i)}
              title={topics[i]}
            >
              <span
                className={i === index ? "active" : i < index ? "complete" : ""}
              />
            </button>
          ))}
        </div>
        <div
          className="presentation-cue"
          data-testid="presentation-cue"
          data-step={cue?.step}
          data-total={cue?.total}
          title={cue?.label}
          role="status"
          aria-atomic="true"
        >
          <span className="cue-progress">
            {cue ? `Алхам ${cue.step} / ${cue.total}` : "Бэлдэж байна"}
          </span>
          <span className="cue-next">
            <span>Дараа:</span> {nextAction}
          </span>
          <span className="sr-only">{cue?.label}</span>
        </div>
        <div className="footer-controls">
          <span className="keyboard-tip">
            <kbd>←</kbd>
            <kbd>→</kbd>
          </span>
          <span className="slide-counter">
            <b>{String(index + 1).padStart(2, "0")}</b>
            <i>/</i>
            {String(slides.length).padStart(2, "0")}
          </span>
          <button
            className="nav-arrow"
            aria-label="Өмнөх алхам"
            title="Өмнөх алхам · ←"
            aria-keyshortcuts="ArrowLeft PageUp"
            disabled={!cue || (index === 0 && cue.step === 0)}
            onClick={previous}
          >
            <ArrowLeft size={21} />
          </button>
          <button
            className="nav-arrow next"
            aria-label="Дараагийн алхам"
            title={`${nextAction} · →`}
            aria-keyshortcuts="ArrowRight PageDown"
            disabled={!cue}
            onClick={advance}
          >
            <ArrowRight size={21} />
          </button>
        </div>
      </footer>
      <dialog
        className={`studio-dialog palette-${slide.color} ${panel === "contents" ? "contents-dialog" : ""}`}
        ref={modal}
        aria-labelledby="dialog-title"
        onClose={() => setPanel(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setPanel(null);
        }}
      >
        {panel && (
          <div className="dialog-inner">
            <div className="dialog-top">
              <span>ХОЛБОО · МЭДЛЭГИЙН ТЭМДЭГЛЭЛ</span>
              <button
                className="hud-button hud-icon"
                aria-label="Цонхыг хаах"
                onClick={() => setPanel(null)}
              >
                <X size={21} />
              </button>
            </div>
            {panel === "contents" ? (
              <>
                <h2 id="dialog-title">Сүлжээний 10 гол санаа.</h2>
                <p className="dialog-intro">
                  Санаа бүрийг нэг жишээгээр ойлгоё. Дээр нь дараад туршаарай.
                </p>
                <nav className="chapter-menu" aria-label="Агуулга">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      className={`menu-chapter palette-${s.color}`}
                      aria-current={i === index ? "step" : undefined}
                      onClick={() => go(i)}
                    >
                      <span className="menu-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <strong>{topics[i]}</strong>
                        <span>{s.takeaway}</span>
                      </div>
                      {i < index ? (
                        <Check size={17} />
                      ) : (
                        <ArrowUpRight size={17} />
                      )}
                    </button>
                  ))}
                </nav>
                <p className="modal-shortcuts">
                  <kbd>←</kbd>
                  <kbd>→</kbd> Туршилтыг алхмаар үзэх <span />
                  <kbd>Space</kbd> Дараах алхам <span />
                  <kbd>F</kbd> Бүтэн дэлгэц <span />
                  <kbd>Esc</kbd> Хаах
                </p>
              </>
            ) : panel === "sources" ? (
              <>
                <h2 id="dialog-title">Эх сурвалжууд.</h2>
                <p className="dialog-intro">
                  Өгсөн сурах бичгийг IETF, Cisco болон бусад анхдагч эх
                  сурвалжаар нягталж, хуучирсан тайлбарыг шинэчилсэн.
                </p>
                <div className="source-list">
                  {sources.map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>{source.title}</span>
                      <ArrowUpRight size={17} />
                    </a>
                  ))}
                </div>
                <p className="source-disclosure">
                  3D загвар нь бүтцийг, туршилт нь сонгосон зарчмыг тайлбарлана.
                  Бодит төхөөрөмжийн зураг эсвэл сүлжээний шууд хэмжилт биш.
                </p>
              </>
            ) : (
              <>
                <h2 id="dialog-title">{topics[index]}</h2>
                <p className="notes-principle">{slide.principle}</p>
                <div className="notes-prose">
                  {slide.notes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </div>
                <div className="fact-strip">
                  {slide.facts.map((fact) => (
                    <div key={fact.label}>
                      <strong>{fact.value}</strong>
                      <span>{fact.label}</span>
                    </div>
                  ))}
                </div>
                <div className="notes-inquiry">
                  <CircleHelp size={20} />
                  <p>{slide.question}</p>
                </div>
                <div className="note-sources">
                  <span>ЭХ СУРВАЛЖ</span>
                  {slide.sourceIds.map((id) => {
                    const source = sources.find((s) => s.id === id);
                    return source ? (
                      <a
                        key={id}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.title}
                        <ArrowUpRight size={12} />
                      </a>
                    ) : null;
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </dialog>
      <span className="sr-only" aria-live="polite">
        {index + 1} / {slides.length}. {topics[index]}
      </span>
    </div>
  );
}

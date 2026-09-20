import { createContext, useContext, useLayoutEffect, useRef } from "react";

export type PresentationEntry = "start" | "end";
export interface PresentationMeta {
  step: number;
  total: number;
  label: string;
  nextLabel: string;
}
export interface PresentationController extends PresentationMeta {
  next: () => void;
  previous: () => void;
}
export interface PresentationStepOptions extends PresentationMeta {
  onNext: () => void;
  onPrevious: () => void;
}

export const PresentationContext = createContext<{
  register: (controller: PresentationController | null) => void;
  entry: PresentationEntry;
} | null>(null);

/** A backward chapter transition enters the final demonstration cue. */
export function usePresentationEntry() {
  return useContext(PresentationContext)?.entry ?? "start";
}

/** Register the current model's real actions; the shell never clicks hidden controls. */
export function usePresentationSteps(options: PresentationStepOptions) {
  const context = useContext(PresentationContext);
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });
  const register = context?.register;
  const { step, total, label, nextLabel } = options;
  useLayoutEffect(() => {
    if (!register) return;
    register({
      step,
      total,
      label,
      nextLabel,
      next: () => latest.current.onNext(),
      previous: () => latest.current.onPrevious(),
    });
    return () => register(null);
  }, [register, step, total, label, nextLabel]);
}

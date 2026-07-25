"use client";

import { useEffect, useRef, useState } from "react";

/** ease-out cúbico (nunca lineal). */
export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Progreso 0→1 al entrar al viewport; se reinicia al salir.
 * Con prefers-reduced-motion: progreso 1 de inmediato.
 */
export function useViewportChartAnimation(durationMs = 1000) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(prefersReducedMotion);
  const [progress, setProgress] = useState(() => (prefersReducedMotion() ? 1 : 0));
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2, rootMargin: "0px 0px -4% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (rafRef.current !== undefined) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }

    if (!inView) {
      setProgress(0);
      return;
    }

    if (reduceMotion) {
      setProgress(1);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setProgress(easeOutCubic(t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, [inView, reduceMotion, durationMs]);

  return { containerRef, progress, reduceMotion, inView };
}

/** Aplica stroke-dashoffset a trazos de línea en un SVG de Observable Plot. */
export function applyLineDrawProgress(svg: SVGSVGElement | null, progress: number) {
  if (!svg) return;

  svg.querySelectorAll("path").forEach((path) => {
    const el = path as SVGPathElement;
    const stroke = el.getAttribute("stroke");
    const fill = el.getAttribute("fill");
    if (!stroke || stroke === "none") return;
    if (fill && fill !== "none") return;

    const length = el.getTotalLength();
    if (!Number.isFinite(length) || length <= 0) return;

    el.style.strokeDasharray = `${length}`;
    el.style.strokeDashoffset = `${length * (1 - progress)}`;
  });

  svg.querySelectorAll("circle").forEach((circle) => {
    (circle as SVGCircleElement).style.opacity = String(Math.min(1, progress * 1.15));
  });
}

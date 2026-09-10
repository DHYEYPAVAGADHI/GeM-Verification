"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { heroBanners } from "@/components/marketing/hero-banners";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const N = heroBanners.length;
const INTERVAL = 4500;

/* [cloneOfLast, ...banners, cloneOfFirst] — start at index 1 */
const track = [heroBanners[N - 1], ...heroBanners, heroBanners[0]];

export function HeroCarousel() {
  const { dict } = useI18n();
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(1);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const dragX = useRef<number | null>(null);

  const active = (index - 1 + N) % N;

  const next = useCallback(() => {
    setAnimate(true);
    setIndex((i) => i + 1);
  }, []);
  const prev = useCallback(() => {
    setAnimate(true);
    setIndex((i) => i - 1);
  }, []);
  const goTo = useCallback((dot: number) => {
    setAnimate(true);
    setIndex(dot + 1);
  }, []);

  // autoplay
  useEffect(() => {
    if (reduce || paused) return;
    const t = setInterval(() => {
      setAnimate(true);
      setIndex((i) => i + 1);
    }, INTERVAL);
    return () => clearInterval(t);
  }, [reduce, paused]);

  // seamless wrap: after sliding onto a clone, jump (no transition) to the real slide
  const onTransitionEnd = () => {
    if (index === track.length - 1) {
      setAnimate(false);
      setIndex(1);
    } else if (index === 0) {
      setAnimate(false);
      setIndex(N);
    }
  };
  useEffect(() => {
    if (animate) return;
    // re-enable transitions only after the no-transition jump has painted
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setAnimate(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [animate]);

  const cur = heroBanners[active];

  return (
    <section id="home" className="scroll-mt-0 bg-gov-navy-deep">
      <div
        className="group relative w-full overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDown={(e) => (dragX.current = e.clientX)}
        onPointerUp={(e) => {
          if (dragX.current === null) return;
          const d = e.clientX - dragX.current;
          dragX.current = null;
          if (d < -50) next();
          else if (d > 50) prev();
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Platform highlights"
      >
        <div
          className={cn("flex h-[240px] sm:h-[330px] lg:h-[400px] xl:h-[440px]", animate && "transition-transform duration-700 ease-out")}
          style={{ transform: `translateX(-${index * 100}%)` }}
          onTransitionEnd={onTransitionEnd}
        >
          {track.map((b, i) => {
            const Art = b.art;
            return (
              <div key={i} className="h-full w-full shrink-0" aria-hidden={i !== index}>
                <Art text={dict.hero[b.key]} />
              </div>
            );
          })}
        </div>

        {/* arrows */}
        <button
          type="button"
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/25 p-2 text-white opacity-0 transition-opacity hover:bg-black/45 group-hover:opacity-100 sm:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next slide"
          className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/25 p-2 text-white opacity-0 transition-opacity hover:bg-black/45 group-hover:opacity-100 sm:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* dots + play/pause */}
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
          {heroBanners.map((b, i) => (
            <button
              key={b.key}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "h-2 rounded-full transition-all",
                i === active ? "w-7 bg-white" : "w-2 bg-white/45 hover:bg-white/70",
              )}
            />
          ))}
          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            aria-label={paused ? "Resume autoplay" : "Pause autoplay"}
            className="ml-1 rounded-full bg-white/15 p-1 text-white hover:bg-white/30"
          >
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* CTA strip under the banner — action follows the visible slide */}
      <div className="border-b border-slate-200 bg-blue-50">
        <div className="section flex flex-col items-center justify-between gap-3 py-4 sm:flex-row">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gov-navy/75">
            <span className="h-1.5 w-1.5 rounded-full bg-gov-green" />
            {dict.heroStrip.sih}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={cur.primary}
              className="btn rounded-md bg-gov-orange px-6 py-2.5 text-sm font-bold text-white hover:bg-gov-orange-dark"
            >
              {dict.hero[cur.key].primary} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={cur.secondary}
              className="btn rounded-md border border-gov-navy/25 bg-white px-5 py-2.5 text-sm text-gov-navy hover:bg-white/60"
            >
              {dict.hero[cur.key].secondary}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

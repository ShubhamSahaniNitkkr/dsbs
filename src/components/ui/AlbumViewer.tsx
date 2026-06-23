import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { ClientModel } from '../../types';
import { getMediaPosterUrl, getMediaThumbUrl, isVideoUrl } from '../../lib/utils';

type Slide =
  | { kind: 'video'; src: string; index: number }
  | { kind: 'photo'; src: string; index: number };

interface Props {
  model: ClientModel;
  layoutId?: string;
  onClose: () => void;
}

function posterForModel(model: ClientModel): string {
  if (model.cover && !isVideoUrl(model.cover)) return model.cover;
  if (model.photos[0]) return model.photos[0];
  return '';
}

export default function AlbumViewer({ model, layoutId, onClose }: Props) {
  const slides = useMemo<Slide[]>(() => {
    const vids = model.videos.map((src, index) => ({ kind: 'video' as const, src, index }));
    const pics = model.photos.map((src, index) => ({ kind: 'photo' as const, src, index }));
    return [...vids, ...pics];
  }, [model]);

  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(0);
  const [loadedSlides, setLoadedSlides] = useState<Set<number>>(() => new Set([0]));
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStart = useRef<number | null>(null);

  const current = slides[active];
  const backdropSrc = posterForModel(model);

  const markLoaded = useCallback((indices: number[]) => {
    setLoadedSlides((prev) => {
      const next = new Set(prev);
      for (const i of indices) {
        if (i >= 0 && i < slides.length) next.add(i);
      }
      return next;
    });
  }, [slides.length]);

  const go = useCallback(
    (next: number) => {
      if (!slides.length) return;
      const clamped = Math.max(0, Math.min(slides.length - 1, next));
      setDirection(clamped > active ? 1 : -1);
      setActive(clamped);
      markLoaded([clamped, clamped - 1, clamped + 1]);
    },
    [active, markLoaded, slides.length],
  );

  const next = useCallback(() => go(active + 1), [active, go]);
  const prev = useCallback(() => go(active - 1), [active, go]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, next, prev]);

  useEffect(() => {
    if (current?.kind !== 'video') {
      videoRef.current?.pause();
      return;
    }
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.load();
    el.play().catch(() => {});
  }, [active, current?.kind, current?.src]);

  if (!slides.length || !mounted) return null;

  const videoCount = model.videos.length;
  const onPhotos = current?.kind === 'photo';
  const photosOnly = videoCount === 0;
  const sharedLayoutId = photosOnly || !layoutId ? undefined : layoutId;

  return createPortal(
    <motion.div
      className="portfolio-viewer fixed inset-0 isolate z-[9999] overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {backdropSrc && !photosOnly && (
        <div className="pointer-events-none absolute inset-0 z-0 scale-110">
          <img
            src={getMediaPosterUrl(backdropSrc, 480)}
            alt=""
            className="h-full w-full object-cover blur-3xl brightness-[0.35] saturate-150"
          />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90" />

      <motion.div
        layoutId={sharedLayoutId}
        className="relative z-10 flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain"
        transition={{ type: 'spring', stiffness: 280, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-30 shrink-0 bg-black px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-8 sm:pt-7">
          <div className="flex items-center gap-4">
            <div className="flex flex-1 gap-1">
              {slides.map((slide, i) => (
                <button
                  key={`${slide.kind}-${slide.src}`}
                  type="button"
                  onClick={() => go(i)}
                  className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/15"
                  aria-label={`Slide ${i + 1}`}
                >
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${slide.kind === 'video' ? 'bg-rose-gold' : 'bg-ivory'}`}
                    style={{ width: i <= active ? '100%' : '0%', opacity: i <= active ? 1 : 0.3 }}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white/90 backdrop-blur-md transition hover:border-rose-gold"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-4 text-center sm:px-8">
          <p className="text-[10px] font-semibold tracking-[0.28em] text-rose-gold-light uppercase">
            Deep Shikha Beauty Studio
          </p>
          <h3 className="font-display mt-1 text-2xl text-ivory sm:text-3xl">{model.title}</h3>
          <p className="mt-1 text-[11px] tracking-[0.2em] text-white/50 uppercase">{model.category} makeup</p>
        </div>

        <div
          className="relative mx-auto mt-4 flex min-h-0 w-full max-w-5xl flex-1 flex-col px-3 sm:mt-6 sm:px-6"
          onTouchStart={(e) => {
            touchStart.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStart.current === null) return;
            const diff = e.changedTouches[0].clientX - touchStart.current;
            if (Math.abs(diff) > 50) diff < 0 ? next() : prev();
            touchStart.current = null;
          }}
        >
          <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-sm shadow-[0_40px_100px_rgba(0,0,0,0.55)] ring-1 ring-white/10 sm:min-h-[58vh]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${current.kind}-${current.src}`}
                custom={direction}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex items-center justify-center bg-black"
              >
                {loadedSlides.has(active) ? (
                  current.kind === 'video' ? (
                    <video
                      ref={videoRef}
                      src={current.src}
                      className="h-full w-full object-contain"
                      controls
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={getMediaPosterUrl(current.src)}
                      alt={`${model.title} — ${current.index + 1}`}
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                  )
                ) : (
                  <div className="h-10 w-10 animate-pulse rounded-full border-2 border-white/20 border-t-rose-gold" />
                )}
              </motion.div>
            </AnimatePresence>

            {active > 0 && (
              <button type="button" onClick={prev} className="absolute top-1/2 left-3 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-rose-gold sm:left-5" aria-label="Previous">‹</button>
            )}
            {active < slides.length - 1 && (
              <button type="button" onClick={next} className="absolute top-1/2 right-3 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-rose-gold sm:right-5" aria-label="Next">›</button>
            )}

            <div className="pointer-events-none absolute top-4 left-4 z-20">
              <span className="inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-white/90 uppercase backdrop-blur-md">
                {onPhotos ? `Photo ${current.index + 1} / ${model.photos.length}` : `Reel ${current.index + 1} / ${videoCount}`}
              </span>
            </div>
          </div>

          <div className="mt-4 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {videoCount > 0 && !onPhotos && model.photos.length > 0 && (
              <div className="mb-3 flex justify-center">
                <button type="button" onClick={() => go(videoCount)} className="border border-rose-gold/60 px-5 py-2 text-[11px] font-medium tracking-widest text-rose-gold-light uppercase hover:bg-rose-gold hover:text-white">
                  View Photos →
                </button>
              </div>
            )}
            <div className="portfolio-filmstrip flex justify-center gap-2">
              {slides.map((slide, i) => {
                const nearActive = Math.abs(i - active) <= +2;
                const shouldLoadThumb = loadedSlides.has(i) || nearActive;

                return (
                  <button
                    key={`thumb-${slide.kind}-${slide.src}`}
                    type="button"
                    onClick={() => go(i)}
                    onMouseEnter={() => markLoaded([i])}
                    className={`relative h-16 w-12 shrink-0 overflow-hidden rounded-sm sm:h-20 sm:w-14 ${i === active ? 'ring-2 ring-rose-gold scale-105' : 'opacity-50 hover:opacity-90'}`}
                  >
                    {slide.kind === 'video' ? (
                      <div className="flex h-full w-full items-center justify-center bg-charcoal text-white text-xs">▶</div>
                    ) : shouldLoadThumb ? (
                      <img
                        src={getMediaThumbUrl(slide.src)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-charcoal/80" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

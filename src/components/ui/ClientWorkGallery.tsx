import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import modelsData from '../../data/models.json';
import type { ClientModel, ModelCategory } from '../../types';
import { getCloudinaryUrl, getCloudinaryVideoPoster, isVideoUrl } from '../../lib/utils';
import AlbumViewer from './AlbumViewer';

const allModels = (modelsData.models || []) as ClientModel[];

const categories: { key: ModelCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All Work' },
  { key: 'bridal', label: 'Bridal' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'reception', label: 'Reception' },
  { key: 'party', label: 'Party' },
  { key: 'haldi', label: 'Haldi' },
];

interface Props {
  defaultCategory?: ModelCategory | 'all';
}

/** Cover image for cards — photo only; video plays on hover when preloaded. */
function cardCoverImage(model: ClientModel): string | null {
  if (model.cover && !isVideoUrl(model.cover)) return model.cover;
  if (model.photos[0]) return model.photos[0];
  const videoSrc = cardVideoSource(model);
  if (videoSrc) return getCloudinaryVideoPoster(videoSrc, 800);
  return null;
}

function cardVideoSource(model: ClientModel): string | null {
  if (model.videos[0]) return model.videos[0];
  if (model.cover && isVideoUrl(model.cover)) return model.cover;
  return null;
}

function useVideoPreload(src: string | null) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!src) {
      setReady(false);
      return;
    }
    setReady(false);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = src;
    const markReady = () => setReady(true);
    video.addEventListener('canplaythrough', markReady, { once: true });
    video.addEventListener('loadeddata', markReady, { once: true });
    video.load();
    return () => {
      video.removeEventListener('canplaythrough', markReady);
      video.removeEventListener('loadeddata', markReady);
      video.src = '';
    };
  }, [src]);

  return ready;
}

function PortfolioCardMedia({
  model,
  cover,
  isHero,
  index,
  hovered,
}: {
  model: ClientModel;
  cover: string | null;
  isHero: boolean;
  index: number;
  hovered: boolean;
}) {
  const videoSrc = cardVideoSource(model);
  const videoReady = useVideoPreload(videoSrc);
  const videoRef = useRef<HTMLVideoElement>(null);
  const showVideo = Boolean(videoSrc && videoReady && hovered);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoReady) return;
    if (hovered) {
      el.play().catch(() => {});
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [hovered, videoReady]);

  if (!cover && !videoSrc) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-charcoal">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 text-2xl text-white/90 ring-1 ring-white/20">▶</span>
      </div>
    );
  }

  return (
    <>
      {cover && (
        <img
          src={getCloudinaryUrl(cover, isHero ? 1200 : 800)}
          alt={model.title}
          className={`portfolio-ken-burns h-full w-full object-cover object-top transition-opacity duration-500 ${showVideo ? 'opacity-0' : 'opacity-100'}`}
          loading={index === 0 ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={index === 0 ? 'high' : 'auto'}
        />
      )}
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
          muted
          loop
          playsInline
          preload="auto"
        />
      )}
    </>
  );
}

function FeaturedBannerMedia({
  model,
  cover,
}: {
  model: ClientModel;
  cover: string;
}) {
  const videoSrc = cardVideoSource(model);
  const videoReady = useVideoPreload(videoSrc);
  const videoRef = useRef<HTMLVideoElement>(null);
  const showVideo = Boolean(videoSrc && videoReady);

  useEffect(() => {
    if (videoRef.current && videoReady) {
      videoRef.current.play().catch(() => {});
    }
  }, [videoReady]);

  return (
    <>
      <img
        src={getCloudinaryUrl(cover, 1600)}
        alt={model.title}
        className={`portfolio-ken-burns h-full w-full object-cover transition-opacity duration-700 ${showVideo ? 'opacity-0' : 'opacity-100'} group-hover:scale-105`}
        loading="eager"
        fetchPriority="high"
      />
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${showVideo ? 'opacity-100' : 'opacity-0'} group-hover:scale-105`}
          muted
          loop
          playsInline
          preload="auto"
        />
      )}
    </>
  );
}

function hasReel(model: ClientModel) {
  return model.videos.length > 0 || (model.cover && isVideoUrl(model.cover));
}

function PortfolioCard({
  model,
  index,
  isDimmed,
  hovered,
  onSelect,
}: {
  model: ClientModel;
  index: number;
  isDimmed: boolean;
  hovered: boolean;
  onSelect: () => void;
}) {
  const cover = cardCoverImage(model);
  const cardRef = useRef<HTMLButtonElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), { stiffness: 280, damping: 28 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), { stiffness: 280, damping: 28 });

  if (!cover && !hasReel(model)) return null;

  const num = String(index + 1).padStart(2, '0');
  const isHero = index % 6 === 0;
  const sharedLayoutId = hasReel(model) ? `portfolio-card-${model.id}` : undefined;

  return (
    <motion.button
      ref={cardRef}
      type="button"
      layoutId={sharedLayoutId}
      onClick={onSelect}
      onMouseMove={(e) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        mx.set((e.clientX - rect.left) / rect.width - 0.5);
        my.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className={`portfolio-bento-card group relative w-full overflow-hidden bg-charcoal text-left ${bentoClass(index)} ${isHero ? 'min-h-[280px] sm:min-h-[420px]' : 'min-h-[200px] sm:min-h-[240px]'}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      animate={{ opacity: isDimmed ? 0.4 : 1, scale: isDimmed ? 0.96 : 1 }}
      whileHover={{
        y: -10,
        scale: 1.02,
        boxShadow: '0 24px 60px rgba(184, 135, 106, 0.25)',
        transition: { duration: 0.35 },
      }}
    >
      <motion.div
        className="absolute inset-0 overflow-hidden"
        animate={{ y: [0, -5, 0] }}
        transition={{
          duration: 3.8 + (index % 4) * 0.45,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: (index % 6) * 0.35,
        }}
      >
        <PortfolioCardMedia
          model={model}
          cover={cover}
          isHero={isHero}
          index={index}
          hovered={hovered}
        />
      </motion.div>

      <div className="portfolio-card-shine pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent opacity-90" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 transition duration-500 group-hover:ring-rose-gold/40" />

      <div className="absolute top-4 left-4 z-10">
        <span className="font-display text-3xl text-white/20 transition-colors duration-500 group-hover:text-rose-gold/60 sm:text-4xl">
          {num}
        </span>
      </div>

      {hasReel(model) && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[9px] font-semibold tracking-widest text-white/90 uppercase backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-gold opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-gold" />
          </span>
          Reel
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">
        <p className="text-[9px] font-semibold tracking-[0.22em] text-rose-gold-light uppercase">{model.category}</p>
        <p className={`mt-1 font-display text-white ${isHero ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}>
          {model.title}
        </p>
        <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-medium tracking-wide text-white backdrop-blur-sm transition group-hover:border-rose-gold/60 group-hover:bg-rose-gold/20">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Experience Look
        </span>
      </div>
    </motion.button>
  );
}

function bentoClass(index: number): string {
  const patterns = [
    'col-span-2 row-span-2',
    'col-span-1 row-span-1',
    'col-span-1 row-span-1',
    'col-span-2 row-span-1',
    'col-span-1 row-span-1',
    'col-span-1 row-span-2',
  ];
  return patterns[index % patterns.length];
}

export default function ClientWorkGallery({ defaultCategory = 'all' }: Props) {
  const [active, setActive] = useState<ModelCategory | 'all'>(defaultCategory);
  const [selected, setSelected] = useState<ClientModel | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const items = useMemo(
    () => (active === 'all' ? allModels : allModels.filter((m) => m.category === active)),
    [active],
  );

  const stats = useMemo(() => {
    const videos = allModels.reduce((n, m) => n + m.videos.length, 0);
    const photos = allModels.reduce((n, m) => n + m.photos.length, 0);
    return { looks: allModels.length, videos, photos };
  }, []);

  const featured = allModels[0];
  const featuredCover = featured ? cardCoverImage(featured) : null;

  if (!items.length) {
    return <p className="text-center text-sm text-white/50">Add looks in site-data.xlsx → Portfolio sheet</p>;
  }

  return (
    <div className="portfolio-showcase">
      <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-y border-white/10 py-4 sm:gap-x-10">
        {[
          { value: stats.looks, label: 'Client Looks' },
          { value: stats.videos, label: 'Reels' },
          { value: stats.photos, label: 'Photos' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-2xl text-ivory sm:text-3xl">{s.value}+</p>
            <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {featured && featuredCover && active === 'all' && !selected && (
        <motion.button
          type="button"
          onClick={() => setSelected(featured)}
          className="group relative mb-10 w-full overflow-hidden text-left"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative aspect-[16/9] overflow-hidden sm:aspect-[21/9]">
            <FeaturedBannerMedia model={featured} cover={featuredCover} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
              <p className="text-[10px] font-semibold tracking-[0.28em] text-rose-gold-light uppercase">
                Featured Transformation
              </p>
              <h3 className="font-display mt-2 max-w-md text-3xl text-ivory sm:text-4xl md:text-5xl">{featured.title}</h3>
              <p className="mt-3 max-w-sm text-sm text-white/60">
                Tap to watch the reel and swipe through every photo from this session.
              </p>
              <span className="mt-5 inline-flex w-fit items-center gap-2 border border-rose-gold/50 bg-rose-gold/10 px-5 py-2.5 text-[11px] font-semibold tracking-[0.15em] text-rose-gold-light uppercase backdrop-blur-sm transition group-hover:bg-rose-gold group-hover:text-white">
                ▶ Play Full Experience
              </span>
            </div>
          </div>
        </motion.button>
      )}

      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActive(cat.key)}
            className={`rounded-full px-5 py-2.5 text-[11px] font-medium tracking-widest uppercase transition-all duration-300 ${
              active === cat.key
                ? 'bg-rose-gold text-white shadow-[0_8px_30px_rgba(184,135,106,0.35)]'
                : 'border border-white/15 text-white/50 hover:border-rose-gold/40 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div
        className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
        onMouseLeave={() => setHoveredId(null)}
      >
        {items.map((model, i) =>
          selected?.id === model.id ? null : (
            <div key={model.id} onMouseEnter={() => setHoveredId(model.id)} className="contents">
              <PortfolioCard
                model={model}
                index={i}
                isDimmed={hoveredId !== null && hoveredId !== model.id}
                hovered={hoveredId === model.id}
                onSelect={() => setSelected(model)}
              />
            </div>
          ),
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <AlbumViewer
            model={selected}
            layoutId={hasReel(selected) ? `portfolio-card-${selected.id}` : undefined}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

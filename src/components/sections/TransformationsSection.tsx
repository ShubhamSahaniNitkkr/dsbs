import media from '../../data/media.json';
import type { Transformation } from '../../types';
import BeforeAfterSlider from '../ui/BeforeAfterSlider';
import { getWhatsAppUrl } from '../../lib/utils';

const items = media.transformations as Transformation[];

export default function TransformationsSection() {
  if (items.length === 0) {
    return (
      <p className="text-center text-sm text-ivory/60">
        No transformations — add rows in Excel Transformations sheet or add folders in public/media/transformations/
      </p>
    );
  }

  return (
    <div className="space-y-14 sm:space-y-20">
      {items.map((item) => (
        <div key={item.id} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <BeforeAfterSlider
            before={item.before}
            after={item.after}
            beforeType={item.beforeType}
            afterType={item.afterType}
            alt={item.brideName}
          />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-rose-gold-light uppercase">{item.event}</p>
            <h3 className="font-display mt-3 text-3xl font-semibold text-ivory sm:text-4xl">{item.brideName}</h3>
            <p className="mt-4 text-sm leading-relaxed text-ivory/70 sm:text-base">&ldquo;{item.story}&rdquo;</p>
            <a
              href={getWhatsAppUrl(`Hi, I want a bridal look like ${item.brideName}'s transformation.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-rose mt-8 inline-flex text-[10px]"
            >
              Book Similar Look
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

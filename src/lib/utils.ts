import site from '../data/site.json';
import type { SiteConfig } from '../types';

export const siteConfig = site as SiteConfig;

export function formatPrice(price: number, startingFrom = false): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
  return startingFrom ? `${formatted}` : formatted;
}

export function getWhatsAppUrl(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${siteConfig.whatsapp}?text=${encoded}`;
}

export function getWhatsAppConsultationUrl(): string {
  return getWhatsAppUrl(siteConfig.whatsappMessages.consultation);
}

export function getWhatsAppPackageUrl(packageName: string, price: number): string {
  const message = siteConfig.whatsappMessages.package
    .replace('{packageName}', packageName)
    .replace('{price}', price.toLocaleString('en-IN'));
  return getWhatsAppUrl(message);
}

export function getWhatsAppPaymentUrl(name: string, pkg: string, amount: number): string {
  const message = siteConfig.whatsappMessages.payment
    .replace('{name}', name)
    .replace('{package}', pkg)
    .replace('{amount}', amount.toLocaleString('en-IN'));
  return getWhatsAppUrl(message);
}

export function getPhoneUrl(): string {
  return `tel:${siteConfig.phone}`;
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm)(\?|$)/i.test(url);
}

/** Optimized delivery URL — thumbnails/posters for images; passthrough for local & video. */
export function getCloudinaryUrl(url: string, width = 800, height?: number): string {
  if (!url) return url;
  if (url.includes('cloudinary.com')) {
    if (isVideoUrl(url)) return url;
    const transform = height
      ? `c_fill,w_${width},h_${height},g_face,q_auto,f_auto`
      : `c_limit,w_${width},q_auto,f_auto`;
    return url.replace('/upload/', `/upload/${transform}/`);
  }
  if (url.includes('unsplash.com') && !url.includes('w=')) {
    return `${url}?w=${width}${height ? `&h=${height}` : ''}&fit=crop&q=80`;
  }
  return url;
}

export function getCloudinaryVideoPoster(url: string, width = 800): string {
  if (!url) return url;
  if (url.includes('cloudinary.com') && isVideoUrl(url)) {
    return url.replace('/upload/', `/upload/so_0,f_jpg,w_${width},q_auto/`);
  }
  return url;
}

export function getMediaThumbUrl(url: string, size = 160): string {
  return getCloudinaryUrl(url, size, size);
}

export function getMediaPosterUrl(url: string, width = 1200): string {
  return getCloudinaryUrl(url, width);
}

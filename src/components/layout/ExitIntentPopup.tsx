import { useState, useEffect, useCallback } from 'react';
import { getWhatsAppConsultationUrl } from '../../lib/utils';

const STORAGE_KEY = 'dsbs-bridal-popup-dismissed';
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function isInCooldown(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* private browsing */
  }
}

export default function ExitIntentPopup() {
  const [show, setShow] = useState(false);
  const [blocked, setBlocked] = useState(true);

  const dismiss = useCallback(() => {
    setShow(false);
    setBlocked(true);
    markDismissed();
  }, []);

  useEffect(() => {
    if (isInCooldown()) {
      setBlocked(true);
      return;
    }
    setBlocked(false);

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) setShow(true);
    };
    const timer = setTimeout(() => {
      if (window.innerWidth < 768) setShow(true);
    }, 50000);

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timer);
    };
  }, []);

  if (blocked || !show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-md bg-ivory p-8 sm:p-10">
        <button onClick={dismiss} className="absolute top-4 right-4 text-muted hover:text-charcoal" aria-label="Close">
          ✕
        </button>
        <p className="label">Consultation</p>
        <h3 className="font-display mt-4 text-3xl text-charcoal">Book Your Bridal Look</h3>
        <p className="mt-3 text-sm text-muted">
          Schedule a free consultation with Deep Shikha — Lakmé certified bridal makeup artist in Patna.
        </p>
        <a
          href={getWhatsAppConsultationUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp mt-8 block w-full text-center"
          onClick={dismiss}
        >
          Book on WhatsApp
        </a>
      </div>
    </div>
  );
}

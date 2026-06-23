import { useState, useEffect, type FormEvent } from 'react';
import packages from '../../data/packages.json';
import payment from '../../data/payment.json';
import type { PaymentConfig } from '../../types';
import { getWhatsAppUrl } from '../../lib/utils';

const paymentConfig = payment as PaymentConfig;

interface Props {
  preselectedPackage?: string;
}

export default function PaymentForm({ preselectedPackage }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    eventType: 'Bridal Makeup',
    eventDate: '',
    package: preselectedPackage || '',
    message: '',
  });
  const [advanceAmount, setAdvanceAmount] = useState(2000);

  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/package=([^&]+)/);
    const pkgId = match?.[1] || preselectedPackage;
    if (pkgId) {
      setFormData((prev) => ({ ...prev, package: pkgId }));
      const advances: Record<string, number> = {
        'bridal-signature': 2000,
        'royal-bride': 3000,
        'luxury-wedding': 5000,
        'engagement-glow': 1000,
        'haldi-radiance': 500,
        'reception-glam': 1500,
        'party-makeup': 500,
      };
      setAdvanceAmount(advances[pkgId] || 2000);
    }
  }, [preselectedPackage]);

  const handlePackageChange = (pkgId: string) => {
    setFormData((prev) => ({ ...prev, package: pkgId }));
    const advances: Record<string, number> = {
      'bridal-signature': 2000,
      'royal-bride': 3000,
      'luxury-wedding': 5000,
      'engagement-glow': 1000,
      'haldi-radiance': 500,
      'reception-glam': 1500,
      'party-makeup': 500,
    };
    setAdvanceAmount(advances[pkgId] || 2000);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const selectedPkg = packages.find((p) => p.id === formData.package);
    const pkgName = selectedPkg?.name || formData.eventType;
    const lines = [
      'Hi Deep Shikha ji, I would like to book my bridal makeup.',
      '',
      `Name: ${formData.name}`,
      `Phone: ${formData.phone}`,
      formData.email ? `Email: ${formData.email}` : '',
      `Event: ${formData.eventType}`,
      formData.eventDate ? `Date: ${formData.eventDate}` : '',
      `Package: ${pkgName}`,
      `Suggested advance: ₹${advanceAmount.toLocaleString('en-IN')}`,
      formData.message ? `Note: ${formData.message}` : '',
    ].filter(Boolean);

    window.open(getWhatsAppUrl(lines.join('\n')), '_blank', 'noopener,noreferrer');
  };

  const inputClass =
    'w-full border border-champagne bg-ivory px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-rose-gold';
  const labelClass = 'mb-1.5 block text-[11px] font-medium tracking-widest text-muted uppercase';

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Full Name *
          </label>
          <input
            id="name"
            type="text"
            required
            minLength={2}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={inputClass}
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone *
          </label>
          <input
            id="phone"
            type="tel"
            required
            pattern="[0-9]{10}"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={inputClass}
            placeholder="10-digit number"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={inputClass}
          placeholder="your@email.com"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="eventType" className={labelClass}>
            Event Type *
          </label>
          <select
            id="eventType"
            required
            value={formData.eventType}
            onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
            className={inputClass}
          >
            <option>Bridal Makeup</option>
            <option>Engagement Makeup</option>
            <option>Haldi Makeup</option>
            <option>Reception Makeup</option>
            <option>Party Makeup</option>
            <option>Anniversary Makeup</option>
            <option>Hair Styling</option>
          </select>
        </div>
        <div>
          <label htmlFor="eventDate" className={labelClass}>
            Event Date
          </label>
          <input
            id="eventDate"
            type="date"
            value={formData.eventDate}
            onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="package" className={labelClass}>
          Package
        </label>
        <select
          id="package"
          value={formData.package}
          onChange={(e) => handlePackageChange(e.target.value)}
          className={inputClass}
        >
          <option value="">Choose a package</option>
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name} — ₹{pkg.price.toLocaleString('en-IN')}
            </option>
          ))}
        </select>
        {formData.package && (
          <p className="mt-1 text-sm text-rose-gold">
            Suggested advance: ₹{advanceAmount.toLocaleString('en-IN')}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Message
        </label>
        <textarea
          id="message"
          rows={3}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className={inputClass}
          placeholder="Special requests..."
        />
      </div>

      <button type="submit" className="btn-whatsapp w-full">
        Continue on WhatsApp
      </button>

      <p className="text-center text-xs text-muted">
        {paymentConfig.advanceNote}
      </p>
    </form>
  );
}

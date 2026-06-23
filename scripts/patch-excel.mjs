#!/usr/bin/env node
/** Syncs site-data.xlsx with media folders + updates key fields */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const excelPath = path.join(root, 'site-data.xlsx');
const mediaRoot = path.join(root, 'public/media');
const VIDEO_EXT = /\.(mp4|mov|webm)$/i;

if (!fs.existsSync(excelPath)) {
  console.log('No site-data.xlsx — run npm run init:excel');
  process.exit(1);
}

const wb = XLSX.readFile(excelPath);
let changed = false;

function setSiteField(rows, field, value) {
  const row = rows.find((r) => r.field === field);
  if (row) {
    if (String(row.value) !== String(value)) {
      row.value = value;
      changed = true;
    }
  } else {
    rows.push({ field, value });
    changed = true;
  }
}

function setSocialField(rows, field, value) {
  const row = rows.find((r) => r.field === field);
  if (row) {
    if (String(row.value) !== String(value)) {
      row.value = value;
      changed = true;
    }
  } else {
    rows.push({ field, value });
    changed = true;
  }
}

function normalizeModelFolder(name) {
  const raw = String(name || '').trim();
  if (/^model-\d+$/i.test(raw)) return raw.toLowerCase();
  const m = raw.match(/^model\s*(\d+)$/i);
  return m ? `model-${m[1]}` : '';
}

function listModelFolders() {
  const dir = path.join(mediaRoot, 'models');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((d) => {
      const full = path.join(dir, d);
      if (!fs.statSync(full).isDirectory() || d.startsWith('.')) return false;
      const folder = normalizeModelFolder(d);
      if (!folder) return false;
      const files = fs.readdirSync(full).filter((f) => !f.startsWith('.'));
      const onlyBeforeAfter =
        files.length <= 2 && files.every((f) => /^(before|after)/i.test(f));
      return !onlyBeforeAfter;
    })
    .map((d) => normalizeModelFolder(d))
    .filter(Boolean)
    .sort((a, b) => parseInt(a.replace('model-', ''), 10) - parseInt(b.replace('model-', ''), 10));
}

function listTransformationFolders() {
  const dir = path.join(mediaRoot, 'transformations');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((d) => fs.statSync(path.join(dir, d)).isDirectory() && !d.startsWith('.'))
    .sort();
}

// ─── Site fields ───
const siteRows = wb.Sheets['Site'] ? XLSX.utils.sheet_to_json(wb.Sheets['Site']) : [];
setSiteField(siteRows, 'rotation_interval_ms', '3000');
setSiteField(siteRows, 'cache_version', '1.6.0');
setSiteField(
  siteRows,
  'artist_philosophy',
  'Har chehra mere liye bahut important hai. Bhagwan ne hum sabko pehle se itna sundar banaya hai — main bas apni chhoti si expertise se us natural beauty ko enhance karti hoon, taaki aap apne special din bilkul khush aur confident mehsoos karein.',
);
wb.Sheets['Site'] = XLSX.utils.json_to_sheet(siteRows);
changed = true;

// ─── Social / Instagram ───
const socialRows = wb.Sheets['Social'] ? XLSX.utils.sheet_to_json(wb.Sheets['Social']) : [];
setSocialField(
  socialRows,
  'instagram_url',
  'https://www.instagram.com/deepshikhabeautystudio?utm_source=qr',
);
if (changed) wb.Sheets['Social'] = XLSX.utils.json_to_sheet(socialRows);

// ─── Portfolio — sync all model folders ───
const categories = ['bridal', 'engagement', 'reception', 'party', 'haldi'];
const labels = ['Bridal', 'Engagement', 'Reception', 'Party', 'Haldi'];
const folders = listModelFolders();
const portfolio = folders.map((folder, i) => {
  const n = parseInt(folder.replace('model-', ''), 10) || i + 1;
  const dir = path.join(mediaRoot, 'models', folder);
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => !f.startsWith('.'))
    : [];
  const hasPhoto = files.some((f) => /\.(jpe?g|png|webp)$/i.test(f));
  return {
    look_id: folder,
    title: `${labels[i % labels.length]} Look ${n}`,
    category: categories[i % categories.length],
    folder,
    cover_file: hasPhoto ? 'photo-01.jpeg' : '',
    video_files: '',
    photo_files: '',
  };
});

if (portfolio.length) {
  wb.Sheets['Portfolio'] = XLSX.utils.json_to_sheet(portfolio);
  changed = true;
  console.log(`Portfolio: ${portfolio.length} models synced from disk`);
}

// ─── Transformations — from transformations/ folders only ───
const tFolders = listTransformationFolders();
if (tFolders.length) {
  const transformations = tFolders.map((folder, i) => ({
    id: folder,
    bride_name: `Bride ${i + 1}`,
    event: 'Bridal',
    story: 'Real before & after transformation — drag the slider to compare.',
    package: 'Royal Bride Package',
    folder,
    before_type: '',
    after_type: '',
    before_file: '',
    after_file: '',
  }));
  wb.Sheets['Transformations'] = XLSX.utils.json_to_sheet(transformations);
  changed = true;
  console.log(`Transformations: ${transformations.length} synced from disk`);
}

// ─── Hero — more model covers ───
const hero = folders.slice(0, 6).map((folder, i) => {
  const dir = path.join(mediaRoot, 'models', folder);
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => !f.startsWith('.'))
    : [];
  const photo = files.find((f) => /^photo-01/i.test(f) && /\.(jpe?g|png|webp)$/i.test(f));
  const video = files.find((f) => VIDEO_EXT.test(f));
  const file = photo || video || files[0] || 'photo-01.jpeg';
  const type = VIDEO_EXT.test(file) ? 'video' : 'image';
  return {
    order: i + 1,
    type,
    folder: `models/${folder}`,
    file,
    alt: `${labels[i % labels.length]} makeup look`,
  };
});
if (hero.length) {
  wb.Sheets['Hero'] = XLSX.utils.json_to_sheet(hero);
  changed = true;
  console.log(`Hero: ${hero.length} rotation slides`);
}

// ─── Testimonials — 6+ with model photos ───
const testimonials = [
  {
    id: 'rev1',
    type: 'text',
    name: 'Priya Sharma',
    rating: 5,
    text: 'Deep Shikha ji ne meri wedding look ko perfect bana diya — sabne compliment kiya!',
    event: 'Bridal Makeup',
    date: '2025-12',
    model_id: 'model-1',
  },
  {
    id: 'rev2',
    type: 'text',
    name: 'Ananya Singh',
    rating: 5,
    text: 'Engagement look itni sundar thi ki sab photos mein shine kar rahi thi!',
    event: 'Engagement Makeup',
    date: '2025-11',
    model_id: 'model-2',
  },
  {
    id: 'rev3',
    type: 'text',
    name: 'Sneha Kumari',
    rating: 5,
    text: 'Professional, punctual, and incredibly talented. Best in Patna!',
    event: 'Reception Makeup',
    date: '2025-10',
    model_id: 'model-3',
  },
  {
    id: 'rev4',
    type: 'text',
    name: 'Kavya Reddy',
    rating: 5,
    text: 'Party makeup bilkul flawless tha — poori raat glow maintain raha.',
    event: 'Party Makeup',
    date: '2025-09',
    model_id: 'model-4',
  },
  {
    id: 'rev5',
    type: 'text',
    name: 'Riya Patel',
    rating: 5,
    text: 'Haldi look natural aur fresh thi. Bahut khush hoon result se!',
    event: 'Haldi Makeup',
    date: '2025-08',
    model_id: 'model-5',
  },
  {
    id: 'rev6',
    type: 'text',
    name: 'Meera Joshi',
    rating: 5,
    text: 'Deep Shikha ji ka makeup long-lasting hai aur photos mein amazing dikhta hai.',
    event: 'Bridal Makeup',
    date: '2025-07',
    model_id: 'model-6',
  },
];
wb.Sheets['Testimonials'] = XLSX.utils.json_to_sheet(testimonials);
changed = true;
console.log(`Testimonials: ${testimonials.length} with model photos`);

// ─── Team — artist photo + philosophy ───
const team = [
  {
    name: 'Deep Shikha',
    role: 'Founder & Lead Makeup Artist',
    certification: 'Lakmé Certified Bridal Makeup Artist',
    bio: '100+ brides across Patna trust Deep Shikha for timeless, camera-ready bridal looks.',
    philosophy:
      'Har chehra mere liye bahut important hai. Bhagwan ne hum sabko pehle se itna sundar banaya hai — main bas apni chhoti si expertise se us natural beauty ko enhance karti hoon, taaki aap apne special din bilkul khush aur confident mehsoos karein.',
    image_path: '/media/deep_shikha.png',
    instagram: '@deepshikhabeautystudio',
    is_founder: 'yes',
  },
];
wb.Sheets['Team'] = XLSX.utils.json_to_sheet(team);
changed = true;
console.log('Team: artist image + philosophy updated');

// ─── Payment section copy ───
function setPaymentField(rows, field, value) {
  const row = rows.find((r) => r.field === field);
  if (row) row.value = value;
  else rows.push({ field, value });
}
const paymentRows = wb.Sheets['Payment'] ? XLSX.utils.sheet_to_json(wb.Sheets['Payment']) : [];
setPaymentField(paymentRows, 'section_label', 'Booking');
setPaymentField(paymentRows, 'section_title', 'Reserve Your Wedding Date');
setPaymentField(
  paymentRows,
  'section_subtitle',
  'Share your celebration details — we confirm your slot personally on WhatsApp.',
);
setPaymentField(
  paymentRows,
  'advance_note',
  'No payment gateway — just your details and a direct WhatsApp conversation with Deep Shikha.',
);
wb.Sheets['Payment'] = XLSX.utils.json_to_sheet(paymentRows);
changed = true;

// ─── SEO sheet if missing ───
if (!wb.SheetNames.includes('SEO')) {
  const seo = [
    {
      slug: 'bridal-makeup-patna',
      title: 'Best Bridal Makeup Artist in Patna | Deep Shikha Beauty Studio',
      h1: 'Best Bridal Makeup Artist in Patna',
      description:
        'Lakmé certified bridal makeup artist in Patna with 100+ happy brides. Book consultation on WhatsApp.',
      keywords: 'bridal makeup artist patna, bridal makeup patna, wedding makeup patna',
      gallery_category: 'bridal',
      featured_package_id: 'royal-bride',
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(seo), 'SEO');
  changed = true;
}

if (!wb.SheetNames.includes('Work')) {
  const work = [
    { field: 'enabled', value: 'yes' },
    { field: 'label', value: 'Work in Progress' },
    { field: 'title', value: 'Fresh Looks Coming Soon' },
    {
      field: 'subtitle',
      value: "Sneak peek from Deep Shikha's studio — full albums landing soon.",
    },
    { field: 'folder', value: 'work' },
    { field: 'photo_files', value: '' },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(work), 'Work');
  changed = true;
}

if (changed) {
  XLSX.writeFile(wb, excelPath);
  console.log('Updated site-data.xlsx');
} else {
  console.log('Excel already up to date');
}

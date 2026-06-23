#!/usr/bin/env node
/**
 * Reads site-data.xlsx from project root → generates src/data/*.json
 * Run: npm run sync
 * Auto-runs before: npm run build
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const excelPath = path.join(root, 'site-data.xlsx');
const dataDir = path.join(root, 'src/data');
const mediaRoot = path.join(root, 'public/media');

const VIDEO_EXT = /\.(mp4|mov|webm)$/i;
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

function writeJson(file, data) {
  fs.writeFileSync(path.join(dataDir, file), JSON.stringify(data, null, 2) + '\n');
}

function sheetRows(wb, name) {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

function siteMap(rows) {
  const map = {};
  for (const row of rows) {
    const key = String(row.field || row.Field || '').trim();
    const val = row.value ?? row.Value ?? '';
    if (key) map[key] = String(val).trim();
  }
  return map;
}

function splitList(str) {
  return String(str || '')
    .split(/[,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

let cloudinaryMap = null;

function loadCloudinaryMap() {
  if (cloudinaryMap) return cloudinaryMap;
  cloudinaryMap = {};
  const manifestPath = path.join(root, 'cloudinary-manifest.json');
  if (!fs.existsSync(manifestPath)) return cloudinaryMap;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const [rel, entry] of Object.entries(manifest.files || {})) {
    if (entry?.url) {
      cloudinaryMap[`/media/${rel}`] = entry.url;
      cloudinaryMap[rel] = entry.url;
    }
  }
  return cloudinaryMap;
}

function resolveCloudinaryUrl(pathOrUrl) {
  const s = String(pathOrUrl || '').trim();
  if (!s || s.startsWith('http')) return s;
  const map = loadCloudinaryMap();
  const local = s.startsWith('/media/') ? s : `/media/${s.replace(/^\//, '')}`;
  return map[local] || map[local.replace(/^\/media\//, '')] || s;
}

function mediaPath(folder, file) {
  const f = String(file || '').trim();
  if (!f) return '';
  if (f.startsWith('http')) return f;
  if (f.startsWith('/')) return resolveCloudinaryUrl(f);
  const dir = String(folder || '').trim().replace(/^\/|\/$/g, '');
  const local = dir ? `/media/${dir}/${f}` : `/media/${f}`;
  return resolveCloudinaryUrl(local);
}

function detectType(file) {
  if (VIDEO_EXT.test(file)) return 'video';
  if (IMAGE_EXT.test(file)) return 'image';
  return 'image';
}

function normalizeModelFolderName(name) {
  const raw = String(name || '').trim();
  if (!raw || raw.startsWith('.')) return '';
  if (/^model-\d+$/i.test(raw)) return raw.toLowerCase();
  const m = raw.match(/^model\s*(\d+)$/i);
  if (m) return `model-${m[1]}`;
  return '';
}

function isTransformationLikeFolder(files) {
  if (!files.length) return true;
  return files.length <= 2 && files.every((f) => /^(before|after)/i.test(f));
}

function listModelFolders() {
  const dir = path.join(mediaRoot, 'models');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((d) => {
      const full = path.join(dir, d);
      if (!fs.statSync(full).isDirectory() || d.startsWith('.')) return false;
      const folder = normalizeModelFolderName(d);
      if (!folder) return false;
      const files = fs.readdirSync(full).filter((f) => !f.startsWith('.'));
      return !isTransformationLikeFolder(files);
    })
    .map((d) => normalizeModelFolderName(d))
    .filter(Boolean)
    .sort((a, b) => parseInt(a.replace('model-', ''), 10) - parseInt(b.replace('model-', ''), 10));
}

function scanModelFolder(folder) {
  const dir = path.join(mediaRoot, 'models', folder);
  if (!fs.existsSync(dir)) return { videos: [], photos: [] };
  const files = fs.readdirSync(dir).filter((f) => !f.startsWith('.'));
  const videos = files
    .filter((f) => VIDEO_EXT.test(f))
    .sort()
    .map((f) => `/media/models/${folder}/${f}`);
  const photos = files
    .filter((f) => IMAGE_EXT.test(f))
    .sort()
    .map((f) => `/media/models/${folder}/${f}`);
  return { videos, photos };
}

/** Folder key: transformation-1 (under public/media/transformations/) */
function normalizeTransformFolder(folder, id) {
  const raw = String(folder || id || '').trim();
  if (!raw) return `transformations/${id}`;
  if (raw.startsWith('transformations/')) return raw;
  if (raw.startsWith('models/')) return raw;
  const slug = raw
    .replace(/^Model\s*/i, 'transformation-')
    .replace(/\s+/g, '-')
    .toLowerCase();
  return `transformations/${slug}`;
}

function scanTransformationFolder(folderKey) {
  const rel = folderKey.replace(/^transformations\//, '');
  const dir = path.join(mediaRoot, 'transformations', rel);
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir).filter((f) => !f.startsWith('.'));
  const base = `transformations/${rel}`;

  const beforeNamed = files.find((f) => /^before/i.test(f));
  const afterNamed = files.find((f) => /^after/i.test(f));
  if (beforeNamed && afterNamed) {
    return {
      before: mediaPath(base, beforeNamed),
      after: mediaPath(base, afterNamed),
      beforeType: detectType(beforeNamed),
      afterType: detectType(afterNamed),
    };
  }

  const videos = files.filter((f) => VIDEO_EXT.test(f)).sort();
  const photos = files.filter((f) => IMAGE_EXT.test(f)).sort();

  if (videos.length >= 2) {
    return {
      before: mediaPath(base, videos[0]),
      after: mediaPath(base, videos[1]),
      beforeType: 'video',
      afterType: 'video',
    };
  }
  if (videos.length === 1 && photos.length >= 1) {
    return {
      before: mediaPath(base, videos[0]),
      after: mediaPath(base, photos[0]),
      beforeType: 'video',
      afterType: 'image',
    };
  }
  if (photos.length >= 2) {
    return {
      before: mediaPath(base, photos[0]),
      after: mediaPath(base, photos[1]),
      beforeType: 'image',
      afterType: 'image',
    };
  }
  if (videos.length === 1) {
    return {
      before: mediaPath(base, videos[0]),
      after: mediaPath(base, videos[0]),
      beforeType: 'video',
      afterType: 'video',
    };
  }
  return null;
}

function listTransformationFolders() {
  const dir = path.join(mediaRoot, 'transformations');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((d) => fs.statSync(path.join(dir, d)).isDirectory() && !d.startsWith('.'))
    .sort();
}

function scanWorkFolder(folder = 'work') {
  const dir = path.join(mediaRoot, folder);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => !f.startsWith('.') && (IMAGE_EXT.test(f) || VIDEO_EXT.test(f)))
    .sort()
    .map((f) => ({
      src: mediaPath(folder, f),
      type: VIDEO_EXT.test(f) ? 'video' : 'image',
    }));
}

function buildWorkInProgress(workRows) {
  const w = siteMap(workRows);
  const folder = String(w.folder || 'work').trim();
  const listed = splitList(w.photo_files || w.files).map((f) => ({
    src: mediaPath(folder, f),
    type: detectType(f),
  }));
  const items = listed.length ? listed : scanWorkFolder(folder);
  const enabled = String(w.enabled || 'yes').toLowerCase() !== 'no';
  if (!enabled || items.length === 0) return null;
  return {
    enabled: true,
    label: w.label || 'Work in Progress',
    title: w.title || 'Fresh Looks Coming Soon',
    subtitle:
      w.subtitle ||
      "Sneak peek from Deep Shikha's studio — full albums landing soon.",
    items,
  };
}

function buildSeoPages(rows) {
  return rows
    .filter((r) => String(r.slug || '').trim())
    .map((r) => ({
      slug: String(r.slug).trim(),
      title: String(r.title || '').trim(),
      h1: String(r.h1 || r.title || '').trim(),
      description: String(r.description || '').trim(),
      keywords: String(r.keywords || '').trim(),
      galleryCategory: String(r.gallery_category || 'bridal').trim(),
      featuredPackageId: String(r.featured_package_id || 'royal-bride').trim(),
    }));
}

function writeLlmsTxt(site, portfolio, packages, faq, transformations, seoPages) {
  const domain = String(site.domain || 'https://deepshikhabeautystudio.com').replace(/\/$/, '');
  const baseLines = [
    `# ${site.brand}`,
    '',
    `> ${site.tagline}. ${site.intro || ''}`,
    '',
    '## Contact',
    `- Phone: ${site.phone}`,
    `- WhatsApp: +${site.whatsapp}`,
    `- Email: ${site.email}`,
    `- Location: ${site.location}`,
    `- Website: ${domain}`,
    '',
    '## Services',
    site.hero_services || 'Bridal, Engagement, Haldi, Reception, Party Makeup',
    '',
    '## Packages',
    ...packages.map((p) => `- ${p.name}: ₹${p.price.toLocaleString('en-IN')}`),
    '',
    '## Portfolio',
    ...portfolio.map((m) => `- ${m.title} (${m.category}): ${m.videos.length} videos, ${m.photos.length} photos`),
    '',
    '## FAQ',
    ...faq.map((f) => `- Q: ${f.question} A: ${f.answer}`),
    '',
    '## Pages',
    `- Home: ${domain}/`,
    ...seoPages.map((p) => `- ${p.h1 || p.title}: ${domain}/${p.slug}`),
    '',
    `Full details: ${domain}/llms-full.txt`,
  ];
  fs.writeFileSync(path.join(root, 'public/llms.txt'), baseLines.join('\n') + '\n');

  const full = [
    ...baseLines.slice(0, -2),
    '',
    '## About',
    site.intro || '',
    '',
    '## Stats',
    `- ${site.happy_brides || 100}+ happy brides`,
    `- Google rating: ${site.google_rating || 4.9}`,
    '',
    '## Transformations',
    ...transformations.map((t) => `- ${t.brideName} (${t.event}): ${t.story}`),
  ];
  fs.writeFileSync(path.join(root, 'public/llms-full.txt'), full.join('\n') + '\n');
}

function patchSwCache(cacheVersion) {
  const swPath = path.join(root, 'public/sw.js');
  if (!fs.existsSync(swPath)) return;
  const version = `dsbs-v${String(cacheVersion || '1.0.0').replace(/\s+/g, '')}`;
  let sw = fs.readFileSync(swPath, 'utf8');
  sw = sw.replace(/const CACHE_VERSION = '[^']+';/, `const CACHE_VERSION = '${version}';`);
  sw = sw.replace(/const PRECACHE = \[[^\]]*\];/, 'const PRECACHE = [];');
  fs.writeFileSync(swPath, sw);
}

function buildPortfolio(rows) {
  const categories = ['bridal', 'engagement', 'reception', 'party', 'haldi'];
  const labels = ['Bridal', 'Engagement', 'Reception', 'Party', 'Haldi'];

  const fromExcel = rows
    .filter((r) => String(r.look_id || r.id || '').trim())
    .map((r) => {
      const id = String(r.look_id || r.id).trim();
      const folder = normalizeModelFolderName(String(r.folder || id).trim()) || id;
      const scanned = scanModelFolder(folder);

      const videoFiles = splitList(r.video_files);
      const photoFiles = splitList(r.photo_files);
      const videos =
        videoFiles.length > 0
          ? videoFiles.map((f) => mediaPath(`models/${folder}`, f))
          : scanned.videos;
      const photos =
        photoFiles.length > 0
          ? photoFiles.map((f) => mediaPath(`models/${folder}`, f))
          : scanned.photos;

      const coverFile = String(r.cover_file || '').trim();
      const coverDisk = coverFile
        ? path.join(mediaRoot, 'models', folder, coverFile)
        : '';
      const cover = coverFile && fs.existsSync(coverDisk)
        ? mediaPath(`models/${folder}`, coverFile)
        : photos[0] || videos[0] || null;

      return {
        id,
        title: String(r.title || id).trim(),
        category: String(r.category || 'bridal').trim().toLowerCase(),
        cover,
        video: videos[0] || null,
        videos,
        photos,
        _folder: folder,
      };
    })
    .filter((m) => m.photos.length > 0 || m.videos.length > 0);

  const excelFolders = new Set(fromExcel.map((m) => m._folder));

  for (const folder of listModelFolders()) {
    if (excelFolders.has(folder)) continue;
    const scanned = scanModelFolder(folder);
    if (!scanned.videos.length && !scanned.photos.length) continue;
    const n = parseInt(folder.replace('model-', ''), 10) || fromExcel.length + 1;
    fromExcel.push({
      id: folder,
      title: `${labels[(n - 1) % labels.length]} Look ${n}`,
      category: categories[(n - 1) % categories.length],
      cover: scanned.photos[0] || scanned.videos[0] || null,
      video: scanned.videos[0] || null,
      videos: scanned.videos,
      photos: scanned.photos,
      _folder: folder,
    });
  }

  return fromExcel
    .sort((a, b) => {
      const na = parseInt(a._folder.replace('model-', ''), 10) || 0;
      const nb = parseInt(b._folder.replace('model-', ''), 10) || 0;
      return na - nb;
    })
    .map(({ _folder, ...m }) => m);
}

function buildTransformations(rows) {
  const fromExcel = rows
    .filter((r) => String(r.id || '').trim())
    .map((r) => {
      const id = String(r.id).trim();
      const folder = normalizeTransformFolder(r.folder || r.media_folder, id);
      let beforeFile = String(r.before_file || '').trim();
      let afterFile = String(r.after_file || '').trim();
      let beforeType = String(r.before_type || '').trim().toLowerCase();
      let afterType = String(r.after_type || '').trim().toLowerCase();

      if (!beforeFile || !afterFile) {
        const scanned = scanTransformationFolder(folder);
        if (scanned) {
          if (!beforeFile) {
            beforeFile = scanned.before.replace(`/media/${folder}/`, '');
            beforeType = scanned.beforeType;
          }
          if (!afterFile) {
            afterFile = scanned.after.replace(`/media/${folder}/`, '');
            afterType = scanned.afterType;
          }
        }
      }

      beforeType = beforeType || detectType(beforeFile);
      afterType = afterType || detectType(afterFile);

      return {
        id,
        brideName: String(r.bride_name || r.name || `Client ${id}`).trim(),
        event: String(r.event || 'Bridal').trim(),
        story: String(r.story || '').trim(),
        packageUsed: String(r.package || r.package_used || '').trim(),
        before: mediaPath(folder, beforeFile),
        after: mediaPath(folder, afterFile),
        beforeType: beforeType === 'video' ? 'video' : 'image',
        afterType: afterType === 'video' ? 'video' : 'image',
        _folder: folder,
      };
    })
    .filter((t) => t.before && t.after);

  const excelIds = new Set(fromExcel.map((t) => t.id));
  const excelFolders = new Set(fromExcel.map((t) => t._folder.replace(/^transformations\//, '')));

  // Auto-add folders in transformations/ not yet in Excel
  for (const dirName of listTransformationFolders()) {
    if (excelFolders.has(dirName)) continue;
    const folder = `transformations/${dirName}`;
    const scanned = scanTransformationFolder(folder);
    if (!scanned) continue;
    const autoId = dirName;
    if (excelIds.has(autoId)) continue;
    fromExcel.push({
      id: autoId,
      brideName: dirName.replace(/transformation-/i, 'Client ').replace(/-/g, ' '),
      event: 'Bridal',
      story: '',
      packageUsed: '',
      before: scanned.before,
      after: scanned.after,
      beforeType: scanned.beforeType,
      afterType: scanned.afterType,
      _folder: folder,
    });
  }

  return fromExcel
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    .map(({ _folder, ...t }) => t);
}

function buildHero(rows) {
  return rows
    .filter((r) => r.file_path || r.file || r.filename)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((r) => {
      const file = String(r.file_path || r.file || r.filename || '').trim();
      const folder = String(r.folder || '').trim();
      const src = file.startsWith('/') ? file : mediaPath(folder, file);
      const type = String(r.type || detectType(file)).trim().toLowerCase();
      return {
        type: type === 'video' ? 'video' : 'image',
        src,
        alt: String(r.alt || '').trim() || 'Bridal makeup',
        ...(r.poster ? { poster: String(r.poster).trim() } : {}),
      };
    });
}

function buildPackages(rows) {
  return rows
    .filter((r) => String(r.id || '').trim())
    .map((r) => ({
      id: String(r.id).trim(),
      name: String(r.name || '').trim(),
      price: Number(r.price) || 0,
      ...(String(r.price_label || '').trim() ? { priceLabel: String(r.price_label).trim() } : {}),
      includes: splitList(r.includes).length
        ? splitList(r.includes)
        : String(r.includes || '')
            .split('|')
            .map((s) => s.trim())
            .filter(Boolean),
      ...(String(r.description || '').trim() ? { description: String(r.description).trim() } : {}),
      ...(String(r.most_popular || '').toLowerCase() === 'yes' ? { mostPopular: true } : {}),
      ...(String(r.starting_from || '').toLowerCase() === 'yes' ? { startingFrom: true } : {}),
    }));
}

function buildFaq(rows) {
  return rows
    .filter((r) => String(r.question || '').trim())
    .map((r) => ({
      question: String(r.question).trim(),
      answer: String(r.answer || '').trim(),
    }));
}

function buildTestimonials(rows, portfolio = []) {
  const modelById = Object.fromEntries(portfolio.map((m) => [m.id, m]));

  return rows
    .filter((r) => String(r.id || r.name || '').trim())
    .map((r) => {
      const modelId = String(r.model_id || r.model || '').trim();
      const model = modelById[modelId];
      let image = String(r.image || r.photo || '').trim();
      if (image && !image.startsWith('/') && !image.startsWith('http')) {
        image = mediaPath(`models/${modelId}`, image);
      }
      if (!image && model) {
        image = model.cover || model.photos[0] || model.videos[0] || '';
      }

      return {
        id: String(r.id || `rev-${r.name}`).trim(),
        type: String(r.type || 'text').trim(),
        name: String(r.name || '').trim(),
        rating: Number(r.rating) || 5,
        text: String(r.text || '').trim(),
        ...(String(r.event || '').trim() ? { event: String(r.event).trim() } : {}),
        ...(String(r.date || '').trim() ? { date: String(r.date).trim() } : {}),
        ...(modelId ? { modelId } : {}),
        ...(image ? { image } : {}),
      };
    });
}

function resolveImagePath(image) {
  const raw = String(image || '').trim();
  if (!raw) return resolveCloudinaryUrl('/media/deep_shikha.png') || resolveCloudinaryUrl('/media/logo.png');
  if (raw.startsWith('http')) return raw;
  if (raw.startsWith('/')) return resolveCloudinaryUrl(raw);
  return mediaPath('team', raw);
}

function buildTeam(rows, site = {}) {
  return rows
    .filter((r) => String(r.name || '').trim())
    .map((r) => {
      const image = String(r.image_path || r.image || '').trim();
      const philosophy =
        String(r.philosophy || r.quote || '').trim() ||
        String(site.artist_philosophy || '').trim();
      return {
        name: String(r.name).trim(),
        role: String(r.role || '').trim(),
        ...(String(r.certification || '').trim()
          ? { certification: String(r.certification).trim() }
          : {}),
        bio: String(r.bio || '').trim(),
        ...(philosophy ? { philosophy } : {}),
        image: resolveImagePath(image),
        ...(String(r.instagram || '').trim() ? { instagram: String(r.instagram).trim() } : {}),
        ...(String(r.is_founder || '').toLowerCase() === 'yes' ? { isFounder: true } : {}),
      };
    });
}

function buildPayment(site, rows) {
  const extra = siteMap(rows);
  const advances = {};
  for (const [k, v] of Object.entries(extra)) {
    if (k.startsWith('advance_') && k !== 'advance_note') {
      advances[k.replace('advance_', '')] = Number(v) || 0;
    }
  }
  return {
    upiId: extra.upi_id || site.upi_id || 'deepshikha@upi',
    qrImage: extra.qr_image || '/images/payment-qr.svg',
    displayName: extra.display_name || site.brand || 'Deep Shikha Beauty Studio',
    advanceNote: extra.advance_note || 'Share your details on WhatsApp to reserve your date.',
    sectionLabel: extra.section_label || 'Booking',
    sectionTitle: extra.section_title || 'Reserve Your Wedding Date',
    sectionSubtitle:
      extra.section_subtitle ||
      'Tell us about your celebration — we will confirm availability on WhatsApp.',
    defaultAdvance: Number(extra.default_advance) || 2000,
    packagesAdvance: Object.keys(advances).length
      ? advances
      : {
          'bridal-signature': 2000,
          'royal-bride': 3000,
          'luxury-wedding': 5000,
          'engagement-glow': 1000,
          'haldi-radiance': 500,
          'reception-glam': 1500,
          'party-makeup': 500,
        },
    instructions: splitList(extra.instructions).length
      ? splitList(extra.instructions)
      : [
          'Fill your details in the form below',
          'Scan the QR code and pay the advance amount',
          'Share payment screenshot on WhatsApp for instant confirmation',
        ],
    formEndpoint: extra.form_endpoint || 'https://api.web3forms.com/submit',
    accessKey: extra.access_key || 'YOUR_WEB3FORMS_ACCESS_KEY',
    notificationEmail: extra.notification_email || site.email || '',
  };
}

function sync() {
  if (!fs.existsSync(excelPath)) {
    console.error('site-data.xlsx not found at project root. Run: npm run init:excel');
    process.exit(1);
  }

  const wb = XLSX.readFile(excelPath);
  const site = siteMap(sheetRows(wb, 'Site'));
  const portfolio = buildPortfolio(sheetRows(wb, 'Portfolio'));
  const transformations = buildTransformations(sheetRows(wb, 'Transformations'));
  const heroRotation = buildHero(sheetRows(wb, 'Hero'));
  const packages = buildPackages(sheetRows(wb, 'Packages'));
  const faq = buildFaq(sheetRows(wb, 'FAQ'));
  const testimonials = buildTestimonials(sheetRows(wb, 'Testimonials'), portfolio);
  const team = buildTeam(sheetRows(wb, 'Team'), site);
  const payment = buildPayment(site, sheetRows(wb, 'Payment'));
  const socialRows = siteMap(sheetRows(wb, 'Social'));
  const seoPages = buildSeoPages(sheetRows(wb, 'SEO'));
  const workInProgress = buildWorkInProgress(sheetRows(wb, 'Work'));

  const phone = site.phone || '+91 9142760891';
  const whatsapp = site.whatsapp || phone.replace(/\D/g, '').replace(/^91/, '91');
  const domain = site.domain || 'https://deepshikhabeautystudio.com';

  writeJson('site.json', {
    brand: site.brand || 'Deep Shikha Beauty Studio',
    tagline: site.tagline || 'Lakmé Certified Bridal Makeup Artist',
    location: site.location || 'Patna, Bihar',
    phone,
    whatsapp: whatsapp.startsWith('91') ? whatsapp : `91${whatsapp.replace(/\D/g, '')}`,
    email: site.email || 'spongi1997deepshikha@gmail.com',
    address: site.address || 'Patna, Bihar, India',
    domain,
    seo: {
      title:
        site.seo_title ||
        `${site.brand || 'Deep Shikha Beauty Studio'} | Bridal Makeup Artist Patna`,
      description:
        site.seo_description ||
        `Lakmé certified bridal makeup artist in Patna. ${site.happy_brides || 100}+ happy brides. Book on WhatsApp.`,
      keywords:
        site.seo_keywords ||
        'bridal makeup patna, makeup artist patna, deep shikha beauty studio, wedding makeup patna',
      ogImage: resolveCloudinaryUrl(site.og_image || '/media/logo.png'),
    },
    stats: {
      happyBrides: Number(site.happy_brides) || 100,
      yearsExperience: Number(site.years_experience) || 6,
      googleRating: Number(site.google_rating) || 4.9,
    },
    certifications: splitList(site.certifications).length
      ? splitList(site.certifications)
      : ['Lakmé Certified', 'Professional Hair Styling'],
    whatsappMessages: {
      consultation:
        site.wa_consultation ||
        'Hi Deep Shikha ji, I want to book a bridal makeup consultation for my wedding. Please share your availability.',
      package:
        site.wa_package ||
        "Hi Deep Shikha ji, I'm interested in the {packageName} package (₹{price}). Please share availability.",
      general:
        site.wa_general ||
        'Hi Deep Shikha ji, I visited your website and would like to know more about your bridal makeup services.',
      payment:
        site.wa_payment ||
        'Hi Deep Shikha ji, I have completed the advance payment. Name: {name}, Package: {package}, Amount: ₹{amount}.',
    },
  });

  writeJson('models.json', { models: portfolio });

  writeJson('media.json', {
    settings: {
      rotationIntervalMs: Number(site.rotation_interval_ms) || 4500,
      cacheVersion: String(site.cache_version || '1.4.0'),
    },
    logo: resolveCloudinaryUrl(site.logo || '/media/logo.png'),
    logoAlt: site.logo_alt || site.brand || 'Deep Shikha Beauty Studio',
    hero: {
      overline: site.hero_overline || 'Lakmé Certified Artist',
      title: site.hero_title || 'Beauty Studio',
      subtitle: site.hero_subtitle || 'by Deep Shikha',
      badge: site.hero_badge || '100+ Happy Brides',
      location: site.location || 'Patna, Bihar',
      description:
        site.intro ||
        site.hero_description ||
        'Premium bridal makeup artistry for your wedding day.',
      services: site.hero_services || 'Bridal | Engagement | Haldi | Reception | Party Makeup',
      titleLine1: site.hero_title_line1 || "Patna's Trusted",
      titleLine2: site.hero_title_line2 || 'Bridal Makeup Artist',
      philosophy:
        site.artist_philosophy ||
        team.find((m) => m.isFounder)?.philosophy ||
        '',
      rotation: heroRotation.length
        ? heroRotation
        : portfolio.slice(0, 4).map((m) => ({
            type: 'image',
            src: m.cover || m.photos[0],
            alt: m.title,
          })),
    },
    transformations,
    team,
    ...(workInProgress ? { workInProgress } : {}),
    instagramReels: [],
  });

  if (packages.length) writeJson('packages.json', packages);
  if (faq.length) writeJson('faq.json', faq);
  if (testimonials.length) writeJson('testimonials.json', testimonials);

  writeJson('payment.json', payment);

  writeJson('social.json', {
    instagram: {
      handle: socialRows.instagram_handle || '@deepshikhabeautystudio',
      url:
        socialRows.instagram_url ||
        'https://www.instagram.com/deepshikhabeautystudio?utm_source=qr',
      featuredReels: [],
    },
    googleReviews: {
      url: socialRows.google_reviews_url || '',
      rating: Number(socialRows.google_rating) || Number(site.google_rating) || 4.9,
      totalReviews: Number(socialRows.google_total_reviews) || 87,
    },
  });

  if (seoPages.length) writeJson('seo-pages.json', seoPages);
  else {
    const existingSeo = path.join(dataDir, 'seo-pages.json');
    if (fs.existsSync(existingSeo)) {
      console.log('  → SEO sheet empty, keeping existing seo-pages.json');
    }
  }

  writeLlmsTxt(site, portfolio, packages, faq, transformations, seoPages);
  patchSwCache(String(site.cache_version || '1.0.0'));

  const ts = new Date().toISOString();
  console.log(`✓ Synced at ${ts}`);
  console.log(`  → ${portfolio.length} portfolio looks, ${transformations.length} transformations${workInProgress ? `, ${workInProgress.items.length} WIP items` : ''}`);
  console.log(`  → phone: ${phone}, email: ${site.email}`);
  console.log(`  → Edit site-data.xlsx then save — dev server auto-reloads`);
}

sync();

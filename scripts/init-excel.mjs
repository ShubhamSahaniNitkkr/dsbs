#!/usr/bin/env node
/**
 * Creates site-data.xlsx at project root with all current content.
 * Run once: npm run init:excel
 * Then edit Excel and run: npm run sync
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const excelPath = path.join(root, 'site-data.xlsx');
const modelsDir = path.join(root, 'public/media/models');

if (fs.existsSync(excelPath) && !process.argv.includes('--force')) {
  console.log('site-data.xlsx already exists. Run: npm run patch:excel to add new sheets');
  console.log('Or: npm run init:excel -- --force to recreate (loses your edits!)');
  process.exit(0);
}

function listModels() {
  if (!fs.existsSync(modelsDir)) return [];
  return fs
    .readdirSync(modelsDir)
    .filter((d) => d.startsWith('model-') && fs.statSync(path.join(modelsDir, d)).isDirectory())
    .sort((a, b) => parseInt(a.replace('model-', '')) - parseInt(b.replace('model-', '')));
}

const categories = ['bridal', 'engagement', 'reception', 'party', 'haldi'];
const labels = ['Bridal', 'Engagement', 'Reception', 'Party', 'Haldi'];

const readme = [
  ['HOW TO UPDATE YOUR WEBSITE'],
  [''],
  ['1. Edit this Excel file (site-data.xlsx) — change text, phone, email, titles'],
  ['2. Add photos/videos in public/media/models/model-X/ folders'],
  ['3. Update Portfolio sheet — folder name must match folder on disk'],
  ['4. Leave video_files & photo_files empty to auto-detect files in folder'],
  ['5. Save Excel — dev server auto-syncs (npm run dev)'],
  ['6. Or run: npm run sync manually'],
  [''],
  ['Sheets: Site | Hero | Portfolio | Transformations | Work | Packages | FAQ | Testimonials | Team | Payment | Social | SEO'],
];

const site = [
  { field: 'brand', value: 'Deep Shikha Beauty Studio' },
  { field: 'tagline', value: 'Lakmé Certified Bridal Makeup Artist' },
  { field: 'phone', value: '+91 9142760891' },
  { field: 'whatsapp', value: '919142760891' },
  { field: 'email', value: 'spongi1997deepshikha@gmail.com' },
  { field: 'address', value: 'Patna, Bihar, India' },
  { field: 'location', value: 'Patna, Bihar' },
  { field: 'domain', value: 'https://deepshikhabeautystudio.com' },
  { field: 'happy_brides', value: '100' },
  { field: 'years_experience', value: '6' },
  { field: 'google_rating', value: '4.9' },
  { field: 'certifications', value: 'Lakmé Certified, Professional Hair Styling' },
  { field: 'logo', value: '/media/logo.png' },
  { field: 'logo_alt', value: 'Deep Shikha Beauty Studio' },
  { field: 'hero_overline', value: 'Lakmé Certified Artist' },
  { field: 'hero_title_line1', value: "Patna's Trusted" },
  { field: 'hero_title_line2', value: 'Bridal Makeup Artist' },
  { field: 'intro', value: 'Premium bridal makeup artistry for your wedding day. HD & airbrush makeup, professional hairstyling, and complete bridal transformation.' },
  { field: 'hero_services', value: 'Bridal | Engagement | Haldi | Reception | Party Makeup' },
  { field: 'hero_badge', value: '100+ Happy Brides' },
  { field: 'rotation_interval_ms', value: '4500' },
  { field: 'cache_version', value: '1.3.0' },
  { field: 'seo_title', value: 'Deep Shikha Beauty Studio | Bridal Makeup Artist Patna' },
  { field: 'seo_description', value: 'Lakmé certified bridal makeup artist in Patna. 100+ happy brides. HD & airbrush makeup. Book on WhatsApp +91 9142760891.' },
  { field: 'seo_keywords', value: 'bridal makeup patna, makeup artist patna, deep shikha beauty studio, wedding makeup patna' },
  { field: 'og_image', value: '/media/logo.png' },
];

const hero = listModels().slice(0, 4).map((folder, i) => ({
  order: i + 1,
  type: 'image',
  folder: `models/${folder}`,
  file: 'photo-01.jpeg',
  alt: `${labels[i % labels.length]} makeup look`,
}));

const portfolio = listModels().map((folder, i) => ({
  look_id: folder,
  title: `${labels[i % labels.length]} Look ${folder.replace('model-', '')}`,
  category: categories[i % categories.length],
  folder,
  cover_file: 'photo-01.jpeg',
  video_files: '',
  photo_files: '',
}));

const transformations = [
  {
    id: 'transformation-1',
    bride_name: 'Client 1',
    event: 'Bridal',
    story: 'Drag the slider — see the real before & after transformation.',
    package: 'Royal Bride Package',
    folder: 'transformation-1',
    before_type: 'video',
    after_type: 'video',
    before_file: '',
    after_file: '',
  },
];

const packages = [
  { id: 'bridal-signature', name: 'Bridal Signature Package', price: 11999, includes: 'HD Bridal Makeup|Hair Styling|Saree/Dupatta Setting|Lashes|Touchup Kit', description: 'Perfect bridal look for your special day.', most_popular: '', starting_from: '' },
  { id: 'royal-bride', name: 'Royal Bride Package', price: 17999, includes: 'HD/Airbrush Makeup|Premium Hairstyling|Lenses|Nail Setup|Touchup Kit|Premium Products', description: 'Our most loved package.', most_popular: 'yes', starting_from: '' },
  { id: 'luxury-wedding', name: 'Luxury Wedding Package', price: 24999, includes: 'Everything in Royal Bride|Trial Makeup|Pre Wedding Consultation|Premium Luxury Products|Full Day Support', description: 'Complete luxury experience.', most_popular: '', starting_from: '' },
  { id: 'engagement-glow', name: 'Engagement Glow Package', price: 6999, includes: 'HD Makeup|Hair Styling|Lashes', description: 'Radiant engagement look.', most_popular: '', starting_from: '' },
  { id: 'haldi-radiance', name: 'Haldi Radiance Package', price: 3999, includes: 'Natural Glow Makeup|Light Hairstyling', description: 'Fresh haldi ceremony look.', most_popular: '', starting_from: 'yes' },
  { id: 'reception-glam', name: 'Reception Glam Package', price: 9999, includes: 'HD Makeup|Glam Hairstyling|Lashes|Touchup', description: 'Bold reception glam.', most_popular: '', starting_from: '' },
  { id: 'party-makeup', name: 'Party Makeup', price: 2999, includes: 'Party Makeup|Basic Hair Styling', description: 'Glamorous party look.', most_popular: '', starting_from: 'yes' },
];

const faq = [
  { question: 'Home service available hai?', answer: 'Haan, hum Patna aur nearby areas mein home service provide karte hain.' },
  { question: 'Airbrush makeup available hai?', answer: 'Haan, HD aur airbrush dono techniques use karte hain.' },
  { question: 'Advance booking kitne din pehle karni chahiye?', answer: 'Wedding season mein kam se kam 2-3 mahine pehle book karna recommend karte hain.' },
  { question: 'Advance payment kitna hai?', answer: 'Token advance ₹500 se ₹5,000 tak — package ke hisaab se.' },
];

const testimonials = [
  { id: 'rev1', type: 'text', name: 'Priya Sharma', rating: 5, text: 'Deep Shikha ji ne meri wedding look ko perfect bana diya!', event: 'Bridal Makeup', date: '2025-12' },
  { id: 'rev2', type: 'text', name: 'Ananya Singh', rating: 5, text: 'Best makeup artist in Patna! Highly recommend.', event: 'Engagement Makeup', date: '2025-11' },
  { id: 'rev3', type: 'google', name: 'Sneha Kumari', rating: 5, text: 'Professional, punctual, and incredibly talented.', event: 'Reception Makeup', date: '2025-10' },
];

const team = [
  { name: 'Deep Shikha', role: 'Founder & Lead Makeup Artist', certification: 'Lakmé Certified Bridal Makeup Artist', bio: '6+ years experience, 100+ brides transformed across Patna.', image_path: '/media/logo.png', instagram: '@deepshikhabeautystudio', is_founder: 'yes' },
];

const payment = [
  { field: 'upi_id', value: 'deepshikha@upi' },
  { field: 'qr_image', value: '/images/payment-qr.svg' },
  { field: 'display_name', value: 'Deep Shikha Beauty Studio' },
  { field: 'default_advance', value: '2000' },
  { field: 'notification_email', value: 'spongi1997deepshikha@gmail.com' },
  { field: 'access_key', value: 'YOUR_WEB3FORMS_ACCESS_KEY' },
  { field: 'instructions', value: 'Fill your details|Scan QR and pay|Share screenshot on WhatsApp' },
];

const social = [
  { field: 'instagram_handle', value: '@deepshikhabeautystudio' },
  { field: 'instagram_url', value: 'https://www.instagram.com/deepshikhabeautystudio/' },
  { field: 'google_reviews_url', value: 'https://g.page/r/example/review' },
  { field: 'google_rating', value: '4.9' },
  { field: 'google_total_reviews', value: '87' },
];

const work = [
  { field: 'enabled', value: 'yes' },
  { field: 'label', value: 'Work in Progress' },
  { field: 'title', value: 'Fresh Looks Coming Soon' },
  { field: 'subtitle', value: "Sneak peek from Deep Shikha's studio — full albums landing soon." },
  { field: 'folder', value: 'work' },
  { field: 'photo_files', value: '' },
];

const seo = [
  { slug: 'bridal-makeup-patna', title: 'Best Bridal Makeup Artist in Patna | Deep Shikha Beauty Studio', h1: 'Best Bridal Makeup Artist in Patna', description: 'Lakmé certified bridal makeup artist in Patna with 100+ happy brides.', keywords: 'bridal makeup artist patna, bridal makeup patna', gallery_category: 'bridal', featured_package_id: 'royal-bride' },
  { slug: 'engagement-makeup-patna', title: 'Engagement Makeup Artist in Patna | Deep Shikha Beauty Studio', h1: 'Engagement Makeup Artist in Patna', description: 'Stunning engagement makeup in Patna.', keywords: 'engagement makeup patna', gallery_category: 'engagement', featured_package_id: 'engagement-glow' },
  { slug: 'best-makeup-artist-patna', title: 'Best Makeup Artist in Patna | Deep Shikha Beauty Studio', h1: 'Best Makeup Artist in Patna', description: "Patna's top-rated makeup artist.", keywords: 'best makeup artist patna', gallery_category: 'bridal', featured_package_id: 'luxury-wedding' },
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(readme), 'README');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(site), 'Site');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hero), 'Hero');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(portfolio), 'Portfolio');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transformations), 'Transformations');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(work), 'Work');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(packages), 'Packages');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(faq), 'FAQ');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(testimonials), 'Testimonials');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(team), 'Team');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payment), 'Payment');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(social), 'Social');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(seo), 'SEO');

XLSX.writeFile(wb, excelPath);
console.log(`Created ${excelPath}`);
console.log('Edit Excel → run: npm run sync');

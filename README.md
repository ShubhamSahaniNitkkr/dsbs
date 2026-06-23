# Deep Shikha Beauty Studio — Website Guide

Simple steps to run, update, and deploy the site.

---

## 1. First time setup

```bash
npm install
npm run dev        # opens http://localhost:4321
```

Stop dev server: `Ctrl + C`

Build for production:

```bash
npm run build      # output in dist/
npm run preview    # test the build locally
```

---

## 2. Update website content (Excel)

**Main file: `site-data.xlsx`** (in project root — open in Excel or Google Sheets)

| Sheet | What you edit |
|-------|---------------|
| **Site** | Phone, WhatsApp, email, address, intro, SEO title |
| **Portfolio** | Client looks — title, category, cover photo, videos, photos |
| **Transformations** | Before/after slider content |
| **Hero** | Homepage rotating images/videos |
| **Packages** | Package names and prices |
| **FAQ** | Questions and answers |
| **Testimonials** | Client reviews |
| **Team** | Artist photos and bios |
| **Payment** | UPI ID, booking form settings |
| **Social** | Instagram, Google reviews links |
| **SEO** | Extra landing pages (slug, title, description) |
| **Work** | “Work in progress” sneak-peek section |

### After editing Excel

```bash
npm run sync       # reads Excel → updates src/data/*.json
```

Or just run `npm run dev` — it auto-syncs when you save the Excel file.

Or run `npm run build` — sync runs automatically before build.

---

## 3. Add photos & videos

Put files in folders under `public/media/`:

```
public/media/
├── logo.png
├── models/
│   ├── model-1/
│   │   ├── video-01.mp4      ← reel
│   │   ├── photo-01.jpeg     ← cover + album
│   │   └── photo-02.jpeg
│   └── model-2/
├── transformations/
│   └── transformation-1/
│       ├── before.jpeg
│       └── after.jpeg
├── work/                     ← work-in-progress section
└── team/
```

### Portfolio sheet (Excel)

| look_id | title | category | folder | cover_file | video_files | photo_files |
|---------|-------|----------|--------|------------|-------------|-------------|
| model-1 | Bridal Look 1 | bridal | model-1 | photo-01.jpeg | | |

- **category:** `bridal`, `engagement`, `reception`, `party`, or `haldi`
- Leave **video_files** and **photo_files** empty → files are auto-detected from the folder
- **cover_file** = the image shown on the portfolio grid (only this loads first; full album loads on click)

More detail: `public/media/README.md`

---

## 4. Large videos? Use Cloudinary (recommended)

**Do not upload big videos (200 MB+) to GitHub.** Use [Cloudinary](https://cloudinary.com) — free tier includes CDN + auto compression.

### One-time Cloudinary setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Copy `.env.example` → `.env`
3. Fill in your credentials from the Cloudinary dashboard:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Every time you add new media

```bash
npm run upload:cloudinary   # uploads public/media/* → Cloudinary CDN
npm run sync                # writes Cloudinary URLs into site-data.xlsx + JSON
npm run build               # deploy-ready site
```

- Re-runs skip files that haven’t changed (tracked in `cloudinary-manifest.json`)
- Excel gets full Cloudinary URLs in `cover_file`, `video_files`, `photo_files`
- Portfolio grid shows cover image only; reels load when visitor clicks

---

## 5. SEO & sitemap

The site auto-generates a sitemap on every build:

| File | URL |
|------|-----|
| Sitemap index | `https://deepshikhabeautystudio.com/sitemap-index.xml` |
| All pages | Home + 6 SEO landing pages (bridal, engagement, haldi, etc.) |

`public/robots.txt` already points Google to the sitemap.

### Submit to Google (once)

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your domain
3. Submit sitemap URL: `https://deepshikhabeautystudio.com/sitemap-index.xml`

### Other SEO files (auto-generated on sync)

- `public/llms.txt` — summary for AI search tools
- Schema markup on every page (JSON-LD)
- Per-page titles/descriptions from Excel **SEO** sheet

Change your domain in Excel **Site** sheet → field `domain` (also used in sitemap).

---

## 6. Deploy

Works on **Vercel**, **Netlify**, or **Cloudflare Pages**:

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Output folder | `dist` |
| Node version | 22+ |

If using Cloudinary in production, add the same 3 env vars in your hosting dashboard.

---

## 7. Useful commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start dev server + auto-sync Excel |
| `npm run sync` | Excel → JSON (manual) |
| `npm run upload:cloudinary` | Upload media to Cloudinary + update Excel |
| `npm run build` | Sync + build static site |
| `npm run init:excel` | Create fresh `site-data.xlsx` (first time only) |

---

## 8. Caching

A service worker caches media after first visit (faster repeat loads).

To force visitors to refresh cached files, bump **cache_version** in Excel **Site** sheet, then sync + rebuild.

---

## Quick daily workflow

```
1. Edit site-data.xlsx (text, titles, prices, etc.)
2. Drop new photos/videos in public/media/models/model-X/
3. npm run upload:cloudinary   ← only if you added big/new media
4. npm run dev                 ← check locally
5. npm run build               ← deploy dist/ folder
```

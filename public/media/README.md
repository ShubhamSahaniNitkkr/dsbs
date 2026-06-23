# Media Folder

**Main control file: `site-data.xlsx` at project root** (open in Excel / Google Sheets)

## Quick update steps

1. Edit **`site-data.xlsx`** — phone, email, intro, portfolio titles, packages, FAQ, everything
2. Add photos/videos in **`public/media/models/model-X/`**
3. Run **`npm run sync`** (or `npm run build` — syncs automatically)

## Large files (200 MB+ videos) — use Cloudinary

**Do not commit huge videos to GitHub.** Use Cloudinary (free tier: 25 GB storage, CDN delivery):

1. Copy **`.env.example`** → **`.env`** and add your [Cloudinary](https://cloudinary.com) credentials
2. Drop media in `public/media/` as usual
3. Run **`npm run upload:cloudinary`** — uploads to CDN and writes URLs into `site-data.xlsx`
4. Run **`npm run sync`**

Portfolio loads **cover image only** on the grid; reels and full albums load **after click**.

## Transformations (before/after slider)

Folder: `public/media/transformations/transformation-1/`

| File | Purpose |
|------|---------|
| `before.mp4` or `before.jpeg` | Before makeup (left side) |
| `after.mp4` or `after.jpeg` | After makeup (right side) |

In Excel **Transformations** sheet:

| id | bride_name | event | story | package | folder | before_file | after_file |
|----|------------|-------|-------|---------|--------|-------------|------------|
| transformation-1 | Client Name | Bridal | Her story | Royal Bride | transformation-1 | *(empty=auto)* | *(empty=auto)* |

Leave `before_file` & `after_file` empty — sync auto-detects `before.*` and `after.*` in folder.

## Work in Progress (Deep Shikha section)

Folder: `public/media/work/`

Drop photos or videos here — shows under **The Artist / Deep Shikha** with a "Work in Progress" badge.

Excel **Work** sheet:

| field | value |
|-------|-------|
| enabled | yes |
| label | Work in Progress |
| title | Fresh Looks Coming Soon |
| folder | work |
| photo_files | *(empty = auto-detect all files)* |

## Photo folder structure

```
public/media/
├── logo.png
├── models/
│   ├── model-1/
│   │   ├── video-01.mp4    ← reel (plays first)
│   │   ├── photo-01.jpeg   ← cover + album
│   │   └── photo-02.jpeg
│   └── model-2/
└── team/
```

## Portfolio sheet (in Excel)

| look_id | title | category | folder | cover_file | video_files | photo_files |
|---------|-------|----------|--------|------------|-------------|-------------|
| model-1 | Bridal Look 1 | bridal | model-1 | photo-01.jpeg | | |

Leave `video_files` and `photo_files` **empty** → files auto-detected from folder.

## Transformations (before/after)

Supports **image** or **video** — set `before_type` / `after_type` to `image` or `video` in Excel.

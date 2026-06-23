// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.deepshikhabeautystudio.com',
  trailingSlash: 'never',
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'framer-motion',
      ],
    },
  },
  integrations: [
    react(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        const url = item.url;
        if (url === 'https://www.deepshikhabeautystudio.com/') {
          item.priority = 1.0;
        } else if (url.includes('bridal-makeup') || url.includes('best-makeup-artist')) {
          item.priority = 0.9;
        } else {
          item.priority = 0.7;
        }
        item.changefreq = 'weekly';
        return item;
      },
    }),
  ],
});

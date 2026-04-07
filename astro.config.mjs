// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://george-sabau.github.io',
	base: '/george-guitars',
	integrations: [sitemap()],
});

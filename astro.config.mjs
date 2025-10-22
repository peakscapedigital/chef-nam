// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://chefnamcatering.com',
  output: 'server', // Server mode required for API endpoints
  adapter: cloudflare({
    mode: 'directory',
    functionPerRoute: false
  }),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin'),
      serialize(item) {
        // Remove trailing slashes from URLs
        item.url = item.url.replace(/\/$/, '');
        // Add last modified date
        item.lastmod = new Date();
        return item;
      },
    }),
    icon({
      iconDir: "src/icons",
      include: {
        mdi: [
          "account-group", "account-multiple", "account-tie", "baby", "briefcase", 
          "broom", "bullseye-arrow", "cake-variant", "calendar-clock", "chart-line", 
          "check-circle", "chef-hat", "chevron-down", "chevron-left", "chevron-right", 
          "chili-hot", "clipboard-text", "clock", "clock-check", "crown", 
          "currency-usd", "earth", "email", "facebook", "food", "gift", 
          "glass-cocktail", "google", "handshake", "heart", "heart-multiple", 
          "help-circle", "home", "home-heart", "instagram", "leaf", "map-marker", 
          "message-text", "office-building", "palette", "party-popper", "peanut", 
          "phone", "plus", "plus-circle-outline", "repeat", "school", 
          "silverware-fork-knife", "sprout", "star", "star-circle", "tie", 
          "trophy", "truck-fast", "wheat", "yelp"
        ],
      },
    })
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [
        'apartments-dsc-coordinate-church.trycloudflare.com',
        '.trycloudflare.com'  // Allow any trycloudflare.com subdomain
      ]
    }
  }
});
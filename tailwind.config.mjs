/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Primary Colors from brand guidelines
          indigo: '#2C3E50',     // Deep Indigo Blue - professionalism and trust
          
          // Secondary Colors from brand guidelines
          white: '#FFFEFA',      // Off White - primary background
          cream: '#ECF0F1',      // Soft Cream - creates space and lightness
          amber: '#F39C12',      // Golden Amber - warmth and celebration (CTAs)
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Montserrat', 'sans-serif'],
        script: ['Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
}
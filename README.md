# Chef Nam Catering Website

A high-performance website for Chef Nam Catering, featuring authentic Thai fusion cuisine for events in Ann Arbor, Michigan and surrounding areas.

## 🚀 Tech Stack

- **Framework**: Astro 4.0 (Static Site Generation)
- **CMS**: Sanity (Headless CMS)
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Pages
- **Language**: TypeScript

## 📋 Features

- **Lightning Fast Performance**: >95 PageSpeed score
- **SEO Optimized**: Structured data, meta tags, local SEO
- **Mobile First**: Responsive design for all devices
- **Content Management**: Easy content updates via Sanity CMS
- **Accessibility**: WCAG 2.1 AA compliant

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # TypeScript validation
npm run lint         # Code linting
```

### Environment Variables

Create a `.env` file with:

```env
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_API_TOKEN=your_api_token
PUBLIC_SITE_URL=https://chefnamcatering.com
```

## 🚀 Deployment

This site is automatically deployed to Cloudflare Pages when changes are pushed to the `main` branch.

### Manual Deployment (if needed)

```bash
npm run build
npx wrangler pages deploy dist
```

## 📁 Project Structure

```
/
├── src/
│   ├── components/     # Astro components
│   ├── layouts/        # Page layouts
│   ├── pages/          # Route pages
│   ├── styles/         # Global styles
│   └── utils/          # Helper functions
├── public/             # Static assets
├── docs/               # Documentation
├── instructions/       # Development guidelines
└── specs/             # Technical specifications
```

## 🎨 Brand Guidelines

- **Primary Color**: Deep Indigo Blue (#2C3E50)
- **Accent Color**: Golden Amber (#F39C12)
- **Typography**: System fonts for performance
- **Imagery**: High-quality food photography

## 📞 Contact

For business inquiries: info@chefnamcatering.com

## 📄 License

© 2025 Chef Nam Catering. All rights reserved.

---

Built with ❤️ by Chef Nam Catering Team
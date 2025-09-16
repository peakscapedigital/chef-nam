# Deployment Instructions for Chef Nam Catering Website

## Project Details
- **Live Site**: https://chefnamcatering.com
- **Cloudflare Pages Project Name**: `chef-nam-website`
- **Preview Domain**: https://chef-nam-website.pages.dev

## Prerequisites
1. Node.js and npm installed
2. Cloudflare account with access to the chef-nam-website project
3. Wrangler CLI authenticated (see Authentication section below)

## Authentication
If not already authenticated, login to Cloudflare:
```bash
npx wrangler login
```
This will open a browser window for OAuth authentication.

## Deployment Process

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```
This creates the production build in the `dist/` directory.

### 3. Deploy to Cloudflare Pages
```bash
npx wrangler pages deploy dist --project-name chef-nam-website --commit-dirty=true
```

**Important Notes:**
- Use `--commit-dirty=true` if you have uncommitted changes
- The project name MUST be `chef-nam-website` (not chef-nam-catering)
- Deployment will provide a preview URL for testing before going live

### 4. Verify Deployment
After deployment, you'll receive:
- A preview URL (e.g., https://[hash].chef-nam-website.pages.dev)
- The changes will automatically go live at https://chefnamcatering.com

## Quick Deploy Script
For convenience, you can run all steps with:
```bash
npm install && npm run build && npx wrangler pages deploy dist --project-name chef-nam-website --commit-dirty=true
```

## Viewing Existing Projects
To see all Cloudflare Pages projects in your account:
```bash
npx wrangler pages project list
```

## Environment Variables
The following environment variables are configured in Cloudflare Pages dashboard:
- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_TOKEN`
- `PUBLIC_SITE_URL`

These are automatically available during the build process on Cloudflare Pages.

## Custom Domains
The following domains are configured:
- chefnamcatering.com (primary)
- www.chefnamcatering.com (redirects to primary)

## Troubleshooting

### Authentication Issues
If you get an authentication error:
```bash
npx wrangler logout
npx wrangler login
```

### Project Not Found Error
If you get "Project not found" error, verify the project name:
```bash
npx wrangler pages project list
```
The correct project name is `chef-nam-website` (NOT chef-nam-catering).

### Build Failures
If the build fails locally but you want to deploy anyway:
1. Check if `dist/` folder exists from a previous build
2. If it exists and contains valid files, you can still deploy it
3. Otherwise, fix build issues before deploying

### Missing Dependencies
If you encounter module errors like "Cannot find module":
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development Server
For local development:
```bash
npm run dev                  # Default port (usually 4321)
npm run dev -- --port 8080   # Custom port 8080
```

## Production Build Testing
To test the production build locally:
```bash
npm run build
npm run preview
```

## Deployment Frequency
- Deployments can be made as frequently as needed
- Each deployment creates a unique preview URL
- Production updates are immediate after deployment
- Cloudflare Pages handles caching and CDN distribution automatically

## Contact for Issues
For deployment issues specific to this project:
- Check Cloudflare Pages dashboard for build logs
- Review wrangler logs in `~/.wrangler/logs/`

---
*Last Updated: January 2025*
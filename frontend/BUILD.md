# Frontend Build Guide

This guide covers building and deploying the frontend application.

## Build Configuration

The frontend is configured with Next.js standalone output mode for optimal Docker deployments.

### Environment Variables

Set the following environment variable before building:

```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## Local Build

### Development Build

```bash
npm run dev
```

This starts the development server with hot reloading at `http://localhost:3000`.

### Production Build

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

The production build:
- Optimizes JavaScript bundles
- Minifies CSS
- Generates static assets
- Creates standalone output for Docker

## Docker Build

### Build Image

```bash
docker build -t profit-share-frontend:latest .
```

### Run Container

```bash
docker run -d \
  --name profit-share-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://your-api-domain.com \
  profit-share-frontend:latest
```

## Vercel Deployment

### Prerequisites

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

### Deploy

#### First Deployment

```bash
vercel
```

Follow the prompts to:
- Link to existing project or create new one
- Configure project settings
- Set environment variables

#### Subsequent Deployments

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Environment Variables in Vercel

Set environment variables in the Vercel dashboard or via CLI:

```bash
vercel env add NEXT_PUBLIC_API_URL production
```

Enter your production API URL when prompted.

### Vercel Configuration

The `vercel.json` file includes:
- Build configuration
- Security headers
- Environment variable templates

## Other Deployment Options

### Netlify

1. Connect your Git repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variable: `NEXT_PUBLIC_API_URL`

### AWS S3 + CloudFront

1. Build the application:
```bash
npm run build
```

2. Export static files (if using static export):
```bash
npm run export
```

3. Upload to S3:
```bash
aws s3 sync out/ s3://your-bucket-name
```

4. Configure CloudFront distribution

### Traditional Server

1. Build the application:
```bash
npm run build
```

2. Copy files to server:
```bash
scp -r .next package.json package-lock.json user@server:/path/to/app
```

3. Install dependencies on server:
```bash
npm install --production
```

4. Start with PM2 or systemd:
```bash
pm2 start npm --name "profit-share-frontend" -- start
```

## Build Optimization

### Analyzing Bundle Size

```bash
# Install analyzer
npm install --save-dev @next/bundle-analyzer

# Analyze bundle
ANALYZE=true npm run build
```

### Performance Tips

1. **Image Optimization**: Use Next.js Image component
2. **Code Splitting**: Automatic with Next.js
3. **Lazy Loading**: Use dynamic imports for heavy components
4. **Caching**: Configure proper cache headers
5. **CDN**: Use CDN for static assets

## Build Troubleshooting

### Build Fails

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

**Error: Out of memory**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Environment Variables Not Working

- Ensure variables are prefixed with `NEXT_PUBLIC_`
- Rebuild after changing environment variables
- Check `.env.production` or `.env.local` files
- Verify variables are set in deployment platform

### Standalone Output Issues

If standalone output is not working:

1. Check `next.config.ts` has `output: 'standalone'`
2. Ensure Next.js version is 12.2+
3. Rebuild the application

## Production Checklist

Before deploying to production:

- [ ] Set `NEXT_PUBLIC_API_URL` to production API
- [ ] Remove development dependencies
- [ ] Enable production optimizations
- [ ] Configure security headers
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure analytics (if needed)
- [ ] Test build locally
- [ ] Verify environment variables
- [ ] Check bundle size
- [ ] Test on target browsers

## Monitoring Build Performance

### Build Metrics

Monitor these metrics:
- Build time
- Bundle size
- Number of pages
- Static vs dynamic pages

### Tools

- Next.js built-in analytics
- Vercel Analytics
- Lighthouse CI
- Bundle analyzer

## Continuous Integration

### GitHub Actions Example

```yaml
name: Build and Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Lint
        working-directory: frontend
        run: npm run lint
      
      - name: Type check
        working-directory: frontend
        run: npm run type-check
      
      - name: Build
        working-directory: frontend
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
```

## Support

For build issues:
1. Check Next.js documentation
2. Review build logs
3. Check environment variables
4. Verify Node.js version compatibility

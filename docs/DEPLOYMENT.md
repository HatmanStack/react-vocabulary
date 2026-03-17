# Deployment Guide

[← Back to Docs](./README.md) · [Backend API](./BACKEND-API.md)

---

## Prerequisites

- Node.js 20+ (24 LTS recommended)
- AWS CLI configured with credentials
- AWS SAM CLI installed
- Expo account (for mobile builds)

## Backend Deployment

### Quick Start

```bash
cd backend && npm install   # install backend dependencies
cd ..
npm run deploy              # deploy via root-level script
```

SAM prompts for:

- **Stack name**: `vocabulary-sync` (or your choice)
- **Region**: `us-west-2` (or your preference)
- **Confirm changeset**: `y`

### First-Time Setup

1. Deploy the backend:

   ```bash
   cd backend && npm install   # install backend dependencies
   cd ..
   npm run deploy              # deploy via root-level script
   ```

2. Copy the API URL from SAM output:

   ```text
   Outputs
   -------------------------------------------------
   Key         ApiUrl
   Value       https://xxx.execute-api.us-west-2.amazonaws.com/progress
   ```

3. Update `.env` in project root:

   ```bash
   EXPO_PUBLIC_SYNC_API_URL=https://xxx.execute-api.us-west-2.amazonaws.com/progress
   ```

### Subsequent Deployments

```bash
npm run deploy
```

SAM uses `samconfig.toml` for saved settings.

## Environment Configuration

### Frontend (.env)

```bash
# Cloud sync API endpoint (from SAM output)
EXPO_PUBLIC_SYNC_API_URL=https://xxx.execute-api.us-west-2.amazonaws.com/progress
```

### Backend (set by SAM)

| Variable          | Purpose                             |
| ----------------- | ----------------------------------- |
| `TABLE_NAME`      | DynamoDB table name (auto-created)  |
| `ALLOWED_ORIGINS` | CORS origins (set in template.yaml) |

## Web Deployment

```bash
# Build static web export
npx expo export --platform web

# Output in dist/
# Deploy to any static host (Vercel, Netlify, S3, etc.)
```

### Vercel

```bash
npm i -g vercel
vercel --prod
```

### Netlify

```bash
# Build command: npx expo export --platform web
# Publish directory: dist
```

### AWS S3 + CloudFront

```bash
aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Mobile Builds

### Expo Go (Development)

```bash
npm start
# Scan QR code with Expo Go app
```

### Production Builds

```bash
# iOS (requires Apple Developer account)
eas build --platform ios

# Android
eas build --platform android
```

## CI/CD

GitHub Actions runs on push/PR:

| Job     | Checks                 |
| ------- | ---------------------- |
| Main    | type-check, lint, test |
| Backend | backend tests          |

Both must pass for merge.

## Troubleshooting

### Backend Issues

**SAM deploy fails with "No changes to deploy"**

- Stack is already up-to-date
- Force redeploy: `sam deploy --force-upload`

**CORS errors in browser**

- Check `ALLOWED_ORIGINS` in `backend/template.yaml`
- Add your domain to the list
- Redeploy: `npm run deploy`

**Lambda timeout**

- Default is 10s, increase in `template.yaml` if needed
- Check CloudWatch logs: `aws logs tail /aws/lambda/vocabulary-sync --follow`

**DynamoDB throttling**

- Table uses on-demand capacity by default
- Check AWS console for throttled requests

### Frontend Issues

**Sync not working**

- Verify `.env` has correct `EXPO_PUBLIC_SYNC_API_URL`
- Restart Expo server after changing `.env`
- Check network tab for API errors

**Tests failing**

- Clear Jest cache: `npm test -- --clearCache`
- Check Node version: `node -v` (should be 20+)

**TypeScript errors**

- Run `npm run type-check` for details
- Check for missing types: `npm install`

**Web build fails**

- Clear Metro cache: `npx expo start --clear`
- Check for web-incompatible packages

### Cloud Sync Issues

**"Username already exists"**

- Choose a different username
- Usernames are globally unique

**Sync conflict**

- App uses the deterministic `mergeProgress` algorithm (see docs/README.md)
- Rule order: higher word state wins, then earliest first-attempt date, then best score (fewer hints, then fewer wrong answers)

**Progress not syncing**

- Check network connectivity
- Verify username is set in Settings
- App syncs on foreground (5-min throttle)

## Architecture

### AWS Resources Created

```text
┌─────────────────────────────────────────────────────┐
│                    API Gateway                       │
│              (HTTP API + CORS)                       │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                     Lambda                           │
│              (Node.js 20, POST /progress)            │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                    DynamoDB                          │
│              (On-demand, single table)               │
└─────────────────────────────────────────────────────┘
```

### Cost Estimate

For typical personal use (~100 syncs/month):

- Lambda: Free tier covers it
- DynamoDB: Free tier covers it
- API Gateway: Free tier covers it

**Total: $0/month** for low usage

## Security Notes

- No authentication beyond username
- Usernames are public identifiers (like save slots)
- Don't store sensitive data in progress
- API has rate limiting (100 req/s burst, 50 req/s sustained)

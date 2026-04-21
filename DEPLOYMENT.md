# Historian - Deployment Guide

## Overview

Historian is deployed to GitHub Pages via an automated CI/CD pipeline. Every push to `main` triggers type checking, testing, building, and automatic deployment.

## Deployment Pipeline (FR42, FR43)

### GitHub Actions Workflow

The `.github/workflows/ci.yml` workflow:

1. **Test** (runs on all pushes and PRs)
   - Sets up Node.js 20
   - Installs dependencies with cache
   - Runs type checking (`npm run type-check`)
   - Runs all tests (`npm test`)
   - Runs golden tests (`npm run test:golden`)

2. **Deploy** (runs only on main branch pushes after tests pass)
   - Depends on test job passing
   - Builds the project (`npm run build`)
   - Deploys `dist/` directory to GitHub Pages using `peaceiris/actions-gh-pages`
   - Published at: `https://GeoffreyHull.github.io/Historian/`

### Pipeline Requirements

All acceptance criteria (AC) must pass the pipeline:
- **Type Safety**: `npm run type-check` ✓
- **Compilation**: `npm run build` ✓
- **Testing**: `npm run test` (all tests pass) ✓
- **Golden Tests**: `npm run test:golden` (core constraints verified) ✓

Pushing to `main` will fail if any of these checks don't pass.

## Local Deployment Testing

To test the build locally:

```bash
npm run type-check
npm run build
npm run test
npm run test:golden
```

All must pass before deploying to main.

## Game Features on Deploy (FR41, FR43)

The deployed game includes:
- ✅ Complete game logic (all Epics implemented)
- ✅ Deterministic event generation
- ✅ Credibility system
- ✅ World state persistence
- ✅ Cross-run consequences
- ✅ History book recap generation
- ✅ Save/load functionality (localStorage)
- ✅ Developer tracing tools

No content is locked after purchase (FR43) — all features are available immediately.

## Environment Variables

None required for MVP. GitHub Pages deployment uses the default GitHub token.

## Manual Deployment

If automatic deployment fails, manually deploy:

```bash
npm ci
npm run build
# Deploy the dist/ folder to GitHub Pages manually
```

## Monitoring Deployment

Check deployment status:
1. Go to your repository Settings → Pages
2. Verify the deployment is set to "Deploy from a branch"
3. Check "Actions" tab for workflow status

## Rollback

If a deployment causes issues:

1. Revert the problematic commit:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. The automated workflow will redeploy the reverted version

## Future Enhancements (Post-MVP)

- React UI components (currently game logic only)
- Purchase/monetization integration
- Advanced analytics and tracing
- Multi-platform support
- Offline PWA support

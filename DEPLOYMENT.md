# Sovereign Dominion Deployment

## Status: ✅ Live

**URL:** https://sovereign-dominion.jae-tierce31.workers.dev

### Deployment Configuration
- **Platform:** Cloudflare Pages
- **Branch:** main
- **Build Command:** `npm run build`
- **Build Output:** dist/
- **Last Deploy:** 2026-06-30

### Features Deployed
- 7-step demo pipeline (QSSM → MMR → SCUGS → Hermes → Council → Stripe → Esther)
- Intent/ExecutionGraph/CapabilityRegistry architectures
- First Avenue (Minneapolis, MN) lead scenario
- Self-Healing Runtime panel with fault injection
- Optional soundtrack toggle with CSS choreography
- CodeQL security scanning

### Running Locally
```bash
npm install
npm run build
npm run preview
```

### Deployment Triggered
Push to `main` automatically triggers GitHub Actions → Cloudflare Pages deployment.

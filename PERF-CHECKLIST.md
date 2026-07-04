# Perf audit checklist — high leverage fixes applied

This checklist accompanies the `Perf/audit-fixes` branch. It summarizes the changes and follow-ups.

Applied fixes
- Lazy bootstrap for demo (demo/boot.mjs) — defers heavy modules until user interaction.
- Shorter, non-blocking health check (1.5s) and API_BASE injection (window.__API_BASE__).
- Added perf workflow skeleton (.github/workflows/perf.yml) to start automating Lighthouse runs on PRs (needs refinement).
- Documented changes in docs/PERF-CHANGES.md and DEPLOYMENT.md guidance.
- Added npm script perf:report for manual Lighthouse runs.

Follow-ups (recommended)
- Replace large PNGs with AVIF/WebP and add srcset (requires asset generation).
- Configure Cloudflare/Pages to set VITE_API_BASE for preview and production.
- Precompress build artifacts and enable CDN caching headers.
- Add granular code-splitting in src/ (React.lazy + Suspense) for 3D/ONNX/SQL features.
- Expand GitHub Actions to run Lighthouse and WebPageTest and publish artifacts.


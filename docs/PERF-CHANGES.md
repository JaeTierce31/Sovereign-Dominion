# Performance and deployment notes

This file documents the changes made on branch `Perf/audit-fixes` and why.

Key points:
- Demo modules are lazy-loaded via demo/boot.mjs to avoid blocking initial render.
- An API base is exposed at window.__API_BASE__ (falls back to import.meta.env.VITE_API_BASE or location.origin).
- Health checks are short (1.5s) and non-blocking to avoid long preview stalls.

Platform alignment
- Changes intentionally preserve the platform's transparency philosophy (see docs/PLATFORM.md and README.md).
- The demo remains fully functional but defers heavy computation until user interaction.


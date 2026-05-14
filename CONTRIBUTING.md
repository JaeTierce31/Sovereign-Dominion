# Contributing to Sovereign Dominion

## Open‑Source Components

We welcome contributions to the MIT‑licensed open‑source components:

- WGSL/GLSL shader programs
- WASM search module
- Voice prosody engine
- LiDAR Capacitor plugin
- Material calculator utilities

## Process

1. **Fork** the repository
2. **Create a branch** (`feature/your-feature` or `fix/your-fix`)
3. **Write tests** for your changes
4. **Run all tests**: `npm test`
5. **Run linter**: `npm run lint`
6. **Submit a PR** with clear description

## Code Standards

- TypeScript strict mode
- WGSL shaders must pass `npm run fuzz` (DarthShader) and `npm run safe` (SafeRace)
- All public APIs documented with JSDoc
- Accessibility: WCAG 2.1 AA minimum
- Performance: no regression below 90 fps on Tier‑High devices

## Security

- No credentials in code
- All WASM modules verified with `wasm-validate`
- Cryptographic operations must use constant‑time implementations
- Report vulnerabilities to security@sovereigndominion.dev

## License

By contributing to MIT‑licensed components, you agree your contributions will be licensed under MIT.

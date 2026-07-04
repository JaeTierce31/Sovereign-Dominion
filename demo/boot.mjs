// boot.mjs — lightweight demo bootstrap to lazy-load heavy modules and configure API base
// Placed in demo/boot.mjs
const API_BASE = window.__API_BASE__ || import.meta.env.VITE_API_BASE || location.origin;

// Minimal DOM wiring — keep initial JS tiny
const runBtn = document.getElementById('run-demo');
const compareBtn = document.getElementById('compare-btn');
const voiceBtn = document.getElementById('voice-btn');

let demoModules = null;
let streamController = null;

async function ensureModules() {
  if (demoModules) return demoModules;
  // Preconnect to API host
  try { const u = new URL(API_BASE); navigator.connection && navigator.connection.addEventListener; /* noop */ } catch {}
  // Dynamic imports: only load when needed
  const [qssm, mmr, scugs, council, hermes, esther, stripe, threeBeam, cert] = await Promise.all([
    import('./qssm-demo.js').catch(e => ({ runQSSMDemo: () => { throw e; } })),
    import('./mmr-demo.js').catch(() => ({})),
    import('./scugs-demo.js').catch(() => ({})),
    import('./council-demo.js').catch(() => ({})),
    import('./hermes.js').catch(() => ({})),
    import('./esther-demo.js').catch(() => ({})),
    import('./stripe.js').catch(() => ({})),
    import('./three-beam.js').catch(() => ({})),
    import('./certificate.js').catch(() => ({})),
  ]);
  demoModules = { qssm, mmr, scugs, council, hermes, esther, stripe, threeBeam, cert };
  return demoModules;
}

runBtn && runBtn.addEventListener('click', async (e) => {
  runBtn.disabled = true;
  runBtn.innerHTML = '<span style="opacity:.8">Loading demo modules…</span>';
  try {
    const m = await ensureModules();
    // hand off to original run handler if present
    if (typeof window.__runDemo === 'function') return window.__runDemo();
    // fallback: call qssm-run if exported
    if (m.qssm && typeof m.qssm.runQSSMDemo === 'function') {
      // call existing demo entrypoint used in original page
      document.getElementById('run-demo').dispatchEvent(new Event('click'));
    }
  } catch (err) {
    console.error('Failed to load demo modules', err);
  } finally {
    runBtn.disabled = false;
    runBtn.innerHTML = 'RUN DEMO';
  }
});

// Compare button lazy-load behavior
compareBtn && compareBtn.addEventListener('click', async (e) => {
  if (!demoModules) await ensureModules();
  // allow original handlers to execute
});

// Voice button kept as-is but do not load heavy speech assets until used
voiceBtn && voiceBtn.addEventListener('click', () => {
  // original page handles voice via window.SpeechRecognition — no heavy module needed
});

// Expose API base for other demo scripts to consume
window.__API_BASE__ = API_BASE;

// Health check helper — non-blocking, short timeout
window.__checkHealth = async function() {
  const endpoint = `${API_BASE.replace(/\/$/, '')}/health`;
  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch (e) { return { ok: false }; }
}

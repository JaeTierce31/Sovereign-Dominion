// Hermes orchestration — calls NousResearch Hermes via backend, falls back to mock.
export async function orchestrateHermes(query) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('http://localhost:3001/hermes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const label = data.mock ? ' <span class="tag">mock</span>' : ' <span class="tag">NIM</span>';
      return { orchestration: (data.orchestration || 'Routing complete.') + label };
    }
  } catch (e) {
    console.warn('⚠️ Hermes backend unavailable, using mock:', e.message);
  }
  return {
    orchestration: 'Hermes mock: routing compliance check to Council → QSSM → Stripe pipeline. <span class="tag">mock</span>'
  };
}

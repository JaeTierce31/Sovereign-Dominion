// Hermes — NousResearch Hermes-3-405B multi-agent orchestration via NVIDIA NIM backend.
// Returns a structured routing plan with agent pipeline, confidence, and rationale.

export async function orchestrateHermes(query, scenario = {}) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('http://localhost:3001/hermes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        compliance: scenario.compliance,
        domain: scenario.domain,
        beamId: scenario.beamId
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const label = data.mock
        ? '<span class="tag">mock</span>'
        : '<span class="tag">NIM · Hermes-3</span>';
      return {
        orchestration: (data.orchestration || 'Routing complete.') + ' ' + label,
        agents: data.agents || ['QSSM', 'MMR', 'Council', 'Stripe'],
        confidence: data.confidence ?? 0.92,
        domain: data.domain || scenario.domain || 'structural',
        routingRationale: data.routingRationale || null,
        mock: data.mock || false
      };
    }
  } catch (e) {
    console.warn('⚠️ Hermes backend unavailable:', e.message);
  }

  // Local structured mock
  const isFail = scenario.compliance === 'FAIL';
  const agents = isFail ? ['QSSM', 'MMR', 'Council'] : ['QSSM', 'MMR', 'Council', 'Stripe'];
  return {
    orchestration: `Hermes: activating ${agents.join(' → ')} for ${scenario.beamId || 'B-001'}. ${isFail ? 'Payment gate blocked pending review.' : 'All agents authorized.'} <span class="tag">mock</span>`,
    agents,
    confidence: isFail ? 0.97 : 0.94,
    domain: scenario.domain || 'structural',
    routingRationale: isFail
      ? 'Non-compliant signature detected in pre-scan. QSSM proof required for immutability. Council deliberation mandatory. Stripe payment gate blocked until structural compliance is restored.'
      : 'Compliance parameters nominal. Full pipeline activation authorized. ZK proof for immutability, Council for governance, Stripe for payment processing.',
    mock: true
  };
}

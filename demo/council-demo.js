// Chromatic Council with Deep Deliberation and Pre-Mortem
// Tries the backend /council endpoint (real NVIDIA Nemotron) first, falls back to local mock.

export function animateCouncil(decision) {
  const bar = document.getElementById('council-bar');
  if (bar) {
    bar.style.transition = 'none';
    bar.style.background = '#e63939';
    void bar.offsetWidth;
    bar.style.transition = 'background 1.4s ease';
    bar.style.background = decision.color;
  }
  const out = document.getElementById('council-rationale');
  if (out && decision.amberRationale) {
    typewrite(out, decision.amberRationale);
  }
}

function typewrite(el, text, speed = 18) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = text;
    return;
  }
  el.textContent = '';
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, i);
    if (i < text.length) { i++; setTimeout(tick, speed); }
  };
  tick();
}

function synthesize(emberVote, umberVote, emberWeight, umberWeight) {
  const amberHue = Math.atan2(
    emberWeight * Math.sin(emberVote.hue * Math.PI / 180) + umberWeight * Math.sin(umberVote.hue * Math.PI / 180),
    emberWeight * Math.cos(emberVote.hue * Math.PI / 180) + umberWeight * Math.cos(umberVote.hue * Math.PI / 180)
  ) * 180 / Math.PI;
  const normalizedHue = (amberHue + 360) % 360;
  const confidence = Math.sqrt(emberVote.confidence * umberVote.confidence);
  const urgency = Math.max(emberVote.urgency, umberVote.urgency);
  // Circular hue distance: max separation is 180°, divide to normalize [0,1]
  const _d = Math.abs(emberVote.hue - umberVote.hue);
  const hueDist = Math.min(_d, 360 - _d);
  const harmony = 1 - hueDist / 180;
  return {
    hue: normalizedHue,
    confidence,
    urgency,
    color: `hsl(${normalizedHue.toFixed(0)}, ${(confidence * 100).toFixed(0)}%, ${(urgency * 50 + 25).toFixed(0)}%)`,
    harmony,
    rationale: `Synthesised at φ‑harmony ${(harmony * 100).toFixed(0)}%.`
  };
}

function preMortemChallenge(emberRationale, umberRationale, domain) {
  const worstCase = [
    `What if the ${domain} assumptions are invalid under extreme load?`,
    `Could the current approach create a single point of failure?`,
    `What if the supply chain for this material is disrupted mid‑project?`
  ];
  return {
    challenge: worstCase[Math.floor(Math.random() * worstCase.length)],
    recommendedCheck: `Verify ${domain} redundancy and supplier diversity.`
  };
}

function localDeliberate(payload, deepMode, preMortem) {
  const isFail = payload?.compliance === 'FAIL';
  const beamLabel = payload?.beamId || 'B-001';

  const emberVote = {
    agent: 'Ember',
    // PASS: warm amber (38°) — optimistic, innovative; FAIL: red-orange (15°) — alarmed
    hue: isFail ? 15 : 38,
    confidence: isFail ? 0.42 : 0.92,
    urgency: isFail ? 0.92 : 0.6,
    rationale: isFail
      ? `Beam ${beamLabel} critically fails IBC 1604 minimum yield at 28 ksi — 22% below the 36 ksi threshold. Structural redesign is mandatory.`
      : `Beam ${beamLabel} exceeds IBC 1604 yield threshold with structural margin. Innovation pathway confirmed viable.`
  };
  const umberVote = {
    agent: 'Umber',
    // PASS: cool gold (62°) — cautiously optimistic; FAIL: pure red (0°) — unanimous alarm
    hue: isFail ? 0 : 62,
    confidence: isFail ? 0.38 : 0.88,
    urgency: isFail ? 0.96 : 0.7,
    rationale: isFail
      ? `Risk analysis confirms critical structural deficiency on ${beamLabel}. Deflection under design load exceeds code limits. Project must halt immediately.`
      : `Deflection analysis within acceptable bounds. Risk factors are controlled with built-in redundancy margins.`
  };

  const round1 = synthesize(emberVote, umberVote, 0.8, 0.6);

  let preMortemResult = null;
  if (preMortem) {
    preMortemResult = preMortemChallenge(emberVote.rationale, umberVote.rationale, payload?.domain || 'structural');
    umberVote.confidence = Math.max(isFail ? 0.3 : 0.7, umberVote.confidence - 0.1);
    umberVote.rationale += ` Pre‑Mortem: "${preMortemResult.challenge}"`;
  }

  let finalSynthesis = round1;
  let deliberationRounds = 1;

  if (deepMode && (round1.harmony < 0.9 || preMortem)) {
    const emberRevised = {
      ...emberVote,
      confidence: Math.min(isFail ? 0.45 : 1.0, emberVote.confidence + 0.03),
      rationale: emberVote.rationale + (isFail
        ? ' No compliance path without material substitution.'
        : ' Addressed pre‑mortem with additional load testing.')
    };
    const umberRevised = {
      ...umberVote,
      confidence: Math.min(isFail ? 0.4 : 1.0, umberVote.confidence + 0.05),
      rationale: umberVote.rationale + (isFail
        ? ' Confirmatory analysis confirms non-compliance.'
        : ' Confirmatory checks satisfied.')
    };
    finalSynthesis = synthesize(emberRevised, umberRevised, 0.85, 0.65);
    deliberationRounds = 2;
  }

  const color = isFail ? 'hsl(0, 82%, 42%)' : finalSynthesis.color;
  const harmony = isFail ? '0.12' : finalSynthesis.harmony.toFixed(3);
  const amberRationale = isFail
    ? `Amber Synthesis: Non-compliant beam ${beamLabel} — council vote is unanimous. Halt all progression. Human engineering review required before any seal can be issued.`
    : finalSynthesis.rationale;
  const verdict = isFail
    ? 'Amber Synthesis — halt, human review required'
    : (finalSynthesis.confidence > 0.8
      ? 'Amber Synthesis — proceed with seal'
      : 'Amber Synthesis — caution, human review advised');

  return {
    verdict,
    paymentAmount: 299,
    reasoning: amberRationale,
    color,
    harmony,
    rounds: deliberationRounds,
    preMortem: preMortemResult?.challenge || null,
    preMortemCheck: preMortemResult?.recommendedCheck || null,
    emberRationale: emberVote.rationale,
    umberRationale: umberVote.rationale,
    amberRationale,
    engine: 'mock'
  };
}

export async function deliberateCouncil(payload, deepMode = true, preMortem = true) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const query = `Assess structural beam compliance for domain: ${payload?.domain || 'structural'}, beam: ${payload?.beamId || 'B-001'}. Compliance status: ${payload?.compliance || 'PASS'}.${payload?.label ? ` Project: ${payload.label}.` : ''}`;
    const res = await fetch('http://localhost:3001/council', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, compliance: payload?.compliance || 'PASS' }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const preMortemResult = preMortem
        ? preMortemChallenge(data.ember, data.umber, payload?.domain || 'structural')
        : null;
      return {
        verdict: data.verdict === 'proceed'
          ? 'Amber Synthesis — proceed with seal'
          : 'Amber Synthesis — caution, human review advised',
        paymentAmount: 299,
        reasoning: data.amber,
        color: data.color || '#22c55e',
        harmony: data.harmony || '0.92',
        rounds: 2,
        preMortem: preMortemResult?.challenge || null,
        preMortemCheck: preMortemResult?.recommendedCheck || null,
        emberRationale: data.ember,
        umberRationale: data.umber,
        amberRationale: data.amber,
        engine: data.mock ? 'mock' : 'nvidia'
      };
    }
  } catch (e) {
    console.warn('⚠️ Council backend unavailable, using local deliberation:', e.message);
  }

  return localDeliberate(payload, deepMode, preMortem);
}

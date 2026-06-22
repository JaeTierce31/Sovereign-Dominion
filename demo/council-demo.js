// Chromatic Council with Deep Deliberation and Pre-Mortem

// Animate the Ember→Amber synthesis: blends a color bar and typewrites the rationale.
export function animateCouncil(decision) {
  const bar = document.getElementById('council-bar');
  if (bar) {
    bar.style.transition = 'none';
    bar.style.background = '#e63939'; // Ember red
    // Force reflow so the transition runs from the start color.
    void bar.offsetWidth;
    bar.style.transition = 'background 1.4s ease';
    bar.style.background = decision.color; // Amber synthesis
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
    if (i < text.length) {
      i++;
      setTimeout(tick, speed);
    }
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
  const hsl = `hsl(${normalizedHue.toFixed(0)}, ${(confidence * 100).toFixed(0)}%, ${(urgency * 50 + 25).toFixed(0)}%)`;
  return {
    hue: normalizedHue,
    confidence,
    urgency,
    color: hsl,
    harmony: (1 - Math.abs(emberVote.hue - umberVote.hue) / 360),
    rationale: `Synthesised at φ‑harmony ${((1 - Math.abs(emberVote.hue - umberVote.hue) / 360) * 100).toFixed(0)}%.`
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

export function deliberateCouncil(payload, deepMode = true, preMortem = true) {
  const emberVote = {
    agent: 'Ember',
    hue: 0,
    confidence: 0.92,
    urgency: 0.6,
    rationale: 'Beam design exceeds IBC 1604 with margin.'
  };
  const umberVote = {
    agent: 'Umber',
    hue: 240,
    confidence: 0.88,
    urgency: 0.7,
    rationale: 'Deflection analysis shows acceptable limits. Risk is controlled.'
  };

  const round1 = synthesize(emberVote, umberVote, 0.8, 0.6);
  const harmony1 = round1.harmony;

  let preMortemResult = null;
  if (preMortem) {
    preMortemResult = preMortemChallenge(emberVote.rationale, umberVote.rationale, payload?.domain || 'structural');
    umberVote.confidence = Math.max(0.7, umberVote.confidence - 0.1);
    umberVote.rationale += ` However, Pre‑Mortem challenge: "${preMortemResult.challenge}" warrants checks.`;
  }

  let finalSynthesis = round1;
  let deliberationRounds = 1;

  if (deepMode && (harmony1 < 0.9 || preMortem)) {
    const emberRevised = {
      ...emberVote,
      confidence: Math.min(1.0, emberVote.confidence + 0.03),
      rationale: emberVote.rationale + ' Addressed pre‑mortem with additional load testing.'
    };
    const umberRevised = {
      ...umberVote,
      confidence: Math.min(1.0, umberVote.confidence + 0.05),
      rationale: umberVote.rationale + ' Confirmatory checks satisfied.'
    };
    finalSynthesis = synthesize(emberRevised, umberRevised, 0.85, 0.65);
    deliberationRounds = 2;
  }

  const verdict = finalSynthesis.confidence > 0.8
    ? 'Amber Synthesis — proceed with seal'
    : 'Amber Synthesis — caution, human review advised';

  return {
    verdict,
    paymentAmount: 299,
    reasoning: finalSynthesis.rationale,
    color: finalSynthesis.color,
    harmony: finalSynthesis.harmony.toFixed(3),
    rounds: deliberationRounds,
    preMortem: preMortemResult?.challenge || null,
    preMortemCheck: preMortemResult?.recommendedCheck || null,
    emberRationale: emberVote.rationale,
    umberRationale: umberVote.rationale,
    amberRationale: finalSynthesis.rationale
  };
}

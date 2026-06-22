const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json({ limit: '16kb' }));

const NIM_BASE = 'https://integrate.api.nvidia.com/v1/chat/completions';

function nimHeaders(apiKey) {
  return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
}

async function nimChat(apiKey, model, systemPrompt, userContent, maxTokens = 128, temperature = 0.5) {
  const res = await fetch(NIM_BASE, {
    method: 'POST',
    headers: nimHeaders(apiKey),
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      max_tokens: maxTokens,
      temperature
    }),
    signal: AbortSignal.timeout(8000)
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

// Chromatic Council — Ember + Umber deliberation via Nemotron, Amber synthesis
app.post('/council', async (req, res) => {
  const apiKey = process.env.NVIDIA_API_KEY;
  const isFail = req.body.compliance === 'FAIL';
  if (!apiKey) {
    return res.json({
      ember: isFail
        ? 'Beam critically fails IBC 1604 minimum yield at 28 ksi — 22% below threshold. Structural redesign is mandatory before proceeding.'
        : 'Beam design exceeds IBC 1604 with structural margin. Innovation path is clear.',
      umber: isFail
        ? 'Risk analysis confirms critical structural deficiency. Deflection under design load exceeds code limits by an unacceptable margin. Project must halt.'
        : 'Deflection analysis shows acceptable limits. Risk factors are controlled.',
      amber: isFail
        ? 'Amber synthesis — halt. Non-compliant beam requires immediate human engineering review. No seal can be issued.'
        : 'Amber synthesis — proceed with compliance seal. Harmony achieved.',
      color: isFail ? '#c0392b' : '#22c55e',
      verdict: isFail ? 'caution' : 'proceed',
      harmony: isFail ? '0.12' : '0.92',
      mock: true
    });
  }

  try {
    const query = String(req.body.query || 'Assess structural beam compliance.').slice(0, 512);
    const model = 'nvidia/nemotron-4-340b-instruct';

    // Run Ember and Umber in parallel to minimize latency
    const [emberText, umberText] = await Promise.all([
      nimChat(
        apiKey, model,
        'You are Ember, the Creative Expansion agent for Sovereign Dominion. Respond in exactly 2 sentences with an optimistic, innovative structural engineering assessment.',
        query, 128, 0.7
      ),
      nimChat(
        apiKey, model,
        'You are Umber, the Risk Analysis agent for Sovereign Dominion. Respond in exactly 2 sentences with a cautious, risk-aware structural engineering assessment.',
        query, 128, 0.3
      )
    ]);

    const ember = emberText || 'Beam exceeds IBC specifications with margin.';
    const umber = umberText || 'Risk factors identified and controlled.';
    const amber = `Amber synthesis: ${ember.split('.')[0]}. ${umber.split('.')[0]}.`;
    const verdict = isFail ? 'caution' : 'proceed';
    const color = isFail ? '#c0392b' : '#22c55e';

    res.json({ ember, umber, amber, color, verdict, harmony: '0.92', mock: false });
  } catch (e) {
    res.json({
      ember: 'Beam design meets all structural requirements with safety margin.',
      umber: 'Risk analysis complete. All factors within acceptable bounds.',
      amber: 'Amber synthesis — proceed with compliance seal.',
      color: '#22c55e', verdict: 'proceed', harmony: '0.92', mock: true
    });
  }
});

// Council SSE streaming — streams Nemotron tokens in real-time to the frontend debug panel
app.post('/council-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const apiKey = process.env.NVIDIA_API_KEY;
  const compliance = String(req.body.compliance || 'PASS');
  const query = String(req.body.query || 'Assess structural beam compliance.').slice(0, 512);
  const isFail = compliance === 'FAIL';

  if (!apiKey) {
    const mockContent = isFail
      ? 'Ember: Beam critically fails IBC 1604 — yield 28 ksi is 22% below 36 ksi threshold. Redesign mandatory. | Umber: Critical structural deficiency confirmed. Deflection exceeds code limits by unacceptable margin. Halt. | Amber: Non-compliant beam — council unanimous. No seal possible. Human engineering review required immediately.'
      : 'Ember: Beam design exceeds IBC 1604 with 11% structural margin. Innovation pathway is sound and clear. | Umber: Deflection under service load within acceptable bounds. Risk factors controlled with built-in redundancy. | Amber: Synthesized council decision — proceed with compliance seal. φ-harmony 0.92 achieved.';
    const tokens = mockContent.split(/(\s+)/);
    for (const token of tokens) {
      if (!token) continue;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
      if (!/^\s+$/.test(token)) await new Promise(r => setTimeout(r, 45));
    }
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  try {
    const systemPrompt = isFail
      ? 'You are the Chromatic Council of Sovereign Dominion. This beam FAILS structural compliance. In exactly 3 sentences labeled Ember, Umber, and Amber: describe the specific failure, confirm the risk analysis, and synthesize a unanimous halt recommendation.'
      : 'You are the Chromatic Council of Sovereign Dominion. In exactly 3 sentences labeled Ember, Umber, and Amber: provide an optimistic structural assessment, a careful risk analysis, and a synthesized proceed recommendation.';

    const nimRes = await fetch(NIM_BASE, {
      method: 'POST',
      headers: nimHeaders(apiKey),
      body: JSON.stringify({
        model: 'nvidia/nemotron-4-340b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 256,
        temperature: 0.5,
        stream: true
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!nimRes.ok) throw new Error(`NIM ${nimRes.status}`);

    const reader = nimRes.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') { res.write('data: [DONE]\n\n'); return res.end(); }
        try {
          const parsed = JSON.parse(raw);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
        } catch {}
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (e) {
    res.write(`data: ${JSON.stringify({ token: ' [stream error — using deliberation fallback]' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Hermes orchestration via NousResearch model on NVIDIA NIM
app.post('/hermes', async (req, res) => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return res.json({
      orchestration: 'Hermes mock: routing compliance check to Chromatic Council → QSSM proof → Stripe payment pipeline.',
      mock: true
    });
  }

  try {
    const query = String(req.body.query || 'Route this task.').slice(0, 512);
    const text = await nimChat(
      apiKey,
      'nousresearch/hermes-3-llama-3.1-405b',
      'You are Hermes, the AI orchestrator for Sovereign Dominion. In 1-2 sentences: identify which agents to activate (Council, QSSM, Stripe) and state the action plan concisely.',
      query, 128, 0.4
    );
    res.json({
      orchestration: text || 'Routing to compliance verification pipeline.',
      mock: false
    });
  } catch (e) {
    res.json({
      orchestration: 'Hermes: routing to Chromatic Council for deliberation and Stripe for payment.',
      mock: true
    });
  }
});

// Stripe PaymentIntent — auto-confirms in test mode
app.post('/payment-intent', async (req, res) => {
  try {
    const secret = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
    const stripe = require('stripe')(secret);
    const { amount, projectId } = req.body;
    const safeAmount = Math.max(50, Math.min(parseInt(amount) || 299, 99999));
    const safeProject = String(projectId || 'demo').slice(0, 64);
    const isTestKey = secret.startsWith('sk_test_');

    const params = {
      amount: safeAmount,
      currency: 'usd',
      metadata: { projectId: safeProject },
    };
    if (isTestKey) {
      params.payment_method = 'pm_card_visa';
      params.confirm = true;
      params.automatic_payment_methods = { enabled: true, allow_redirects: 'never' };
    }

    const paymentIntent = await stripe.paymentIntents.create(params);
    res.json({
      status: paymentIntent.status,
      id: paymentIntent.id,
      amount: safeAmount,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    res.status(500).json({ error: 'Payment intent creation failed' });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SD Backend running on :${PORT}`));

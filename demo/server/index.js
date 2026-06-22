const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json({ limit: '16kb' }));

// Stripe PaymentIntent endpoint — creates and (in test mode) confirms with a
// test payment method so the demo surfaces a real `succeeded` status end-to-end.
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
    // Only auto-confirm with a test card in test mode (safe, never on live keys).
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

// NVIDIA NIM proxy (if API key available)
app.post('/council-deliberate', async (req, res) => {
  try {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return res.json({ deliberation: 'Mock deliberation — NVIDIA key not configured.' });
    }
    const query = String(req.body.query || 'Check beam compliance.').slice(0, 512);
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nvidia/nemotron-4-340b-instruct',
        messages: [{ role: 'user', content: query }],
        max_tokens: 256
      }),
      signal: AbortSignal.timeout(8000)
    });
    const data = await response.json();
    res.json({ deliberation: data.choices?.[0]?.message?.content || 'No response' });
  } catch (e) {
    res.json({ deliberation: 'Mock deliberation — NIM unavailable.' });
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

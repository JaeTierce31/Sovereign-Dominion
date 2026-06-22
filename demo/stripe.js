// Stripe Payment Intents — attempts real backend, falls back to mock
let stripeInstance = null;

async function loadStripe() {
  if (typeof window !== 'undefined' && window.Stripe) {
    stripeInstance = window.Stripe('pk_test_placeholder'); // Replace with real test key
    console.log('✅ Stripe.js loaded');
    return true;
  }
  console.warn('⚠️ Stripe.js not loaded, using mock');
  return false;
}

export async function initiatePayment(amount, projectId) {
  const stripeLoaded = await loadStripe();

  // Try real backend first
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('http://localhost:3001/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, projectId }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const { clientSecret } = await res.json();
      if (stripeLoaded && stripeInstance) {
        const { paymentIntent } = await stripeInstance.confirmCardPayment(clientSecret);
        console.log(`[BENCHMARK] Stripe real: ${paymentIntent.status}`);
        return { status: paymentIntent.status, amount };
      }
      return { status: 'requires_payment_method', amount };
    }
  } catch (e) {
    console.warn('⚠️ Backend not available, using mock payment:', e.message);
  }

  // Mock fallback
  await new Promise(r => setTimeout(r, 15));
  console.log('[BENCHMARK] Stripe mock: succeeded');
  return { status: 'succeeded', mock: true, amount };
}

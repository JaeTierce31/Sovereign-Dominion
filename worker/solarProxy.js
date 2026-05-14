export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };

    if (!lat || !lng) {
      return new Response(JSON.stringify({ error: 'lat and lng required' }), { status: 400, headers: corsHeaders });
    }

    const cacheKey = `solar:${parseFloat(lat).toFixed(3)}:${parseFloat(lng).toFixed(3)}`;
    const cached = await env.SOLAR_CACHE.get(cacheKey);
    if (cached) return new Response(cached, { headers: corsHeaders });

    const apiUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${env.GOOGLE_SOLAR_KEY}`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    const result = JSON.stringify(data);
    ctx.waitUntil(env.SOLAR_CACHE.put(cacheKey, result, { expirationTtl: 86400 }));
    return new Response(result, { headers: corsHeaders });
  },
};

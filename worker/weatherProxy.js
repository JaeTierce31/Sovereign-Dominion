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

    const cacheKey = `weather:${parseFloat(lat).toFixed(2)}:${parseFloat(lng).toFixed(2)}`;
    const cached = await env.WEATHER_CACHE.get(cacheKey);
    if (cached) return new Response(cached, { headers: corsHeaders });

    const res = await fetch(
      `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lng}/next14days?unitGroup=us&key=${env.WEATHER_KEY}&contentType=json&include=days`
    );
    const data = await res.json();
    const result = JSON.stringify(data);
    ctx.waitUntil(env.WEATHER_CACHE.put(cacheKey, result, { expirationTtl: 3600 }));
    return new Response(result, { headers: corsHeaders });
  },
};

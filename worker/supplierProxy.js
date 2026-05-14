export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const zip = url.searchParams.get('zip') || '53703';
    const query = url.searchParams.get('query') || 'retaining wall block';
    const cacheKey = `supplier:${zip}:${query}`;
    const cached = await env.SUPPLIER_CACHE.get(cacheKey);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'GET' } });
    }

    if (cached) return new Response(cached, { headers: corsHeaders });

    const apiRes = await fetch('https://api.1build.com/v1/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.ONE_BUILD_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `{ materials(zip: "${zip}", keyword: "${query}") { items { description unit unitPrice supplierName supplierDistance stock } } }`,
      }),
    });

    const data = await apiRes.json();
    const result = JSON.stringify(data);
    ctx.waitUntil(env.SUPPLIER_CACHE.put(cacheKey, result, { expirationTtl: 3600 }));
    return new Response(result, { headers: corsHeaders });
  },
};

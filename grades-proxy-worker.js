// Cloudflare Worker: forwards grade lookups to the class API and adds CORS headers
// so the portfolio page is allowed to read the response.
const UPSTREAM = 'http://class-grades-it.mywebcommunity.org/grades_api.php/';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const params = new URL(request.url).searchParams;
    const id = params.get('id');
    const lastName = params.get('lastName');
    if (!id || !lastName) return json({ error: 'Missing id or lastName' }, 400);

    try {
      const res = await fetch(UPSTREAM + '?' + new URLSearchParams({ id, lastName }), {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      return new Response(await res.text(), {
        status: res.status,
        headers: { ...CORS, 'Content-Type': res.headers.get('Content-Type') || 'text/plain' },
      });
    } catch (e) {
      return json({ error: 'Grades server unreachable' }, 502);
    }
  },
};

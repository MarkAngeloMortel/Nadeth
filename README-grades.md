# Making the grade checker work online

The page can't call the grades server directly (browser security: no CORS headers, plain http).
Fix = a tiny free proxy.

1. Go to https://dash.cloudflare.com -> Workers & Pages -> Create -> Create Worker.
2. Click Deploy, then Edit code. Replace everything with the contents of `grades-proxy-worker.js`. Deploy.
3. Copy the worker URL (looks like https://something.yourname.workers.dev).
4. In `script.js`, set:  var GRADE_PROXY = 'https://something.yourname.workers.dev/';
5. Re-upload / refresh your site.

Quick test: open  https://something.yourname.workers.dev/?id=2540064&lastName=Mortel  in a browser tab.

const CACHE_NAME = 'spunti-v12';
const ASSETS = [
  './styles.css',
  './manifest.webmanifest',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
];

function patchIndexHtml(html) {
  return html
    .replace(
      '<button class="chip" data-filter-type="comprare_provare">🛒 Provare/Comprare</button>',
      '<button class="chip" data-filter-type="idea">💭 Idea</button>\n      <button class="chip" data-filter-type="provare">🧪 Provare</button>\n      <button class="chip" data-filter-type="comprare">🛒 Comprare</button>'
    )
    .replace(
      '<div class="radio-option"><input type="radio" name="f-type" id="f-type-comprare_provare" value="comprare_provare" /><label for="f-type-comprare_provare">🛒 Provare/Comprare</label></div>',
      '<div class="radio-option"><input type="radio" name="f-type" id="f-type-idea" value="idea" /><label for="f-type-idea">💭 Idea</label></div>\n        <div class="radio-option"><input type="radio" name="f-type" id="f-type-provare" value="provare" /><label for="f-type-provare">🧪 Provare</label></div>\n        <div class="radio-option"><input type="radio" name="f-type" id="f-type-comprare" value="comprare" /><label for="f-type-comprare">🛒 Comprare</label></div>'
    )
    .replace(
      '<label class="form-label" for="f-nextAction">Prossima azione minima</label>',
      '<label class="form-label" for="f-nextAction">Prossima azione, domanda o sviluppo possibile</label>'
    )
    .replace(
      'placeholder="Es: Trovare il libro in biblioteca"',
      'placeholder="Es: primo passo, domanda aperta o possibile sviluppo"'
    )
    .replace(
      '<script src="./app.js"></script>',
      `<script src="./app.js"></script>
<script>
  TYPE_LABELS.idea = 'Idea';
  TYPE_LABELS.provare = 'Provare';
  TYPE_LABELS.comprare = 'Comprare';
  TYPE_EMOJI.idea = '💭';
  TYPE_EMOJI.provare = '🧪';
  TYPE_EMOJI.comprare = '🛒';
  delete TYPE_LABELS.comprare_provare;
  delete TYPE_EMOJI.comprare_provare;
</script>`
    );
}

function patchAppJs(js) {
  return js
    .replace(
      "  creare:              'Creare',\n  comprare_provare:    'Provare/Comprare',",
      "  creare:              'Creare',\n  idea:                'Idea',\n  provare:             'Provare',\n  comprare:            'Comprare',"
    )
    .replace(
      "  creare:              '🎨',\n  comprare_provare:    '🛒',",
      "  creare:              '🎨',\n  idea:                '💭',\n  provare:             '🧪',\n  comprare:            '🛒',"
    );
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isHtml = url.pathname.endsWith('/spunti-pwa/') || url.pathname.endsWith('/spunti-pwa/index.html') || url.pathname.endsWith('/index.html');
  const isAppJs = url.pathname.endsWith('/spunti-pwa/app.js') || url.pathname.endsWith('/app.js');

  if (isHtml || isAppJs) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => response.text())
        .then(text => {
          const patched = isHtml ? patchIndexHtml(text) : patchAppJs(text);
          const headers = { 'Content-Type': isHtml ? 'text/html; charset=utf-8' : 'application/javascript; charset=utf-8' };
          return new Response(patched, { status: 200, headers });
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
/* Suivi TCC - Service Worker OFFLINE AUTONOME
   Objectif : après une première ouverture avec Acode/local server,
   l'icône installée doit pouvoir ouvrir l'appli même si Acode est fermé.
*/

const CACHE_NAME = "suivi-tcc-offline-autonome-20260521-2";
const INDEX_FALLBACK = "./index.htm";

const APP_FILES = [
  "./",
  "./index.htm",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./manifest.webmanifest",
  "./icons/icon-48.png",
  "./icons/icon-72.png",
  "./icons/icon-96.png",
  "./icons/icon-128.png",
  "./icons/icon-144.png",
  "./icons/icon-152.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-256.png",
  "./icons/icon-384.png",
  "./icons/icon-512.png",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./js/00-init.js",
  "./js/01-config.js",
  "./js/02-storage.js",
  "./js/03-helpers.js",
  "./js/04-models-data.js",
  "./js/05-counters-states.js",
  "./js/06-tables.js",
  "./js/07-energy.js",
  "./js/08-intervention.js",
  "./js/09-admin.js",
  "./js/10-views-main.js",
  "./js/11-views-tcc.js",
  "./js/12-views-injecteurs.js",
  "./js/13-render.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function updateCacheInBackground(request) {
  fetch(request)
    .then((response) => {
      if (!response || !response.ok) return;
      caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
    })
    .catch(() => {});
}

async function serveNavigation(request) {
  const cache = await caches.open(CACHE_NAME);

  // Important : pour une appli installée sur localhost,
  // on sert d'abord l'accueil depuis le cache.
  // Sinon, si Acode est fermé, Chrome tente localhost et échoue.
  const cachedIndex = await cache.match(INDEX_FALLBACK, { ignoreSearch: true })
    || await cache.match("./index.html", { ignoreSearch: true })
    || await cache.match(request, { ignoreSearch: true });

  if (cachedIndex) {
    updateCacheInBackground(request);
    return cachedIndex;
  }

  return fetch(request);
}

async function serveAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });

  if (cached) {
    updateCacheInBackground(request);
    return cached;
  }

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(serveNavigation(request));
    return;
  }

  event.respondWith(serveAsset(request));
});

/* Suivi TCC - Service Worker OFFLINE AUTONOME
   Version corrigée : cache robuste, nouveaux fichiers JS, index.html comme accueil.
*/

const CACHE_NAME = "suivi-tcc-offline-autonome-20260604-4";
const INDEX_FALLBACK = "./index.html";

const CORE_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
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
  "./js/13-render.js",
  "./js/14-cellules-cycle.js",
  "./js/planification.js",
  "./js/calendrier-preventifs.js",
  "./js/formulaires-preventifs.js"
];

// Ces fichiers sont utiles si présents, mais leur absence ne doit plus casser l'installation offline.
const OPTIONAL_FILES = [
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
  "./schemas/cellule.png",
  "./schemas/chariot.png",
  "./schemas/groupe-moteur.png",
  "./schemas/sortie.png",
  "./schemas/injecteurs/general.png",
  "./schemas/injecteurs/motorisation.png",
  "./schemas/injecteurs/orientation-60.png",
  "./schemas/injecteurs/reception.png",
  "./schemas/injecteurs/synchronisation.png",
  "./schemas/injecteurs/lancement-30.png"
];

async function cacheFile(cache, file, required = false) {
  try {
    const request = new Request(file, { cache: "reload" });
    const response = await fetch(request);
    if (!response || !response.ok) {
      if (required) throw new Error("Fichier introuvable : " + file);
      return;
    }
    await cache.put(file, response);
  } catch (error) {
    if (required) throw error;
    console.warn("Fichier optionnel non mis en cache :", file, error);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_FILES.map((file) => cacheFile(cache, file, true)));
    await Promise.allSettled(OPTIONAL_FILES.map((file) => cacheFile(cache, file, false)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

function updateCacheInBackground(request) {
  fetch(request)
    .then((response) => {
      if (!response || !response.ok) return;
      caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
    })
    .catch(() => {});
}

async function serveNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedIndex = await cache.match(INDEX_FALLBACK, { ignoreSearch: true })
    || await cache.match("./index.htm", { ignoreSearch: true })
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

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cached || Response.error();
  }
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

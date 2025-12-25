const CACHE_NAME = "eduspark-cache-v4";
const OFFLINE_URL = "/offline.html";

const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/offline.html",
  "/style.css",

  "/js/script.js",
  "/js/firebase-config.js",

  "/images/favicon.ico",
  "/images/apple-touch-icon.png",
  "/images/web-app-manifest-192x192.png",
  "/images/web-app-manifest-512x512.png"
];

// INSTALL
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
      ),
      self.registration.navigationPreload?.enable()
    ])
  );
  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Ignore external APIs
  if (
    url.includes("googleapis.com") ||
    url.includes("firestore.googleapis.com") ||
    url.includes("cloudinary.com") ||
    url.includes("chrome-extension")
  ) {
    return;
  }

  // Navigation requests
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Assets
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});


const CACHE_NAME = "quickfix-v8";

// App Shell (static files)
const STATIC_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./data.json",
  "./manifest.json",
  "./icon.png"
];


// ============================
// INSTALL (CACHE STATIC FILES)
// ============================
self.addEventListener("install", (event) => {
  console.log("SW: Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("SW: Caching app shell");
        return cache.addAll(STATIC_FILES);
      })
  );

  self.skipWaiting();
});


// ============================
// ACTIVATE (CLEAN OLD CACHE)
// ============================
self.addEventListener("activate", (event) => {
  console.log("SW: Activated");

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("SW: Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});


// ============================
// FETCH HANDLER
// ============================
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // 🧠 1. API / JSON → Network First
  if (request.url.includes("data.json")) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ⚡ 2. STATIC FILES → Cache First
  event.respondWith(
    caches.match(request).then(cached => {
      return (
        cached ||
        fetch(request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, clone);
          });
          return response;
        }).catch(() => {
          // Optional fallback (offline message)
          return new Response(
            "<h2 style='text-align:center;'>⚠️ You are offline</h2>",
            { headers: { "Content-Type": "text/html" } }
          );
        })
      );
    })
  );
});

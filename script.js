// ============================
// QUICKFIX 2.0 FINAL SCRIPT
// ============================

let services = [];
let userLocation = null;

// ============================
// LOAD DATA
// ============================
async function loadData() {
  const container = document.getElementById("serviceList");
  container.innerHTML = "<p style='text-align:center;'>Loading services...</p>";

  try {
    const res = await fetch('./data.json');
    services = await res.json();
    displayServices([...services]);
    loadRequests();
  } catch (err) {
    container.innerHTML = "<p style='text-align:center;'>Failed to load data</p>";
    console.error(err);
  }
}

loadData();


// ============================
// 📍 DETECT USER LOCATION
// ============================
function detectLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      alert("📍 Location detected!");
      filterServices();
    },
    () => {
      alert("Location permission denied");
    }
  );
}


// ============================
// 📏 DISTANCE CALCULATION
// ============================
function getDistance(user, service) {
  const dist = Math.sqrt(
    (user.lat - service.lat) ** 2 +
    (user.lng - service.lng) ** 2
  );

  return dist.toFixed(2); // cleaner display
}


// ============================
// 🧾 DISPLAY SERVICES
// ============================
function displayServices(data) {
  const container = document.getElementById("serviceList");
  container.innerHTML = "";

  let sortedData = [...data];

  // SORT BY DISTANCE (SAFE COPY)
  if (userLocation) {
    sortedData.sort((a, b) =>
      getDistance(userLocation, a) - getDistance(userLocation, b)
    );
  }

  if (sortedData.length === 0) {
    container.innerHTML = `<p style="text-align:center;">No services found</p>`;
    return;
  }

  sortedData.forEach(service => {
    const distance = userLocation
      ? `${getDistance(userLocation, service)} km away`
      : "Location not set";

    container.innerHTML += `
      <div class="card">
        <h3>${service.name}</h3>
        <p><b>Service:</b> ${capitalize(service.service)}</p>
        <p><b>Phone:</b> ${service.phone}</p>
        <p><b>Rating:</b> ⭐ ${service.rating}</p>
        <p><b>Distance:</b> ${distance}</p>

        <p class="status ${service.available ? "available" : "busy"}">
          ${service.available ? "Available" : "Busy"}
        </p>

        <button onclick="requestService('${service.name}')">
          📩 Request Service
        </button>

        <button onclick="callNow('${service.phone}')">
          📞 Call Now
        </button>

        <button onclick="chatNow('${service.phone}')">
          💬 WhatsApp
        </button>
      </div>
    `;
  });
}


// ============================
// 📞 CALL FUNCTION
// ============================
function callNow(phone) {
  window.location.href = `tel:${phone}`;
}


// ============================
// 💬 WHATSAPP CHAT
// ============================
function chatNow(phone) {
  window.open(`https://wa.me/91${phone}`, "_blank");
}


// ============================
// 📩 REQUEST SERVICE
// ============================
function requestService(serviceName) {
  let requests = JSON.parse(localStorage.getItem("quickfix_requests")) || [];

  // PREVENT DUPLICATES
  const alreadyRequested = requests.some(r => r.name === serviceName);

  if (alreadyRequested) {
    alert("⚠️ Already requested this service");
    return;
  }

  const newRequest = {
    name: serviceName,
    time: new Date().toLocaleString()
  };

  requests.push(newRequest);
  localStorage.setItem("quickfix_requests", JSON.stringify(requests));

  alert(`✅ Request sent for ${serviceName}`);
  loadRequests();
}


// ============================
// 📦 LOAD REQUESTS
// ============================
function loadRequests() {
  const container = document.getElementById("requestList");
  if (!container) return;

  let requests = JSON.parse(localStorage.getItem("quickfix_requests")) || [];
  container.innerHTML = "";

  if (requests.length === 0) {
    container.innerHTML = `<p style="text-align:center;">No requests yet</p>`;
    return;
  }

  requests.slice().reverse().forEach(req => {
    container.innerHTML += `
      <div class="card">
        <h3>${req.name}</h3>
        <p>Requested at: ${req.time}</p>
        <button onclick="removeRequest('${req.name}')">❌ Remove</button>
      </div>
    `;
  });
}


// ============================
// ❌ REMOVE REQUEST
// ============================
function removeRequest(name) {
  let requests = JSON.parse(localStorage.getItem("quickfix_requests")) || [];

  requests = requests.filter(r => r.name !== name);

  localStorage.setItem("quickfix_requests", JSON.stringify(requests));
  loadRequests();
}


// ============================
// 🔍 FILTER SERVICES
// ============================
document.getElementById("serviceFilter")
  .addEventListener("change", filterServices);

document.getElementById("searchInput")
  .addEventListener("input", filterServices);

function filterServices() {
  const selected = document.getElementById("serviceFilter").value;
  const search = document.getElementById("searchInput").value.toLowerCase();

  let filtered = [...services];

  if (selected !== "all") {
    filtered = filtered.filter(s => s.service === selected);
  }

  filtered = filtered.filter(s =>
    s.name.toLowerCase().includes(search) ||
    s.service.toLowerCase().includes(search)
  );

  displayServices(filtered);
}


// ============================
// 🔤 HELPER
// ============================
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}


// ============================
// 📲 SERVICE WORKER REGISTER
// ============================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker Registered"))
    .catch(err => console.log("SW Error:", err));
}
let deferredPrompt;

const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  installBtn.style.display = "inline-block";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();

  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === "accepted") {
    console.log("User installed app");
  }

  deferredPrompt = null;
  installBtn.style.display = "none";
});

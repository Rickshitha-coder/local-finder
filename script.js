// ============================
// QUICKFIX 2.0 ADVANCED SCRIPT
// ============================

let services = [];
let userLocation = null;

// LOAD DATA
fetch('./data.json')
  .then(res => res.json())
  .then(data => {
    services = data;
    displayServices(services);
    loadRequests();
  })
  .catch(err => {
    console.error("Error loading data:", err);
  });


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
  return Math.sqrt(
    (user.lat - service.lat) ** 2 +
    (user.lng - service.lng) ** 2
  );
}


// ============================
// 🧾 DISPLAY SERVICES
// ============================
function displayServices(data) {
  const container = document.getElementById("serviceList");
  container.innerHTML = "";

  // SORT BY DISTANCE IF LOCATION AVAILABLE
  if (userLocation) {
    data.sort((a, b) =>
      getDistance(userLocation, a) - getDistance(userLocation, b)
    );
  }

  // NO DATA CASE
  if (data.length === 0) {
    container.innerHTML = `<p style="text-align:center;">No services found</p>`;
    return;
  }

  // RENDER CARDS
  data.forEach(service => {
    container.innerHTML += `
      <div class="card">
        <h3>${service.name}</h3>
        <p><b>Service:</b> ${capitalize(service.service)}</p>
        <p><b>Phone:</b> ${service.phone}</p>
        <p><b>Rating:</b> ⭐ ${service.rating}</p>

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
// 📩 REQUEST SERVICE (LOCAL STORAGE)
// ============================
function requestService(serviceName) {
  let requests = JSON.parse(localStorage.getItem("quickfix_requests")) || [];

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

  requests.reverse().forEach(req => {
    container.innerHTML += `
      <div class="card">
        <h3>${req.name}</h3>
        <p>Requested at: ${req.time}</p>
      </div>
    `;
  });
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

  let filtered = services;

  // FILTER BY CATEGORY
  if (selected !== "all") {
    filtered = filtered.filter(s => s.service === selected);
  }

  // SEARCH (SMART)
  filtered = filtered.filter(s =>
    s.name.toLowerCase().includes(search) ||
    s.service.toLowerCase().includes(search)
  );

  displayServices(filtered);
}


// ============================
// 🔤 HELPER FUNCTION
// ============================
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

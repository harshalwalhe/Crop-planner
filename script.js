let map;
let marker;

// === Reverse Geocoding (lat, lng → address) ===
function reverseGeocode(lat, lng) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => {
            const address = data.display_name || "Unknown Address";
            const city = data.address.city || data.address.town || data.address.village || "Unknown City";
            const country = data.address.country || "Unknown Country";
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            document.getElementById('detectedAddress').textContent = address;
            document.getElementById('detectedRegion').textContent = `${city}, ${country}`;
            document.getElementById('timezone').textContent = timezone;

            updateMap(lat, lng, `${city}, ${country}`);
        })
        .catch(err => console.error("Reverse geocoding error:", err));
}

// === Forward Geocoding (address → lat, lng) ===
function forwardGeocode(query) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(results => {
            if (results.length > 0) {
                const lat = parseFloat(results[0].lat);
                const lng = parseFloat(results[0].lon);

                document.getElementById("latitude").textContent = lat.toFixed(6);
                document.getElementById("longitude").textContent = lng.toFixed(6);
                document.getElementById("accuracy").textContent = "Manual entry";

                reverseGeocode(lat, lng);
                fetchWeather(lat, lng); // ✅ fetch weather for manual location
            } else {
                alert("❌ Location not found. Try again.");
            }
        })
        .catch(err => console.error("Forward geocoding error:", err));
}

// === Update Map ===
function updateMap(lat, lng, label) {
    if (!map) {
        map = L.map('map').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
    }
    if (marker) {
        marker.setLatLng([lat, lng]).setPopupContent(`📍 ${label}`).openPopup();
    } else {
        marker = L.marker([lat, lng]).addTo(map).bindPopup(`📍 ${label}`).openPopup();
    }
    map.setView([lat, lng], 13);
}

// === Fetch Weather Data ===
function fetchWeather(lat, lng) {
    const apiKey = "be7dc6dc7a8837d6d79cf832775e6543"; // 🔑 Your OpenWeatherMap API key
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.main) {
                document.getElementById("temperature").textContent = `${data.main.temp.toFixed(1)} °C`;
                document.getElementById("humidity").textContent = `${data.main.humidity} %`;
                document.getElementById("wind").textContent = `${data.wind.speed} km/h`; // ✅ Fixed ID
                document.getElementById("precipitation").textContent = data.rain ? `${data.rain["1h"] || 0} mm` : "0 mm";
            } else {
                console.error("Weather API error:", data);
            }
        })
        .catch(err => console.error("Weather fetch error:", err));
}

// === GPS Detection ===
function getUserLocation() {
    if (!navigator.geolocation) {
        alert("❌ Geolocation not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            document.getElementById("latitude").textContent = lat.toFixed(6);
            document.getElementById("longitude").textContent = lng.toFixed(6);
            document.getElementById("accuracy").textContent = `< ${Math.round(pos.coords.accuracy)} meters`;

            reverseGeocode(lat, lng);
            fetchWeather(lat, lng); // ✅ fetch weather for GPS location
        },
        (err) => {
            console.error("GPS error:", err);
            alert("❌ GPS access denied/unavailable");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
}

// === Event Listeners ===
document.addEventListener("DOMContentLoaded", () => {
    // GPS detect button
    document.getElementById("refreshLocation").addEventListener("click", getUserLocation);

    // Manual location button
    document.getElementById("setManualLocation").addEventListener("click", () => {
        const query = document.getElementById("manualLocationInput").value;
        if (query.trim()) {
            forwardGeocode(query);
        } else {
            alert("⚠️ Please enter a location");
        }
    });

    // Auto-try GPS first
    getUserLocation();
});
document.addEventListener("DOMContentLoaded", () => {
    const recommendationBtn = document.getElementById("getRecommendations");
    const resultsBox = document.getElementById("recommendationResults");

    if (recommendationBtn) {
        recommendationBtn.addEventListener("click", () => {
            // Collect form values
            const spaceType = document.getElementById("space-type").value;
            const dimensions = document.getElementById("dimensions").value;
            const sunlight = document.getElementById("sunlight").value;
            const soil = document.getElementById("soil-type").value;
            const experience = document.getElementById("experience").value;

            // Basic validation
            if (!spaceType || !dimensions || !sunlight) {
                resultsBox.innerHTML = `<p style="color:red;">⚠️ Please fill in all required fields (Space type, Dimensions, Sunlight).</p>`;
                return;
            }

            // Demo recommendation logic (you can replace with backend API later)
            let recommendations = [];

            if (sunlight === "high") {
                recommendations.push("🍅 Tomatoes", "🌶️ Chili Peppers", "🥒 Cucumbers");
            } else if (sunlight === "medium") {
                recommendations.push("🥕 Carrots", "🥬 Lettuce", "🌿 Herbs (Mint, Basil)");
            } else {
                recommendations.push("🌱 Spinach", "🥦 Broccoli", "🌿 Coriander");
            }

            if (soil === "sandy") {
                recommendations.push("🥜 Groundnuts (sandy soil friendly)");
            } else if (soil === "clay") {
                recommendations.push("🍠 Sweet Potatoes (tolerates clay soil)");
            }

            // Update results box
            resultsBox.innerHTML = `
                <h3>🌿 Recommended Plants for You</h3>
                <ul>
                    ${recommendations.map(plant => `<li>${plant}</li>`).join("")}
                </ul>
                <p><b>Tip:</b> Based on your <i>${experience}</i> experience, start with easier plants first.</p>
            `;

            // Scroll to results
            resultsBox.scrollIntoView({ behavior: "smooth" });
        });
    }
});

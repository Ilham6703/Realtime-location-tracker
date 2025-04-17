const socket = io();

let mySocketId;
const markers = {};

// Get your own socket ID
socket.on("connect", () => {
    mySocketId = socket.id;
});

// Watch the user's position and send updates
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude });
        },
        (error) => {
            console.error("Geolocation error:", error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
} else {
    alert("Geolocation is not supported by your browser.");
}

// Initialize the map
const map = L.map("map").setView([0, 0], 16);

// Load OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Listen for location updates from all users
socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    // Center the map only for the current user
    if (id === mySocketId) {
        map.setView([latitude, longitude], 16);
    }

    // Update or add the marker
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }
});

// Handle user disconnection
socket.on("user-disconnect", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});

// LOAD SAVED REPORTS
let items = JSON.parse(localStorage.getItem("isuItems")) || [];
let claims = JSON.parse(localStorage.getItem("isuClaims")) || [];

let currentPhoto = "";

// SAVE DATA
function saveData() {
    localStorage.setItem("isuItems", JSON.stringify(items));
    localStorage.setItem("isuClaims", JSON.stringify(claims));
}

// ESCAPE USER INPUT
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// IMAGE PREVIEW
document.getElementById("photo").addEventListener("change", function() {
    const file = this.files[0];
    const preview = document.getElementById("preview");

    currentPhoto = "";

    if (!file) {
        preview.style.display = "none";
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please upload an image.");
        this.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert("Image must be 2MB or smaller.");
        this.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        currentPhoto = e.target.result;
        preview.src = currentPhoto;
        preview.style.display = "block";
    };

    reader.readAsDataURL(file);
});

// SUBMIT REPORT
document.getElementById("itemForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const newItem = {
        id: "ISU-" + Date.now(),
        type: document.getElementById("type").value,
        name: document.getElementById("name").value.trim(),
        category: document.getElementById("category").value,
        date: document.getElementById("date").value,
        location: document.getElementById("location").value.trim(),
        reporter: document.getElementById("reporter").value.trim(),
        contact: document.getElementById("contact").value.trim(),
        description: document.getElementById("description").value.trim(),
        photo: currentPhoto,
        status: document.getElementById("type").value,
        created: Date.now()
    };

    items.unshift(newItem);
    saveData();
    renderItems();

    this.reset();
    currentPhoto = "";
    document.getElementById("preview").style.display = "none";

    alert("Your report has been submitted successfully!");
});

// DASHBOARD COUNTERS
function updateDashboard() {
    document.getElementById("total").textContent = items.length;

    document.getElementById("lostCount").textContent =
        items.filter(i => i.status === "Lost").length;

    document.getElementById("foundCount").textContent =
        items.filter(i => i.status === "Found").length;

    document.getElementById("returnedCount").textContent =
        items.filter(i => i.status === "Returned").length;
}

// FILTER STATUS
function setStatus(status) {
    document.getElementById("filterStatus").value = status;
    renderItems();
}

// DISPLAY ITEMS
function renderItems() {
    const grid = document.getElementById("itemsGrid");

    const search = document.getElementById("search").value.toLowerCase();
    const category = document.getElementById("filterCategory").value;
    const status = document.getElementById("filterStatus").value;

    const filtered = items.filter(item => {
        const text = [
            item.name,
            item.location,
            item.description,
            item.category
        ].join(" ").toLowerCase();

        return text.includes(search) &&
            (!category || item.category === category) &&
            (!status || item.status === status);
    });

    grid.innerHTML = "";

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty">
                <h3>🔍 No Items Found</h3>
                <p>Try another search or submit a new report.</p>
            </div>`;
    }

    filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = "item-card";

        const photo = item.photo ||
            "https://placehold.co/600x400/e7eee9/075b35?text=No+Image";

        card.innerHTML = `
            <img src="${photo}" alt="Item photo"
                 onerror="this.src='https://placehold.co/600x400?text=No+Image'">

            <div class="item-info">
                <span class="status ${escapeHTML(item.status)}">
                    ${escapeHTML(item.status)}
                </span>

                <h3>${escapeHTML(item.name)}</h3>

                <p><b>Item ID:</b> ${escapeHTML(item.id)}</p>
                <p><b>Category:</b> ${escapeHTML(item.category)}</p>
                <p><b>Date:</b> ${escapeHTML(item.date)}</p>
                <p><b>Location:</b> ${escapeHTML(item.location)}</p>
                <p><b>Description:</b> ${escapeHTML(item.description)}</p>
                <p><b>Reported by:</b> ${escapeHTML(item.reporter)}</p>

                <div class="card-buttons">

                    <button onclick="claimItem('${escapeHTML(item.id)}')">
                        Claim Item
                    </button>

                    <button class="btn-secondary"
                        onclick="copyID('${escapeHTML(item.id)}')">
                        Copy ID
                    </button>

                    ${item.status !== "Returned" ? `
                    <button class="btn-blue"
                        onclick="markReturned('${escapeHTML(item.id)}')">
                        Mark Returned
                    </button>` : ""}

                    <button class="btn-danger"
                        onclick="deleteItem('${escapeHTML(item.id)}')">
                        Delete
                    </button>

                </div>
            </div>
        `;

        grid.appendChild(card);
    });

    updateDashboard();
}

// CLAIM ITEM
function claimItem(id) {
    const item = items.find(i => i.id === id);

    if (!item) return;

    if (item.status === "Lost") {
        alert("This item is currently reported as lost, not found.");
        return;
    }

    if (item.status === "Returned") {
        alert("This item has already been returned.");
        return;
    }

    const name = prompt("Enter your full name:");

    if (!name || !name.trim()) return;

    const email = prompt("Enter your school email:");

    if (!email || !email.includes("@")) {
        alert("Please enter a valid email.");
        return;
    }

    claims.push({
        itemID: id,
        name: name.trim(),
        email: email.trim(),
        date: new Date().toISOString()
    });

    saveData();

    alert("Claim request recorded! Please contact the campus Lost and Found staff for verification.");
}

// MARK RETURNED
function markReturned(id) {
    const item = items.find(i => i.id === id);

    if (!item) return;

    if (item.status !== "Found") {
        alert("Only found items can be marked as returned.");
        return;
    }

    if (confirm("Mark this item as returned?")) {
        item.status = "Returned";
        saveData();
        renderItems();
    }
}

// DELETE REPORT
function deleteItem(id) {
    if (confirm("Are you sure you want to delete this report?")) {
        items = items.filter(i => i.id !== id);
        claims = claims.filter(c => c.itemID !== id);

        saveData();
        renderItems();
    }
}

// COPY ITEM ID
function copyID(id) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(id)
            .then(() => alert("Item ID copied!"))
            .catch(() => prompt("Copy this Item ID:", id));
    } else {
        prompt("Copy this Item ID:", id);
    }
}

// SEARCH AND FILTER EVENTS
document.getElementById("search").addEventListener("input", renderItems);

document.getElementById("filterCategory").addEventListener("change", renderItems);

document.getElementById("filterStatus").addEventListener("change", renderItems);

// INITIAL DISPLAY
renderItems();
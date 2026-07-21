const API_BASE = "";

const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const addBtn = document.getElementById("add-btn");

function getToken() {
  return localStorage.getItem("adminToken");
}

function showDashboard() {
  loginSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  loadCharacters();
}

if (getToken()) {
  showDashboard();
}

loginBtn.addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || "Login failed";
      return;
    }

    localStorage.setItem("adminToken", data.token);
    showDashboard();
  } catch (err) {
    errorEl.textContent = "Network error. Try again.";
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("adminToken");
  dashboardSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
});

addBtn.addEventListener("click", async () => {
  const name = document.getElementById("char-name").value;
  const imageUrl = document.getElementById("char-image").value;
  const statusEl = document.getElementById("add-status");
  statusEl.textContent = "";

  if (!name || !imageUrl) {
    statusEl.textContent = "Please fill in both fields.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/characters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify({ name, imageUrl })
    });
    const data = await res.json();

    if (!res.ok) {
      statusEl.textContent = data.error || "Failed to add cosplay";
      return;
    }

    statusEl.textContent = "Cosplay added!";
    document.getElementById("char-name").value = "";
    document.getElementById("char-image").value = "";
    loadCharacters();
  } catch (err) {
    statusEl.textContent = "Network error.";
  }
});

async function loadCharacters() {
  const listEl = document.getElementById("admin-list");
  listEl.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/api/characters`);
    const characters = await res.json();

    listEl.innerHTML = "";
    characters.forEach((c) => {
      const item = document.createElement("div");
      item.className = "admin-item";
      item.innerHTML = `
        <img src="${c.imageUrl}" alt="${c.name}" />
        <span>${c.name} (${c.fupCount} points)</span>
        <button data-id="${c._id}" class="delete-btn">Delete</button>
      `;
      listEl.appendChild(item);
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        await fetch(`${API_BASE}/api/characters/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${getToken()}` }
        });
        loadCharacters();
      });
    });
  } catch (err) {
    listEl.innerHTML = "Failed to load cosplays.";
  }
}

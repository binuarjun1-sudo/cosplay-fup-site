const API_BASE = "";

const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const addBtn = document.getElementById("add-btn");
const saveWelcomeBtn = document.getElementById("save-welcome-btn");
const charImageFile = document.getElementById("char-image-file");
const adminPreviewImg = document.getElementById("admin-preview-img");
const adminUploadText = document.getElementById("admin-upload-text");

let selectedAdminFile = null;

charImageFile.addEventListener("change", () => {
  const file = charImageFile.files[0];
  if (!file) return;
  selectedAdminFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    adminPreviewImg.src = e.target.result;
    adminPreviewImg.classList.remove("hidden");
    adminUploadText.textContent = "✅ " + file.name;
  };
  reader.readAsDataURL(file);
});

function getToken() {
  return localStorage.getItem("adminToken");
}

function showDashboard() {
  loginSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  loadCharacters();
  loadWelcomeMessage();
  loadSubmissions();
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

async function loadWelcomeMessage() {
  try {
    const res = await fetch(`${API_BASE}/api/settings`);
    const data = await res.json();
    document.getElementById("welcome-input").value = data.welcomeMessage;
  } catch (err) {}
}

saveWelcomeBtn.addEventListener("click", async () => {
  const message = document.getElementById("welcome-input").value;
  const statusEl = document.getElementById("welcome-status");
  statusEl.textContent = "";

  try {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify({ welcomeMessage: message })
    });
    const data = await res.json();

    if (!res.ok) {
      statusEl.textContent = data.error || "Failed to save";
      return;
    }
    statusEl.textContent = "Welcome message updated!";
  } catch (err) {
    statusEl.textContent = "Network error.";
  }
});

addBtn.addEventListener("click", async () => {
  const name = document.getElementById("char-name").value;
  const statusEl = document.getElementById("add-status");
  statusEl.textContent = "";

  if (!name || !selectedAdminFile) {
    statusEl.textContent = "Please add a name and choose a photo.";
    return;
  }

  addBtn.disabled = true;
  statusEl.textContent = "Uploading...";

  try {
    const formData = new FormData();
    formData.append("image", selectedAdminFile);

    const uploadRes = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData
    });
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      statusEl.textContent = uploadData.error || "Upload failed";
      addBtn.disabled = false;
      return;
    }

    const res = await fetch(`${API_BASE}/api/characters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify({ name, imageUrl: uploadData.imageUrl })
    });
    const data = await res.json();

    if (!res.ok) {
      statusEl.textContent = data.error || "Failed to add cosplay";
      addBtn.disabled = false;
      return;
    }

    statusEl.textContent = "Cosplay added!";
    document.getElementById("char-name").value = "";
    charImageFile.value = "";
    adminPreviewImg.classList.add("hidden");
    adminUploadText.textContent = "📷 Tap to choose a photo";
    selectedAdminFile = null;
    addBtn.disabled = false;
    loadCharacters();
  } catch (err) {
    statusEl.textContent = "Network error.";
    addBtn.disabled = false;
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

async function loadSubmissions() {
  const listEl = document.getElementById("submissions-list");
  listEl.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/api/submissions`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    });
    const submissions = await res.json();

    if (!submissions.length) {
      listEl.innerHTML = '<p class="empty-text">No pending submissions.</p>';
      return;
    }

    listEl.innerHTML = "";
    submissions.forEach((s) => {
      const item = document.createElement("div");
      item.className = "admin-item";
      item.innerHTML = `
        <img src="${s.imageUrl}" alt="${s.name}" />
        <span>${s.name}</span>
        <button data-id="${s._id}" class="approve-btn">Approve</button>
        <button data-id="${s._id}" class="reject-btn delete-btn">Reject</button>
      `;
      listEl.appendChild(item);
    });

    document.querySelectorAll(".approve-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        await fetch(`${API_BASE}/api/submissions/${id}/approve`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${getToken()}` }
        });
        loadSubmissions();
        loadCharacters();
      });
    });

    document.querySelectorAll(".reject-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        await fetch(`${API_BASE}/api/submissions/${id}/reject`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${getToken()}` }
        });
        loadSubmissions();
      });
    });
  } catch (err) {
    listEl.innerHTML = "Failed to load submissions.";
  }
}

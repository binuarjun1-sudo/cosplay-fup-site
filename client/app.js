const API_BASE = "";

function getUserId() {
  let id = localStorage.getItem("fupUserId");
  if (!id) {
    id = "user_" + Math.random().toString(36).substring(2) + Date.now();
    localStorage.setItem("fupUserId", id);
  }
  return id;
}

let allCharacters = [];

async function loadGallery() {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = '<p class="empty-text">Loading...</p>';

  try {
    const res = await fetch(`${API_BASE}/api/characters`);
    const characters = await res.json();
    allCharacters = characters;
    renderGallery(characters);
  } catch (err) {
    gallery.innerHTML = '<p class="empty-text">Failed to load cosplays.</p>';
  }
}

function renderGallery(characters) {
  const gallery = document.getElementById("gallery");

  if (!characters.length) {
    gallery.innerHTML = '<p class="empty-text">No cosplays uploaded yet. Check back soon.</p>';
    return;
  }

  gallery.innerHTML = "";
  characters.forEach((c) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${c.imageUrl}" alt="${c.name}" />
      <div class="card-body">
        <div class="card-name">${c.name}</div>
        <div class="card-count">${c.fupCount} FUP points</div>
        <button class="vote-btn" data-id="${c._id}">Give FUP Point</button>
      </div>
    `;
    gallery.appendChild(card);
  });

  document.querySelectorAll(".vote-btn").forEach((btn) => {
    checkVoteStatus(btn.getAttribute("data-id"), btn);
    btn.addEventListener("click", () => vote(btn.getAttribute("data-id"), btn));
  });
}

async function checkVoteStatus(id, btn) {
  try {
    const res = await fetch(`${API_BASE}/api/characters/${id}/vote-status?userId=${getUserId()}`);
    const data = await res.json();
    if (!data.canVote) {
      startCooldown(btn, data.remainingSeconds);
    }
  } catch (err) {}
}

function startCooldown(btn, seconds) {
  btn.disabled = true;
  let remaining = seconds;

  function updateText() {
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    btn.textContent = `Wait ${h}h ${m}m`;
  }
  updateText();

  const interval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(interval);
      btn.disabled = false;
      btn.textContent = "Give FUP Point";
    } else {
      updateText();
    }
  }, 60000);
}

async function vote(id, btn) {
  btn.disabled = true;
  try {
    const res = await fetch(`${API_BASE}/api/characters/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: getUserId() })
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.remainingSeconds) {
        startCooldown(btn, data.remainingSeconds);
      }
      return;
    }

    btn.classList.add("pulse");
    loadGallery();
  } catch (err) {
    btn.disabled = false;
  }
}

document.getElementById("search-input").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase().trim();
  const filtered = allCharacters.filter((c) => c.name.toLowerCase().includes(query));
  renderGallery(filtered);
});

loadGallery();

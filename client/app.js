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
let currentCommentCharId = null;

async function loadWelcomeMessage() {
  try {
    const res = await fetch(`${API_BASE}/api/settings`);
    const data = await res.json();
    document.getElementById("welcome-message").textContent = data.welcomeMessage;
  } catch (err) {
    document.getElementById("welcome-message").textContent =
      "Browse the cosplays and give your favorite a FUP point.";
  }
}

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
        <button class="comment-btn" data-id="${c._id}" data-name="${c.name}">💬 Comments</button>
      </div>
    `;
    gallery.appendChild(card);
  });

  document.querySelectorAll(".vote-btn").forEach((btn) => {
    checkVoteStatus(btn.getAttribute("data-id"), btn);
    btn.addEventListener("click", () => vote(btn.getAttribute("data-id"), btn));
  });

  document.querySelectorAll(".comment-btn").forEach((btn) => {
    btn.addEventListener("click", () =>
      openComments(btn.getAttribute("data-id"), btn.getAttribute("data-name"))
    );
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

    loadGallery();
  } catch (err) {
    btn.disabled = false;
  }
}

async function openComments(characterId, name) {
  currentCommentCharId = characterId;
  document.getElementById("modal-title").textContent = name;
  document.getElementById("comment-modal").classList.remove("hidden");
  document.getElementById("comment-status").textContent = "";
  await loadComments(characterId);
}

document.getElementById("modal-close").addEventListener("click", () => {
  document.getElementById("comment-modal").classList.add("hidden");
});

async function loadComments(characterId) {
  const listEl = document.getElementById("comment-list");
  listEl.innerHTML = "Loading...";
  try {
    const res = await fetch(`${API_BASE}/api/characters/${characterId}/comments`);
    const comments = await res.json();

    if (!comments.length) {
      listEl.innerHTML = '<p class="empty-text">No comments yet. Be the first!</p>';
      return;
    }

    listEl.innerHTML = "";
    comments.forEach((c) => {
      const item = document.createElement("div");
      item.className = "comment-item";
      item.innerHTML = `<span class="comment-author">FUP USER</span><p>${escapeHtml(c.text)}</p>`;
      listEl.appendChild(item);
    });
  } catch (err) {
    listEl.innerHTML = "Failed to load comments.";
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById("comment-submit-btn").addEventListener("click", async () => {
  const input = document.getElementById("comment-input");
  const text = input.value.trim();
  const statusEl = document.getElementById("comment-status");
  statusEl.textContent = "";

  if (!text) {
    statusEl.textContent = "Comment cannot be empty.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/characters/${currentCommentCharId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await res.json();

    if (!res.ok) {
      statusEl.textContent = data.error || "Failed to post comment";
      return;
    }

    input.value = "";
    loadComments(currentCommentCharId);
  } catch (err) {
    statusEl.textContent = "Network error.";
  }
});

document.getElementById("search-input").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase().trim();
  const filtered = allCharacters.filter((c) => c.name.toLowerCase().includes(query));
  renderGallery(filtered);
});

loadWelcomeMessage();
loadGallery();

const API_BASE = "";

async function loadLeaderboard(range) {
  const container = document.getElementById("leaderboard");
  container.innerHTML = '<p class="empty-text">Loading...</p>';

  try {
    const res = await fetch(`${API_BASE}/api/leaderboard?range=${range}`);
    const characters = await res.json();

    if (!characters.length) {
      container.innerHTML = '<p class="empty-text">No cosplays yet.</p>';
      return;
    }

    container.innerHTML = "";
    characters.forEach((c, i) => {
      const row = document.createElement("div");
      row.className = "leaderboard-row";
      row.innerHTML = `
        <div class="leaderboard-rank">#${i + 1}</div>
        <img src="${c.imageUrl}" alt="${c.name}" />
        <div class="leaderboard-name">${c.name}</div>
        <div class="leaderboard-count">${c.rangeCount} pts</div>
      `;
      container.appendChild(row);
    });
  } catch (err) {
    container.innerHTML = '<p class="empty-text">Failed to load leaderboard.</p>';
  }
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    loadLeaderboard(btn.getAttribute("data-range"));
  });
});

loadLeaderboard("today");

const API_BASE = "";

async function loadLeaderboard() {
  const container = document.getElementById("leaderboard");
  container.innerHTML = '<p class="empty-text">Loading...</p>';

  try {
    const res = await fetch(`${API_BASE}/api/characters`);
    const characters = await res.json();

    if (!characters.length) {
      container.innerHTML = '<p class="empty-text">No cosplays yet.</p>';
      return;
    }

    characters.sort((a, b) => b.fupCount - a.fupCount);

    container.innerHTML = "";
    characters.forEach((c, i) => {
      const row = document.createElement("div");
      row.className = "leaderboard-row";
      row.innerHTML = `
        <div class="leaderboard-rank">#${i + 1}</div>
        <img src="${c.imageUrl}" alt="${c.name}" />
        <div class="leaderboard-name">${c.name}</div>
        <div class="leaderboard-count">${c.fupCount} pts</div>
      `;
      container.appendChild(row);
    });
  } catch (err) {
    container.innerHTML = '<p class="empty-text">Failed to load leaderboard.</p>';
  }
}

loadLeaderboard();

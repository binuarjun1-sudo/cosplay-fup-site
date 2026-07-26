const API_BASE = "";

function medalFor(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

async function loadLeaderboard(range) {
  const container = document.getElementById("leaderboard");
  container.innerHTML = '<div class="skeleton-grid" style="grid-template-columns: 1fr;">' +
    Array(5).fill('<div class="skeleton-card" style="height:66px;"></div>').join("") +
    '</div>';

  try {
    const res = await fetch(`${API_BASE}/api/leaderboard?range=${range}`);
    const characters = await res.json();

    if (!characters.length) {
      container.innerHTML = '<p class="empty-text">No cosplays yet.</p>';
      return;
    }

    container.innerHTML = "";
    characters.forEach((c, i) => {
      const rank = i + 1;
      const medal = medalFor(rank);
      const row = document.createElement("div");
      row.className = `leaderboard-row${rank <= 3 ? " top-rank" : ""}`;
      row.style.animationDelay = `${i * 0.06}s`;
      row.innerHTML = `
        <div class="leaderboard-rank">${medal ? medal : "#" + rank}</div>
        <img src="${c.imageUrl}" alt="${c.name}" loading="lazy" />
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

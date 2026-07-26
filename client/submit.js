const API_BASE = "";

document.getElementById("sub-btn").addEventListener("click", async () => {
  const name = document.getElementById("sub-name").value.trim();
  const imageUrl = document.getElementById("sub-image").value.trim();
  const statusEl = document.getElementById("sub-status");
  statusEl.textContent = "";
  statusEl.className = "status-text";

  if (!name || !imageUrl) {
    statusEl.textContent = "Please fill in both fields.";
    statusEl.className = "error-text";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, imageUrl })
    });
    const data = await res.json();

    if (!res.ok) {
      statusEl.textContent = data.error || "Submission failed";
      statusEl.className = "error-text";
      return;
    }

    statusEl.textContent = "Submitted! An admin will review it soon.";
    document.getElementById("sub-name").value = "";
    document.getElementById("sub-image").value = "";
  } catch (err) {
    statusEl.textContent = "Network error.";
    statusEl.className = "error-text";
  }
});

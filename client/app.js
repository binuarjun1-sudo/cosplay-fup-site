const API_BASE = "https://cosplay-fup-site.onrender.com";

function getUserId() {
  let id = localStorage.getItem("fup_user_id");
  if (!id) {
    id = "visitor_" + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem("fup_user_id", id);
  }
  return id;
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function timeLeftLabel(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `Wait ${h}h ${m}m`;
  return `Wait ${m}m`;
}

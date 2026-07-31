const API_BASE = "";
let selectedFile = null;

const fileInput = document.getElementById("sub-image-file");
const previewImg = document.getElementById("preview-img");
const previewText = document.getElementById("upload-preview-text");

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  selectedFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewImg.classList.remove("hidden");
    previewText.textContent = "✅ " + file.name;
  };
  reader.readAsDataURL(file);
});

document.getElementById("sub-btn").addEventListener("click", async () => {
  const name = document.getElementById("sub-name").value.trim();
  const statusEl = document.getElementById("sub-status");
  statusEl.textContent = "";
  statusEl.className = "status-text";

  if (!name || !selectedFile) {
    statusEl.textContent = "Please add a name and choose a photo.";
    statusEl.className = "error-text";
    return;
  }

  const submitBtn = document.getElementById("sub-btn");
  submitBtn.disabled = true;
  statusEl.textContent = "Uploading...";

  try {
    const formData = new FormData();
    formData.append("image", selectedFile);

    const uploadRes = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData
    });
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      statusEl.textContent = uploadData.error || "Upload failed";
      statusEl.className = "error-text";
      submitBtn.disabled = false;
      return;
    }

    const res = await fetch(`${API_BASE}/api/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, imageUrl: uploadData.imageUrl })
    });
    const data = await res.json();

    if (!res.ok) {
      statusEl.textContent = data.error || "Submission failed";
      statusEl.className = "error-text";
      submitBtn.disabled = false;
      return;
    }

    statusEl.textContent = "Submitted! An admin will review it soon.";
    statusEl.className = "status-text";
    document.getElementById("sub-name").value = "";
    fileInput.value = "";
    previewImg.classList.add("hidden");
    previewText.textContent = "📷 Tap to choose a photo";
    selectedFile = null;
    submitBtn.disabled = false;
  } catch (err) {
    statusEl.textContent = "Network error.";
    statusEl.className = "error-text";
    submitBtn.disabled = false;
  }
});

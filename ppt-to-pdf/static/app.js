const form = document.getElementById("convertForm");
const statusEl = document.getElementById("status");
const dl = document.getElementById("download");
const checkBtn = document.getElementById("checkBtn");
const engineRow = document.getElementById("engineRow");
const modeSel = document.getElementById("mode");
const fileInput = document.getElementById("file");
const submitBtn = document.getElementById("submitBtn");
const engineSel = document.getElementById("engine");

// Toggle UI based on mode
function applyModeUI() {
  const mode = modeSel.value;
  dl.innerHTML = "";
  statusEl.textContent = "";

  if (mode === "PPT2PDF") {
    engineRow.style.display = "flex";
    fileInput.accept = ".ppt,.pptx";
    submitBtn.textContent = "Convert to PDF";
  } else {
    engineRow.style.display = "none";
    fileInput.accept = ".pdf";
    submitBtn.textContent = "Convert to PPTX";
  }
}
applyModeUI();
modeSel.addEventListener("change", applyModeUI);

// Health check (engines)
checkBtn.addEventListener("click", async () => {
  statusEl.textContent = "Checking engines…";
  try {
    const r = await fetch("/health");
    const j = await r.json();
    statusEl.innerHTML =
      `LibreOffice: <b>${j.libreoffice ? "FOUND" : "NOT FOUND"}</b>` +
      (j.soffice_path ? ` (path: ${j.soffice_path})` : "") +
      ` • PowerPoint COM: <b>${j.powerpoint_com ? "AVAILABLE" : "NOT AVAILABLE"}</b>`;
  } catch {
    statusEl.textContent = "Unable to check /health.";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  dl.innerHTML = "";
  statusEl.textContent = "Uploading & converting…";

  if (!fileInput.files.length) {
    statusEl.textContent = "Please choose a file.";
    return;
  }

  const mode = modeSel.value;
  const data = new FormData();
  data.append("mode", mode);
  data.append("file", fileInput.files[0]);
  if (mode === "PPT2PDF") data.append("engine", engineSel.value);

  try {
    const res = await fetch("/convert", { method: "POST", body: data });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Conversion failed");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    let filename = mode === "PPT2PDF" ? "converted.pdf" : "converted.pptx";
    const cd = res.headers.get("Content-Disposition");
    if (cd) {
      const m = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
      filename = decodeURIComponent((m && (m[1] || m[2])) || filename);
    }

    dl.innerHTML = `<a href="${url}" download="${filename}">⬇️ Download ${filename}</a>`;
    statusEl.textContent = "Done ✔";
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
  }
});

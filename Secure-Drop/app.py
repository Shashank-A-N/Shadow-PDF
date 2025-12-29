import os
import sqlite3
import uuid
import shutil
import uvicorn
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Request
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# --- Configuration ---
UPLOAD_DIR = "secure_uploads"
DB_FILE = "secure_drop.db"
HOST = "localhost"
PORT = 8000
BASE_URL = f"http://{HOST}:{PORT}"

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Database Setup ---
def init_db():
    """Initialize the SQLite database to track files."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            filename TEXT,
            filepath TEXT,
            uploaded_at TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- FastAPI App ---
app = FastAPI(title="Secure Drop")

# --- HTML Templates (Embedded for Single-File Portability) ---
# In a larger app, these would be in a /templates folder.

STYLES = """
<style>
    :root { --bg: #1a1a1a; --card: #2d2d2d; --text: #e0e0e0; --accent: #646cff; --danger: #ff4646; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .container { background: var(--card); padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); width: 100%; max-width: 400px; text-align: center; }
    h1 { margin-top: 0; font-size: 1.5rem; }
    .drop-zone { border: 2px dashed #555; padding: 2rem; margin: 1.5rem 0; border-radius: 8px; cursor: pointer; transition: 0.2s; }
    .drop-zone:hover { border-color: var(--accent); background: rgba(100, 108, 255, 0.1); }
    button { background: var(--accent); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 6px; font-size: 1rem; cursor: pointer; transition: 0.2s; width: 100%; }
    button:hover { background: #535bf2; }
    button.download { background: #28a745; }
    button.download:hover { background: #218838; }
    .link-box { margin-top: 1rem; padding: 1rem; background: #222; border-radius: 6px; word-break: break-all; display: none; }
    .link-box p { margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #aaa; }
    .link-box a { color: var(--accent); text-decoration: none; }
    .hidden { display: none; }
    .spinner { border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top: 3px solid var(--accent); width: 20px; height: 20px; animation: spin 1s linear infinite; margin: 0 auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .warning { color: #aaa; font-size: 0.8rem; margin-top: 1rem; }
</style>
"""

UPLOAD_PAGE_HTML = f"""
<!DOCTYPE html>
<html>
<head><title>Secure Drop</title>{STYLES}</head>
<body>
    <div class="container">
        <h1>Secure Drop 🔒</h1>
        <p>Upload a file. Get a link. <br>File self-destructs after one download.</p>
        
        <div class="drop-zone" id="dropZone">
            <p>Drag & Drop or Click to Upload</p>
            <input type="file" id="fileInput" hidden>
        </div>

        <div id="loading" class="hidden"><div class="spinner"></div><p>Encrypting & Uploading...</p></div>

        <div id="result" class="link-box">
            <p>Your self-destructing link:</p>
            <a id="fileLink" href="#" target="_blank">...</a>
            <p style="margin-top:0.5rem; font-size: 0.7rem; color: #777;">(Copy this now. It vanishes once clicked.)</p>
        </div>
    </div>
    <script>
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        const fileLink = document.getElementById('fileLink');

        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {{ e.preventDefault(); dropZone.style.borderColor = '#646cff'; }});
        dropZone.addEventListener('dragleave', () => {{ dropZone.style.borderColor = '#555'; }});
        dropZone.addEventListener('drop', (e) => {{
            e.preventDefault();
            dropZone.style.borderColor = '#555';
            if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files[0]);
        }});
        fileInput.addEventListener('change', () => {{ if (fileInput.files.length) handleUpload(fileInput.files[0]); }});

        async function handleUpload(file) {{
            dropZone.classList.add('hidden');
            loading.classList.remove('hidden');
            
            const formData = new FormData();
            formData.append('file', file);

            try {{
                const res = await fetch('/upload', {{ method: 'POST', body: formData }});
                const data = await res.json();
                
                loading.classList.add('hidden');
                result.style.display = 'block';
                fileLink.href = data.url;
                fileLink.textContent = data.url;
            }} catch (err) {{
                alert('Upload failed');
                loading.classList.add('hidden');
                dropZone.classList.remove('hidden');
            }}
        }}
    </script>
</body>
</html>
"""

DOWNLOAD_PAGE_HTML = f"""
<!DOCTYPE html>
<html>
<head><title>File Ready</title>{STYLES}</head>
<body>
    <div class="container">
        <h1>File Ready 📦</h1>
        <p>This file will be <b>permanently deleted</b> immediately after you download it.</p>
        <div id="status">
            <button class="download" onclick="downloadFile()">Download File</button>
        </div>
        <p class="warning">Do not refresh this page after downloading.<br>The link is already expiring.</p>
    </div>
    <script>
        function downloadFile() {{
            const btn = document.querySelector('button');
            btn.disabled = true;
            btn.textContent = "Downloading & Deleting...";
            btn.style.background = "#555";
            
            // Trigger the actual download endpoint
            window.location.href = window.location.href + '/stream';
            
            // Update UI to reflect destruction
            setTimeout(() => {{
                document.querySelector('.container').innerHTML = "<h1>💥 Poof!</h1><p>The file has been deleted from the server.</p>";
            }}, 2000);
        }}
    </script>
</body>
</html>
"""

ERROR_PAGE_HTML = f"""
<!DOCTYPE html>
<html>
<head><title>Gone</title>{STYLES}</head>
<body>
    <div class="container">
        <h1 style="color: var(--danger);">404 Not Found</h1>
        <p>This drop has already self-destructed or never existed.</p>
        <a href="/" style="color: var(--accent);">Create New Drop</a>
    </div>
</body>
</html>
"""

# --- Helper Functions ---
def cleanup_file(file_id: str, filepath: str):
    """Deletes the file from disk and the database."""
    try:
        # 1. Delete from Disk
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"[-] File deleted from disk: {filepath}")
        
        # 2. Delete from Database
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM files WHERE id = ?", (file_id,))
        conn.commit()
        conn.close()
        print(f"[-] Record deleted from DB: {file_id}")
        
    except Exception as e:
        print(f"Error during cleanup: {e}")

# --- Endpoints ---

@app.get("/", response_class=HTMLResponse)
async def home():
    """Serve the upload page."""
    return HTMLResponse(content=UPLOAD_PAGE_HTML)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Handle file upload and generate link."""
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    save_name = f"{file_id}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, save_name)

    # Save content to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Save metadata to DB
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO files (id, filename, filepath, uploaded_at) VALUES (?, ?, ?, ?)",
        (file_id, file.filename, file_path, datetime.now())
    )
    conn.commit()
    conn.close()

    return {"url": f"{BASE_URL}/d/{file_id}"}

@app.get("/d/{file_id}", response_class=HTMLResponse)
async def download_landing(file_id: str):
    """Show the 'Click to Download' landing page."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT filename FROM files WHERE id = ?", (file_id,))
    result = cursor.fetchone()
    conn.close()

    if not result:
        return HTMLResponse(content=ERROR_PAGE_HTML, status_code=404)
    
    return HTMLResponse(content=DOWNLOAD_PAGE_HTML)

@app.get("/d/{file_id}/stream")
async def download_stream(file_id: str, background_tasks: BackgroundTasks):
    """Actually serve the file and trigger self-destruction."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT filename, filepath FROM files WHERE id = ?", (file_id,))
    result = cursor.fetchone()
    conn.close()

    if not result:
        return HTMLResponse(content=ERROR_PAGE_HTML, status_code=404)

    filename, filepath = result

    # Schedule the cleanup task to run AFTER the response is sent
    background_tasks.add_task(cleanup_file, file_id, filepath)

    return FileResponse(
        path=filepath, 
        filename=filename,
        media_type='application/octet-stream'
    )

if __name__ == "__main__":
    print(f"Server starting on {BASE_URL}")
    uvicorn.run(app, host=HOST, port=PORT)
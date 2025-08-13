import os
import sys
import tempfile
import shutil
import subprocess
from pathlib import Path
from datetime import datetime
import logging

from flask import Flask, render_template, request, send_file, jsonify, abort

# PDF -> PPT deps
import fitz  # PyMuPDF
from pptx import Presentation
from pptx.util import Inches

# --- Basic Configuration ---
app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["MAX_CONTENT_LENGTH"] = 300 * 1024 * 1024  # 300 MB
logging.basicConfig(level=logging.INFO)

# --- Supported File Extensions ---
PPT_EXTS = {".ppt", ".pptx"}
PDF_EXTS = {".pdf"}


# ---------------------------
# Engine detection (PPT->PDF) - Works on Windows, Linux, and macOS
# ---------------------------

def which_libreoffice():
    """Find the path to the LibreOffice executable."""
    # Check common command names first
    for cand in ("soffice", "libreoffice"):
        p = shutil.which(cand)
        if p:
            return p

    # Check default installation paths for Windows
    if sys.platform == "win32":
        for c in (
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        ):
            if os.path.exists(c):
                return c

    # Check default installation path for macOS
    if sys.platform == "darwin":
        c = "/Applications/LibreOffice.app/Contents/MacOS/soffice"
        if os.path.exists(c):
            return c
    
    return None


def powerpoint_available():
    """Check if PowerPoint can be controlled via COM on Windows."""
    if sys.platform != "win32":
        return False
    try:
        # This import will fail on non-windows systems
        import win32com.client
        # Try to create a dispatch object. If this fails, PowerPoint is not installed.
        win32com.client.Dispatch("PowerPoint.Application")
        return True
    except Exception:
        return False


# ---------------------------
# PPT -> PDF Conversion Engines
# ---------------------------

def convert_with_libreoffice(soffice_path, input_file, out_dir):
    """Converts a file using the LibreOffice command line."""
    input_file = str(Path(input_file).resolve())
    out_dir = str(Path(out_dir).resolve())
    os.makedirs(out_dir, exist_ok=True)

    logging.info(f"Attempting conversion with LibreOffice: {input_file}")
    cmd = [
        soffice_path,
        "--headless", "--nologo", "--invisible",
        "--convert-to", "pdf",
        input_file,
        "--outdir", out_dir,
    ]
    subprocess.run(cmd, check=True, capture_output=True, timeout=120)

    stem = Path(input_file).stem
    expected = Path(out_dir) / f"{stem}.pdf"
    if expected.exists():
        return str(expected)
    
    # Fallback for any unexpected naming
    candidates = sorted(Path(out_dir).glob(f"{stem}*.pdf"), key=lambda p: p.stat().st_mtime)
    if candidates:
        return str(candidates[-1])
        
    raise FileNotFoundError("LibreOffice reported success, but the output PDF could not be found.")


def convert_with_powerpoint(input_file, out_dir):
    """Converts a file using PowerPoint COM automation (Windows only)."""
    # These imports are safe because this function is only called on Windows
    import pythoncom
    import win32com.client

    pythoncom.CoInitialize()
    
    input_file = str(Path(input_file).resolve())
    out_dir = Path(out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    out_pdf = out_dir / f"{Path(input_file).stem}.pdf"

    pp = None
    pres = None
    try:
        logging.info(f"Attempting conversion with PowerPoint: {input_file}")
        pp = win32com.client.Dispatch("PowerPoint.Application")
        pres = pp.Presentations.Open(input_file, WithWindow=False)
        pres.SaveAs(str(out_pdf), 32)  # 32 = PDF format
    finally:
        if pres:
            pres.Close()
        if pp:
            pp.Quit()
        pythoncom.CoUninitialize()

    if not out_pdf.exists():
        raise FileNotFoundError("PowerPoint did not create the PDF file.")
    return str(out_pdf)


def ppt_to_pdf(input_file):
    """
    Master function to convert PPT to PDF.
    It automatically chooses the best available engine.
    """
    tmp_out = tempfile.mkdtemp(prefix="ppt2pdf_out_")
    
    # On Windows, prefer PowerPoint if available.
    if sys.platform == "win32" and powerpoint_available():
        try:
            return convert_with_powerpoint(input_file, tmp_out), "PowerPoint"
        except Exception as e:
            logging.warning(f"PowerPoint conversion failed: {e}. Falling back to LibreOffice.")

    # Fallback to LibreOffice on all platforms
    lo_path = which_libreoffice()
    if lo_path:
        return convert_with_libreoffice(lo_path, input_file, tmp_out), "LibreOffice"

    raise RuntimeError("No conversion engine found. Please install LibreOffice or (on Windows) Microsoft PowerPoint.")


# ---------------------------
# PDF -> PPT (image-based) - This part is already cross-platform
# ---------------------------

def pdf_to_ppt_image_based(input_pdf, scale=2.0):
    """Convert each PDF page to an image and place it on its own slide."""
    input_pdf = str(Path(input_pdf).resolve())
    tmp_out = tempfile.mkdtemp(prefix="pdf2ppt_out_")
    out_pptx = str(Path(tmp_out) / (Path(input_pdf).stem + ".pptx"))

    doc = fitz.open(input_pdf)
    prs = Presentation()

    for page in doc:
        rect = page.rect
        width_in = float(rect.width) / 72.0
        height_in = float(rect.height) / 72.0

        prs.slide_width = Inches(width_in)
        prs.slide_height = Inches(height_in)

        mat = fitz.Matrix(scale, scale)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_path = str(Path(tmp_out) / f"page_{page.number+1}.png")
        pix.save(img_path)

        blank = prs.slide_layouts[6]
        slide = prs.slides.add_slide(blank)
        slide.shapes.add_picture(img_path, Inches(0), Inches(0), width=prs.slide_width, height=prs.slide_height)

    prs.save(out_pptx)
    doc.close()
    return out_pptx


# ---------------------------
# Flask Routes
# ---------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/health")
def health():
    """A simple health check endpoint."""
    return jsonify({
        "status": "ok",
        "platform": sys.platform,
        "powerpoint_com_available": powerpoint_available(),
        "libreoffice_available": bool(which_libreoffice()),
        "libreoffice_path": which_libreoffice() or "Not Found",
    })


@app.route("/convert", methods=["POST"])
def convert():
    """Handles both conversion directions: PPT2PDF and PDF2PPT."""
    mode = (request.form.get("mode") or "PPT2PDF").upper()

    if "file" not in request.files:
        abort(400, "No file field named 'file' in form data.")

    f = request.files["file"]
    if not f.filename:
        abort(400, "No file selected.")

    ext = Path(f.filename).suffix.lower()
    tmp_in = tempfile.mkdtemp(prefix="conv_in_")
    src_path = os.path.join(tmp_in, Path(f.filename).name)
    f.save(src_path)

    output_path = None
    try:
        if mode == "PPT2PDF":
            if ext not in PPT_EXTS:
                abort(400, "Please upload a .ppt or .pptx file for PPT2PDF.")
            
            output_path, engine_used = ppt_to_pdf(src_path)
            out_name = f"{Path(src_path).stem}_({engine_used}).pdf"
            mime_type = "application/pdf"

        elif mode == "PDF2PPT":
            if ext not in PDF_EXTS:
                abort(400, "Please upload a .pdf file for PDF2PPT.")
            
            output_path = pdf_to_ppt_image_based(src_path, scale=2.0)
            out_name = f"{Path(src_path).stem}.pptx"
            mime_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        else:
            abort(400, "Unknown mode. Use PPT2PDF or PDF2PPT.")

        resp = send_file(output_path, as_attachment=True, download_name=out_name, mimetype=mime_type)

        @resp.call_on_close
        def _cleanup():
            try:
                shutil.rmtree(tmp_in, ignore_errors=True)
                if output_path:
                    shutil.rmtree(Path(output_path).parent, ignore_errors=True)
            except Exception as e:
                logging.error(f"Error during cleanup: {e}")
        
        return resp

    except Exception as e:
        shutil.rmtree(tmp_in, ignore_errors=True)
        logging.error(f"Conversion failed: {e}", exc_info=True)
        abort(500, f"Conversion failed: {e}")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)

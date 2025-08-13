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
# PPT -> PDF Conversion Engine (LibreOffice only)
# ---------------------------

def convert_with_libreoffice(input_file, out_dir):
    """
    Converts a file to PDF using the LibreOffice/soffice command line tool.
    This is the only engine used in the Docker container.
    """
    # In the Docker container, 'libreoffice' is installed and should be in the PATH
    soffice_path = "libreoffice"
    
    input_file = str(Path(input_file).resolve())
    out_dir = str(Path(out_dir).resolve())
    os.makedirs(out_dir, exist_ok=True)

    logging.info(f"Starting conversion for {input_file} using {soffice_path}")

    cmd = [
        soffice_path,
        "--headless",
        "--nologo",
        "--invisible",
        "--convert-to", "pdf",
        input_file,
        "--outdir", out_dir,
    ]
    
    try:
        # Run the conversion command
        process = subprocess.run(
            cmd, 
            check=True, 
            capture_output=True, 
            text=True,
            timeout=120 # 2-minute timeout
        )
        logging.info("LibreOffice stdout: %s", process.stdout)
        logging.error("LibreOffice stderr: %s", process.stderr)

    except subprocess.CalledProcessError as e:
        # This catches errors if LibreOffice returns a non-zero exit code
        logging.error(f"LibreOffice command failed with exit code {e.returncode}")
        logging.error(f"Stderr: {e.stderr}")
        raise RuntimeError(f"LibreOffice conversion failed. Error: {e.stderr}")
    except FileNotFoundError:
        # This catches an error if the 'libreoffice' command itself isn't found
        logging.error("The 'libreoffice' command was not found. Is it installed and in the system's PATH?")
        raise RuntimeError("LibreOffice is not installed or not found in the container's PATH.")

    # Find the output file and return its path
    stem = Path(input_file).stem
    expected = Path(out_dir) / f"{stem}.pdf"
    if expected.exists():
        logging.info(f"Conversion successful. Output file: {expected}")
        return str(expected)
    
    # Fallback for any unexpected naming
    candidates = sorted(Path(out_dir).glob(f"{stem}*.pdf"), key=lambda p: p.stat().st_mtime)
    if candidates:
        return str(candidates[-1])
        
    raise FileNotFoundError("LibreOffice reported success, but the output PDF could not be found.")


# ---------------------------
# PDF -> PPT (image-based) - This part is already cross-platform
# ---------------------------

def pdf_to_ppt_image_based(input_pdf, scale=2.0):
    """
    Convert each PDF page to an image and place it on its own slide.
    """
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
    # Check if shutil can find the 'libreoffice' command
    libreoffice_path = shutil.which("libreoffice")
    return jsonify({
        "status": "ok",
        "libreoffice_available": bool(libreoffice_path),
        "libreoffice_path": libreoffice_path or "Not found in PATH",
    })


@app.route("/convert", methods=["POST"])
def convert():
    """
    Handles both conversion directions: PPT2PDF and PDF2PPT.
    """
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
            
            tmp_out_dir = tempfile.mkdtemp(prefix="ppt2pdf_out_")
            output_path = convert_with_libreoffice(src_path, tmp_out_dir)
            out_name = f"{Path(src_path).stem}.pdf"
            mime_type = "application/pdf"

        elif mode == "PDF2PPT":
            if ext not in PDF_EXTS:
                abort(400, "Please upload a .pdf file for PDF2PPT.")
            
            output_path = pdf_to_ppt_image_based(src_path, scale=2.0)
            out_name = f"{Path(src_path).stem}.pptx"
            mime_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        else:
            abort(400, "Unknown mode. Use PPT2PDF or PDF2PPT.")

        # Prepare the file to be sent
        resp = send_file(output_path, as_attachment=True, download_name=out_name, mimetype=mime_type)

        @resp.call_on_close
        def _cleanup():
            # This function will be called after the response is sent
            try:
                shutil.rmtree(tmp_in, ignore_errors=True)
                if output_path:
                    shutil.rmtree(Path(output_path).parent, ignore_errors=True)
            except Exception as e:
                logging.error(f"Error during cleanup: {e}")
        
        return resp

    except Exception as e:
        # Clean up input files on any conversion error
        shutil.rmtree(tmp_in, ignore_errors=True)
        logging.error(f"Conversion failed: {e}", exc_info=True)
        abort(500, f"Conversion failed: {e}")


if __name__ == "__main__":
    # This is for local development only. Gunicorn is used in production.
    app.run(host="127.0.0.1", port=5000, debug=True)

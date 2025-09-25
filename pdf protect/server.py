import os
import subprocess
import tempfile
import threading
import time
from flask import Flask, request, render_template, send_file, jsonify
from werkzeug.utils import secure_filename

app = Flask(__name__)

def _remove_later(path, delay=5):
    def _fn():
        time.sleep(delay)
        try:
            if os.path.exists(path):
                os.unlink(path)
        except Exception:
            app.logger.exception("Failed to remove temp file %s", path)
    t = threading.Thread(target=_fn, daemon=True)
    t.start()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/protect', methods=['POST'])
def protect_pdf():
    if 'pdf' not in request.files or 'password' not in request.form:
        return jsonify({'error': 'Missing PDF file or password'}), 400

    pdf_file = request.files['pdf']
    password = request.form['password']
    if not password:
        return jsonify({'error': 'Password cannot be empty'}), 400

    in_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    out_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    in_path = in_temp.name
    out_path = out_temp.name
    try:
        # Save and close so other tools can read the file
        pdf_file.save(in_path)
        in_temp.close()
        out_temp.close()

        # --------- DETECT ENCRYPTION (1) PyPDF2 ----------
        is_encrypted = False
        try:
            from PyPDF2 import PdfReader
            try:
                reader = PdfReader(in_path)
                is_encrypted = getattr(reader, "is_encrypted", False)
            except Exception as e:
                # If PdfReader fails with an encrypted-file error, treat as encrypted
                msg = str(e).lower()
                if "encrypted" in msg or "password" in msg or "cannot decrypt" in msg:
                    is_encrypted = True
        except Exception:
            app.logger.debug("PyPDF2 not available; falling back to qpdf detection")

        # --------- DETECT ENCRYPTION (2) qpdf fallback ----------
        if not is_encrypted:
            try:
                show = subprocess.run(
                    ['qpdf', '--show-encryption', in_path],
                    capture_output=True, text=True, check=False
                )
                combined = (show.stdout or "") + "\n" + (show.stderr or "")
                lower = combined.lower()
                app.logger.debug("qpdf --show-encryption output: %s", combined)
                # If output mentions encryption (but not 'not encrypted' / 'no encryption') treat as encrypted
                if ("encrypted" in lower and "not encrypted" not in lower and "no encryption" not in lower) \
                   or "password required" in lower or "user password" in lower or "owner password" in lower:
                    is_encrypted = True
            except FileNotFoundError:
                app.logger.error("qpdf not installed; cannot run qpdf --show-encryption")

        if is_encrypted:
            # clean up input temp right away, leave output not created
            try:
                if os.path.exists(in_path):
                    os.unlink(in_path)
            except Exception:
                app.logger.exception("Failed to remove input temp after detecting encryption")
            return jsonify({'error': 'PDF is already protected'}), 409

        # --------- PROTECT with qpdf ----------
        try:
            proc = subprocess.run([
                'qpdf',
                '--encrypt',
                password,
                password,
                '256',
                '--modify=none',
                '--print=none',
                '--extract=n',
                '--',
                in_path,
                out_path
            ], capture_output=True, text=True, check=True)
        except subprocess.CalledProcessError as e:
            stderr = (e.stderr or "").lower()
            app.logger.error("qpdf encrypt failed: %s", e.stderr)
            # If qpdf complains 'invalid password', it's very likely the input was encrypted and detection missed it.
            if 'invalid password' in stderr or 'incorrect password' in stderr or 'password required' in stderr:
                # cleanup and return friendly 409
                try:
                    if os.path.exists(in_path):
                        os.unlink(in_path)
                except Exception:
                    app.logger.exception("Failed to remove input temp after qpdf error")
                return jsonify({'error': 'PDF is already protected'}), 409
            # otherwise return qpdf stderr for debugging
            return jsonify({'error': e.stderr or 'Failed to process PDF with qpdf.'}), 500

        # Serve the protected file. Schedule deletion shortly after returning.
        response = send_file(
            out_path,
            as_attachment=True,
            download_name=f"protected-{secure_filename(pdf_file.filename)}"
        )
        # remove input immediately and output shortly after response is returned
        try:
            if os.path.exists(in_path):
                os.unlink(in_path)
        except Exception:
            app.logger.exception("Failed to remove input temp file")
        _remove_later(out_path, delay=6)
        return response

    except FileNotFoundError:
        return jsonify({'error': 'qpdf is not installed on the server'}), 500
    finally:
        # in case something else left the input temp
        try:
            if os.path.exists(in_path):
                os.unlink(in_path)
        except Exception:
            pass

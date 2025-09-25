import os
import subprocess
import tempfile
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

# --- Flask App Initialization ---
print("Flask server is starting up...")
app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app, expose_headers='Content-Disposition')

# --- Configuration ---
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB limit

# --- Language Detection and Mapping ---
def get_installed_languages():
    """
    Scans the Tesseract data directory to find all installed language packs
    and returns a dictionary of language codes to their friendly names.
    """
    print("Attempting to get installed Tesseract languages...")
    try:
        result = subprocess.run(
            ['tesseract', '--list-langs'], 
            capture_output=True, text=True, check=True
        )
        langs = [lang for lang in result.stdout.split('\n')[1:] if lang and lang != 'osd']
        language_name_map = {
            'eng': 'English', 'spa': 'Spanish', 'fra': 'French',
            'deu': 'German', 'por': 'Portuguese', 'ita': 'Italian',
            'nld': 'Dutch', 'rus': 'Russian', 'chi_sim': 'Chinese - Simplified',
            'chi_tra': 'Chinese - Traditional', 'jpn': 'Japanese', 'kor': 'Korean'
        }
        installed = {lang: language_name_map.get(lang, lang) for lang in sorted(langs)}
        if not installed:
            raise ValueError("No languages found")
        print(f"Successfully found {len(installed)} languages: {list(installed.keys())}")
        return installed
    except (subprocess.CalledProcessError, FileNotFoundError, ValueError) as e:
        error_message = f"FATAL: Could not get languages from Tesseract. Error: {e}"
        if hasattr(e, 'stderr') and e.stderr:
            error_message += f"\n Tesseract Stderr: {e.stderr}"
        print(error_message)
        print("Warning: Using a hardcoded fallback language list.")
        return {'eng': 'English (Fallback)'}

SUPPORTED_LANGUAGES = get_installed_languages()

# --- API Endpoints ---
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/languages', methods=['GET'])
def get_languages():
    print("Request received for /languages endpoint.")
    return jsonify(SUPPORTED_LANGUAGES)

@app.route('/ocr', methods=['POST'])
def ocr_pdf():
    print("Request received for /ocr endpoint.")
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in request.'}), 400
    
    file = request.files['file']
    language = request.form.get('language', 'eng')
    
    if file.filename == '':
        return jsonify({'error': 'No file selected.'}), 400
        
    if language not in SUPPORTED_LANGUAGES:
        error_msg = f"Unsupported language '{language}'."
        print(f"Error: {error_msg}")
        return jsonify({'error': error_msg}), 400

    if file and file.filename.lower().endswith('.pdf'):
        filename = secure_filename(file.filename)
        output_filename = os.path.splitext(filename)[0] + '_searchable.pdf'
        
        with tempfile.TemporaryDirectory() as temp_dir:
            pdf_path = os.path.join(temp_dir, filename)
            file.save(pdf_path)
            
            try:
                # --- STEP 1: Validate the PDF before processing ---
                # Use pdfinfo to check for corruption or password protection.
                pdfinfo_proc = subprocess.run(
                    ['pdfinfo', pdf_path],
                    capture_output=True, text=True
                )
                
                # Check for errors from pdfinfo. A non-zero return code means failure.
                if pdfinfo_proc.returncode != 0:
                    stderr_lower = pdfinfo_proc.stderr.lower()
                    if 'password' in stderr_lower:
                        error_msg = 'The PDF file is password-protected and cannot be processed.'
                        print(f"Validation failed for '{filename}': {error_msg}")
                        return jsonify({'error': error_msg}), 400
                    else:
                        # For any other error, assume it's corrupted or invalid.
                        error_msg = 'The PDF file appears to be corrupted or is not a valid PDF.'
                        print(f"Validation failed for '{filename}': {error_msg}. Details: {pdfinfo_proc.stderr}")
                        return jsonify({'error': error_msg}), 400

                # --- STEP 2: Convert valid PDF to images ---
                image_prefix = os.path.join(temp_dir, 'page_img')
                subprocess.run(
                    ['pdftoppm', '-tiff', pdf_path, image_prefix],
                    check=True, capture_output=True, text=True
                )
                
                image_files = sorted([f for f in os.listdir(temp_dir) if f.startswith('page_img')])
                if not image_files:
                    raise ValueError("PDF could not be converted into images. It might be empty or corrupt.")

                image_list_path = os.path.join(temp_dir, 'image_list.txt')
                with open(image_list_path, 'w') as f:
                    for img in image_files:
                        f.write(os.path.join(temp_dir, img) + '\n')

                # --- STEP 3: Run OCR on the images to create a new PDF ---
                output_pdf_base = os.path.join(temp_dir, 'output')
                subprocess.run(
                    ['tesseract', image_list_path, output_pdf_base, '-l', language, 'pdf'],
                    check=True, capture_output=True, text=True
                )
                
                output_pdf_path = output_pdf_base + '.pdf'
                if not os.path.exists(output_pdf_path):
                    raise FileNotFoundError("Tesseract did not create the output PDF file.")

                print(f"Successfully created searchable PDF for '{filename}'.")
                
                return send_file(
                    output_pdf_path,
                    mimetype='application/pdf',
                    as_attachment=True,
                    download_name=output_filename
                )

            except subprocess.CalledProcessError as e:
                error_details = e.stderr or "No error details available."
                print(f"Subprocess failed for '{filename}'. Stderr: {error_details}")
                # Provide a more user-friendly message for common syntax errors.
                if "syntax" in error_details.lower():
                     return jsonify({'error': 'Processing failed. The PDF may be corrupted.'}), 500
                return jsonify({'error': f"Processing failed. Details: {error_details}"}), 500
            except Exception as e:
                print(f"An unexpected error occurred for '{filename}': {e}")
                return jsonify({'error': f'An unexpected server error occurred: {str(e)}'}), 500
    else:
        return jsonify({'error': 'Invalid file type. Please upload a PDF.'}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)


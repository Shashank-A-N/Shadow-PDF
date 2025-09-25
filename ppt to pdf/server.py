import os
import subprocess
import uuid
import zipfile
import shutil
from flask import Flask, request, send_from_directory, jsonify, make_response, render_template

# Initialize Flask App and tell it where to find template files
app = Flask(__name__, static_folder='static', template_folder='static')

# Configuration
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 128 * 1024 * 1024 # 128MB limit
ALLOWED_EXTENSIONS = {'ppt', 'pptx'}

def allowed_file(filename):
    """Checks if the uploaded file has an allowed extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def cleanup(directory):
    """Recursively removes a directory and all its contents."""
    try:
        shutil.rmtree(directory)
        print(f"Successfully cleaned up directory: {directory}")
    except Exception as e:
        print(f"Error during cleanup of {directory}: {e}")

@app.route('/')
def index():
    """Serves the main HTML page."""
    # This ensures Flask can find the index.html inside the static folder
    return render_template('index.html')

@app.route('/convert-single', methods=['POST'])
def convert_single():
    """
    Handles single file upload and conversion.
    Does NOT send the file back, instead returns a JSON with a link to download.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if file and allowed_file(file.filename):
        job_id = str(uuid.uuid4())
        job_dir = os.path.join(app.config['UPLOAD_FOLDER'], job_id)
        os.makedirs(job_dir, exist_ok=True)
        input_path = os.path.join(job_dir, file.filename)
        file.save(input_path)

        try:
            # Using 'libreoffice' is more standard than 'soffice'
            subprocess.run(
                ['libreoffice', '--headless', '--convert-to', 'pdf', '--outdir', job_dir, input_path],
                check=True, timeout=120
            )
        except Exception as e:
            print(f"Conversion failed for {file.filename}: {e}")
            cleanup(job_dir)
            return jsonify({"error": f"Conversion failed for {file.filename}"}), 500

        output_filename = os.path.splitext(file.filename)[0] + '.pdf'
        output_path = os.path.join(job_dir, output_filename)

        if not os.path.exists(output_path):
            cleanup(job_dir)
            return jsonify({"error": "Converted file could not be found."}), 500
        
        # On success, return info to build the download link on the client
        return jsonify({
            "success": True, 
            "job_id": job_id,
            "output_filename": output_filename
        })
    else:
        return jsonify({"error": "Invalid file type."}), 400

@app.route('/download/<job_id>/<filename>', methods=['GET'])
def download_file(job_id, filename):
    """Serves the converted file for download and cleans up afterwards."""
    job_dir = os.path.join(app.config['UPLOAD_FOLDER'], job_id)
    
    if not os.path.exists(os.path.join(job_dir, filename)):
        return jsonify({"error": "File not found or has expired."}), 404
        
    response = make_response(send_from_directory(job_dir, filename, as_attachment=True))
    
    @response.call_on_close
    def after_request_cleanup():
        cleanup(job_dir)
        
    return response

@app.route('/create-zip', methods=['POST'])
def create_zip():
    """
    This endpoint is now effectively replaced by the logic within the frontend 
    to download multiple files individually, or a new batch endpoint would be needed.
    For simplicity, let's stick to single file logic and a simplified batch download.
    The most robust solution is to match the previous server's logic.
    """
    try:
        data = request.get_json()
        job_ids_info = data.get('job_ids', [])
        if not job_ids_info:
            return jsonify({'error': 'No files selected for ZIP creation'}), 400

        zip_job_id = str(uuid.uuid4())
        zip_dir = os.path.join(app.config['UPLOAD_FOLDER'], zip_job_id)
        os.makedirs(zip_dir)
        zip_filename = f"converted_files_{zip_job_id}.zip"
        zip_filepath = os.path.join(zip_dir, zip_filename)

        with zipfile.ZipFile(zip_filepath, 'w') as zipf:
            cleanup_dirs = []
            for job_info in job_ids_info:
                job_id = job_info.get('job_id')
                output_filename = job_info.get('output_filename')
                job_dir = os.path.join(app.config['UPLOAD_FOLDER'], job_id)
                
                converted_file_path = os.path.join(job_dir, output_filename)
                if os.path.exists(converted_file_path):
                    zipf.write(converted_file_path, arcname=output_filename)
                    cleanup_dirs.append(job_dir)
        
        response = make_response(send_from_directory(zip_dir, zip_filename, as_attachment=True))

        @response.call_on_close
        def after_request_cleanup():
            for d in set(cleanup_dirs): # Use set to avoid deleting the same dir twice
                cleanup(d)
            cleanup(zip_dir)

        return response
    except Exception as e:
        app.logger.error(f"Failed to create ZIP file: {e}")
        return jsonify({'error': f'Failed to create ZIP: {str(e)}'}), 500

if __name__ == '__main__':
    # Gunicorn will bind to the port, so this is for local dev only
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)), debug=True)



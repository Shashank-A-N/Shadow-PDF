from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from rembg import remove
from PIL import Image
import io

# Initialize the Flask application
app = Flask(__name__)
# Enable CORS to allow frontend to communicate with the backend
CORS(app)

# def serve_index():
#     """Serve the index.html file at the root URL."""
#     return render_template('index.html')


@app.route('/api/remove-background', methods=['POST'])
def remove_background_api():
    """
    API endpoint to remove the background from an uploaded image.
    Accepts a multipart/form-data request with an image file.
    Returns the processed image as a PNG file.
    """
    # Check if a file was sent in the request
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']

    # Check if the user selected a file
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Check if the file is an allowed image type
    allowed_extensions = {'png', 'jpg', 'jpeg', 'webp'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({"error": "Invalid file type. Please upload a PNG, JPG, JPEG, or WEBP image."}), 400

    try:
        # Read the image file from the request
        input_image_bytes = file.read()
        
        # Use rembg to remove the background
        output_image_bytes = remove(input_image_bytes)

        # Create an in-memory byte stream for the output image
        output_buffer = io.BytesIO(output_image_bytes)
        output_buffer.seek(0)

        # Send the processed image back as a file
        return send_file(
            output_buffer,
            mimetype='image/png',
            as_attachment=True,
            download_name='background_removed.png'
        )
    except Exception as e:
        # Log the error for debugging
        print(f"An error occurred: {e}")
        return jsonify({"error": "An error occurred during image processing."}), 500

if __name__ == '__main__':
    # Run the app on port 5001 to avoid conflicts with common dev ports
    app.run(host='0.0.0.0', port=5001, debug=True)

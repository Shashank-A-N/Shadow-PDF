import io
import os
import logging
import secrets
from flask import Flask, request, send_file, jsonify, abort
from flask_cors import CORS
import pikepdf

app = Flask(__name__)
# Expose the custom header for the password
CORS(app, expose_headers=['X-Generated-Password'])

# Basic config
MAX_UPLOAD_SIZE = 20 * 1024 * 1024  # 20 MB
ALLOWED_MIMETYPES = {"application/pdf"}
logging.basicConfig(level=logging.INFO)


# --- Authentication placeholder ---
def require_author(f):
    from functools import wraps
    @wraps(f)
    def wrapper(*args, **kwargs):
        # Auth is still commented out
        return f(*args, **kwargs)
    return wrapper


@app.route('/restrict', methods=['POST'])
@require_author
def restrict_pdf():
    try:
        # Basic checks
        if 'pdfFile' not in request.files:
            return jsonify({"error": "No file part"}), 400

        file = request.files['pdfFile']
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # ... (File size and mimetype checks are the same) ...
        file.stream.seek(0, io.SEEK_END)
        file_len = file.stream.tell()
        file.stream.seek(0)
        if file_len > MAX_UPLOAD_SIZE:
            return jsonify({"error": "File too large"}), 413
        if file.mimetype not in ALLOWED_MIMETYPES:
            return jsonify({"error": "Uploaded file is not a PDF"}), 400

        # --- Simplified Password Logic ---
        new_owner_password = request.form.get('ownerPassword')      # The new password to apply
        generate_owner = request.form.get('generateOwner') == 'true'
        
        generated_pass = None
        
        # Validate NEW password input
        if not new_owner_password and not generate_owner:
            return jsonify({"error": "No new owner password provided"}), 400
        if generate_owner:
            new_owner_password = secrets.token_urlsafe(16)
            generated_pass = new_owner_password
        # --- END Simplified Password Logic ---

        # Permissions controls (unchanged)
        restrict_copy = request.form.get('restrictCopy') == 'true'
        restrict_printing = request.form.get('restrictPrinting') == 'true'
        restrict_modifying = request.form.get('restrictModifying') == 'true'
        restrict_annotations = request.form.get('restrictAnnotations') == 'true'
        
        permissions = pikepdf.Permissions(
            print_lowres=not restrict_printing,
            print_highres=not restrict_printing,
            modify_assembly=not restrict_modifying,
            modify_other=not restrict_modifying,
            modify_form=not restrict_modifying and not restrict_annotations,
            modify_annotation=not restrict_modifying and not restrict_annotations,
            extract=not restrict_copy,
            accessibility=not restrict_copy
        )

        # --- MODIFIED: PDF opening logic ---
        pdf = None
        try:
            # Try opening with an empty password (for unrestricted files)
            pdf = pikepdf.Pdf.open(file.stream, password="")
        
        except pikepdf.PasswordError:
            # --- THIS IS THE NEW ERROR MESSAGE ---
            return jsonify({"error": "This file is already restricted. To apply new settings, please go to the 'Remove Restrictions' tab first."}), 400
        except Exception as e:
            app.logger.exception("Failed opening PDF")
            return jsonify({"error": "Invalid PDF file."}), 400
        # --- END MODIFIED: PDF opening logic ---


        output_stream = io.BytesIO()

        # Save with encryption using the NEW password
        pdf.save(
            output_stream,
            encryption=pikepdf.Encryption(
                owner=new_owner_password, # Use the new password
                allow=permissions 
            )
        )

        output_stream.seek(0)

        # Create the response
        response = send_file(
            output_stream,
            as_attachment=True,
            download_name=f"restricted_{os.path.basename(file.filename)}",
            mimetype='application/pdf'
        )
        
        # Add the new password to the header if it was generated
        if generated_pass:
            response.headers['X-Generated-Password'] = generated_pass

        return response

    except Exception:
        app.logger.exception("Unexpected error in /restrict")
        return jsonify({"error": "Internal server error"}), 500


# --- The unrestrict_pdf function is unchanged and correct ---
@app.route('/unrestrict', methods=['POST'])
@require_author
def unrestrict_pdf():
    try:
        # Basic checks
        if 'pdfFile' not in request.files:
            return jsonify({"error": "No file part"}), 400

        file = request.files['pdfFile']
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # Password is REQUIRED to unrestrict
        owner_password = request.form.get('ownerPassword')
        if not owner_password:
            return jsonify({"error": "Owner password is required to remove restrictions."}), 400

        pdf = None
        try:
            # 1. Try to open the file without a password first.
            pdf_check = pikepdf.Pdf.open(file.stream)
            
            # 2. Check if it's actually encrypted.
            if not pdf_check.is_encrypted:
                return jsonify({"error": "File is not password-protected or restricted."}), 400
            
            # 3. If we are here, the file IS encrypted.
            file.stream.seek(0) # Reset stream
            try:
                pdf = pikepdf.Pdf.open(file.stream, password=owner_password)
            except pikepdf.PasswordError:
                return jsonify({"error": "Incorrect owner password."}), 401

        except pikepdf.PasswordError:
            # This block runs if the file has a USER password
            file.stream.seek(0) # Reset stream
            try:
                pdf = pikepdf.Pdf.open(file.stream, password=owner_password)
            except pikepdf.PasswordError:
                return jsonify({"error": "Incorrect owner password."}), 401
            except Exception as e:
                app.logger.exception("Failed opening encrypted PDF")
                return jsonify({"error": f"Invalid PDF file or error: {e}"}), 400
        
        except Exception as e:
            # Other error (e.g., not a PDF)
            app.logger.exception("Failed opening PDF for unrestrict")
            return jsonify({"error": "Invalid PDF file."}), 400
        
        # If we're here, 'pdf' is the successfully decrypted file
        output_stream = io.BytesIO()

        # Save with NO encryption
        pdf.save(output_stream)
        output_stream.seek(0)

        response = send_file(
            output_stream,
            as_attachment=True,
            download_name=f"unrestricted_{os.path.basename(file.filename)}",
            mimetype='application/pdf'
        )
        return response

    except Exception:
        app.logger.exception("Unexpected error in /unrestrict")
        return jsonify({"error": "Internal server error"}), 500
# --- END OF NEW FUNCTION ---


if __name__ == '__main__':
    print("Starting Flask server on http://127.0.0.1:5000")
    print("Open pdf_restrictor.html in your browser to use the app.")
    app.run(port=5000, debug=True)
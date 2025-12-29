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
        return f(*args, **kwargs)
    return wrapper


@app.route('/restrict', methods=['POST'])
@require_author
def restrict_pdf():
    try:
        if 'pdfFile' not in request.files:
            return jsonify({"error": "No file part"}), 400
        file = request.files['pdfFile']
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # ... (File size and mimetype checks) ...
        file.stream.seek(0, io.SEEK_END)
        file_len = file.stream.tell()
        file.stream.seek(0)
        if file_len > MAX_UPLOAD_SIZE:
            return jsonify({"error": "File too large"}), 413
        if file.mimetype not in ALLOWED_MIMETYPES:
            return jsonify({"error": "Uploaded file is not a PDF"}), 400

        # Password logic
        new_owner_password = request.form.get('ownerPassword')
        generate_owner = request.form.get('generateOwner') == 'true'
        generated_pass = None
        
        if not new_owner_password and not generate_owner:
            return jsonify({"error": "No new owner password provided"}), 400
        if generate_owner:
            new_owner_password = secrets.token_urlsafe(16)
            generated_pass = new_owner_password

        # Permissions logic
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

        output_stream = io.BytesIO()

        # Open, check, and save logic
        try:
            with pikepdf.Pdf.open(file.stream, password="") as pdf:
                if pdf.is_encrypted:
                    return jsonify({"error": "This file is already restricted. To apply new settings, please go to the 'Edit/Remove Restrictions' tab first."}), 400

                pdf.save(
                    output_stream,
                    encryption=pikepdf.Encryption(
                        owner=new_owner_password,
                        allow=permissions 
                    )
                )
        except pikepdf.PasswordError:
            return jsonify({"error": "This file is already restricted (and has a user password). Please remove restrictions first."}), 400
        except Exception as e:
            app.logger.exception("Failed opening or saving PDF")
            return jsonify({"error": f"Invalid PDF file or processing error: {e}"}), 400

        output_stream.seek(0)
        response = send_file(
            output_stream,
            as_attachment=True,
            # --- THIS IS THE FIX ---
            download_name=f"restricted_{os.path.basename(file.filename)}",
            mimetype='application/pdf'
        )
        
        if generated_pass:
            response.headers['X-Generated-Password'] = generated_pass
        return response

    except Exception:
        app.logger.exception("Unexpected error in /restrict")
        return jsonify({"error": "Internal server error"}), 500


# --- NEW ENDPOINT TO READ PERMISSIONS ---
@app.route('/check_permissions', methods=['POST'])
@require_author
def check_permissions():
    try:
        if 'pdfFile' not in request.files:
            return jsonify({"error": "No file part"}), 400
        file = request.files['pdfFile']
        owner_password = request.form.get('ownerPassword')
        if not owner_password:
            return jsonify({"error": "Owner password is required."}), 400

        # Try to open with the password
        with pikepdf.Pdf.open(file.stream, password=owner_password) as pdf:
            # If we're here, password was correct and we have owner access
            p = pdf.allow
            
            # Read all the current permissions
            perms = {
                'can_print': bool(p.print_highres),
                'can_copy': bool(p.extract),
                'can_modify': bool(p.modify_other),
                'can_annotate': bool(p.modify_annotation)
            }
            return jsonify({"success": True, "permissions": perms})

    except pikepdf.PasswordError:
        return jsonify({"error": "Incorrect owner password."}), 401
    except Exception as e:
        app.logger.exception("Error in /check_permissions")
        return jsonify({"error": f"An error occurred: {e}"}), 500


# --- MODIFIED: This is the old /unrestrict endpoint, now rebuilt ---
@app.route('/update_permissions', methods=['POST'])
@require_author
def update_permissions():
    try:
        # Basic checks
        if 'pdfFile' not in request.files:
            return jsonify({"error": "No file part"}), 400
        file = request.files['pdfFile']
        owner_password = request.form.get('ownerPassword')
        if not owner_password:
            return jsonify({"error": "Owner password is required."}), 400

        # Get the new desired permissions from the form
        allow_print = request.form.get('allowPrinting') == 'true'
        allow_copy = request.form.get('allowCopying') == 'true'
        allow_modify = request.form.get('allowModifying') == 'true'
        allow_annotate = request.form.get('allowAnnotations') == 'true'

        # Create new pikepdf.Permissions object
        new_permissions = pikepdf.Permissions(
            print_lowres=allow_print,
            print_highres=allow_print,
            extract=allow_copy,
            modify_other=allow_modify,
            modify_assembly=allow_modify, # Tie assembly to modify
            modify_annotation=allow_annotate,
            modify_form=allow_annotate, # Tie forms to annotate
            accessibility=allow_copy # Tie accessibility to copy
        )
        
        # Open the PDF with the owner password
        with pikepdf.Pdf.open(file.stream, password=owner_password) as pdf:
            output_stream = io.BytesIO()
            
            # Check if all permissions are being set to True
            # If so, we can just save with no encryption at all
            if allow_print and allow_copy and allow_modify and allow_annotate:
                pdf.save(output_stream)
                app.logger.info("All restrictions lifted. Saving as unencrypted.")
            else:
                # Otherwise, re-encrypt with the SAME password but NEW permissions
                pdf.save(
                    output_stream,
                    encryption=pikepdf.Encryption(
                        owner=owner_password, # Use the SAME password
                        allow=new_permissions
                    )
                )
                app.logger.info("Permissions updated. Re-saving as encrypted.")

            output_stream.seek(0)
            response = send_file(
                output_stream,
                as_attachment=True,
                # --- THIS IS THE SECOND FIX ---
                download_name=f"updated_{os.path.basename(file.filename)}",
                mimetype='application/pdf'
            )
            return response

    except pikepdf.PasswordError:
        return jsonify({"error": "Incorrect owner password."}), 401
    except Exception as e:
        app.logger.exception("Error in /update_permissions")
        return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    print("Starting Flask server on http://127.0.0.1:5000")
    print("Open pdf_restrictor.html in your browser to use the app.")
    app.run(port=5000, debug=True)
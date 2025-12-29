from flask import Flask, request, send_file, jsonify, send_from_directory
import os, tempfile, subprocess

app = Flask(__name__, static_folder="static")

@app.route("/")
def home():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/unlock", methods=["POST"])
def unlock_pdf():
    if "file" not in request.files:
        return jsonify({"message": "No file uploaded"}), 400

    file = request.files["file"]
    password = request.form.get("password", "")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_in:
        file.save(temp_in.name)
        input_path = temp_in.name

    output_path = input_path.replace(".pdf", "-unlocked.pdf")

    try:
        # Run qpdf decryption
        cmd = ["qpdf", f"--password={password}", "--decrypt", input_path, output_path]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            return jsonify({"message": "Incorrect password or unsupported encryption"}), 400

        return send_file(
            output_path,
            as_attachment=True,
            download_name=file.filename.replace(".pdf", "-unlocked.pdf"),
            mimetype="application/pdf"
        )

    except Exception as e:
        return jsonify({"message": f"Failed to process PDF: {str(e)}"}), 500

    finally:
        if os.path.exists(input_path):
            os.remove(input_path)
        if os.path.exists(output_path):
            os.remove(output_path)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

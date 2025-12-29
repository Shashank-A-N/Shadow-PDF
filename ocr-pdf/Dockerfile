# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required for Tesseract and PDF processing
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    # Install a curated list of common languages to prevent build timeouts
    tesseract-ocr-eng \
    tesseract-ocr-spa \
    tesseract-ocr-fra \
    tesseract-ocr-deu \
    tesseract-ocr-por \
    tesseract-ocr-ita \
    tesseract-ocr-nld \
    tesseract-ocr-rus \
    tesseract-ocr-chi-sim \
    tesseract-ocr-chi-tra \
    tesseract-ocr-jpn \
    tesseract-ocr-kor \
    # Poppler-utils contains pdftoppm, which is needed to convert PDF to images
    poppler-utils \
    # Clean up apt-get lists to reduce image size
    && rm -rf /var/lib/apt/lists/*

# Copy the dependencies file to the working directory
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application's code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Run the application using gunicorn for production
# This command binds the server to 0.0.0.0, allowing external connections
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--timeout", "300", "server:app"]


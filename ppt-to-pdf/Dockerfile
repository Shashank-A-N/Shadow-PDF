# Use an official Python runtime as a parent image.
# python:3.10-slim is a good balance of size and functionality.
FROM python:3.10-slim

# --- Install System Dependencies ---
# Update the package list and install LibreOffice.
# LibreOffice is required for the app to convert PPT to PDF on Linux.
# --no-install-recommends keeps the image size smaller.
RUN apt-get update && apt-get install -y \
    libreoffice \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# --- Setup Python Environment ---
# Set the working directory in the container
WORKDIR /app

# Copy the requirements file first to leverage Docker's build cache.
# This layer only gets rebuilt if requirements.txt changes.
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code into the container
COPY . .

# --- Run the Application ---
# Tell Gunicorn to listen on all network interfaces on port 8080.
# Render will automatically map this to the public-facing port.
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app"]

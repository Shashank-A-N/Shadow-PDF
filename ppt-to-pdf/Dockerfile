# Use a lightweight official Python image
FROM python:3.10-slim

# Install LibreOffice for document conversion
# This is the key step to enable PPT-to-PDF conversion on Linux
RUN apt-get update && apt-get install -y libreoffice-writer --no-install-recommends

# Set working directory inside the container
WORKDIR /app

# Copy dependency list first (for caching)
COPY requirements.txt .

# Install Python dependencies
# Make sure pywin32 is REMOVED from your requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your project files
COPY . .

# Set the port for the web server
ENV PORT 8080

# Command to run Flask via Gunicorn
CMD ["gunicorn", "-b", ":8080", "app:app"]

# Use a lightweight official Python image
FROM python:3.10-slim

# Set working directory inside the container
WORKDIR /app

# Copy dependency list first (for caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your project files
COPY . .

# Set the port for Cloud Run
ENV PORT 8080

# Command to run Flask via Gunicorn
CMD ["gunicorn", "-b", ":8080", "app:app"]

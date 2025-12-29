FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install qpdf binary
RUN apt-get update && apt-get install -y qpdf && rm -rf /var/lib/apt/lists/*

# Copy source
COPY . .

# Start Flask app
CMD ["python", "server.py"]

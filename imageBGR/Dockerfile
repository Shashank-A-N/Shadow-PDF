# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- THE DEFINITIVE FIX: Pre-download the model by running it on a dummy image ---
# This creates a tiny 1x1 pixel PNG file, then runs the actual `remove` function
# on it. This forces the default model to be downloaded in a way that is guaranteed
# to work, regardless of internal library changes.
RUN python -c "from PIL import Image; Image.new('RGB', (1, 1)).save('dummy.png')"
RUN python -c "from rembg import remove; from PIL import Image; remove(Image.open('dummy.png'))"

# Copy the rest of the application code into the container
COPY . .

# Make the port available to the world outside this container
EXPOSE 8080

# Define environment variable for Render to use
ENV PORT 8080

# --- FINAL CMD FIX: Use shell form and increase the timeout to 120 seconds ---
# This prevents timeouts on larger image files.
CMD gunicorn --bind 0.0.0.0:$PORT --timeout 120 server:app


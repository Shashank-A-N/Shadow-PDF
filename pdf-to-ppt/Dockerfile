# Use an official Python runtime as a parent image.
# python:3.9-slim is a lightweight version, which is great for keeping the image size small.
FROM python:3.9-slim

# Set the working directory inside the container to /app.
# All subsequent commands (like COPY, RUN, CMD) will be run from this directory.
WORKDIR /app

# Copy the requirements.txt file into the container.
# This is done first to take advantage of Docker's layer caching. If this file doesn't
# change, Docker will reuse the cached layer during future builds, speeding them up.
COPY requirements.txt .

# Install the Python dependencies specified in requirements.txt.
# The --no-cache-dir flag prevents pip from storing the package cache,
# which helps to keep the final image size smaller.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the server script and the static folder into the container.
COPY server.py .
COPY static ./static/
# Create the uploads directory so the app has a place to store temp files.
RUN mkdir -p /app/uploads

# Inform Docker that the container will listen on port 5000 at runtime.
EXPOSE 5000

# Specify the command to run when the container starts.
# Use Gunicorn for a production-ready server.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "server:app"]
# Use an official Python runtime as a parent image
# Using a 'slim' version for a smaller base image size
FROM python:3.11-slim

# Install qpdf, the command-line tool for PDF manipulation
# This is a single RUN command to avoid parsing errors with line breaks.
# 'apt-get update' refreshes the package index
# 'apt-get install -y qpdf' installs the qpdf package without prompting for confirmation
# 'rm -rf /var/lib/apt/lists/*' cleans up the package cache to keep the image small
RUN apt-get update && apt-get install -y qpdf && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
# All subsequent commands (like COPY, RUN) will be executed from this directory
WORKDIR /app

# Copy the dependencies file to the working directory
# This copies the local requirements.txt into the /app directory inside the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# '--no-cache-dir' disables the pip cache to reduce image size
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to the working directory
# '.' refers to the current local directory, copying all files into the container's /app directory
COPY . .

# Make port 8080 available to the world outside this container
# This informs Docker that the container listens on the specified network port at runtime
# Render will automatically map this to ports 80/443
EXPOSE 8080

# Define environment variables
# Sets the FLASK_APP environment variable, which tells Flask where to find the application
ENV FLASK_APP=app.py

# Run app.py when the container launches using a production-ready server
# 'gunicorn' is a production WSGI server to run the Python app
# '--bind 0.0.0.0:8080' binds the server to all network interfaces on port 8080
# 'app:app' tells Gunicorn to run the 'app' object from the 'app.py' module
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "server:app"]
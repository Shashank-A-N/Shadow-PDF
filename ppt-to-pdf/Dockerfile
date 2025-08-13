FROM python:3.10-slim

# Install LibreOffice & fonts
RUN apt-get update && \
    apt-get install -y --no-install-recommends libreoffice libreoffice-common fonts-dejavu-core && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

ENV PORT=8080
# This ensures Python sees 'soffice' in PATH
ENV PATH="/usr/bin:${PATH}"

CMD ["gunicorn", "-b", "0.0.0.0:$PORT", "app:app"]

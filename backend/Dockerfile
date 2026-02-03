FROM python:3.12-slim

WORKDIR /app

# System deps for sentence-transformers (optional, for faster install)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# CPU 専用の PyTorch を先に導入し、CUDA 用の nvidia_* ホイールのダウンロードを防ぐ
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

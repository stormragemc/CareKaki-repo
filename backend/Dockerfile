# ── CareKaki backend (FastAPI + uvicorn) ─────────────────────────────────────
# Build context is ./backend (see docker-compose.yml).
FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Deps first for layer caching. pandas ships manylinux wheels on slim — no build tools needed.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

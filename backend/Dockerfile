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
# Shell form so hosts that inject $PORT (Render, Railway, Fly) are honoured;
# falls back to 8000 for local `docker run` / docker-compose.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv

COPY backend /app/backend
COPY data /app/data
COPY docs /app/docs
COPY README.md /app/README.md
COPY feature_list.json /app/feature_list.json
COPY progress.md /app/progress.md
COPY session-handoff.md /app/session-handoff.md

WORKDIR /app/backend

RUN uv sync --no-dev
RUN mkdir -p /app/backend/var

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


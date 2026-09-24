# Dev image for the FastAPI backend (hot reload via uvicorn --reload).
FROM python:3.14-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Keep the venv outside /app so the source bind mount doesn't hide it.
ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --locked --no-install-project

COPY . .

EXPOSE 8000
CMD ["uv", "run", "--no-sync", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]

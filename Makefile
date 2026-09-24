export UV_PROJECT_ENVIRONMENT := $(CURDIR)/.venv
export OLLAMA_HOST := 127.0.0.1:11435
export OLLAMA_MODELS := $(CURDIR)/.ollama/models
export OLLAMA_NO_CLOUD := 1

.DEFAULT_GOAL := all

.PHONY: all install dev front build check format test ai model-pull browser-test

all: install
	@set -eu; \
	ollama serve & \
	OLLAMA_PID=$$!; \
	trap 'kill $$OLLAMA_PID 2>/dev/null || true' EXIT INT TERM; \
	until ollama list >/dev/null 2>&1; do \
		kill -0 $$OLLAMA_PID 2>/dev/null || { echo "Ollama non si è avviato."; exit 1; }; \
		sleep 1; \
	done; \
	ollama pull qwen2.5:0.5b; \
	uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000

ai:
	ollama serve

model-pull:
	ollama pull qwen2.5:0.5b

install:
	uv sync --locked
	npm --prefix web ci
	npm --prefix web run build

dev:
	uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000

front:
	npm --prefix web run dev

build:
	npm --prefix web run build

browser-test: build
	npm --prefix web run test:e2e

check:
	uv lock --check
	uv run ruff check .
	uv run ruff format --check .
	uv run python -m pytest -q
	npm --prefix web test
	npm --prefix web run build

test:
	uv run python -m pytest -q

format:
	uv run ruff format .

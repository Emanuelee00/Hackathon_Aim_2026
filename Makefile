export UV_PROJECT_ENVIRONMENT := $(CURDIR)/.venv
export OLLAMA_HOST := 127.0.0.1:11435
export OLLAMA_MODELS := $(CURDIR)/.ollama/models
export OLLAMA_NO_CLOUD := 1
# OpenAI key of the chatbot agents (OPENAI_API=...), kept out of Git.
-include .env
# Export only the variables actually set: exporting an empty one would
# override the defaults in the code.
ifneq ($(OPENAI_API),)
export OPENAI_API
endif
ifneq ($(OPENAI_MODEL),)
export OPENAI_MODEL
endif

.DEFAULT_GOAL := all

.PHONY: all run install dev front build check format test ai model-pull browser-test demo qr migrate migration user seed tunnel tunnel-forever

all: install
	@set -eu; \
	ollama serve & \
	OLLAMA_PID=$$!; \
	trap 'kill $$OLLAMA_PID 2>/dev/null || true' EXIT INT TERM; \
	until ollama list >/dev/null 2>&1; do \
		kill -0 $$OLLAMA_PID 2>/dev/null || { echo "Ollama failed to start."; exit 1; }; \
		sleep 1; \
	done; \
	ollama pull qwen2.5:0.5b; \
	ollama pull qwen2.5:3b; \
	uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Comme `all`, mais sans Ollama : installe, builde le frontend et lance le backend.
run: install
	uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000

ai:
	ollama serve

model-pull:
	ollama pull qwen2.5:0.5b; \
	ollama pull qwen2.5:3b

install:
	uv sync --locked
	npm --prefix frontend ci
	npm --prefix frontend run build

dev:
	uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000

demo: build
	MARTHE_DEMO=1 uv run uvicorn main:app --host 0.0.0.0 --port 8000

qr:
	@test -n "$(URL)" || { echo "Usage : make qr URL=https://..."; exit 1; }
	uvx --from "qrcode[pil]" qr "$(URL)" > qr-demo.png
	@echo "QR code créé : qr-demo.png"

front:
	npm --prefix frontend run dev

build:
	npm --prefix frontend run build

browser-test: build
	npm --prefix frontend run test:e2e

check:
	uv lock --check
	uv run ruff check .
	uv run ruff format --check .
	uv run python -m pytest -q
	npm --prefix frontend test
	npm --prefix frontend run build

test:
	uv run python -m pytest -q

format:
	uv run ruff format .

migrate:
	uv run alembic -c backend/alembic.ini upgrade head

migration:
	@test -n "$(NAME)" || { echo "Usage : make migration NAME=\"add something\""; exit 1; }
	uv run alembic -c backend/alembic.ini revision --autogenerate -m "$(NAME)"

user:
	@test -n "$(EMAIL)" -a -n "$(NAME)" -a -n "$(ROLE)" || { echo "Usage : make user EMAIL=... NAME=... ROLE=equipe"; exit 1; }
	PYTHONPATH=backend uv run python -m accounts.create_user "$(EMAIL)" "$(NAME)" "$(ROLE)"

seed:
	PYTHONPATH=backend uv run python -m accounts.seed_demo

tunnel:
	cloudflared tunnel --config cloudflare/tunnel.yml run marthe

# Comme `tunnel`, mais se relance tout seul s'il s'arrête ou perd la connexion.
tunnel-forever:
	./cloudflare/tunnel-forever.sh

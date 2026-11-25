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

# The backend as uvicorn starts it everywhere (see Guide.md, entry point).
SERVER := uv run uvicorn main:app --app-dir backend
OLLAMA_MODELS_LIST := qwen2.5:0.5b qwen2.5:3b

.DEFAULT_GOAL := help
.PHONY: help install run dev front build all ai model-pull demo qr tunnel tunnel-forever \
	check test format migrate migration user seed

help: ## List the commands
	@awk 'BEGIN {FS = ":.*## "} /^[a-z-]+:.*## / {printf "  make %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# --- Run locally -------------------------------------------------------------

install: ## Install Python and npm dependencies, build the frontend
	uv sync --locked
	npm --prefix frontend ci
	npm --prefix frontend run build

run: install ## Install, build, then start the site on http://localhost:8000 (no AI)
	$(SERVER) --reload --host 127.0.0.1 --port 8000

dev: ## Start the backend only (after a build), with reload
	$(SERVER) --reload --host 127.0.0.1 --port 8000

front: ## Vite dev server on http://localhost:5173, live reload of the frontend
	npm --prefix frontend run dev

build: ## Build the frontend into frontend/dist
	npm --prefix frontend run build

# --- Local AI (Ollama) ---------------------------------------------------------
# Production runs without AI (MARTHE_AI=0). Locally, the employment plan still
# calls Ollama; chat and matching moved to Nemotron (see docs-md/HANDOFF.md).

all: install ## Like run, plus Ollama and its models
	@set -eu; \
	ollama serve & \
	OLLAMA_PID=$$!; \
	trap 'kill $$OLLAMA_PID 2>/dev/null || true' EXIT INT TERM; \
	until ollama list >/dev/null 2>&1; do \
		kill -0 $$OLLAMA_PID 2>/dev/null || { echo "Ollama failed to start."; exit 1; }; \
		sleep 1; \
	done; \
	for model in $(OLLAMA_MODELS_LIST); do ollama pull $$model; done; \
	$(SERVER) --reload --host 127.0.0.1 --port 8000

ai: ## Start Ollama alone
	ollama serve

model-pull: ## Download the Ollama models
	for model in $(OLLAMA_MODELS_LIST); do ollama pull $$model; done

# --- Demos from the laptop -----------------------------------------------------

demo: build ## Demo mode (pre-written answers instead of AI), reachable on the local network
	MARTHE_DEMO=1 $(SERVER) --host 0.0.0.0 --port 8000

qr: ## QR code of a link: make qr URL=https://...
	@test -n "$(URL)" || { echo "Usage: make qr URL=https://..."; exit 1; }
	uvx --from "qrcode[pil]" qr "$(URL)" > qr-demo.png
	@echo "QR code written to qr-demo.png"

tunnel: ## Publish the laptop on chezmarthe.site (Cloudflare tunnel)
	cloudflared tunnel --config cloudflare/tunnel.yml run marthe

tunnel-forever: ## Same as tunnel, restarted whenever it stops
	./cloudflare/tunnel-forever.sh

# --- Checks --------------------------------------------------------------------

check: ## Everything that must pass before a commit
	uv lock --check
	uv run ruff check .
	uv run ruff format --check .
	uv run python -m pytest -q
	npm --prefix frontend test
	npm --prefix frontend run build

test: ## Backend tests only
	uv run python -m pytest -q

format: ## Format the Python code
	uv run ruff format .

# --- Database and accounts -------------------------------------------------------

migrate: ## Apply the database migrations (the app also does it at start)
	uv run alembic -c backend/alembic.ini upgrade head

migration: ## New migration: make migration NAME="add something"
	@test -n "$(NAME)" || { echo "Usage: make migration NAME=\"add something\""; exit 1; }
	uv run alembic -c backend/alembic.ini revision --autogenerate -m "$(NAME)"

user: ## Create an account: make user EMAIL=... NAME=... ROLE=equipe
	@test -n "$(EMAIL)" -a -n "$(NAME)" -a -n "$(ROLE)" || { echo "Usage: make user EMAIL=... NAME=... ROLE=equipe"; exit 1; }
	PYTHONPATH=backend uv run python -m features.accounts.create_user "$(EMAIL)" "$(NAME)" "$(ROLE)"

seed: ## Demo accounts, local development only (never on the VM)
	PYTHONPATH=backend uv run python -m features.accounts.seed_demo

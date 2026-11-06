.DEFAULT_GOAL := help
.PHONY: help install dev build preview lint format format-check typecheck test-seo check images deploy deploy-prod clean

help: ## Show this list of commands
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  %-14s %s\n", $$1, $$2}'

install: ## Install frontend and backend dependencies
	npm ci
	uv sync --locked --directory backend

dev: ## Start the backend and the Nuxt dev server
	npm run dev

build: ## Create a production build and prerender public pages
	npm run build

preview: ## Run the production build locally
	npm run preview

lint: ## Lint the frontend (ESLint) and backend (Ruff)
	npm run lint
	uv run --directory backend ruff check .

format: ## Format all code
	npm run format
	uv run --directory backend ruff check --fix --select I .
	uv run --directory backend ruff format .

format-check: ## Fail if any code isn't formatted
	npm run format:check
	uv run --directory backend ruff format --check .

typecheck: ## Type-check the frontend
	npm run typecheck

test-seo: ## Check the SEO of the production build (run `make build` first)
	node scripts/with-backend.mjs sh scripts/test-seo.sh

check: lint format-check typecheck build test-seo ## Run everything CI runs

images: ## Regenerate product artwork
	npm run images

deploy: ## Deploy a preview to Vercel using vercel.json
	npx vercel

deploy-prod: ## Deploy to production on Vercel using vercel.json
	npx vercel --prod

clean: ## Remove build output
	rm -rf .nuxt .output

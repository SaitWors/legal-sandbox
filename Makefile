.PHONY: api-test frontend-test frontend-check compose-config compose-up compose-smoke compose-down

api-test:
	cd services/api && python -m pytest -q

frontend-test:
	cd apps/frontend && npm run test:smoke

frontend-check:
	cd apps/frontend && npm run lint && npm run typecheck && npm run build

compose-config:
	docker compose config --quiet

compose-up:
	docker compose up -d --build

compose-smoke:
	python scripts/compose_smoke.py

compose-down:
	docker compose down -v --remove-orphans

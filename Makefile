.PHONY: setup dev test seed clean

VENV = backend/.venv/bin

setup:
	cd backend && $(VENV)/pip install -r requirements.txt
	cd frontend && npm install

dev:
	@echo "Starting backend on :8000 and frontend on :3000"
	cd backend && $(VENV)/uvicorn main:app --reload --port 8000 &
	cd frontend && npm run dev &

test:
	cd backend && $(VENV)/python -m pytest tests/ -v

seed:
	cd backend && $(VENV)/python scripts/seed_demo.py

clean:
	rm -f backend/eipr_agent.db
	rm -rf frontend/.next
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

docker:
	docker-compose up --build

mlops:
	docker-compose up prometheus grafana mlflow -d

start:
	chmod +x start.sh && ./start.sh

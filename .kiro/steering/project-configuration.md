# Project Configuration

## Docker Setup

This is a **Dockerized project**. All services run in Docker containers.

### Running Tests

To run backend tests:
```bash
docker-compose exec backend pytest tests/
```

To run specific test files:
```bash
docker-compose exec backend pytest tests/test_holder_repository.py -v
```

### Running Backend Commands

All backend commands should be executed inside the Docker container:
```bash
docker-compose exec backend <command>
```

Examples:
- `docker-compose exec backend pytest`
- `docker-compose exec backend black app tests`
- `docker-compose exec backend ruff check app tests`
- `docker-compose exec backend mypy app`

### Starting Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Service URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Important Notes

- **Always use Docker commands** for running tests, linting, and other development tasks
- The backend uses SQLite with data persisted in `./backend/data/`
- Code changes are hot-reloaded in development mode

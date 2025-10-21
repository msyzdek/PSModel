# Profit Share Calculator - Backend

FastAPI backend for the Profit Share Calculator application.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements-dev.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the development server:
```bash
uvicorn app.main:app --reload
```

## Development

### Code Formatting
```bash
black app tests
```

### Linting
```bash
ruff check app tests
```

### Type Checking
```bash
mypy app
```

### Testing
```bash
pytest
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── models/          # SQLAlchemy models
│   ├── services/        # Business logic
│   ├── repositories/    # Data access layer
│   └── api/            # FastAPI routes
├── tests/
├── requirements.txt
├── requirements-dev.txt
└── pyproject.toml
```

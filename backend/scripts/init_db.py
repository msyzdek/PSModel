"""Database initialization script."""

import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import init_db


def main() -> None:
    """Initialize the database by creating all tables."""
    print("Initializing database...")
    init_db()
    print("Database initialized successfully!")


if __name__ == "__main__":
    main()

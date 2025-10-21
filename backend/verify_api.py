"""Simple script to verify API structure and imports."""

import sys

try:
    # Verify all imports work
    from app.api import calculations, periods
    from app.main import app
    from app.middleware import (
        ErrorHandlingMiddleware,
        sqlalchemy_exception_handler,
        validation_exception_handler,
    )

    print("✓ All imports successful")

    # Verify routers are registered
    routes = [route.path for route in app.routes]
    print(f"\n✓ Registered routes ({len(routes)} total):")

    # Check for expected endpoints
    expected_endpoints = [
        "/api/periods",
        "/api/periods/{year}/{month}",
        "/api/calculate/preview",
        "/api/periods/{year}/{month}/summary",
    ]

    for endpoint in expected_endpoints:
        matching_routes = [r for r in routes if endpoint in r]
        if matching_routes:
            print(f"  ✓ {endpoint}")
        else:
            print(f"  ✗ {endpoint} NOT FOUND")
            sys.exit(1)

    # Verify middleware is registered
    middleware_types = [m.cls.__name__ for m in app.user_middleware]
    print(f"\n✓ Registered middleware:")
    for mw in middleware_types:
        print(f"  - {mw}")

    # Verify exception handlers
    exception_handlers = list(app.exception_handlers.keys())
    print(f"\n✓ Registered exception handlers:")
    for handler in exception_handlers:
        print(f"  - {handler.__name__ if hasattr(handler, '__name__') else handler}")

    print("\n✅ All verifications passed!")

except Exception as e:
    print(f"\n❌ Verification failed: {e}")
    import traceback

    traceback.print_exc()
    sys.exit(1)

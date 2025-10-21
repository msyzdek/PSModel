"""Error handling middleware and exception handlers."""

import logging
from typing import Callable

from fastapi import Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware for handling errors and logging requests."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and handle errors.

        Args:
            request: Incoming request
            call_next: Next middleware/handler in chain

        Returns:
            Response: HTTP response
        """
        # Log incoming request
        logger.info(
            f"{request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
            },
        )

        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            logger.exception("Unhandled exception during request processing")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "detail": "Internal server error occurred",
                    "type": "internal_error",
                },
            )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Handle validation errors (400 Bad Request).

    Args:
        request: Incoming request
        exc: Validation exception

    Returns:
        JSONResponse: Error response with validation details
    """
    logger.warning(
        f"Validation error on {request.method} {request.url.path}: {exc.errors()}"
    )

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": "Validation error",
            "type": "validation_error",
            "errors": exc.errors(),
        },
    )


async def sqlalchemy_exception_handler(
    request: Request, exc: SQLAlchemyError
) -> JSONResponse:
    """
    Handle database errors (500 Internal Server Error).

    Args:
        request: Incoming request
        exc: SQLAlchemy exception

    Returns:
        JSONResponse: Error response
    """
    logger.error(
        f"Database error on {request.method} {request.url.path}: {str(exc)}",
        exc_info=True,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Database error occurred",
            "type": "database_error",
        },
    )

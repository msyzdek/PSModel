"""Authentication middleware and dependencies."""

from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status

from app.schemas.auth import TokenData
from app.services.auth_service import decode_access_token


async def get_current_user(access_token: Annotated[str | None, Cookie()] = None) -> TokenData:
    """
    Dependency to get the current authenticated user from JWT token in cookie.

    Raises:
        HTTPException: If token is missing or invalid.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if access_token is None:
        raise credentials_exception

    token_data = decode_access_token(access_token)
    if token_data is None or token_data.username is None:
        raise credentials_exception

    return token_data


# Type alias for dependency injection
CurrentUser = Annotated[TokenData, Depends(get_current_user)]

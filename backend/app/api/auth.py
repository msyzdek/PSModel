"""Authentication API endpoints."""

import logging
from datetime import timedelta

from fastapi import APIRouter, HTTPException, Response, status

from app.middleware.auth import CurrentUser
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(login_request: LoginRequest, response: Response) -> TokenResponse:
    """
    Authenticate user and return JWT token.

    The token is set as an httpOnly cookie for security.
    """
    if not authenticate_user(login_request.username, login_request.password):
        logger.warning(f"Failed login attempt for username: {login_request.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": login_request.username}, expires_delta=access_token_expires
    )

    # Set httpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
    )

    logger.info(f"Successful login for username: {login_request.username}")

    return TokenResponse(access_token=access_token, token_type="bearer")


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response) -> dict[str, str]:
    """
    Logout user by clearing the authentication cookie.
    """
    response.delete_cookie(key="access_token", samesite="lax")
    return {"message": "Successfully logged out"}


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_current_user_info(current_user: CurrentUser) -> dict[str, str]:
    """
    Get current authenticated user information.

    This endpoint requires authentication.
    """
    return {"username": current_user.username or "unknown"}

"""Authentication schemas."""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Login request schema."""

    username: str = Field(..., min_length=1, description="Username")
    password: str = Field(..., min_length=1, description="Password")


class TokenResponse(BaseModel):
    """Token response schema."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")


class TokenData(BaseModel):
    """Token data schema for JWT payload."""

    username: str | None = None

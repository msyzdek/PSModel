"""API endpoints for holder CRUD operations."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import CurrentUser
from app.schemas.holder import HolderCreate, HolderResponse, HolderUpdate
from app.services.holder_service import HolderService

router = APIRouter(prefix="/api/holders", tags=["holders"])


def get_holder_service(db: Annotated[Session, Depends(get_db)]) -> HolderService:
    """Dependency to get holder service instance."""
    return HolderService(db)


@router.post("", response_model=HolderResponse, status_code=status.HTTP_201_CREATED)
def create_holder(
    request: HolderCreate,
    service: Annotated[HolderService, Depends(get_holder_service)],
    current_user: CurrentUser,
) -> HolderResponse:
    """
    Create a new holder.

    Args:
        request: Holder creation request with name and optional default_shares
        service: Holder service instance
        current_user: Authenticated user

    Returns:
        HolderResponse: Created holder

    Raises:
        HTTPException: 400 if validation fails or name already exists
    """
    try:
        holder = service.create_holder(
            name=request.name,
            default_shares=request.default_shares,
        )
        return HolderResponse.model_validate(holder)
    except ValueError as e:
        error_msg = str(e)
        if "already exists" in error_msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=error_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.get("", response_model=list[HolderResponse])
def list_holders(
    service: Annotated[HolderService, Depends(get_holder_service)],
    current_user: CurrentUser,
    active_only: bool = True,
) -> list[HolderResponse]:
    """
    List all holders with optional filtering by active status.

    Args:
        service: Holder service instance
        current_user: Authenticated user
        active_only: If True, return only active holders (default: True)

    Returns:
        list[HolderResponse]: List of holders ordered by name
    """
    holders = service.list_holders(active_only=active_only)
    return [HolderResponse.model_validate(holder) for holder in holders]


@router.get("/{id}", response_model=HolderResponse)
def get_holder(
    id: int,
    service: Annotated[HolderService, Depends(get_holder_service)],
    current_user: CurrentUser,
) -> HolderResponse:
    """
    Get a specific holder by ID.

    Args:
        id: ID of the holder
        service: Holder service instance
        current_user: Authenticated user

    Returns:
        HolderResponse: Holder details

    Raises:
        HTTPException: 404 if holder not found
    """
    holder = service.get_holder(id)
    if not holder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Holder with id {id} not found",
        )
    return HolderResponse.model_validate(holder)


@router.put("/{id}", response_model=HolderResponse)
def update_holder(
    id: int,
    request: HolderUpdate,
    service: Annotated[HolderService, Depends(get_holder_service)],
    current_user: CurrentUser,
) -> HolderResponse:
    """
    Update an existing holder.

    Updates the holder's name and/or default_shares. When the name is updated,
    it cascades to all associated allocations to maintain consistency.

    Args:
        id: ID of the holder to update
        request: Holder update request with optional name and default_shares
        service: Holder service instance
        current_user: Authenticated user

    Returns:
        HolderResponse: Updated holder

    Raises:
        HTTPException: 404 if holder not found
        HTTPException: 400 if validation fails
        HTTPException: 409 if name already exists
    """
    try:
        holder = service.update_holder(
            holder_id=id,
            name=request.name,
            default_shares=request.default_shares,
        )
        return HolderResponse.model_validate(holder)
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_msg)
        if "already exists" in error_msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=error_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.delete("/{id}", response_model=HolderResponse)
def deactivate_holder(
    id: int,
    service: Annotated[HolderService, Depends(get_holder_service)],
    current_user: CurrentUser,
) -> HolderResponse:
    """
    Deactivate a holder (soft delete).

    Marks the holder as inactive, which hides them from new period creation
    but preserves all historical data. Holders with allocations cannot be
    hard deleted to maintain referential integrity.

    Args:
        id: ID of the holder to deactivate
        service: Holder service instance
        current_user: Authenticated user

    Returns:
        HolderResponse: Deactivated holder

    Raises:
        HTTPException: 404 if holder not found
    """
    try:
        holder = service.deactivate_holder(id)
        return HolderResponse.model_validate(holder)
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

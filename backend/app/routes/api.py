from fastapi import APIRouter

from app.models.schemas import MessageResponse

router = APIRouter()


@router.get("/services", response_model=MessageResponse)
def services_placeholder() -> MessageResponse:
    return MessageResponse(message="Services endpoint — coming soon.")


@router.get("/pricing", response_model=MessageResponse)
def pricing_placeholder() -> MessageResponse:
    return MessageResponse(message="Pricing endpoint — coming soon.")


@router.get("/about", response_model=MessageResponse)
def about_placeholder() -> MessageResponse:
    return MessageResponse(message="About endpoint — coming soon.")


@router.post("/auth/login", response_model=MessageResponse)
def login_placeholder() -> MessageResponse:
    return MessageResponse(message="Authentication — coming soon.")

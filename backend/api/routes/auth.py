import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import settings
from core.security import hash_password, verify_password, create_access_token, create_refresh_token, get_current_user, encrypt_api_key
from core.llm_client import build_llm_client_for_user, LLMProvider
from jose import jwt
from models.user import User

router = APIRouter()


class RegisterRequest(BaseModel):
    email: str = Field(..., max_length=255)
    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain a lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain a digit")
        return v


class LoginRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: dict


@router.post("/register")
async def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=body.email, name=body.name, hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created", "user": {"id": user.id, "email": user.email, "name": user.name}}


@router.post("/login")
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token_data = {"sub": user.id}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user={"id": user.id, "email": user.email, "name": user.name},
    )


class UpdateSettingsRequest(BaseModel):
    preferred_provider: Optional[str] = Field(None, max_length=50)
    preferred_model: Optional[str] = Field(None, max_length=100)
    ollama_base_url: Optional[str] = Field(None, max_length=500)
    llm_api_keys: Optional[dict] = None


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    api_keys = current_user.llm_api_keys or {}
    providers_with_keys = {}
    for provider in LLMProvider:
        pval = provider.value
        if pval in api_keys and api_keys[pval]:
            providers_with_keys[pval] = True
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "preferred_provider": current_user.preferred_provider,
        "preferred_model": current_user.preferred_model,
        "ollama_base_url": current_user.ollama_base_url,
        "has_api_keys": bool(api_keys),
        "providers_with_keys": providers_with_keys,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }


@router.patch("/settings")
async def update_settings(body: UpdateSettingsRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.preferred_provider is not None:
        current_user.preferred_provider = body.preferred_provider
    if body.preferred_model is not None:
        current_user.preferred_model = body.preferred_model
    if body.ollama_base_url is not None:
        current_user.ollama_base_url = body.ollama_base_url
    if body.llm_api_keys is not None:
        existing = current_user.llm_api_keys or {}
        for provider, key in body.llm_api_keys.items():
            if key:
                existing[provider] = encrypt_api_key(key)
            else:
                existing.pop(provider, None)
        current_user.llm_api_keys = existing
    db.commit()
    db.refresh(current_user)

    api_keys = current_user.llm_api_keys or {}
    providers_with_keys = {}
    for p in LLMProvider:
        pval = p.value
        if pval in api_keys and api_keys[pval]:
            providers_with_keys[pval] = True

    return {"message": "Settings updated", "user": {
        "preferred_provider": current_user.preferred_provider,
        "preferred_model": current_user.preferred_model,
        "ollama_base_url": current_user.ollama_base_url,
        "has_api_keys": bool(api_keys),
        "providers_with_keys": providers_with_keys,
    }}


@router.post("/test-llm")
async def test_llm_connection(current_user: User = Depends(get_current_user)):
    try:
        llm = await build_llm_client_for_user(current_user)
        result = await llm.test_connection()
        return {"success": result.get("success", False), "response": result.get("response", ""), "error": result.get("error", "")}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/ollama/models")
async def list_ollama_models(current_user: User = Depends(get_current_user)):
    from core.llm_client import get_ollama_models
    base_url = current_user.ollama_base_url or settings.OLLAMA_BASE_URL
    models = await get_ollama_models(base_url)
    return {"models": models, "base_url": base_url}


class ListModelsRequest(BaseModel):
    provider: Optional[str] = Field(None, max_length=50)
    api_key: Optional[str] = Field(None, max_length=500)
    base_url: Optional[str] = Field(None, max_length=500)


@router.post("/models")
async def list_provider_models(body: ListModelsRequest, current_user: User = Depends(get_current_user)):
    from core.llm_client import get_provider_models
    provider = body.provider or current_user.preferred_provider or "ollama"
    api_key = body.api_key or ""
    if not api_key:
        saved_keys = current_user.llm_api_keys or {}
        encrypted = saved_keys.get(provider, "")
        if encrypted:
            from core.security import decrypt_api_key
            try:
                api_key = decrypt_api_key(encrypted)
            except Exception:
                api_key = encrypted
    base_url = body.base_url or current_user.ollama_base_url or settings.OLLAMA_BASE_URL
    models = await get_provider_models(provider, api_key, base_url)
    return {"models": models, "provider": provider}


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("New password must contain an uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("New password must contain a lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("New password must contain a digit")
        return v


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=255)


@router.patch("/profile")
async def update_profile(body: UpdateProfileRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.name is not None:
        current_user.name = body.name
    if body.email is not None:
        existing = db.query(User).filter(User.email == body.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = body.email
    db.commit()
    db.refresh(current_user)
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
    }


@router.post("/change-password")
async def change_password(body: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(body.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


@router.post("/refresh")
async def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    from jose import JWTError
    try:
        payload = jwt.decode(body.refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        token_data = {"sub": user.id}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            user={"id": user.id, "email": user.email, "name": user.name},
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

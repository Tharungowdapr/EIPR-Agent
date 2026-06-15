import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import time

from api.routes import auth, project, agents, mlops
from core.database import Base, engine
from core.config import settings

logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EIPR-Agent API",
    description="Multi-Agent AI System for Entrepreneurship & IP Rights Analysis",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(project.router, prefix="/api/projects", tags=["Projects"])
app.include_router(agents.router, prefix="/api/agents", tags=["AI Agents"])
app.include_router(mlops.router, prefix="/api/mlops", tags=["MLOps"])


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": "1.0.0", "app": "EIPR-Agent"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1,
    )

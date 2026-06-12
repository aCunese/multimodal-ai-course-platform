from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

project_root = Path(__file__).resolve().parents[2]
backend_root = Path(__file__).resolve().parents[1]

load_dotenv(project_root / ".env.local", override=False)
load_dotenv(backend_root / ".env.local", override=False)

from .api.routes import router
from .services.core import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="多模态 AI 课程成果平台 Backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(router)

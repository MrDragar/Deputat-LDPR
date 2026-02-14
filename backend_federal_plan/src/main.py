import logging

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from src.core import config
from src.application.routes import root_router
from src.core.containers import Container

app = FastAPI()


@app.on_event("startup")
async def startup_event():
    await Container().database().create_database()

    
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

app.include_router(root_router, prefix="/api/federal_plan", tags=[""])
logging.basicConfig(
    level=config.log_level,
    format=config.log_format,
    filename=config.log_file,
    filemode="a"
)

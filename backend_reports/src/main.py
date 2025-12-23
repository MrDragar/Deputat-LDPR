import os
import uuid

from fastapi import FastAPI, Request, APIRouter
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from src.pdf_creater import generate_pdf_report
from src.model import InputData


app = FastAPI()
router = APIRouter(prefix='/api/reports')
router.mount("/media", StaticFiles(directory="media"), name="media")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)


@router.get("/ping")
async def ping():
    return {"message": "Pong"}


@router.post("/")
async def create_pdf(input_data: InputData, request: Request):
    report_filename = f"report_{uuid.uuid4()}.pdf"
    report_filepath = os.path.join("media", report_filename)
    generate_pdf_report(input_data.data.dict(), report_filepath)
    return {"status": "Success", "message": f"{request.base_url}/api/reports/media/{report_filename}".replace(
        'https://', 'https://')}

app.include_router(router)

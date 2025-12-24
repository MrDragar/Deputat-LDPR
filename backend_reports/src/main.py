import os
import uuid

from fastapi import FastAPI, Request, APIRouter
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from src.celery_app import CeleryTaskClient
from src.pdf_creater import generate_pdf_report
from src import database
from src.model import InputData


app = FastAPI()
router = APIRouter(prefix='/api/reports')
app.mount("/api/reports/media", StaticFiles(directory="media"), name="media")
db = database.Database()
db.create_table()

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
    try:
        report_filename = f"report_{uuid.uuid4()}.pdf"
        report_filepath = os.path.join("media", report_filename)
        generate_pdf_report(input_data.data.dict(), report_filepath)
        db.insert(input_data.user_id, input_data.data.dict())
        link = f"{request.base_url}/api/reports/media/{report_filename}".replace('http://', 'https://')
        CeleryTaskClient.send_log(message=f"Новый отчёт у {input_data.data.general_info.full_name}", level='INFO', extra_data={**input_data.data.dict(), "link": link})
        return {"status": "Success", "message": link}
    except Exception as e:
        CeleryTaskClient.send_log(message=f"Ошибка при создании отчёта у {input_data.data.general_info.full_name}", level='ERROR', extra_data={**input_data.data.dict(), "error": e.__dict__})
        raise

app.include_router(router)

import os
import uuid

from fastapi import FastAPI, Request, APIRouter, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from src.auth import get_current_admin, User
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


@router.post("/without_logs")
async def create_pdf(input_data: InputData, request: Request):
    report_filename = f"report_{uuid.uuid4()}.pdf"
    report_filepath = os.path.join("media", report_filename)
    generate_pdf_report(input_data.data.dict(), report_filepath)
    link = f"{request.base_url}/api/reports/media/{report_filename}".replace('http://', 'https://')
    return {"status": "Success", "message": link}


@router.post("/")
async def create_pdf(input_data: InputData, request: Request):
    try:
        report_filename = f"report_{uuid.uuid4()}.pdf"
        report_filepath = os.path.join("media", report_filename)
        generate_pdf_report(input_data.data.dict(), report_filepath)
        link = f"{request.base_url}/api/reports/media/{report_filename}".replace('http://', 'https://')
        db.insert(input_data.user_id, input_data.data.dict(), link)
        CeleryTaskClient.send_log(
            message=f"Новый отчёт у {input_data.data.general_info.full_name}\nСсылка на отчёт: {link}",
            level='INFO', extra_data={**input_data.data.dict(), "link": link})
        return {"status": "Success", "message": link}
    except Exception as e:
        CeleryTaskClient.send_log(
            message=f"Ошибка при создании отчёта у {input_data.data.general_info.full_name}",
            level='ERROR',
            extra_data={**input_data.data.dict(), "error": e.__dict__}
        )
        raise


@router.get("/all")
async def get_all_reports(admin: User = Depends(get_current_admin)):
    """1. Получение списка всех отчётов (без поля data)"""
    return db.get_all()


@router.get("/{record_id}")
async def get_report(record_id: int, admin: User = Depends(get_current_admin)):
    """2. Получение детального record по id"""
    record = db.get_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Отчет не найден")
    return record


@router.put("/{record_id}")
async def update_report(
        record_id: int,
        input_data: InputData,
        request: Request,
        admin: User = Depends(get_current_admin)
):
    """3. Обновление рекорда (и перегенерация PDF)"""
    old_record = db.get_by_id(record_id)
    if not old_record:
        raise HTTPException(status_code=404, detail="Отчет не найден")

    # Генерируем новый PDF, так как данные изменились
    report_filename = f"report_{uuid.uuid4()}.pdf"
    report_filepath = os.path.join("media", report_filename)
    generate_pdf_report(input_data.data.dict(), report_filepath)
    link = f"{request.base_url}api/reports/media/{report_filename}".replace('http://', 'https://')

    # Обновляем в БД
    db.update(record_id, input_data.data.dict(), link)

    # Удаляем старый файл с диска, если он был
    if old_record.get("report_link"):
        old_filename = old_record["report_link"].split("/")[-1]
        old_filepath = os.path.join("media", old_filename)
        if os.path.exists(old_filepath):
            os.remove(old_filepath)

    return {"status": "Success", "message": "Отчет успешно обновлен", "new_link": link}


@router.delete("/{record_id}")
async def delete_report(record_id: int, admin: User = Depends(get_current_admin)):
    """4. Удаление рекорда (и удаление PDF с диска)"""
    old_record = db.get_by_id(record_id)
    if not old_record:
        raise HTTPException(status_code=404, detail="Отчет не найден")

    db.delete(record_id)

    # Удаляем файл с диска
    if old_record.get("report_link"):
        old_filename = old_record["report_link"].split("/")[-1]
        old_filepath = os.path.join("media", old_filename)
        if os.path.exists(old_filepath):
            os.remove(old_filepath)

    return {"status": "Success", "message": "Отчет успешно удален"}


app.include_router(router)

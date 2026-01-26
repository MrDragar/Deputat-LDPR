import os
import uuid
import json
from typing import Annotated, Union, Literal

from pydantic import BaseModel
from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.pdf_creater import generate_pdf_report


app = FastAPI()
app.mount("/media", StaticFiles(directory="media"), name="media")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешить все источники временно
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]  
)


@app.get("/ping")
async def ping():
    return {"message": "Pong"}


class IndividualRecipient(BaseModel):
    lastName: str
    firstName: str
    middleName: str
    gender: Literal["male", "female"]

class LegalEntityRecipient(BaseModel):
    companyName: str

class LetterRequest(BaseModel):
    entityType: Literal["individual", "legal_entity"]
    date: str
    recipient: Union[IndividualRecipient, LegalEntityRecipient]


@app.post("/generate_letter")
async def create_pdf(letter_request: LetterRequest, request: Request):
    letter_filename = f"letter_{uuid.uuid4()}.pdf"
    letter_filepath = os.path.join("media", letter_filename)
    
    # Ensure the media directory exists
    os.makedirs("media", exist_ok=True)
    
    with open("data_example.json", 'r', encoding='utf-8') as file:
        example_dict = json.load(file)

    request_dict = letter_request.dict()
    request_dict["sender"] = example_dict["sender"]
    
    # Assuming generate_pdf_report writes the PDF to letter_filepath
    generate_pdf_report(request_dict, letter_filepath)
    
    return {"status": "Success", "message": f"{request.base_url}media/{letter_filename}"}

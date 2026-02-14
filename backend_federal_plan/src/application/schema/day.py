from datetime import date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# DTO для Detail
class DetailCreate(BaseModel):
    name: str
    value: str


class DetailUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[str] = None


class DetailResponse(BaseModel):
    id: int
    name: str
    value: str

    model_config = ConfigDict(from_attributes=True)


# DTO для Event
class EventCreate(BaseModel):
    title: str
    party_image: Optional[str] = None
    is_infostrike: bool = False
    details: List[DetailCreate] = []


class EventUpdate(BaseModel):
    title: Optional[str] = None
    party_image: Optional[str] = None
    is_infostrike: Optional[bool] = None


class EventResponse(BaseModel):
    id: int
    title: str
    party_image: Optional[str] = None
    is_infostrike: bool
    details: List[DetailResponse] = []

    model_config = ConfigDict(from_attributes=True)


# DTO для Holiday
class HolidayCreate(BaseModel):
    name: str


class HolidayUpdate(BaseModel):
    name: Optional[str] = None


class HolidayResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


# DTO для Day
class DayCreate(BaseModel):
    date: date
    holidays: List[HolidayCreate] = []
    events: List[EventCreate] = []


class DayUpdate(BaseModel):
    date: date
    holidays: List[HolidayCreate] = []
    events: List[EventCreate] = []


class DayResponse(BaseModel):
    id: int
    date: date
    holidays: List[HolidayResponse] = []
    events: List[EventResponse] = []

    model_config = ConfigDict(from_attributes=True)


class DayShortResponse(BaseModel):
    id: int
    date: date
    model_config = ConfigDict(from_attributes=True)


class DayListResponse(BaseModel):
    items: List[DayShortResponse]
    total: int
    skip: int
    limit: int


from datetime import date

from src.application.schema.day import (
    DayCreate, DayUpdate, HolidayCreate, EventCreate, DetailCreate,
    DayResponse, HolidayResponse, EventResponse, DetailResponse, EventUpdate
)
from src.domain.entities.day import Day, Holiday, Event, Detail


class DayMapper:
    @staticmethod
    def create_to_domain(day_create: DayCreate) -> Day:
        """Преобразование DTO создания в Domain модель"""
        holidays = [
            Holiday(id=0, name=holiday.name)
            for holiday in day_create.holidays
        ]

        events = []
        for event_create in day_create.events:
            details = [
                Detail(id=0, name=detail.name, value=detail.value)
                for detail in event_create.details
            ]
            event = Event(
                id=0,
                title=event_create.title,
                party_image=event_create.party_image,
                is_infostrike=event_create.is_infostrike,
                details=details
            )
            events.append(event)

        return Day(
            id=0,
            date=day_create.date,
            holidays=holidays,
            events=events
        )

    @staticmethod
    def update_to_domain(day_id: int, day_update: DayUpdate) -> Day:
        """Преобразование DTO обновления в Domain модель"""
        holidays = [
            Holiday(id=0, name=holiday.name)
            for holiday in day_update.holidays
        ]

        events = []
        for event_create in day_update.events:
            details = [
                Detail(id=0, name=detail.name, value=detail.value)
                for detail in event_create.details
            ]
            event = Event(
                id=0,
                title=event_create.title,
                party_image=event_create.party_image,
                is_infostrike=event_create.is_infostrike,
                details=details
            )
            events.append(event)
        return Day(
            id=day_id,
            date=day_update.date,
            holidays=holidays,
            events=events
        )

    @staticmethod
    def domain_to_response(day: Day) -> DayResponse:
        """Преобразование Domain модели в DTO ответа"""
        holidays = [
            HolidayResponse(id=h.id, name=h.name)
            for h in day.holidays
        ]

        events = []
        for event in day.events:
            details = [
                DetailResponse(id=d.id, name=d.name, value=d.value)
                for d in event.details
            ]
            event_response = EventResponse(
                id=event.id,
                title=event.title,
                party_image=event.party_image,
                is_infostrike=event.is_infostrike,
                details=details
            )
            events.append(event_response)

        return DayResponse(
            id=day.id,
            date=day.date,
            holidays=holidays,
            events=events
        )

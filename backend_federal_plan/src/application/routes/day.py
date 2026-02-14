import logging
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path

from src.application.dependencies.auth import get_current_user
from src.application.schema.day import (
    DayCreate, DayUpdate, DayResponse, DayListResponse
)
from src.application.mappers.day import DayMapper
from src.domain.entities import User
from src.services.day_service import DayService
from src.application.dependencies.services import get_day_service

router = APIRouter(prefix="/days", tags=["days"])


@router.post("/", response_model=DayResponse,
             status_code=status.HTTP_201_CREATED)
async def create_day(
        day_create: DayCreate,
        day_service: DayService = Depends(get_day_service),
        user: User = Depends(get_current_user)
):
    if user.role != 'admin':
        raise HTTPException(403, detail="You do not have permission to perform this")
    """Создать день со всеми праздниками и событиями"""
    try:
        # Преобразуем DTO в Domain модель
        day_domain = DayMapper.create_to_domain(day_create)

        # Создаем день через сервис
        created_day = await day_service.create_day(day_domain)

        # Преобразуем Domain модель в DTO ответа
        return DayMapper.domain_to_response(created_day)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logging.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/", response_model=DayListResponse)
async def list_days(
        skip: int = Query(0, ge=0,
                          description="Количество пропущенных записей"),
        limit: int = Query(100, ge=1, le=1000, description="Лимит записей"),
        day_service: DayService = Depends(get_day_service),
        user: User = Depends(get_current_user)
):
    """Получить список дней (без агрегатов - только базовые данные)"""
    try:
        days = await day_service.list_days(skip, limit)

        # Преобразуем Domain модели в DTO
        day_responses = [DayMapper.domain_to_response(day) for day in days]

        return DayListResponse(
            items=day_responses,
            total=len(day_responses),
            skip=skip,
            limit=limit
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/{day_id}", response_model=DayResponse)
async def get_day(
        day_id: int = Path(..., ge=0, description="ID дня"),
        day_service: DayService = Depends(get_day_service),
        user: User = Depends(get_current_user)
):
    """Получить день по ID со всеми праздниками и событиями"""
    try:
        day = await day_service.get_day(day_id)

        if not day:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Day with id {day_id} not found"
            )

        return DayMapper.domain_to_response(day)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/by-date/{target_date}", response_model=DayResponse)
async def get_day_by_date(
        target_date: date = Path(..., description="Дата в формате YYYY-MM-DD"),
        day_service: DayService = Depends(get_day_service),
        user: User = Depends(get_current_user)
):
    """Получить день по дате со всеми праздниками и событиями"""
    try:
        day = await day_service.get_day_by_date(target_date)

        if not day:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Day with date {target_date} not found"
            )

        return DayMapper.domain_to_response(day)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.put("/{day_id}", response_model=DayResponse)
async def update_day(
        day_id: int = Path(..., ge=1, description="ID дня"),
        day_update: DayUpdate = None,
        day_service: DayService = Depends(get_day_service),
        user: User = Depends(get_current_user)
):
    if user.role != 'admin':
        raise HTTPException(403, detail="You do not have permission to perform this")
    """Обновить день (с агрегатами)"""
    try:
        # Для полного обновления с агрегатами нужен отдельный метод
        if day_update is None:
            # Можно сделать получение текущего дня и его возврат
            day = await day_service.get_day(day_id)
            if not day:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Day with id {day_id} not found"
                )
            return DayMapper.domain_to_response(day)

        # Преобразуем DTO обновления в Domain модель
        day_domain = DayMapper.update_to_domain(day_id, day_update)

        # Обновляем день через сервис
        updated_day = await day_service.update_day(day_id, day_domain)

        if not updated_day:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Day with id {day_id} not found"
            )

        return DayMapper.domain_to_response(updated_day)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.delete("/{day_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_day(
        day_id: int = Path(..., ge=1, description="ID дня"),
        day_service: DayService = Depends(get_day_service),
        user: User = Depends(get_current_user)
):
    if user.role != 'admin':
        raise HTTPException(403, detail="You do not have permission to perform this")
    """Удалить день (каскадно удалит все связанные праздники и события)"""
    try:
        success = await day_service.delete_day(day_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Day with id {day_id} not found"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
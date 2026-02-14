from fastapi import Depends

from src.core.containers import Container
from src.services.day_service import DayService
from src.services.interfaces import IAuthService

__container = Container()


async def get_container() -> Container:
    return __container


async def get_auth_service(container: Container = Depends(get_container)) -> IAuthService:
    return container.auth_service()


async def get_day_service(container: Container = Depends(get_container)) -> DayService:
    return container.day_service()


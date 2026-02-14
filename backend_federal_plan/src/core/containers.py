from src.core.di import DeclarativeContainer, providers
from src.domain.interfaces import IUnitOfWork, \
    IJWTRepository, IDayRepository
from src.infrastructure import Database, UnitOfWork
from src.infrastructure.interfaces import IDatabase
from src.infrastructure.repositories import (
    JWTRepository, DayRepository
)
from src.core import config
from src.services import AuthService
from src.services.day_service import DayService
from src.services.interfaces import IAuthService


class Container(DeclarativeContainer):
    database: providers.Singleton[IDatabase] = providers.Singleton(
        Database, "federal_plan_db.sqlite3"
    )
    uow: providers.Singleton[IUnitOfWork] = providers.Singleton(
        UnitOfWork, database=database
    )
    jwt_repository: providers.Factory[IJWTRepository] = providers.Factory(
        JWTRepository, public_key=config.PUBLIC_KEY, algorithm=config.ALGORITHM
    )
    day_repository: providers.Factory[IDayRepository] = providers.Factory(
        DayRepository, uow=uow
    )

    auth_service: providers.Factory[IAuthService] = providers.Factory(
        AuthService,
        jwt_repository=jwt_repository,
        uow=uow
    )
    day_service: providers.Factory[DayService] = providers.Factory(
        DayService, day_repository=day_repository, uow=uow
    )
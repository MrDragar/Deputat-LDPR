from src.domain.entities import User
from src.domain.exceptions import AuthError
from src.domain.interfaces import IJWTRepository, IUnitOfWork
from src.services.interfaces import IAuthService


class AuthService(IAuthService):
    def __init__(
            self,
            jwt_repository: IJWTRepository,
            uow: IUnitOfWork
    ):
        self.__jwt_repository = jwt_repository
        self.__uow = uow

    async def get_user(self, jwt_token: str) -> User:
        if not jwt_token:
            raise AuthError('Пустой JWT токе')
        try:
            user = await self.__jwt_repository.decode_access_token(jwt_token)
        except AuthError:
            raise
        except Exception:
            raise AuthError('Неизвестная ошибка авторизации')
        return user

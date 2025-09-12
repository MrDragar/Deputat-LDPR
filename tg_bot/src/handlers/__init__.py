from aiogram import Router

from .common import router as common_router
from .join import router as join_router

router = Router()

router.include_router(common_router)
router.include_router(join_router)

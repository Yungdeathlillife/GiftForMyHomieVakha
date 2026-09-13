import asyncio
from contextlib import asynccontextmanager
import os
from typing import Union

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    WebAppInfo,
)
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://example.com")
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID", "")

bot = Bot(token=BOT_TOKEN or "missing-token")
dp = Dispatcher()


@dp.message(CommandStart())
async def cmd_start(message: Message) -> None:
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Открыть портфолио",
                    web_app=WebAppInfo(url=WEBAPP_URL),
                )
            ]
        ]
    )
    await message.answer(
        "Привет! Я UI/UX дизайнер из Великого Новгорода.\n"
        "Открой мини-приложение, чтобы посмотреть работы и оставить заказ.",
        reply_markup=keyboard,
    )


class OrderIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    contact: str = Field(..., min_length=1, max_length=200)
    task_type: str = Field(..., min_length=1, max_length=120)
    budget: str = Field(..., min_length=1, max_length=80)
    description: str = Field(..., min_length=1, max_length=4000)


def format_order_message(order: OrderIn) -> str:
    def md(value: str) -> str:
        return (
            value.replace("\\", "\\\\")
            .replace("*", "\\*")
            .replace("_", "\\_")
            .replace("[", "\\[")
            .replace("`", "\\`")
        )

    return (
        "*Новый заказ из Mini App*\n\n"
        f"*Имя:* {md(order.name)}\n"
        f"*Контакт:* {md(order.contact)}\n"
        f"*Тип задачи:* {md(order.task_type)}\n"
        f"*Бюджет:* {md(order.budget)}\n"
        f"*Описание:*\n{md(order.description)}"
    )


# Управление жизненным циклом (Lifespan) FastAPI
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Сбрасываем старый webhook с удалением зависших обновлений
    await bot.delete_webhook(drop_pending_updates=True)
    # 2. Запускаем polling бота в фоновом режиме
    polling_task = asyncio.create_task(dp.start_polling(bot))
    
    yield  # В этот момент FastAPI работает и принимает HTTP запросы
    
    # Завершение работы
    polling_task.cancel()
    await bot.session.close()


app = FastAPI(title="VakhasBot Mini App", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/order")
async def create_order(order: OrderIn) -> dict[str, str]:
    if not ADMIN_CHAT_ID:
        raise HTTPException(status_code=500, detail="ADMIN_CHAT_ID is not configured")

    try:
        chat_id: Union[int, str] = int(ADMIN_CHAT_ID)
    except ValueError:
        chat_id = ADMIN_CHAT_ID

    try:
        await bot.send_message(
            chat_id=chat_id,
            text=format_order_message(order),
            parse_mode=ParseMode.MARKDOWN,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to send Telegram message: {exc}") from exc

    return {"status": "ok"}
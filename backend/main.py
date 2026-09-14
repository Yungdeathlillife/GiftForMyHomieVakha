import asyncio
import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional, Union

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
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError
import os

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://example.com")
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID", "")
CONTENT_PATH = Path(__file__).resolve().parent / "content.json"

bot = Bot(token=BOT_TOKEN or "missing-token")
dp = Dispatcher()


class Profile(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    title: str = Field(..., min_length=1, max_length=200)
    avatar_url: str = Field(..., min_length=1, max_length=500)
    bio: str = Field(..., min_length=1, max_length=2000)


class Pitch(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    subtitle: str = Field(..., min_length=1, max_length=500)
    button_text: str = Field(..., min_length=1, max_length=80)


class Contact(BaseModel):
    id: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=80)
    url: str = Field(..., min_length=1, max_length=500)
    icon: str = Field(..., min_length=1, max_length=40)


class Case(BaseModel):
    id: str = Field(..., min_length=1, max_length=64)
    title: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=120)
    cover: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., min_length=1, max_length=4000)
    images: List[str] = Field(default_factory=list)
    link: str = Field(..., min_length=1, max_length=500)


class Content(BaseModel):
    profile: Profile
    pitch: Pitch
    contacts: List[Contact]
    cases: List[Case]


class OrderIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    contact: str = Field(..., min_length=1, max_length=200)
    task_type: str = Field(..., min_length=1, max_length=120)
    budget: str = Field(..., min_length=1, max_length=80)
    description: str = Field(..., min_length=1, max_length=4000)


class OrderStatus(BaseModel):
    status: str


def admin_chat_id() -> Union[int, str]:
    if not ADMIN_CHAT_ID:
        raise HTTPException(status_code=500, detail="ADMIN_CHAT_ID is not configured")
    try:
        return int(ADMIN_CHAT_ID)
    except ValueError:
        return ADMIN_CHAT_ID


def read_content() -> Content:
    if not CONTENT_PATH.exists():
        raise HTTPException(status_code=404, detail="content.json not found")
    try:
        raw = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
        return Content.model_validate(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"content.json is invalid JSON: {exc}") from exc
    except ValidationError as exc:
        raise HTTPException(status_code=500, detail=f"content.json failed schema validation: {exc}") from exc
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to read content.json: {exc}") from exc


def write_content(content: Content) -> Content:
    tmp_path = CONTENT_PATH.with_suffix(".json.tmp")
    try:
        tmp_path.write_text(
            json.dumps(content.model_dump(), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        tmp_path.replace(CONTENT_PATH)
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to write content.json: {exc}") from exc
    return content


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


@asynccontextmanager
async def lifespan(app: FastAPI):
    await bot.delete_webhook(drop_pending_updates=True)
    polling_task = asyncio.create_task(dp.start_polling(bot))
    yield
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


@app.get("/api/content", response_model=Content)
async def get_content() -> Content:
    return read_content()


@app.post("/api/order", response_model=OrderStatus)
async def create_order(order: OrderIn) -> OrderStatus:
    chat_id = admin_chat_id()
    try:
        await bot.send_message(
            chat_id=chat_id,
            text=format_order_message(order),
            parse_mode=ParseMode.MARKDOWN,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to send Telegram message: {exc}",
        ) from exc
    return OrderStatus(status="ok")


@app.post("/api/admin/content", response_model=Content)
async def update_content(
    payload: Content,
    x_admin_id: Optional[str] = Header(default=None, alias="X-Admin-ID"),
) -> Content:
    if not ADMIN_CHAT_ID:
        raise HTTPException(status_code=500, detail="ADMIN_CHAT_ID is not configured")
    if not x_admin_id:
        raise HTTPException(status_code=401, detail="Missing X-Admin-ID header")
    if str(x_admin_id) != str(ADMIN_CHAT_ID):
        raise HTTPException(status_code=403, detail="Not authorized")
    return write_content(payload)

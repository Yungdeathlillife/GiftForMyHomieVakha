import asyncio
import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional, Union

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from datetime import datetime, timedelta
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    WebAppInfo,
    BotCommand,
)
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError, field_validator
import re
import os

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://example.com")
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID", "")
CONTENT_PATH = Path(__file__).resolve().parent / "content.json"
STATS_PATH = Path(__file__).resolve().parent / "stats.json"

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
    name: str = Field(..., min_length=2, max_length=120)
    contact: str = Field(..., min_length=3, max_length=200)
    task_type: str = Field(..., min_length=1, max_length=120)
    budget: str = Field(..., min_length=1, max_length=80)
    description: str = Field(..., min_length=10, max_length=4000)

    @field_validator('contact')
    @classmethod
    def validate_contact(cls, v: str) -> str:
        v = v.strip()
        # Автоподстановка @ если это просто текст (юзернейм)
        if not v.startswith('@') and not v.startswith('+') and not v.startswith('http') and re.match(r'^[a-zA-Z0-9_]+$', v):
            v = f"@{v}"
        
        is_tg = bool(re.match(r'^@[a-zA-Z0-9_]{4,32}$', v))
        is_phone = bool(re.match(r'^\+?[0-9\s\-\(\)]{7,18}$', v))
        is_url = bool(re.match(r'^https?://', v))

        if not (is_tg or is_phone or is_url):
            raise ValueError('Некорректный контакт')
        return v


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

def record_visit(user_id: str) -> None:
    """Записывает визит пользователя с текущей датой."""
    if not user_id:
        return
    visits = []
    if STATS_PATH.exists():
        try:
            visits = json.loads(STATS_PATH.read_text(encoding="utf-8"))
        except Exception:
            visits = []
    
    visits.append({
        "user_id": str(user_id),
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Храним историю не дольше 60 дней, чтобы файл не раздувался
    cutoff = (datetime.utcnow() - timedelta(days=60)).isoformat()
    visits = [v for v in visits if v.get("timestamp", "") > cutoff]
    
    try:
        STATS_PATH.write_text(json.dumps(visits, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:
        print(f"Failed to write stats: {e}")

def get_stats_7_days() -> int:
    """Считает уникальных пользователей за последние 7 дней."""
    if not STATS_PATH.exists():
        return 0
    try:
        visits = json.loads(STATS_PATH.read_text(encoding="utf-8"))
        cutoff = (datetime.utcnow() - timedelta(days=7)).isoformat()
        recent_user_ids = {
            v["user_id"] for v in visits 
            if v.get("timestamp", "") >= cutoff and "user_id" in v
        }
        return len(recent_user_ids)
    except Exception:
        return 0

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
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}?v=release_v3"),
                )
            ]
        ]
    )
    await message.answer(
        "Привет! Я веб-дизайнер из Великого Новгорода.\n"
        "Открой мини-приложение, чтобы посмотреть работы и оставить заказ.",
        reply_markup=keyboard,
    )

@dp.message(Command("stats"))
async def cmd_stats(message: Message) -> None:
    if str(message.from_user.id) != str(ADMIN_CHAT_ID):
        return  # Игнорируем обычных пользователей

    count = get_stats_7_days()
    await message.answer(
        f"📊 *Статистика Mini App*\n\n"
        f"Уникальных пользователей за последние 7 дней: *{count}*",
        parse_mode=ParseMode.MARKDOWN,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    await bot.delete_webhook(drop_pending_updates=True)
    
    # Регистрируем меню команд для бота
    await bot.set_my_commands([
        BotCommand(command="start", description="Открыть портфолио"),
        BotCommand(command="stats", description="Статистика визитов"),
    ])

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
async def get_content(
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID")
) -> Content:
    if x_user_id:
        record_visit(x_user_id)
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

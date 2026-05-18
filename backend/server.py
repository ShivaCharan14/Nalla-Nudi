from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


# ---------------------------------------------------------------------------
# Nalla-Nudi: AI definition generator (used when a word is not in local DB)
# ---------------------------------------------------------------------------
class GenerateWordRequest(BaseModel):
    word: str
    subject_category: Optional[str] = None  # Science | Math | Commerce (optional hint)

class GenerateWordResponse(BaseModel):
    eng_word: str
    kn_meaning: str
    english_explanation: str
    kannada_explanation: str
    subject_category: str  # one of Science | Math | Commerce
    phonetic_kn: Optional[str] = None

@api_router.post("/generate_word", response_model=GenerateWordResponse)
async def generate_word(req: GenerateWordRequest):
    """Generate a bilingual STEM dictionary entry for a word using Gemini Flash."""
    word = req.word.strip()
    if not word or len(word) > 60:
        raise HTTPException(400, "Invalid word")

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(500, "LLM key not configured")

    system_message = (
        "You are a bilingual technical dictionary assistant for Kannada-medium STEM students. "
        "Given an English term, return a JSON object with exactly these fields: "
        "kn_meaning (1-3 word Kannada translation in Kannada script), "
        "english_explanation (1 short sentence, max 18 words), "
        "kannada_explanation (1 short sentence in Kannada script, max 18 words), "
        "subject_category (one of: Science, Math, Commerce), "
        "phonetic_kn (English word broken into syllables in Kannada script, e.g., 'ಫೋ-ಟೋ-ಸಿಂ-ಥೆ-ಸಿಸ್'). "
        "Output ONLY the JSON object, no markdown, no commentary."
    )

    chat = LlmChat(
        api_key=api_key,
        session_id=f"nalla-nudi-{uuid.uuid4().hex[:8]}",
        system_message=system_message,
    ).with_model("gemini", "gemini-2.5-flash")

    hint = f" (subject hint: {req.subject_category})" if req.subject_category else ""
    user_msg = UserMessage(text=f"Term: {word}{hint}")

    try:
        raw = await chat.send_message(user_msg)
    except Exception as e:
        logger.exception("LLM generation failed")
        raise HTTPException(502, f"AI generation failed: {e}")

    # Strip markdown fences if present
    text = (raw or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:].strip()
    try:
        data = json.loads(text)
    except Exception:
        # Fallback: try to extract JSON substring
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1:
            raise HTTPException(502, "AI response was not valid JSON")
        data = json.loads(text[start:end + 1])

    cat = data.get("subject_category", "Science")
    if cat not in ("Science", "Math", "Commerce"):
        cat = "Science"

    return GenerateWordResponse(
        eng_word=word,
        kn_meaning=data.get("kn_meaning", ""),
        english_explanation=data.get("english_explanation", ""),
        kannada_explanation=data.get("kannada_explanation", ""),
        subject_category=cat,
        phonetic_kn=data.get("phonetic_kn"),
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

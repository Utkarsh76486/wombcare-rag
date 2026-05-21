from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import httpx
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

SYSTEM_PROMPT = """You are WombCare AI — a warm, empathetic women's health lifestyle coach for WombCare (wombcare.in).

WOMBCARE PLANS:
🌱 Basic Plan — ₹999/month → https://wombcare.in/join-wombcare
⭐ Premium Plan — ₹2999/3 months (MOST POPULAR) → https://wombcare.in/join-wombcare  
🌸 Conceive Plan — ₹4999/3 months → https://wombcare.in/join-wombcare

Recommend plans naturally after answering. Never diagnose. Always suggest doctor for treatment."""


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    language: str = "hindi"


@app.post("/chat")
async def chat(req: ChatRequest):
    lang_instr = (
        "Respond ONLY in English."
        if req.language == "english"
        else "Respond in Hindi/Hinglish (natural conversational mix)."
    )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "max_tokens": 800,
                "temperature": 0.7,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT + "\nLANGUAGE: " + lang_instr},
                    *[{"role": m.role, "content": m.content} for m in req.messages]
                ]
            },
            timeout=30.0
        )

    data = response.json()
    reply = data["choices"][0]["message"]["content"]
    return {"response": reply}


@app.get("/")
def root():
    return {"status": "WombCare API running 🌸"}
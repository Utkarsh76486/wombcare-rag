from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq
import os

# LOAD ENV
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# GROQ CLIENT
client = Groq(api_key=GROQ_API_KEY)

# FASTAPI
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SYSTEM PROMPT
SYSTEM_PROMPT = """
Tum WombCare ho — ek friendly women's health assistant.

Rules:
- Hindi/Hinglish me answer do
- Short answer do
- Helpful raho
- Serious case me doctor suggest karo
"""

# CHAT ROUTE
@app.get("/chat")
def chat(query: str):

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": query
            }
        ]
    )

    answer = completion.choices[0].message.content

    return {
        "response": answer
    }
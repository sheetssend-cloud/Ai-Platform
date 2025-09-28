
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if HAS_OPENAI and OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

app = FastAPI(title="Multi-Agent AI Brainstorming API")

# CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AskPayload(BaseModel):
    question: str
    provider: str | None = "mock"

@app.get("/models")
def list_models():
    return {
        "current": "openai" if OPENAI_API_KEY else "mock",
        "available_models": [
            {
                "id": "openai",
                "name": "🧠 GPT-5 (OpenAI)",
                "description": "แม่นยำสูง เหมาะกับงานวิเคราะห์เชิงลึก ข้อมูลซับซ้อน และโค้ด",
                "speed": "⚡⚡ ปานกลาง-เร็ว",
                "cost": "$0.03"
            },
            {
                "id": "gemini",
                "name": "🌐 Gemini 2.5 (Google)",
                "description": "ดีเยี่ยมด้านข้อมูลสดจากเว็บ เหมาะกับงานสืบค้นและอัปเดตเรียลไทม์",
                "speed": "⚡⚡⚡ เร็วมาก",
                "cost": "$0.02"
            },
            {
                "id": "claude",
                "name": "🤖 Claude 3 (Anthropic)",
                "description": "เก่งด้านการวิเคราะห์ข้อความยาวและบริบทซับซ้อน เหมาะกับงานเอกสาร",
                "speed": "⚡⚡ ปานกลาง",
                "cost": "$0.025"
            },
            {
                "id": "mock",
                "name": "🧪 Mock LLM (ทดสอบ)",
                "description": "จำลองการทำงาน ใช้สำหรับทดสอบระบบโดยไม่เสียค่าใช้จ่าย",
                "speed": "⚡⚡⚡⚡ เร็วที่สุด",
                "cost": "$0.00"
            }
        ]
    }

def mock_response(q: str):
    return {
        "plan": f"📑 แผนการสำหรับคำถาม: {q}\n- วิเคราะห์โจทย์\n- กำหนดเป้าหมาย\n- สรุปขั้นตอน",
        "research": f"🔎 สรุปข้อมูลเบื้องต้นเกี่ยวกับ '{q}' จากฐานข้อมูลในระบบ",
        "analysis": "📊 วิเคราะห์ปัจจัย จุดแข็ง จุดอ่อน โอกาส และอุปสรรค",
        "critique": "🧪 ตรวจสอบข้อผิดพลาดที่อาจเกิดขึ้น พร้อมข้อเสนอแนะ",
        "final": "🧠 ข้อสรุปที่ดีที่สุดพร้อมแนวทางปฏิบัติที่แนะนำ"
    }

@app.post("/ask")
async def ask_ai(payload: AskPayload):
    q = payload.question
    provider = (payload.provider or "mock").lower()

    if provider == "openai" and HAS_OPENAI and OPENAI_API_KEY:
        try:
            # Use Chat Completions; fall back to mock if SDK not available
            completion = await openai.ChatCompletion.acreate(
                model=os.getenv("OPENAI_MODEL", "gpt-4o"),
                messages=[
                    {"role": "system", "content": "You are a team of AI agents brainstorming in Thai."},
                    {"role": "user", "content": q}
                ]
            )
            answer = completion.choices[0].message["content"]
            return {
                "plan": "📑 สรุปแผนการจาก GPT:\n" + answer,
                "research": "🔎 ข้อมูลค้นคว้าที่เกี่ยวข้อง\n" + answer,
                "analysis": "📊 วิเคราะห์เชิงลึก\n" + answer,
                "critique": "🧪 วิจารณ์และตรวจสอบ\n" + answer,
                "final": "🧠 บทสรุปสุดท้าย\n" + answer,
            }
        except Exception as e:
            # Fallback to mock on error
            return mock_response(q + f"\n(⚠️ openai error: {e})")

    # For gemini/claude in this scaffold, we fallback to mock
    if provider in {"gemini", "claude"}:
        return mock_response(q + "\n(ℹ️ เดโม่: ยังไม่เชื่อมต่อผู้ให้บริการจริงในไฟล์ backend นี้)")

    return mock_response(q)

@app.get("/")
def root():
    return {"ok": True, "service": "multiagent-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

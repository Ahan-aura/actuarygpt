from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any

router = APIRouter(prefix="/agent", tags=["chatbot"])

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    context: Optional[Dict[str, Any]] = None

@router.post("/chat")
def agent_chat(req: ChatRequest):
    try:
        from llm import chat_with_agent
        reply = chat_with_agent(req.message, req.history, req.context)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

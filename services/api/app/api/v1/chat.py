from app.api.deps import DbSession, get_rag_orchestrator
from app.application.rag_orchestrator import RagOrchestrator
from app.schemas.chat import ChatRequest, ChatResponse
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/ask", response_model=ChatResponse)
async def ask_rules(
    body: ChatRequest,
    session: DbSession,
    orchestrator: RagOrchestrator = Depends(get_rag_orchestrator),
) -> ChatResponse:
    return await orchestrator.ask(session, body)

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.mlops import MLOpsEvent, AgentRunLog

router = APIRouter()


@router.get("/events")
async def get_mlops_events(
    event_type: Optional[str] = None,
    project_id: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(MLOpsEvent)
    if event_type:
        query = query.filter(MLOpsEvent.event_type == event_type)
    if project_id:
        query = query.filter(MLOpsEvent.project_id == project_id)
    events = query.order_by(desc(MLOpsEvent.created_at)).limit(limit).all()
    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "project_id": e.project_id,
            "agent_name": e.agent_name,
            "llm_provider": e.llm_provider,
            "llm_model": e.llm_model,
            "total_tokens": e.total_tokens,
            "latency_ms": e.latency_ms,
            "status": e.status,
            "error_message": e.error_message,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in events
    ]


@router.get("/agent-logs")
async def get_agent_logs(
    project_id: Optional[str] = None,
    agent_name: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(AgentRunLog)
    if project_id:
        query = query.filter(AgentRunLog.project_id == project_id)
    if agent_name:
        query = query.filter(AgentRunLog.agent_name == agent_name)
    logs = query.order_by(desc(AgentRunLog.created_at)).limit(limit).all()
    return [
        {
            "id": l.id,
            "project_id": l.project_id,
            "agent_name": l.agent_name,
            "quality_score": l.quality_score,
            "latency_ms": l.latency_ms,
            "status": l.status,
            "error": l.error,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]


@router.get("/stats")
async def get_mlops_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_runs = db.query(func.count(AgentRunLog.id)).scalar() or 0
    success_runs = db.query(func.count(AgentRunLog.id)).filter(AgentRunLog.status == "completed").scalar() or 0
    failed_runs = db.query(func.count(AgentRunLog.id)).filter(AgentRunLog.status == "failed").scalar() or 0
    avg_latency = db.query(func.avg(AgentRunLog.latency_ms)).scalar() or 0
    avg_quality = db.query(func.avg(AgentRunLog.quality_score)).scalar() or 0

    agent_breakdown = (
        db.query(AgentRunLog.agent_name, func.count(AgentRunLog.id), func.avg(AgentRunLog.latency_ms), func.avg(AgentRunLog.quality_score))
        .group_by(AgentRunLog.agent_name)
        .all()
    )

    return {
        "total_runs": total_runs,
        "success_runs": success_runs,
        "failed_runs": failed_runs,
        "success_rate": round((success_runs / total_runs * 100) if total_runs > 0 else 0, 2),
        "avg_latency_ms": round(avg_latency, 2),
        "avg_quality_score": round(avg_quality, 2),
        "agent_breakdown": [
            {"agent_name": a[0], "runs": a[1], "avg_latency_ms": round(a[2], 2) if a[2] else 0, "avg_quality": round(a[3], 2) if a[3] else 0}
            for a in agent_breakdown
        ],
    }

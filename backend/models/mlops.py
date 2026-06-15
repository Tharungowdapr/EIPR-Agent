import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Float, JSON, Integer
from core.database import Base


class MLOpsEvent(Base):
    __tablename__ = "mlops_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String, nullable=False, index=True)
    project_id = Column(String, index=True)
    agent_name = Column(String)
    llm_provider = Column(String)
    llm_model = Column(String)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    latency_ms = Column(Float, default=0.0)
    status = Column(String, default="success")
    error_message = Column(Text)
    event_metadata = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class AgentRunLog(Base):
    __tablename__ = "agent_run_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, index=True)
    agent_name = Column(String, nullable=False)
    input_summary = Column(Text)
    output_summary = Column(Text)
    quality_score = Column(Float)
    latency_ms = Column(Float)
    status = Column(String, default="completed")
    error = Column(Text)
    run_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

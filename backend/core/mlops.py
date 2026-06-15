import time
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from core.config import settings

logger = logging.getLogger(__name__)

try:
    import mlflow
    MLFLOW_AVAILABLE = True
except ImportError:
    MLFLOW_AVAILABLE = False


class MLFlowTracker:
    def __init__(self):
        self.enabled = settings.ENABLE_MLFLOW and MLFLOW_AVAILABLE
        if self.enabled:
            mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
            mlflow.set_experiment("eipr-agent")

    def start_run(self, run_name: str, tags: dict = None):
        if self.enabled:
            mlflow.start_run(run_name=run_name)
            if tags:
                mlflow.set_tags(tags)

    def log_params(self, params: dict):
        if self.enabled:
            mlflow.log_params(params)

    def log_metrics(self, metrics: dict, step: Optional[int] = None):
        if self.enabled:
            mlflow.log_metrics(metrics, step=step)

    def log_artifact(self, local_path: str):
        if self.enabled:
            mlflow.log_artifact(local_path)

    def end_run(self):
        if self.enabled:
            mlflow.end_run()


mlflow_tracker = MLFlowTracker()


class AgentMetrics:
    def __init__(self):
        self.start_time: Optional[float] = None
        self.prompt_tokens: int = 0
        self.completion_tokens: int = 0
        self.total_tokens: int = 0
        self.agent_name: str = ""
        self.status: str = "success"

    def start(self, agent_name: str):
        self.agent_name = agent_name
        self.start_time = time.time()
        return self

    def record_tokens(self, prompt: int, completion: int):
        self.prompt_tokens = prompt
        self.completion_tokens = completion
        self.total_tokens = prompt + completion

    def end(self, status: str = "success"):
        self.status = status
        latency = (time.time() - self.start_time) * 1000 if self.start_time else 0
        return {
            "agent_name": self.agent_name,
            "latency_ms": round(latency, 2),
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "status": self.status,
        }


def log_agent_run(db: Session, project_id: str, agent_name: str, input_summary: str,
                  output_summary: str, quality_score: float, latency_ms: float,
                  status: str = "completed", error: str = None, metadata: dict = None):
    from models.mlops import AgentRunLog
    log = AgentRunLog(
        project_id=project_id,
        agent_name=agent_name,
        input_summary=input_summary[:500],
        output_summary=str(output_summary)[:500],
        quality_score=quality_score,
        latency_ms=latency_ms,
        status=status,
        error=error,
        run_metadata=metadata or {},
    )
    db.add(log)
    db.commit()


def log_mlops_event(db: Session, event_type: str, project_id: str = None,
                    agent_name: str = None, llm_provider: str = None,
                    llm_model: str = None, prompt_tokens: int = 0,
                    completion_tokens: int = 0, latency_ms: float = 0.0,
                    status: str = "success", error_message: str = None,
                    metadata: dict = None):
    from models.mlops import MLOpsEvent
    event = MLOpsEvent(
        event_type=event_type,
        project_id=project_id,
        agent_name=agent_name,
        llm_provider=llm_provider,
        llm_model=llm_model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=prompt_tokens + completion_tokens,
        latency_ms=latency_ms,
        status=status,
        error_message=error_message,
        event_metadata=metadata or {},
    )
    db.add(event)
    db.commit()

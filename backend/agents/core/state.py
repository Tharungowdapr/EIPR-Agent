from typing import TypedDict, List, Dict, Any, Optional, Annotated
from datetime import datetime
from enum import Enum
import operator


class AgentStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ResearchStep(TypedDict):
    step_id: str
    description: str
    tool: str
    input: Dict[str, Any]
    output: Optional[Dict[str, Any]]
    status: AgentStatus
    started_at: Optional[str]
    completed_at: Optional[str]
    error: Optional[str]


class AgentState(TypedDict):
    project_id: str
    user_id: str
    domain: str
    input_text: str
    user_context: str
    current_step: int
    total_steps: int
    steps: Annotated[List[ResearchStep], operator.add]
    research_data: Dict[str, Any]
    analysis_results: Dict[str, Any]
    final_report: Optional[Dict[str, Any]]
    status: AgentStatus
    error: Optional[str]
    created_at: str
    updated_at: str
    llm_provider: str
    llm_model: str


def create_initial_state(
    project_id: str,
    user_id: str,
    domain: str,
    input_text: str,
    user_context: str,
    llm_provider: str,
    llm_model: str,
) -> AgentState:
    now = datetime.utcnow().isoformat()
    return AgentState(
        project_id=project_id,
        user_id=user_id,
        domain=domain,
        input_text=input_text,
        user_context=user_context,
        current_step=0,
        total_steps=0,
        steps=[],
        research_data={},
        analysis_results={},
        final_report=None,
        status=AgentStatus.IDLE,
        error=None,
        created_at=now,
        updated_at=now,
        llm_provider=llm_provider,
        llm_model=llm_model,
    )


def add_step(
    state: AgentState,
    step_id: str,
    description: str,
    tool: str,
    input_data: Dict[str, Any],
) -> AgentState:
    step: ResearchStep = {
        "step_id": step_id,
        "description": description,
        "tool": tool,
        "input": input_data,
        "output": None,
        "status": AgentStatus.RUNNING,
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": None,
        "error": None,
    }
    return {
        **state,
        "steps": state["steps"] + [step],
        "current_step": state["current_step"] + 1,
        "updated_at": datetime.utcnow().isoformat(),
    }


def complete_step(
    state: AgentState,
    step_id: str,
    output: Dict[str, Any],
) -> AgentState:
    updated_steps = []
    for step in state["steps"]:
        if step["step_id"] == step_id:
            updated_steps.append({
                **step,
                "output": output,
                "status": AgentStatus.COMPLETED,
                "completed_at": datetime.utcnow().isoformat(),
            })
        else:
            updated_steps.append(step)
    return {
        **state,
        "steps": updated_steps,
        "updated_at": datetime.utcnow().isoformat(),
    }


def fail_step(
    state: AgentState,
    step_id: str,
    error: str,
) -> AgentState:
    updated_steps = []
    for step in state["steps"]:
        if step["step_id"] == step_id:
            updated_steps.append({
                **step,
                "status": AgentStatus.FAILED,
                "completed_at": datetime.utcnow().isoformat(),
                "error": error,
            })
        else:
            updated_steps.append(step)
    return {
        **state,
        "steps": updated_steps,
        "status": AgentStatus.FAILED,
        "error": error,
        "updated_at": datetime.utcnow().isoformat(),
    }
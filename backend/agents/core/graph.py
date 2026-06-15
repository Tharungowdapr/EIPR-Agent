from typing import Literal, Dict, Any
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from agents.core.state import AgentState, AgentStatus, create_initial_state, add_step, complete_step, fail_step
from agents.tools.llm_factory import create_llm_from_user
from agents.tools.web_search import research_topic
import json
import logging

logger = logging.getLogger(__name__)


async def research_node(state: AgentState) -> AgentState:
    state = add_step(state, "research", "Researching domain and market", "web_search", {"query": state["domain"]})
    try:
        data = await research_topic(f"{state['domain']} {state['input_text']} business opportunities")
        state["research_data"]["web_research"] = data
        state = complete_step(state, "research", data)
    except Exception as e:
        state = fail_step(state, "research", str(e))
    return state


async def analyze_node(state: AgentState) -> AgentState:
    state = add_step(state, "analysis", "Analyzing research data with LLM", "llm", {})
    try:
        user_obj = type("User", (), {
            "preferred_provider": state["llm_provider"],
            "preferred_model": state["llm_model"],
            "llm_api_keys": {},
            "ollama_base_url": "http://localhost:11434",
        })()
        llm = create_llm_from_user(user_obj)

        research_summary = json.dumps(state["research_data"], indent=2)[:4000]
        domain = state["domain"]
        input_text = state["input_text"]

        prompt = f"""You are an EIPR Entrepreneurship Analyst. Analyze the following domain and research data.

Domain: {domain}
User Input: {input_text}

Research Data:
{research_summary}

Provide a structured analysis with:
1. Market opportunities (5-8 specific opportunities)
2. IP strategy considerations
3. Business model recommendations
4. Financial feasibility overview

Return as JSON with keys: opportunities, ip_strategy, business_model, financial_overview"""

        from langchain_core.messages import HumanMessage, SystemMessage
        messages = [
            SystemMessage(content="You are an expert entrepreneurship analyst. Return structured JSON."),
            HumanMessage(content=prompt),
        ]
        response = llm.invoke(messages)

        import re
        text = response.content
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
        else:
            result = {"raw_analysis": text}

        state["analysis_results"] = result
        state = complete_step(state, "analysis", result)
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        state = fail_step(state, "analysis", str(e))
    return state


async def report_node(state: AgentState) -> AgentState:
    state = add_step(state, "report", "Generating final report", "llm", {})
    try:
        user_obj = type("User", (), {
            "preferred_provider": state["llm_provider"],
            "preferred_model": state["llm_model"],
            "llm_api_keys": {},
            "ollama_base_url": "http://localhost:11434",
        })()
        llm = create_llm_from_user(user_obj)

        analysis = json.dumps(state["analysis_results"], indent=2)[:3000]
        research = json.dumps(state["research_data"], indent=2)[:2000]

        prompt = f"""Synthesize this EIPR analysis into a professional report.

Domain: {state['domain']}
Input: {state['input_text']}

Analysis Results:
{analysis}

Research Data:
{research}

Generate a complete EIPR case study report with:
1. Title and abstract
2. Introduction (Entrepreneurship context)
3. Opportunity analysis with SWOC
4. IP strategy and recommendations
5. Business model and financials
6. EIPR curriculum mapping (Units I-V)
7. Learning outcomes and discussion questions

Return as structured JSON."""

        from langchain_core.messages import HumanMessage, SystemMessage
        messages = [
            SystemMessage(content="You are an EIPR curriculum expert. Generate comprehensive educational content."),
            HumanMessage(content=prompt),
        ]
        response = llm.invoke(messages)

        import re
        text = response.content
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
        else:
            result = {"report": text}

        state["final_report"] = result
        state["status"] = AgentStatus.COMPLETED
        state = complete_step(state, "report", result)
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        state = fail_step(state, "report", str(e))
    return state


def should_continue(state: AgentState) -> Literal["research", "analyze", "report", END]:
    if state["status"] == AgentStatus.FAILED:
        return END
    if state["current_step"] == 0:
        return "research"
    if state["current_step"] == 1:
        return "analyze"
    if state["current_step"] == 2:
        return "report"
    return END


def build_agent_graph() -> StateGraph:
    workflow = StateGraph(AgentState)
    workflow.add_node("research", research_node)
    workflow.add_node("analyze", analyze_node)
    workflow.add_node("report", report_node)
    workflow.set_conditional_entry_point(should_continue)
    workflow.add_conditional_edges("research", should_continue)
    workflow.add_conditional_edges("analyze", should_continue)
    workflow.add_conditional_edges("report", should_continue)
    return workflow.compile(checkpointer=MemorySaver())

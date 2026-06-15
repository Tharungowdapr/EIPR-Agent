import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from core.database import get_db
from core.security import get_current_user
from core.llm_client import build_llm_client_for_user
from core.mcp_client import MCPOrchestrator
from core.mlops import AgentMetrics, log_agent_run

from models.user import User
from models.project import Project, Output

from agents.opportunity_scout.agent import run_opportunity_scout
from agents.ip_strategist.agent import run_ip_strategist_full
from agents.business_architect.agent import run_business_architect
from agents.financial_analyst.agent import run_financial_analyst
from agents.pedagogical_synthesizer.agent import run_pedagogical_synthesizer
from agents.core.graph import build_agent_graph, create_initial_state

router = APIRouter()
logger = logging.getLogger(__name__)
mcp = MCPOrchestrator()

_agent_graph = None


def get_agent_graph():
    global _agent_graph
    if _agent_graph is None:
        _agent_graph = build_agent_graph()
    return _agent_graph


def _require_llm_config(user: User):
    if not user.preferred_provider:
        raise HTTPException(
            status_code=400,
            detail="No LLM provider configured. Go to Settings > AI Settings to configure your LLM provider.",
        )


class AgentRequest(BaseModel):
    project_id: str
    user_inputs: Optional[str] = ""


class IPAnalysisRequest(BaseModel):
    project_id: str
    opportunity_index: int = 0
    user_inputs: Optional[str] = ""


class BusinessPlanRequest(BaseModel):
    project_id: str
    opportunity_index: int = 0
    user_inputs: Optional[str] = ""


class FinancialRequest(BaseModel):
    project_id: str
    opportunity_index: int = 0
    user_inputs: Optional[str] = ""


class ReportRequest(BaseModel):
    project_id: str
    user_inputs: Optional[str] = ""
    report_template: Optional[str] = "academic"


class LangGraphRequest(BaseModel):
    project_id: str
    user_inputs: Optional[str] = ""


@router.post("/discover-opportunities")
async def discover_opportunities(body: AgentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_llm_config(current_user)
    project = _get_project(body.project_id, current_user.id, db)
    llm = await build_llm_client_for_user(current_user)
    metrics = AgentMetrics().start("opportunity_scout")

    try:
        user_context = body.user_inputs or project.user_context or project.domain
        result = await run_opportunity_scout(project.input_text, user_context, llm)
        _save_output(db, project.id, "opportunities", result)
        project.current_stage = "opportunities"
        db.commit()

        m = metrics.end()
        log_agent_run(db, project.id, "opportunity_scout", project.input_text[:200], json.dumps(result)[:200], 0.85, m["latency_ms"])
        return {"project_id": project.id, "opportunities": result}
    except Exception as e:
        metrics.end("failed")
        raise HTTPException(status_code=500, detail=f"Opportunity discovery failed: {str(e)}")


@router.post("/analyze-ip")
async def analyze_ip(body: IPAnalysisRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_llm_config(current_user)
    project = _get_project(body.project_id, current_user.id, db)
    opportunities = _get_output(db, project.id, "opportunities")
    if not opportunities:
        raise HTTPException(status_code=400, detail="Run opportunity discovery first")

    opps = opportunities.get("opportunities", [])
    if body.opportunity_index >= len(opps):
        raise HTTPException(status_code=400, detail="Invalid opportunity index")

    opportunity = opps[body.opportunity_index]
    llm = await build_llm_client_for_user(current_user)

    try:
        result = await run_ip_strategist_full(opportunity, project.domain, llm, mcp)
        _save_output(db, project.id, f"ip_analysis_{body.opportunity_index}", result)
        project.current_stage = "ip"
        db.commit()
        return {"project_id": project.id, "ip_analysis": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IP analysis failed: {str(e)}")


@router.post("/generate-business-plan")
async def generate_business_plan(body: BusinessPlanRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_llm_config(current_user)
    project = _get_project(body.project_id, current_user.id, db)
    opportunities = _get_output(db, project.id, "opportunities")
    if not opportunities:
        raise HTTPException(status_code=400, detail="Run opportunity discovery first")

    opps = opportunities.get("opportunities", [])
    if body.opportunity_index >= len(opps):
        raise HTTPException(status_code=400, detail="Invalid opportunity index")

    opportunity = opps[body.opportunity_index]
    llm = await build_llm_client_for_user(current_user)

    opportunity_str = json.dumps(opportunity)
    try:
        result = await run_business_architect(
            opportunity_str, project.domain,
            opportunity.get("target_customer", ""),
            body.user_inputs or "", llm
        )
        _save_output(db, project.id, f"business_plan_{body.opportunity_index}", result)
        project.current_stage = "strategy"
        db.commit()

        fin_result = await run_financial_analyst(
            opportunity_str,
            json.dumps(result.get("business_plan", {}).get("business_model", {})),
            json.dumps(result.get("business_plan", {}).get("market_analysis", {})),
            body.user_inputs or "", llm
        )
        _save_output(db, project.id, f"financial_{body.opportunity_index}", fin_result)

        return {"project_id": project.id, "business_plan": result, "financial_analysis": fin_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Business plan generation failed: {str(e)}")


@router.post("/generate-financial-analysis")
async def generate_financial_analysis(body: FinancialRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_llm_config(current_user)
    project = _get_project(body.project_id, current_user.id, db)
    opportunities = _get_output(db, project.id, "opportunities")
    if not opportunities:
        raise HTTPException(status_code=400, detail="Run opportunity discovery first")

    opps = opportunities.get("opportunities", [])
    if body.opportunity_index >= len(opps):
        raise HTTPException(status_code=400, detail="Invalid opportunity index")

    bp = _get_output(db, project.id, f"business_plan_{body.opportunity_index}")
    if not bp:
        raise HTTPException(status_code=400, detail="Generate business strategy first")

    opportunity = opps[body.opportunity_index]
    llm = await build_llm_client_for_user(current_user)

    try:
        fin_result = await run_financial_analyst(
            json.dumps(opportunity),
            json.dumps(bp.get("business_plan", {}).get("business_model", {})),
            json.dumps(bp.get("business_plan", {}).get("market_analysis", {})),
            body.user_inputs or "", llm
        )
        _save_output(db, project.id, f"financial_{body.opportunity_index}", fin_result)
        return {"project_id": project.id, "financial_analysis": fin_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Financial analysis failed: {str(e)}")


@router.post("/generate-report")
async def generate_report(body: ReportRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_llm_config(current_user)
    project = _get_project(body.project_id, current_user.id, db)
    opportunities = _get_output(db, project.id, "opportunities") or {}
    ip_analysis = _get_output(db, project.id, "ip_analysis_0") or {}
    business_plan = _get_output(db, project.id, "business_plan_0") or {}
    financial = _get_output(db, project.id, "financial_0") or {}

    llm = await build_llm_client_for_user(current_user)

    try:
        result = await run_pedagogical_synthesizer(
            project.domain, opportunities, ip_analysis, business_plan, financial, llm, body.report_template
        )
        _save_output(db, project.id, "report", result)
        project.status = "done"
        project.current_stage = "report"
        db.commit()
        return {"project_id": project.id, "report": result, "template": body.report_template}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.post("/run-langgraph")
async def run_langgraph_analysis(body: LangGraphRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_llm_config(current_user)
    project = _get_project(body.project_id, current_user.id, db)

    state = create_initial_state(
        project_id=project.id,
        user_id=current_user.id,
        domain=project.domain,
        input_text=project.input_text,
        user_context=body.user_inputs or project.user_context or "",
        llm_provider=current_user.preferred_provider or "ollama",
        llm_model=current_user.preferred_model or "",
    )

    graph = get_agent_graph()
    try:
        result = await graph.ainvoke(state, {"configurable": {"thread_id": project.id}})
        _save_output(db, project.id, "langgraph_analysis", result)
        return {
            "project_id": project.id,
            "status": result["status"],
            "steps": result["steps"],
            "analysis": result["analysis_results"],
            "report": result["final_report"],
            "error": result["error"],
        }
    except Exception as e:
        logger.error(f"LangGraph analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


def _stream_yield(step: str, message: str, data: any = None):
    obj = {"step": step, "message": message}
    if data:
        obj["data"] = data
    return f"data: {json.dumps(obj)}\n\n"


@router.post("/{project_id}/ip-stream")
async def ip_stream(project_id: str, opportunity_index: int = 0, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_llm_config(current_user)
    project = _get_project(project_id, current_user.id, db)
    opportunities = _get_output(db, project.id, "opportunities")
    if not opportunities:
        raise HTTPException(status_code=400, detail="Run opportunity discovery first")
    opps = opportunities.get("opportunities", [])
    if opportunity_index >= len(opps):
        raise HTTPException(status_code=400, detail="Invalid opportunity index")

    llm = await build_llm_client_for_user(current_user)
    opportunity = opps[opportunity_index]

    async def event_stream():
        try:
            yield _stream_yield("analyzing", "Analyzing patent landscape under Indian Patents Act 1970...")
            yield _stream_yield("analyzing", "Evaluating trademark strategy under Trade Marks Act 1999...")
            yield _stream_yield("analyzing", "Assessing copyright protection under Copyright Act 1957...")
            yield _stream_yield("analyzing", "Building IP portfolio roadmap for India...")
            result = await run_ip_strategist_full(opportunity, project.domain, llm, mcp)
            _save_output(db, project.id, f"ip_analysis_{opportunity_index}", result)
            project.current_stage = "ip"
            db.commit()
            yield _stream_yield("complete", "IP analysis complete", result)
        except Exception as e:
            yield _stream_yield("error", str(e))

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{project_id}/strategy-stream")
async def strategy_stream(project_id: str, opportunity_index: int = 0, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_llm_config(current_user)
    project = _get_project(project_id, current_user.id, db)
    opportunities = _get_output(db, project.id, "opportunities")
    if not opportunities:
        raise HTTPException(status_code=400, detail="Run opportunity discovery first")
    opps = opportunities.get("opportunities", [])
    if opportunity_index >= len(opps):
        raise HTTPException(status_code=400, detail="Invalid opportunity index")

    llm = await build_llm_client_for_user(current_user)
    opportunity = opps[opportunity_index]
    opportunity_str = json.dumps(opportunity)

    async def event_stream():
        try:
            yield _stream_yield("analyzing", "Crafting executive summary and company description...")
            yield _stream_yield("analyzing", "Running SWOC analysis for Indian market...")
            yield _stream_yield("analyzing", "Building 4Ps marketing strategy for India...")
            yield _stream_yield("analyzing", "Setting growth strategy for Indian ecosystem...")
            result = await run_business_architect(
                opportunity_str, project.domain,
                opportunity.get("target_customer", ""),
                "", llm
            )
            _save_output(db, project.id, f"business_plan_{opportunity_index}", result)
            project.current_stage = "strategy"
            db.commit()

            yield _stream_yield("analyzing", "Estimating startup costs in INR...")
            yield _stream_yield("analyzing", "Projecting revenue for Year 1-3...")
            yield _stream_yield("analyzing", "Building funding strategy with Indian sources...")
            fin_result = await run_financial_analyst(
                opportunity_str,
                json.dumps(result.get("business_plan", {}).get("business_model", {})),
                json.dumps(result.get("business_plan", {}).get("market_analysis", {})),
                "", llm
            )
            _save_output(db, project.id, f"financial_{opportunity_index}", fin_result)

            yield _stream_yield("complete", "Strategy and financial analysis complete", {
                "business_plan": result, "financial_analysis": fin_result
            })
        except Exception as e:
            yield _stream_yield("error", str(e))

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{project_id}/finance-stream")
async def finance_stream(project_id: str, opportunity_index: int = 0, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_llm_config(current_user)
    project = _get_project(project_id, current_user.id, db)
    opportunities = _get_output(db, project.id, "opportunities")
    if not opportunities:
        raise HTTPException(status_code=400, detail="Run opportunity discovery first")
    opps = opportunities.get("opportunities", [])
    if opportunity_index >= len(opps):
        raise HTTPException(status_code=400, detail="Invalid opportunity index")

    bp = _get_output(db, project.id, f"business_plan_{opportunity_index}")
    if not bp:
        raise HTTPException(status_code=400, detail="Generate business strategy first")

    llm = await build_llm_client_for_user(current_user)
    opportunity = opps[opportunity_index]

    async def event_stream():
        try:
            yield _stream_yield("analyzing", "Estimating startup costs in INR...")
            yield _stream_yield("analyzing", "Projecting revenue for Year 1-3...")
            yield _stream_yield("analyzing", "Analyzing break-even metrics...")
            yield _stream_yield("analyzing", "Building funding strategy with Indian sources...")
            fin_result = await run_financial_analyst(
                json.dumps(opportunity),
                json.dumps(bp.get("business_plan", {}).get("business_model", {})),
                json.dumps(bp.get("business_plan", {}).get("market_analysis", {})),
                "", llm
            )
            _save_output(db, project.id, f"financial_{opportunity_index}", fin_result)
            yield _stream_yield("complete", "Financial analysis complete", fin_result)
        except Exception as e:
            yield _stream_yield("error", str(e))

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{project_id}/report-stream")
async def report_stream(project_id: str, report_template: str = "academic", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_llm_config(current_user)
    project = _get_project(project_id, current_user.id, db)
    opportunities = _get_output(db, project.id, "opportunities") or {}
    ip_analysis = _get_output(db, project.id, "ip_analysis_0") or {}
    business_plan = _get_output(db, project.id, "business_plan_0") or {}
    financial = _get_output(db, project.id, "financial_0") or {}

    llm = await build_llm_client_for_user(current_user)

    async def event_stream():
        try:
            yield _stream_yield("analyzing", "Synthesizing opportunity analysis into case study...")
            yield _stream_yield("analyzing", "Mapping to EIPR curriculum Units I-V...")
            yield _stream_yield("analyzing", "Drafting introduction and business strategy sections...")
            yield _stream_yield("analyzing", "Compiling IP strategy and legal references...")
            yield _stream_yield("analyzing", "Generating learning outcomes and discussion questions...")
            result = await run_pedagogical_synthesizer(
                project.domain, opportunities, ip_analysis, business_plan, financial, llm, report_template
            )
            result["template"] = report_template
            _save_output(db, project.id, "report", result)
            project.status = "done"
            project.current_stage = "report"
            db.commit()
            yield _stream_yield("complete", "Report generation complete", result)
        except Exception as e:
            yield _stream_yield("error", str(e))

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{project_id}/discover-stream")
async def discover_stream(project_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_llm_config(current_user)
    project = _get_project(project_id, current_user.id, db)
    llm = await build_llm_client_for_user(current_user)

    async def event_stream():
        try:
            yield f"data: {json.dumps({'step': 'analyzing', 'message': 'Analyzing domain...'})}\n\n"
            user_context = project.user_context or project.domain
            result = await run_opportunity_scout(project.input_text, user_context, llm)
            _save_output(db, project.id, "opportunities", result)
            project.current_stage = "opportunities"
            db.commit()
            yield f"data: {json.dumps({'step': 'complete', 'message': 'Opportunity discovery complete', 'data': result})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'step': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{project_id}/stream-langgraph")
async def stream_langgraph(project_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_llm_config(current_user)
    project = _get_project(project_id, current_user.id, db)

    state = create_initial_state(
        project_id=project.id,
        user_id=current_user.id,
        domain=project.domain,
        input_text=project.input_text,
        user_context=project.user_context or "",
        llm_provider=current_user.preferred_provider or "ollama",
        llm_model=current_user.preferred_model or "",
    )

    graph = get_agent_graph()

    async def event_stream():
        try:
            for step_name in ['research', 'analyze', 'report']:
                yield f"data: {json.dumps({'step': step_name, 'message': f'Running {step_name} phase...'})}\n\n"
            result = await graph.ainvoke(state, {"configurable": {"thread_id": project.id}})
            _save_output(db, project.id, "langgraph_analysis", result)
            yield f"data: {json.dumps({'step': 'complete', 'message': 'Analysis complete', 'data': result})}\n\n"
        except Exception as e:
            logger.error(f"LangGraph streaming failed: {e}")
            yield f"data: {json.dumps({'step': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{project_id}/export/docx")
async def export_docx(project_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from services.export_service import generate_docx
    import io

    _get_project(project_id, current_user.id, db)
    report = _get_output(db, project_id, "report")
    if not report:
        raise HTTPException(status_code=400, detail="Generate report first")

    try:
        docx_bytes = generate_docx(report)
        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=eipr_case_study.docx"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DOCX export failed: {str(e)}")


@router.post("/{project_id}/export/pdf")
async def export_pdf(project_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_project(project_id, current_user.id, db)
    report = _get_output(db, project_id, "report")
    if not report:
        raise HTTPException(status_code=400, detail="Generate report first")

    from services.export_service import generate_pdf_html
    html_content = generate_pdf_html(report)

    try:
        from weasyprint import HTML
        import io
        pdf_bytes = HTML(string=html_content).write_pdf()
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=eipr_case_study.pdf"},
        )
    except ImportError:
        from fastapi.responses import HTMLResponse
        return HTMLResponse(content=html_content)


def _get_project(project_id: str, user_id: str, db: Session) -> Project:
    p = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p


def _save_output(db: Session, project_id: str, output_type: str, data: dict):
    existing = db.query(Output).filter(Output.project_id == project_id, Output.output_type == output_type).first()
    if existing:
        existing.data = data
    else:
        db.add(Output(project_id=project_id, output_type=output_type, data=data))
    db.commit()


def _get_output(db: Session, project_id: str, output_type: str):
    o = db.query(Output).filter(Output.project_id == project_id, Output.output_type == output_type).first()
    return o.data if o else None
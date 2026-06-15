from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.project import Project, Output

router = APIRouter()


class CreateProjectRequest(BaseModel):
    title: str
    domain: str
    input_text: str
    user_context: Optional[str] = ""


class UpdateOutputRequest(BaseModel):
    output_type: str
    data: dict


@router.post("/")
async def create_project(body: CreateProjectRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = Project(user_id=current_user.id, title=body.title, domain=body.domain, input_text=body.input_text, user_context=body.user_context)
    db.add(project)
    db.commit()
    db.refresh(project)
    return _project_response(project)


@router.get("/")
async def list_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.user_id == current_user.id).order_by(Project.updated_at.desc()).all()
    return [_project_response(p) for p in projects]


@router.get("/{project_id}")
async def get_project(project_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = _get_project(project_id, current_user.id, db)
    outputs = db.query(Output).filter(Output.project_id == project_id).order_by(Output.created_at).all()
    resp = _project_response(project)
    resp["outputs"] = {o.output_type: o.data for o in outputs}
    resp["output_versions"] = {o.output_type: {"version": o.version, "user_edited": o.user_edited} for o in outputs}
    return resp


@router.patch("/{project_id}/stage")
async def update_stage(project_id: str, body: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = _get_project(project_id, current_user.id, db)
    project.current_stage = body.get("stage", project.current_stage)
    db.commit()
    return {"message": "Stage updated", "stage": project.current_stage}


@router.put("/{project_id}/output")
async def update_output(project_id: str, body: UpdateOutputRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = _get_project(project_id, current_user.id, db)
    existing = db.query(Output).filter(Output.project_id == project_id, Output.output_type == body.output_type).first()
    if existing:
        existing.data = body.data
        existing.user_edited = True
        existing.version = str(int(existing.version) + 1)
    else:
        db.add(Output(project_id=project_id, output_type=body.output_type, data=body.data, user_edited=True))
    db.commit()
    return {"message": "Output updated", "output_type": body.output_type}


@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = _get_project(project_id, current_user.id, db)
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}


def _get_project(project_id: str, user_id: str, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _project_response(project: Project) -> dict:
    return {
        "id": project.id,
        "title": project.title,
        "domain": project.domain,
        "input_text": project.input_text,
        "user_context": project.user_context,
        "status": project.status,
        "current_stage": project.current_stage,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
    }

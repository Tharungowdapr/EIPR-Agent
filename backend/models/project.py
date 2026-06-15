import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    domain = Column(String, default="")
    input_text = Column(Text, nullable=False)
    user_context = Column(Text, default="")
    status = Column(String, default="created")
    current_stage = Column(String, default="opportunities")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    outputs = relationship("Output", back_populates="project", cascade="all, delete-orphan")


class Output(Base):
    __tablename__ = "outputs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    output_type = Column(String, nullable=False)
    data = Column(JSON, nullable=False, default=dict)
    version = Column(String, default="1")
    user_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="outputs")

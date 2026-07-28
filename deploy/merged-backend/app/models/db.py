from __future__ import annotations

import enum
import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class JobStatus(str, enum.Enum):
    open = "open"
    closed = "closed"


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    reviewing = "reviewing"
    shortlisted = "shortlisted"
    interviewing = "interviewing"
    offered = "offered"
    rejected = "rejected"
    withdrawn = "withdrawn"


class EmbeddingEntity(str, enum.Enum):
    user = "user"
    job = "job"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(30), default="")
    resume_data = Column(JSONB, default={})
    created_at = Column(DateTime, server_default=func.now())

    password_hash = Column(String(255), default="")
    role = Column(String(20), default="candidate", nullable=False)
    google_id = Column(String(255), default="", index=True)
    company = Column(String(200), default="")
    recruiter_id = Column(UUID(as_uuid=True), ForeignKey("recruiters.id", ondelete="SET NULL"), nullable=True)

    applications = relationship("Application", back_populates="user")


class Recruiter(Base):
    __tablename__ = "recruiters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    company = Column(String(200), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    jobs = relationship("Job", back_populates="recruiter")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recruiter_id = Column(UUID(as_uuid=True), ForeignKey("recruiters.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, default="")
    location = Column(String(200), default="")
    status = Column(Enum(JobStatus, name="job_status"), default=JobStatus.open, nullable=False)
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    department = Column(String(100), default="")
    employment_type = Column(String(30), default="full-time")
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_currency = Column(String(10), default="USD")
    skills = Column(JSONB, default=[])
    benefits = Column(JSONB, default=[])
    responsibilities = Column(JSONB, default=[])
    is_remote = Column(Boolean, default=False)
    team_size = Column(Integer, nullable=True)
    max_applicants = Column(Integer, nullable=True)

    recruiter = relationship("Recruiter", back_populates="jobs")
    applications = relationship("Application", back_populates="job")


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("job_id", "user_id", name="uq_job_user"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_snapshot = Column(JSONB, default={})
    applied_at = Column(DateTime, server_default=func.now())
    ai_score = Column(Float, default=0.0)
    ai_summary = Column(Text, default="")
    ai_strengths = Column(JSONB, default=[])
    ai_gaps = Column(JSONB, default=[])
    status = Column(Enum(ApplicationStatus, name="application_status"), default=ApplicationStatus.pending, nullable=False)

    job = relationship("Job", back_populates="applications")
    user = relationship("User", back_populates="applications")


class Embedding(Base):
    __tablename__ = "embeddings"
    __table_args__ = (UniqueConstraint("entity_type", "entity_id", name="uq_embedding_entity"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(Enum(EmbeddingEntity, name="embedding_entity"), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    embedding = Column(Vector(1536), nullable=False)
    content_hash = Column(String(64), default="")
    created_at = Column(DateTime, server_default=func.now())

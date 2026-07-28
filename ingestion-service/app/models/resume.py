from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class PersonalDetailsModel(BaseModel):
    first_name: str = Field(description="First name")
    last_name: str = Field(description="Last name")
    email: EmailStr = Field(description="Email address")
    phone: str = Field(description="Phone number with country code")
    country_code: str = Field(default="", description="ISO 3166-1 alpha-2 country code")
    address: str = Field(default="", description="Full address")
    avatar_url: str = Field(default="", description="URL to avatar photo")


class ExperienceModel(BaseModel):
    id: str = Field(description="Unique identifier")
    company: str = Field(description="Company name")
    position: str = Field(description="Job title / position")
    location: str = Field(default="", description="Job location")
    start_date: str = Field(description="Start date (YYYY-MM or YYYY-MM-DD)")
    end_date: str = Field(default="", description="End date (YYYY-MM or YYYY-MM-DD), empty if current")
    is_current: bool = Field(default=False, description="Whether this is the current position")
    highlights: list[str] = Field(default_factory=list, description="Key achievements / responsibilities")


class EducationModel(BaseModel):
    id: str = Field(description="Unique identifier")
    institution: str = Field(description="Institution name")
    degree: str = Field(description="Degree type (e.g. Bachelor, Master)")
    field_of_study: str = Field(default="", description="Field of study")
    start_date: str = Field(description="Start date (YYYY-MM)")
    end_date: str = Field(default="", description="End date (YYYY-MM)")
    gpa: float = Field(default=0.0, description="GPA if available")
    description: str = Field(default="", description="Additional notes")


class ResumeModel(BaseModel):

    personal_details: PersonalDetailsModel
    bio: str = Field(default="", description="Professional summary / short bio")
    experience: list[ExperienceModel] = Field(default_factory=list)
    education: list[EducationModel] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list, description="List of skills / tags")

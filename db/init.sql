CREATE EXTENSION IF NOT EXISTS vector;


CREATE TYPE job_status AS ENUM ('open', 'closed');
CREATE TYPE embedding_entity AS ENUM ('user', 'job');
CREATE TYPE application_status AS ENUM (
    'pending', 'reviewing', 'shortlisted', 'interviewing', 'offered', 'rejected', 'withdrawn'
);


CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) DEFAULT '',
    resume_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE recruiters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT DEFAULT '',
    location VARCHAR(200) DEFAULT '',
    status job_status DEFAULT 'open',
    deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    department VARCHAR(100) DEFAULT '',
    employment_type VARCHAR(30) DEFAULT 'full-time',
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(10) DEFAULT 'USD',
    skills JSONB DEFAULT '[]',
    benefits JSONB DEFAULT '[]',
    responsibilities JSONB DEFAULT '[]',
    is_remote BOOLEAN DEFAULT FALSE,
    team_size INTEGER,
    max_applicants INTEGER
);

CREATE INDEX idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX idx_jobs_status ON jobs(status);


CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_snapshot JSONB DEFAULT '{}',
    applied_at TIMESTAMP DEFAULT NOW(),
    ai_score FLOAT DEFAULT 0.0,
    ai_summary TEXT DEFAULT '',
    status application_status DEFAULT 'pending',
    UNIQUE(job_id, user_id)
);

CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_user ON applications(user_id);


CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type embedding_entity NOT NULL,
    entity_id UUID NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    content_hash VARCHAR(64) DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_embeddings_entity ON embeddings(entity_type, entity_id);

CREATE INDEX idx_embeddings_vector ON embeddings
    USING hnsw (embedding vector_cosine_ops);

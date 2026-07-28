

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM (
        'pending', 'reviewing', 'shortlisted', 'interviewing', 'offered', 'rejected', 'withdrawn'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


ALTER TABLE jobs ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT '';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS employment_type VARCHAR(30) DEFAULT 'full-time';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_min INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_max INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS responsibilities JSONB DEFAULT '[]';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_remote BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS team_size INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_applicants INTEGER;


ALTER TABLE applications ADD COLUMN IF NOT EXISTS status application_status DEFAULT 'pending';

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actions table
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  responsible_id UUID REFERENCES members(id) ON DELETE SET NULL,
  accountable_id UUID REFERENCES members(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
  start_date DATE,
  due_date DATE,
  amdec_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Action RACI relationships
CREATE TABLE action_consulted (
  action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (action_id, member_id)
);

CREATE TABLE action_informed (
  action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (action_id, member_id)
);

-- AMDEC table
CREATE TABLE amdecs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  element TEXT NOT NULL,
  failure_mode TEXT NOT NULL,
  cause TEXT NOT NULL,
  effect TEXT,
  severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 4),
  occurrence INTEGER NOT NULL CHECK (occurrence >= 1 AND occurrence <= 4),
  detection INTEGER NOT NULL CHECK (detection >= 1 AND detection <= 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_members_project_id ON members(project_id);
CREATE INDEX idx_actions_project_id ON actions(project_id);
CREATE INDEX idx_actions_status ON actions(status);
CREATE INDEX idx_actions_responsible_id ON actions(responsible_id);
CREATE INDEX idx_amdecs_project_id ON amdecs(project_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actions_updated_at BEFORE UPDATE ON actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amdecs_updated_at BEFORE UPDATE ON amdecs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE amdecs ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_consulted ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_informed ENABLE ROW LEVEL SECURITY;

-- For development: allow all operations (remove this in production)
CREATE POLICY "Enable all access for development" ON projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for development" ON members
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for development" ON actions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for development" ON amdecs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for development" ON action_consulted
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for development" ON action_informed
  FOR ALL USING (true) WITH CHECK (true);

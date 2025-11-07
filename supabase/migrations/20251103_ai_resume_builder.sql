-- AI Resume Builder core schema for JobStalker2
-- Tables: templates, wizard_sessions, generated_resumes, generated_resume_versions, ai_events
-- Indexes, RLS policies, and seed data

-- Use consistent UUID generator as in existing schema
-- extensions.uuid_generate_v4() is available

BEGIN;

-- ===============
-- templates
-- ===============
CREATE TABLE IF NOT EXISTS public.templates (
	id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
	name text UNIQUE NOT NULL,
	slug text UNIQUE NOT NULL,
	schema jsonb NOT NULL,
	preview_url text,
	is_active boolean NOT NULL DEFAULT true,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===============
-- wizard_sessions
-- ===============
CREATE TABLE IF NOT EXISTS public.wizard_sessions (
	id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
	user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	template_id uuid NOT NULL REFERENCES public.templates(id) ON DELETE RESTRICT,
	draft_json jsonb NOT NULL DEFAULT '{}'::jsonb,
	progress jsonb NOT NULL DEFAULT '{}'::jsonb,
	status text NOT NULL CHECK (status IN ('active','completed','abandoned')) DEFAULT 'active',
	last_step int NOT NULL DEFAULT 0,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wizard_sessions_user_status ON public.wizard_sessions (user_id, status);

-- ===============
-- generated_resumes
-- ===============
CREATE TABLE IF NOT EXISTS public.generated_resumes (
	id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
	user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	template_id uuid NOT NULL REFERENCES public.templates(id) ON DELETE RESTRICT,
	title text NOT NULL DEFAULT 'My Resume',
	current_version int,
	share_token text UNIQUE,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_resumes_user_updated ON public.generated_resumes (user_id, updated_at DESC);

-- ===============
-- generated_resume_versions
-- ===============
CREATE TABLE IF NOT EXISTS public.generated_resume_versions (
	id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
	generated_resume_id uuid NOT NULL REFERENCES public.generated_resumes(id) ON DELETE CASCADE,
	version_number int NOT NULL,
	content_json jsonb NOT NULL,
	render_artifact_url text,
	created_at timestamptz NOT NULL DEFAULT now(),
	UNIQUE (generated_resume_id, version_number)
);

-- ===============
-- ai_events
-- ===============
CREATE TABLE IF NOT EXISTS public.ai_events (
	id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
	user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	wizard_session_id uuid REFERENCES public.wizard_sessions(id) ON DELETE SET NULL,
	provider text NOT NULL,
	model text NOT NULL,
	input_tokens int,
	output_tokens int,
	latency_ms int,
	status text NOT NULL CHECK (status IN ('success','error')),
	error text,
	created_at timestamptz NOT NULL DEFAULT now()
);

-- ===============
-- RLS Enablement
-- ===============
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wizard_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_events ENABLE ROW LEVEL SECURITY;

-- ===============
-- RLS Policies
-- ===============
-- templates: read-only for authenticated users; write via service role only
DROP POLICY IF EXISTS templates_select_all_auth ON public.templates;
CREATE POLICY templates_select_all_auth ON public.templates
	FOR SELECT
	TO authenticated
	USING (is_active);

-- wizard_sessions ownership
DROP POLICY IF EXISTS wizard_sessions_select_own ON public.wizard_sessions;
CREATE POLICY wizard_sessions_select_own ON public.wizard_sessions
	FOR SELECT TO authenticated
	USING (user_id = auth.uid());

DROP POLICY IF EXISTS wizard_sessions_insert_own ON public.wizard_sessions;
CREATE POLICY wizard_sessions_insert_own ON public.wizard_sessions
	FOR INSERT TO authenticated
	WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS wizard_sessions_update_own ON public.wizard_sessions;
CREATE POLICY wizard_sessions_update_own ON public.wizard_sessions
	FOR UPDATE TO authenticated
	USING (user_id = auth.uid())
	WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS wizard_sessions_delete_own ON public.wizard_sessions;
CREATE POLICY wizard_sessions_delete_own ON public.wizard_sessions
	FOR DELETE TO authenticated
	USING (user_id = auth.uid());

-- generated_resumes ownership
DROP POLICY IF EXISTS generated_resumes_select_own ON public.generated_resumes;
CREATE POLICY generated_resumes_select_own ON public.generated_resumes
	FOR SELECT TO authenticated
	USING (user_id = auth.uid());

DROP POLICY IF EXISTS generated_resumes_insert_own ON public.generated_resumes;
CREATE POLICY generated_resumes_insert_own ON public.generated_resumes
	FOR INSERT TO authenticated
	WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS generated_resumes_update_own ON public.generated_resumes;
CREATE POLICY generated_resumes_update_own ON public.generated_resumes
	FOR UPDATE TO authenticated
	USING (user_id = auth.uid())
	WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS generated_resumes_delete_own ON public.generated_resumes;
CREATE POLICY generated_resumes_delete_own ON public.generated_resumes
	FOR DELETE TO authenticated
	USING (user_id = auth.uid());

-- generated_resume_versions ownership (via join on resume)
DROP POLICY IF EXISTS generated_resume_versions_select_own ON public.generated_resume_versions;
CREATE POLICY generated_resume_versions_select_own ON public.generated_resume_versions
	FOR SELECT TO authenticated
	USING (EXISTS (
		SELECT 1 FROM public.generated_resumes r
		WHERE r.id = generated_resume_id AND r.user_id = auth.uid()
	));

DROP POLICY IF EXISTS generated_resume_versions_insert_own ON public.generated_resume_versions;
CREATE POLICY generated_resume_versions_insert_own ON public.generated_resume_versions
	FOR INSERT TO authenticated
	WITH CHECK (EXISTS (
		SELECT 1 FROM public.generated_resumes r
		WHERE r.id = generated_resume_id AND r.user_id = auth.uid()
	));

DROP POLICY IF EXISTS generated_resume_versions_update_own ON public.generated_resume_versions;
CREATE POLICY generated_resume_versions_update_own ON public.generated_resume_versions
	FOR UPDATE TO authenticated
	USING (EXISTS (
		SELECT 1 FROM public.generated_resumes r
		WHERE r.id = generated_resume_id AND r.user_id = auth.uid()
	))
	WITH CHECK (EXISTS (
		SELECT 1 FROM public.generated_resumes r
		WHERE r.id = generated_resume_id AND r.user_id = auth.uid()
	));

DROP POLICY IF EXISTS generated_resume_versions_delete_own ON public.generated_resume_versions;
CREATE POLICY generated_resume_versions_delete_own ON public.generated_resume_versions
	FOR DELETE TO authenticated
	USING (EXISTS (
		SELECT 1 FROM public.generated_resumes r
		WHERE r.id = generated_resume_id AND r.user_id = auth.uid()
	));

-- ai_events ownership
DROP POLICY IF EXISTS ai_events_select_own ON public.ai_events;
CREATE POLICY ai_events_select_own ON public.ai_events
	FOR SELECT TO authenticated
	USING (user_id = auth.uid());

DROP POLICY IF EXISTS ai_events_insert_own ON public.ai_events;
CREATE POLICY ai_events_insert_own ON public.ai_events
	FOR INSERT TO authenticated
	WITH CHECK (user_id = auth.uid());

-- ===============
-- Public read RPC for share links (latest version)
-- ===============
DROP FUNCTION IF EXISTS public.get_public_generated_resume(text);
CREATE FUNCTION public.get_public_generated_resume(p_share_token text)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
	SELECT v.content_json
	FROM public.generated_resumes gr
	JOIN public.generated_resume_versions v
	  ON v.generated_resume_id = gr.id
	WHERE gr.share_token = p_share_token
	ORDER BY v.version_number DESC
	LIMIT 1;
$$;

-- ===============
-- Seed starter templates
-- ===============
-- Templates removed - no default templates seeded

COMMIT;



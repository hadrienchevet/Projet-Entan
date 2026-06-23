-- ===========================================================================
-- fix-11 — Facturation (Stripe) + plans (Free / Pro)
-- Idempotent. À exécuter dans le SQL Editor après fix-10.
--
--   - subscriptions : source de vérité du plan, écrite UNIQUEMENT par le
--     webhook Stripe (service-role, hors RLS). Le client la lit (RLS).
--   - user_plan(uid) : 'pro' si abonnement actif, sinon 'free'.
--   - enforce_project_limit : en Free, max 3 projets PAR TYPE (gestion / rdp).
-- ===========================================================================

create table if not exists public.subscriptions (
  user_id                uuid primary key references public.profiles (id) on delete cascade,
  plan                   text not null default 'free' check (plan in ('free', 'pro')),
  status                 text,
  stripe_customer_id     text unique,
  stripe_subscription_id text,
  current_period_end     timestamptz,
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Lecture : uniquement sa propre ligne. Aucune policy d'écriture → seules les
-- écritures service-role (webhook) passent.
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions for select
  using (user_id = auth.uid());

-- Plan effectif d'un compte (défaut 'free').
create or replace function public.user_plan(p_user uuid)
returns text
language sql security definer stable set search_path = public
as $$
  select coalesce(
    (select case when s.status in ('active', 'trialing') then s.plan else 'free' end
       from public.subscriptions s
      where s.user_id = p_user),
    'free');
$$;

-- Limite du plan gratuit : 3 projets par type (gestion / rdp).
create or replace function public.enforce_project_limit()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_count int;
begin
  if public.user_plan(new.owner_id) = 'free' then
    select count(*) into v_count
    from public.projects
    where owner_id = new.owner_id
      and project_type = new.project_type;
    if v_count >= 3 then
      raise exception 'free_plan_project_limit';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists before_project_insert_limit on public.projects;
create trigger before_project_insert_limit
  before insert on public.projects
  for each row execute function public.enforce_project_limit();

-- Realtime : le plan se met à jour en direct dans l'app après le webhook.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'subscriptions'
  ) then
    alter publication supabase_realtime add table public.subscriptions;
  end if;
end $$;

notify pgrst, 'reload schema';

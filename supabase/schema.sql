-- Moxphere sync table. Run once in Supabase: SQL Editor > New query > paste > Run.
create table if not exists public.docs (
  user_id    uuid        not null default auth.uid() references auth.users on delete cascade,
  key        text        not null,
  data       jsonb       not null,
  updated_at bigint      not null,
  server_at  timestamptz not null default now(),
  primary key (user_id, key)
);
create index if not exists docs_user_server_at on public.docs (user_id, server_at);

alter table public.docs enable row level security;
drop policy if exists "own docs" on public.docs;
create policy "own docs" on public.docs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Write many documents; a document is only replaced by a newer edit.
-- Returns the server copy of any document that was newer than the one sent.
create or replace function public.put_docs(docs jsonb)
returns setof public.docs
language plpgsql security invoker as $$
declare d jsonb;
begin
  for d in select * from jsonb_array_elements(docs) loop
    insert into public.docs (user_id, key, data, updated_at)
    values (auth.uid(), d->>'key', d->'data', (d->>'updated_at')::bigint)
    on conflict (user_id, key) do update
      set data = excluded.data, updated_at = excluded.updated_at, server_at = now()
      where public.docs.updated_at < excluded.updated_at;
  end loop;
  return query
    select t.* from public.docs t
    join jsonb_array_elements(docs) x on t.key = x->>'key'
    where t.user_id = auth.uid() and t.updated_at > (x->>'updated_at')::bigint;
end $$;

-- Live updates between laptop and phone.
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

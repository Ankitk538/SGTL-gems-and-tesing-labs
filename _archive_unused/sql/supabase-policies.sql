-- SG&TL recommended Supabase RLS policies
-- Run in Supabase SQL editor after setting SUPABASE_SERVICE_KEY on the Node server.

alter table public.sgtl_database enable row level security;
alter table public.enquiries enable row level security;

drop policy if exists "Public can verify certificates directly" on public.sgtl_database;
drop policy if exists "Authenticated users can read certificates" on public.sgtl_database;
drop policy if exists "Authenticated users can write certificates" on public.sgtl_database;
drop policy if exists "Anyone can submit enquiries" on public.enquiries;
drop policy if exists "Authenticated users can read enquiries" on public.enquiries;
drop policy if exists "Authenticated users can update enquiries" on public.enquiries;

-- Certificate rows should not be broadly readable through the anon key.
-- Public verification is handled by the Node endpoint: GET /verify/:reportNo.
-- The Node server uses the Supabase service-role key after exact report-number matching.

create policy "Anyone can submit enquiries"
on public.enquiries
for insert
to anon
with check (true);

create policy "Authenticated users can read enquiries"
on public.enquiries
for select
to authenticated
using (true);

create policy "Authenticated users can update enquiries"
on public.enquiries
for update
to authenticated
using (true)
with check (true);

-- Optional fallback only if you intentionally want authenticated dashboard users
-- to access certificates directly outside the Node admin API.
create policy "Authenticated users can read certificates"
on public.sgtl_database
for select
to authenticated
using (true);

create policy "Authenticated users can write certificates"
on public.sgtl_database
for all
to authenticated
using (true)
with check (true);

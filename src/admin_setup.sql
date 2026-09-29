-- =========================================
-- 1) Add email column + backfill existing users
-- =========================================
alter table public.profiles add column email text;

update public.profiles pr
set email = au.email
from auth.users au
where pr.id = au.id;

-- Update the signup trigger to also save the email going forward
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, birth_date, gender)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    (new.raw_user_meta_data->>'birth_date')::date,
    new.raw_user_meta_data->>'gender'
  );
  return new;
end;
$$ language plpgsql security definer;


-- =========================================
-- 2) Add is_admin flag
-- =========================================
alter table public.profiles add column is_admin boolean default false;


-- =========================================
-- 3) Helper function (avoids recursive RLS issues)
-- =========================================
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$ language sql security definer stable;


-- =========================================
-- 4) Admin bypass policies
-- =========================================

-- Profiles: admin can view + update everyone
create policy "Admins can view all profiles"
on public.profiles for select
to authenticated
using (public.is_admin());

create policy "Admins can update all profiles"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Workout plans: admin full CRUD
create policy "Admins can view all workout plans"
on public.workout_plans for select
to authenticated
using (public.is_admin());

create policy "Admins can insert workout plans"
on public.workout_plans for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update workout plans"
on public.workout_plans for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete workout plans"
on public.workout_plans for delete
to authenticated
using (public.is_admin());

-- Nutrition plans: admin full CRUD
create policy "Admins can view all nutrition plans"
on public.nutrition_plans for select
to authenticated
using (public.is_admin());

create policy "Admins can insert nutrition plans"
on public.nutrition_plans for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update nutrition plans"
on public.nutrition_plans for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete nutrition plans"
on public.nutrition_plans for delete
to authenticated
using (public.is_admin());

-- Subscription requests: admin can view
create policy "Admins can view all subscription requests"
on public.subscription_requests for select
to authenticated
using (public.is_admin());

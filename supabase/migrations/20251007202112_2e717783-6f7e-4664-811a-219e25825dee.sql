-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create categories table
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null default '#6366f1',
  icon text,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS on categories
alter table public.categories enable row level security;

-- Categories policies
create policy "Users can view own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can create own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Create transactions table
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  amount decimal(12, 2) not null,
  type text not null check (type in ('income', 'expense')),
  description text not null,
  date date not null default current_date,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS on transactions
alter table public.transactions enable row level security;

-- Transactions policies
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can create own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Create goals table
create table public.goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  target_amount decimal(12, 2) not null,
  current_amount decimal(12, 2) default 0 not null,
  deadline date,
  completed boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS on goals
alter table public.goals enable row level security;

-- Goals policies
create policy "Users can view own goals"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Users can create own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on public.goals for update
  using (auth.uid() = user_id);

create policy "Users can delete own goals"
  on public.goals for delete
  using (auth.uid() = user_id);

-- Create reminders table
create table public.reminders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  amount decimal(12, 2),
  due_date date not null,
  completed boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS on reminders
alter table public.reminders enable row level security;

-- Reminders policies
create policy "Users can view own reminders"
  on public.reminders for select
  using (auth.uid() = user_id);

create policy "Users can create own reminders"
  on public.reminders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reminders"
  on public.reminders for update
  using (auth.uid() = user_id);

create policy "Users can delete own reminders"
  on public.reminders for delete
  using (auth.uid() = user_id);

-- Create chat_messages table
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS on chat_messages
alter table public.chat_messages enable row level security;

-- Chat messages policies
create policy "Users can view own messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can create own messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

-- Create function to handle profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  
  -- Create default categories for new users
  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Salário', 'income', '#10b981', 'DollarSign'),
    (new.id, 'Freelance', 'income', '#3b82f6', 'Briefcase'),
    (new.id, 'Investimentos', 'income', '#8b5cf6', 'TrendingUp'),
    (new.id, 'Alimentação', 'expense', '#ef4444', 'UtensilsCrossed'),
    (new.id, 'Transporte', 'expense', '#f59e0b', 'Car'),
    (new.id, 'Moradia', 'expense', '#06b6d4', 'Home'),
    (new.id, 'Lazer', 'expense', '#ec4899', 'Gamepad'),
    (new.id, 'Saúde', 'expense', '#14b8a6', 'Heart'),
    (new.id, 'Educação', 'expense', '#6366f1', 'GraduationCap');
  
  return new;
end;
$$;

-- Create trigger for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create triggers for updated_at
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_transactions_updated_at before update on public.transactions
  for each row execute function public.update_updated_at_column();

create trigger update_goals_updated_at before update on public.goals
  for each row execute function public.update_updated_at_column();

create trigger update_reminders_updated_at before update on public.reminders
  for each row execute function public.update_updated_at_column();
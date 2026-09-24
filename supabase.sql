-- قاعدة بيانات النسخة السحابية
-- نفّذ هذا الملف داخل Supabase SQL Editor.
create extension if not exists "pgcrypto";

create table if not exists public.manga (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  english text,
  japanese text,
  status text,
  author text,
  artist text,
  genres text[] default '{}',
  description text,
  cover_url text,
  created_at timestamptz default now()
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  manga_id uuid not null references public.manga(id) on delete cascade,
  number integer not null,
  title text not null,
  published_at date,
  created_at timestamptz default now(),
  unique(manga_id, number)
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  page_number integer not null,
  storage_path text not null,
  created_at timestamptz default now(),
  unique(chapter_id, page_number)
);

alter table public.manga enable row level security;
alter table public.chapters enable row level security;
alter table public.pages enable row level security;

-- القراءة العامة
create policy "public read manga" on public.manga for select using (true);
create policy "public read chapters" on public.chapters for select using (true);
create policy "public read pages" on public.pages for select using (true);

-- الإدارة للمستخدمين المسجلين فقط
create policy "auth manage manga" on public.manga for all to authenticated using (true) with check (true);
create policy "auth manage chapters" on public.chapters for all to authenticated using (true) with check (true);
create policy "auth manage pages" on public.pages for all to authenticated using (true) with check (true);

-- أنشئ Bucket باسم manga-pages من Storage.
-- اجعله Public لقراءة الصور.
-- سيقوم admin.js برفع الملفات إليه.

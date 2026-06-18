alter table public.message_attachments
  add column if not exists extracted_text text,
  add column if not exists extraction_status text
    check (extraction_status in ('readable', 'empty', 'failed')),
  add column if not exists extraction_truncated boolean default false;

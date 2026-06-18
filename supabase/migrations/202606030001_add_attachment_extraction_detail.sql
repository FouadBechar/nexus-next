alter table public.message_attachments
  add column if not exists extraction_detail text;

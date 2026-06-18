alter table public.message_attachments
  add column if not exists extraction_error text
    check (extraction_error in ('parser_failed', 'encrypted_or_protected'));

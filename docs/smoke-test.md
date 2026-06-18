# Smoke Test

Run this checklist before promoting a deployment.

## Chat Access

- With `NEXUS_REQUIRE_AUTH_FOR_CHAT=true`, confirm signed-out chat shows the sign-in error and does not add a transcript message.
- Confirm signed-in chat sends a prompt and receives a streamed assistant response.
- Temporarily set a low guest or signed-in rate limit and confirm `/api/chat` returns `429`.

## Persistence

- Create a signed-in chat, reload the app, and confirm the same messages load.
- Regenerate the latest response and confirm the old assistant tail is replaced, not duplicated.
- Rename and delete a chat, then reload and confirm Supabase reflects the change.

## Attachments

- Upload an image with an image-capable model and confirm the assistant can inspect it.
- Upload a PDF and confirm the attachment badge shows whether text was readable, empty, failed, or truncated.
- Reload the chat and confirm attachment metadata and PDF extraction status still appear.

## Exports

- Export Markdown and JSON.
- Confirm exported attachments include filename, MIME type, size, and extraction status.
- Confirm exported attachments do not include Supabase signed URLs.

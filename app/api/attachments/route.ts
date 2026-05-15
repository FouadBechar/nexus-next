import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase/server";

const ATTACHMENTS_BUCKET = "chat-attachments";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
]);

function safeFileName(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "") || "attachment"
  );
}

async function getCurrentUserId() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const formData = await req.formData();
    const chatId = formData.get("chatId");
    const content = formData.get("content");
    const messageId = formData.get("messageId");
    const file = formData.get("file");

    if (
      typeof chatId !== "string" ||
      typeof content !== "string" ||
      typeof messageId !== "string"
    ) {
      return new Response("chatId, content, and messageId are required.", {
        status: 400,
      });
    }

    if (!(file instanceof File)) {
      return new Response("A file is required.", { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return new Response("This file type is not supported.", { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response("File size must be 10 MB or less.", { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", userId)
      .single();

    if (chatError) throw chatError;

    if (!chat) {
      return new Response("Chat not found.", { status: 404 });
    }

    const { error: messageError } = await supabase.from("messages").upsert(
      {
        id: messageId,
        chat_id: chatId,
        user_id: userId,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

    if (messageError) throw messageError;

    const attachmentId = crypto.randomUUID();
    const storagePath = `${userId}/${chatId}/${attachmentId}-${safeFileName(
      file.name
    )}`;

    const { error: uploadError } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase
      .from("message_attachments")
      .insert({
        id: attachmentId,
        user_id: userId,
        chat_id: chatId,
        message_id: messageId,
        bucket: ATTACHMENTS_BUCKET,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
      });

    if (insertError) throw insertError;

    const { data } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .createSignedUrl(storagePath, 60 * 60);

    return Response.json({
      attachment: {
        id: attachmentId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        url: data?.signedUrl ?? "",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    const status = message === "Unauthorized" ? 401 : 500;

    return new Response(message, { status });
  }
}

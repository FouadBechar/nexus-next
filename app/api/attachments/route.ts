import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import {
  AuthError,
  StorageError,
  ValidationError,
  toErrorResponse,
} from "../../../lib/errors/api-error";
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  ATTACHMENTS_BUCKET,
  MAX_ATTACHMENT_FILE_SIZE,
  runAttachmentPipeline,
} from "../../../lib/attachments/pipeline";
import { getSupabaseAdmin } from "../../../lib/supabase/server";

export const runtime = "nodejs";

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
    throw new AuthError("Unauthorized");
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
      throw new ValidationError("chatId, content, and messageId are required.");
    }

    if (!(file instanceof File)) {
      throw new ValidationError("A file is required.");
    }

    if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.type)) {
      throw new ValidationError("This file type is not supported.");
    }

    if (file.size > MAX_ATTACHMENT_FILE_SIZE) {
      throw new ValidationError("File size must be 10 MB or less.");
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
      throw new ValidationError("Chat not found.", {
        status: 404,
      });
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

    const pipelineResult = await runAttachmentPipeline(file);

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

    if (uploadError) {
      throw new StorageError("Attachment upload failed.", {
        cause: uploadError,
      });
    }

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
        extracted_text: pipelineResult.extractedText || null,
        extraction_detail: pipelineResult.extractionDetail ?? null,
        extraction_error: pipelineResult.extractionError ?? null,
        extraction_status: pipelineResult.extractionStatus ?? null,
        extraction_truncated: pipelineResult.extractionTruncated,
      });

    if (insertError) {
      throw new StorageError("Attachment metadata could not be saved.", {
        cause: insertError,
      });
    }

    const { data } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .createSignedUrl(storagePath, 60 * 60);

    return Response.json({
      attachment: {
        id: attachmentId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        extractedText: pipelineResult.extractedText,
        extractionDetail: pipelineResult.extractionDetail,
        extractionError: pipelineResult.extractionError,
        extractionStatus: pipelineResult.extractionStatus,
        extractionTruncated: pipelineResult.extractionTruncated,
        pipelineStatus: pipelineResult.pipelineStatus,
        url: data?.signedUrl ?? "",
      },
    });
  } catch (error) {
    return toErrorResponse(error, {
      fallbackMessage: "Upload failed.",
      logMessage: "Attachment upload failed.",
    });
  }
}

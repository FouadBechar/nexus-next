import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import {
  AuthError,
  StorageError,
  ValidationError,
  toErrorResponse,
} from "../../../lib/errors/api-error";
import { logger } from "../../../lib/logger";
import { PdfExtractionError, extractPdfText } from "../../../lib/pdf/extract";
import { getSupabaseAdmin } from "../../../lib/supabase/server";

export const runtime = "nodejs";

const ATTACHMENTS_BUCKET = "chat-attachments";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_CHARS = 60_000;
const TEXT_MIME_TYPES = new Set(["text/plain", "text/markdown"]);
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

function isTextFile(file: File) {
  const lowerName = file.name.toLowerCase();

  return (
    TEXT_MIME_TYPES.has(file.type) ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".markdown")
  );
}

async function extractTextFile(file: File) {
  const text = (await file.text()).trim();

  if (!text) {
    return {
      extractedText: "",
      truncated: false,
    };
  }

  return {
    extractedText:
      text.length > MAX_EXTRACTED_TEXT_CHARS
        ? text.slice(0, MAX_EXTRACTED_TEXT_CHARS)
        : text,
    truncated: text.length > MAX_EXTRACTED_TEXT_CHARS,
  };
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

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new ValidationError("This file type is not supported.");
    }

    if (file.size > MAX_FILE_SIZE) {
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

    let extractedText = "";
    let extractionTruncated = false;
    let extractionStatus: "readable" | "empty" | "failed" | undefined;
    let extractionError:
      | "parser_failed"
      | "encrypted_or_protected"
      | undefined;
    let extractionDetail: string | undefined;

    if (isTextFile(file)) {
      const extraction = await extractTextFile(file);
      extractedText = extraction.extractedText;
      extractionTruncated = extraction.truncated;
      extractionStatus = extractedText.trim() ? "readable" : "empty";
    } else if (file.type === "application/pdf") {
      try {
        const extraction = await extractPdfText(file);
        extractedText = extraction.extractedText;
        extractionTruncated = extraction.truncated;
        extractionStatus = extractedText.trim() ? "readable" : "empty";
      } catch (error) {
        logger.warn("PDF extraction failed.", {
          error,
          fileName: file.name,
        });
        extractionStatus = "failed";
        extractionError = getPdfExtractionError(error);
        extractionDetail = getPdfExtractionDetail(error);
      }
    }

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
        extracted_text: extractedText || null,
        extraction_detail: extractionDetail ?? null,
        extraction_error: extractionError ?? null,
        extraction_status: extractionStatus ?? null,
        extraction_truncated: extractionTruncated,
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
        extractedText,
        extractionDetail,
        extractionError,
        extractionStatus,
        extractionTruncated,
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

function getPdfExtractionError(error: unknown) {
  if (
    error instanceof PdfExtractionError &&
    error.detail === "password_required"
  ) {
    return "encrypted_or_protected" as const;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (
    message.includes("password") ||
    message.includes("encrypted") ||
    message.includes("protected")
  ) {
    return "encrypted_or_protected" as const;
  }

  return "parser_failed" as const;
}

function getPdfExtractionDetail(error: unknown) {
  if (error instanceof PdfExtractionError) {
    return error.diagnostic ?? error.detail;
  }

  if (error instanceof Error) {
    return `unknown_error: ${error.name}: ${error.message}`
      .replace(/\s+/g, " ")
      .slice(0, 240);
  }

  return "unknown_error";
}

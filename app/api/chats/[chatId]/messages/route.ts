import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import {
  AuthError,
  ValidationError,
  toErrorResponse,
} from "../../../../../lib/errors/api-error";
import { getSupabaseAdmin } from "../../../../../lib/supabase/server";
import type { Message } from "../../../../types/message";

type RouteContext = {
  params: Promise<{
    chatId: string;
  }>;
};

async function getCurrentUserId() {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthError("Unauthorized");
  }

  return userId;
}

function isMessageId(value: unknown) {
  return (
    value === undefined ||
    (typeof value === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value
      ))
  );
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;

  const message = value as Partial<Message>;

  return (
    isMessageId(message.id) &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string"
  );
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    const { chatId } = await params;
    const { messages, title } = await req.json();

    if (!Array.isArray(messages) || !messages.every(isMessage)) {
      throw new ValidationError("Messages must be a valid message array.");
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

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

    const normalizedMessages = messages.map((message: Message) => ({
      ...message,
      id: message.id || crypto.randomUUID(),
    }));

    if (normalizedMessages.length > 0) {
      const { error: upsertError } = await supabase.from("messages").upsert(
        normalizedMessages.map((message) => ({
          id: message.id,
          chat_id: chatId,
          user_id: userId,
          role: message.role,
          content: message.content,
          created_at: message.createdAt ?? now,
        })),
        {
          onConflict: "id",
        }
      );

      if (upsertError) throw upsertError;
    }

    const retainedMessageIds = normalizedMessages.map((message) => message.id);
    let staleMessageQuery = supabase
      .from("messages")
      .select("id")
      .eq("chat_id", chatId)
      .eq("user_id", userId);

    if (retainedMessageIds.length > 0) {
      staleMessageQuery = staleMessageQuery.not(
        "id",
        "in",
        `(${retainedMessageIds.join(",")})`
      );
    }

    const { data: staleMessages, error: staleMessagesError } =
      await staleMessageQuery;

    if (staleMessagesError) throw staleMessagesError;

    const staleMessageIds = (staleMessages ?? []).map((message) => message.id);

    if (staleMessageIds.length > 0) {
      const { error: attachmentError } = await supabase
        .from("message_attachments")
        .update({
          message_id: null,
        })
        .eq("chat_id", chatId)
        .eq("user_id", userId)
        .in("message_id", staleMessageIds);

      if (attachmentError) throw attachmentError;

      const { error: deleteError } = await supabase
        .from("messages")
        .delete()
        .eq("chat_id", chatId)
        .eq("user_id", userId)
        .in("id", staleMessageIds);

      if (deleteError) throw deleteError;
    }

    const { error: updateError } = await supabase
      .from("chats")
      .update({
        ...(title ? { title } : {}),
        updated_at: now,
      })
      .eq("id", chatId)
      .eq("user_id", userId);

    if (updateError) throw updateError;

    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, {
      fallbackMessage: "Failed to save messages.",
      logMessage: "Failed to save messages.",
    });
  }
}

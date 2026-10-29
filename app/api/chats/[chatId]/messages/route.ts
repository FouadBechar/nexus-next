import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import {
  AuthError,
  ValidationError,
  toErrorResponse,
} from "../../../../../lib/errors/api-error";
import { getSupabaseAdmin } from "../../../../../lib/supabase/server";
import { messagesSaveSchema } from "../../../../../lib/validation/chat";

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

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    const { chatId } = await params;
    const parsed = messagesSaveSchema.safeParse(await req.json());

    if (!parsed.success) {
      throw new ValidationError(
        "Messages must contain at most 80 valid messages with supported fields."
      );
    }

    const { messages, title } = parsed.data;

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

    const normalizedMessages = messages.map((message) => ({
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

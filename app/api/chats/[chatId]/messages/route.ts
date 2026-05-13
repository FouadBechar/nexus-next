import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
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
    throw new Error("Unauthorized");
  }

  return userId;
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;

  const message = value as Partial<Message>;

  return (
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
      return new Response("Messages must be a valid message array.", {
        status: 400,
      });
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
      return new Response("Chat not found.", { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("messages")
      .delete()
      .eq("chat_id", chatId)
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    if (messages.length > 0) {
      const { error: insertError } = await supabase.from("messages").insert(
        messages.map((message: Message) => ({
          chat_id: chatId,
          user_id: userId,
          role: message.role,
          content: message.content,
          created_at: message.createdAt ?? now,
        }))
      );

      if (insertError) throw insertError;
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
    const message = error instanceof Error ? error.message : "Failed to save messages.";
    const status = message === "Unauthorized" ? 401 : 500;

    return new Response(message, { status });
  }
}

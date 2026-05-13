import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase/server";
import type { Chat } from "../../types/chat";
import type { Message } from "../../types/message";

type DbChat = {
  id: string;
  title: string;
  created_at: string | null;
  updated_at: string | null;
};

type DbMessage = {
  chat_id: string;
  role: Message["role"] | "system";
  content: string;
  created_at: string | null;
};

async function getCurrentUserId() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

function toMessage(message: DbMessage): Message {
  return {
    role: message.role === "system" ? "assistant" : message.role,
    content: message.content,
    createdAt: message.created_at ?? undefined,
  };
}

function toChats(chats: DbChat[], messages: DbMessage[]): Chat[] {
  return chats.map((chat) => ({
    id: chat.id,
    title: chat.title,
    messages: messages
      .filter((message) => message.chat_id === chat.id)
      .map(toMessage),
  }));
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const supabase = getSupabaseAdmin();

    const { data: chats, error: chatsError } = await supabase
      .from("chats")
      .select("id,title,created_at,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (chatsError) throw chatsError;

    const chatIds = (chats ?? []).map((chat) => chat.id);

    if (chatIds.length === 0) {
      return Response.json({ chats: [] });
    }

    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("chat_id,role,content,created_at")
      .eq("user_id", userId)
      .in("chat_id", chatIds)
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    return Response.json({
      chats: toChats(chats ?? [], messages ?? []),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load chats.";
    const status = message === "Unauthorized" ? 401 : 500;

    return new Response(message, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const { id, title } = await req.json();
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("chats")
      .insert({
        ...(id ? { id } : {}),
        user_id: userId,
        title: title?.trim() || "New Chat",
        created_at: now,
        updated_at: now,
      })
      .select("id,title")
      .single();

    if (error) throw error;

    return Response.json({
      chat: {
        id: data.id,
        title: data.title,
        messages: [],
      } satisfies Chat,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create chat.";
    const status = message === "Unauthorized" ? 401 : 500;

    return new Response(message, { status });
  }
}

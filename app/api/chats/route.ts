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
  id: string;
  chat_id: string;
  role: Message["role"] | "system";
  content: string;
  created_at: string | null;
};

type DbAttachment = {
  id: string;
  message_id: string | null;
  file_name: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
};

async function getCurrentUserId() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

async function toMessage(
  message: DbMessage,
  attachments: DbAttachment[]
): Promise<Message> {
  const supabase = getSupabaseAdmin();
  const messageAttachments = attachments.filter(
    (attachment) => attachment.message_id === message.id
  );

  return {
    id: message.id,
    role: message.role === "system" ? "assistant" : message.role,
    content: message.content,
    createdAt: message.created_at ?? undefined,
    attachments: await Promise.all(
      messageAttachments.map(async (attachment) => {
        const { data } = await supabase.storage
          .from("chat-attachments")
          .createSignedUrl(attachment.storage_path, 60 * 60);

        return {
          id: attachment.id,
          fileName: attachment.file_name,
          mimeType: attachment.mime_type,
          fileSize: attachment.file_size,
          url: data?.signedUrl ?? "",
        };
      })
    ),
  };
}

async function toChats(
  chats: DbChat[],
  messages: DbMessage[],
  attachments: DbAttachment[]
): Promise<Chat[]> {
  return Promise.all(
    chats.map(async (chat) => ({
      id: chat.id,
      title: chat.title,
      messages: await Promise.all(
        messages
          .filter((message) => message.chat_id === chat.id)
          .map((message) => toMessage(message, attachments))
      ),
    }))
  );
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
      .select("id,chat_id,role,content,created_at")
      .eq("user_id", userId)
      .in("chat_id", chatIds)
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    const { data: attachments, error: attachmentsError } = await supabase
      .from("message_attachments")
      .select("id,message_id,file_name,mime_type,file_size,storage_path")
      .eq("user_id", userId)
      .in("chat_id", chatIds);

    if (attachmentsError) throw attachmentsError;

    return Response.json({
      chats: await toChats(chats ?? [], messages ?? [], attachments ?? []),
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

import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabase/server";

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

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    const { chatId } = await params;
    const { title } = await req.json();

    const trimmedTitle = title?.trim();

    if (!trimmedTitle) {
      return new Response("Title is required.", { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from("chats")
      .update({
        title: trimmedTitle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chatId)
      .eq("user_id", userId);

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update chat.";
    const status = message === "Unauthorized" ? 401 : 500;

    return new Response(message, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    const { chatId } = await params;

    const { error } = await getSupabaseAdmin()
      .from("chats")
      .delete()
      .eq("id", chatId)
      .eq("user_id", userId);

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete chat.";
    const status = message === "Unauthorized" ? 401 : 500;

    return new Response(message, { status });
  }
}

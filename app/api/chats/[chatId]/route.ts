import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import {
  AuthError,
  ValidationError,
  toErrorResponse,
} from "../../../../lib/errors/api-error";
import { getSupabaseAdmin } from "../../../../lib/supabase/server";

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

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    const { chatId } = await params;
    const { title } = await req.json();

    const trimmedTitle = title?.trim();

    if (!trimmedTitle) {
      throw new ValidationError("Title is required.");
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
    return toErrorResponse(error, {
      fallbackMessage: "Failed to update chat.",
      logMessage: "Failed to update chat.",
    });
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
    return toErrorResponse(error, {
      fallbackMessage: "Failed to delete chat.",
      logMessage: "Failed to delete chat.",
    });
  }
}

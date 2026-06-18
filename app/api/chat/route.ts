import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import { DEFAULT_MODEL_ID, getModelById } from "../../../lib/ai/models";
import { streamAiChat } from "../../../lib/ai/provider";
import {
  checkRateLimit,
  rateLimitHeaders,
} from "../../../lib/security/rate-limit";
import {
  DEFAULT_RESPONSE_LENGTH,
  getMaxTokensForResponseLength,
  isResponseLength,
} from "../../types/settings";

const CHAT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const SIGNED_IN_CHAT_LIMIT = 30;
const GUEST_CHAT_LIMIT = 5;
const MAX_MESSAGES_PER_REQUEST = 80;
const MAX_MESSAGE_CHARS = 100_000;
const MAX_SYSTEM_PROMPT_CHARS = 8_000;

const attachmentSchema = z.object({
  fileName: z.string().max(255).optional(),
  mimeType: z.string().min(1).max(120),
  url: z.string().url(),
});

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(MAX_MESSAGE_CHARS),
  attachments: z.array(attachmentSchema).max(10).optional(),
});

const chatRequestSchema = z
  .object({
    messages: z.array(messageSchema).min(1).max(MAX_MESSAGES_PER_REQUEST),
    model: z.string().min(1).optional(),
    responseLength: z.unknown().optional(),
    systemPrompt: z.string().max(MAX_SYSTEM_PROMPT_CHARS).optional(),
    temperature: z.number().min(0).max(2).optional(),
  })
  .refine(
    (value) =>
      value.messages.reduce(
        (total, message) => total + message.content.length,
        0
      ) <= MAX_MESSAGE_CHARS * 2,
    {
      message: "The submitted conversation is too large.",
      path: ["messages"],
    }
  );

async function readJson(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    throw new Response("Request body must be valid JSON.", {
      status: 400,
    });
  }
}

function getBooleanEnv(name: string) {
  return process.env[name]?.toLowerCase() === "true";
}

function getIntegerEnv(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function getServerErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Internal Server Error";
  }

  const message = error.message.trim();

  return (
    message ||
    "The chat provider failed to respond. Try Response Length: Short or switch models."
  );
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const requireAuth = getBooleanEnv("NEXUS_REQUIRE_AUTH_FOR_CHAT");

    if (requireAuth && !userId) {
      return new Response("Authentication is required to use chat.", {
        status: 401,
      });
    }

    const rateLimit = checkRateLimit({
      identifier: userId ? `user:${userId}` : `guest:${getClientIp(req)}`,
      limit: userId
        ? getIntegerEnv("NEXUS_SIGNED_IN_CHAT_LIMIT", SIGNED_IN_CHAT_LIMIT)
        : getIntegerEnv("NEXUS_GUEST_CHAT_LIMIT", GUEST_CHAT_LIMIT),
      windowMs: getIntegerEnv(
        "NEXUS_CHAT_RATE_LIMIT_WINDOW_MS",
        CHAT_RATE_LIMIT_WINDOW_MS
      ),
    });

    if (!rateLimit.allowed) {
      return new Response("Too many chat requests. Please try again shortly.", {
        headers: rateLimitHeaders(rateLimit),
        status: 429,
      });
    }

    const parsed = chatRequestSchema.safeParse(await readJson(req));

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid chat request.",
          issues: parsed.error.flatten().fieldErrors,
        },
        {
          status: 400,
        }
      );
    }

    const { messages, model, responseLength, systemPrompt, temperature } =
      parsed.data;
    const selectedModel = model || DEFAULT_MODEL_ID;

    if (!getModelById(selectedModel)) {
      return new Response("The selected model is not available.", {
        status: 400,
      });
    }

    const safeResponseLength = isResponseLength(responseLength)
      ? responseLength
      : DEFAULT_RESPONSE_LENGTH;

    return streamAiChat({
      maxTokens: getMaxTokensForResponseLength(safeResponseLength),
      messages,
      model: selectedModel,
      systemPrompt,
      temperature,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error(error);

    return new Response(getServerErrorMessage(error), {
      status: 500,
    });
  }
}

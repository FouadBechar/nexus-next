import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import { DEFAULT_MODEL_ID, getModelById } from "../../../lib/ai/models";
import { streamAiChat } from "../../../lib/ai/provider";
import {
  AuthError,
  RateLimitError,
  ValidationError,
  toErrorResponse,
} from "../../../lib/errors/api-error";
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
    throw new ValidationError("Request body must be valid JSON.");
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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const requireAuth = getBooleanEnv("NEXUS_REQUIRE_AUTH_FOR_CHAT");

    if (requireAuth && !userId) {
      throw new AuthError("Authentication is required to use chat.");
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
      throw new RateLimitError("Too many chat requests. Please try again shortly.", {
        headers: rateLimitHeaders(rateLimit),
      });
    }

    const parsed = chatRequestSchema.safeParse(await readJson(req));

    if (!parsed.success) {
      throw new ValidationError("Invalid chat request.", {
        details: {
          issues: parsed.error.flatten().fieldErrors,
        },
      });
    }

    const { messages, model, responseLength, systemPrompt, temperature } =
      parsed.data;
    const selectedModel = model || DEFAULT_MODEL_ID;

    if (!getModelById(selectedModel)) {
      throw new ValidationError("The selected model is not available.");
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
    return toErrorResponse(error, {
      fallbackMessage:
        error instanceof Error && error.message.trim()
          ? error.message
          : "The chat provider failed to respond. Try Response Length: Short or switch models.",
      logMessage: "Chat request failed.",
    });
  }
}

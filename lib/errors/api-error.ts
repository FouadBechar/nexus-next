import { logger } from "../logger";

type ErrorDetails = Record<string, unknown>;

type ApiErrorOptions = {
  cause?: unknown;
  code?: string;
  details?: ErrorDetails;
  expose?: boolean;
  headers?: HeadersInit;
  status: number;
};

export class ApiError extends Error {
  code: string;
  details?: ErrorDetails;
  expose: boolean;
  headers?: HeadersInit;
  status: number;

  constructor(message: string, options: ApiErrorOptions) {
    super(message, {
      cause: options.cause,
    });
    this.name = "ApiError";
    this.code = options.code ?? "api_error";
    this.details = options.details;
    this.expose = options.expose ?? options.status < 500;
    this.headers = options.headers;
    this.status = options.status;
  }
}

export class AuthError extends ApiError {
  constructor(message = "Authentication is required.", options: Partial<ApiErrorOptions> = {}) {
    super(message, {
      ...options,
      code: options.code ?? "auth_error",
      status: options.status ?? 401,
    });
    this.name = "AuthError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, options: Partial<ApiErrorOptions> = {}) {
    super(message, {
      ...options,
      code: options.code ?? "validation_error",
      status: options.status ?? 400,
    });
    this.name = "ValidationError";
  }
}

export class ProviderError extends ApiError {
  constructor(message: string, options: Partial<ApiErrorOptions> = {}) {
    super(message, {
      ...options,
      code: options.code ?? "provider_error",
      status: options.status ?? 502,
    });
    this.name = "ProviderError";
  }
}

export class StorageError extends ApiError {
  constructor(message: string, options: Partial<ApiErrorOptions> = {}) {
    super(message, {
      ...options,
      code: options.code ?? "storage_error",
      status: options.status ?? 500,
    });
    this.name = "StorageError";
  }
}

export class ExtractionError extends ApiError {
  constructor(message: string, options: Partial<ApiErrorOptions> = {}) {
    super(message, {
      ...options,
      code: options.code ?? "extraction_error",
      status: options.status ?? 422,
    });
    this.name = "ExtractionError";
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string, options: Partial<ApiErrorOptions> = {}) {
    super(message, {
      ...options,
      code: options.code ?? "rate_limit_error",
      status: options.status ?? 429,
    });
    this.name = "RateLimitError";
  }
}

type ErrorResponseOptions = {
  fallbackMessage?: string;
  logMessage?: string;
};

export function toErrorResponse(
  error: unknown,
  options: ErrorResponseOptions = {}
) {
  if (error instanceof Response) {
    return error;
  }

  if (error instanceof ApiError) {
    const message = error.expose
      ? error.message
      : options.fallbackMessage ?? "Internal Server Error";

    if (error.status >= 500) {
      logger.error(options.logMessage ?? error.message, {
        cause: error.cause,
        code: error.code,
        error,
      });
    } else {
      logger.warn(options.logMessage ?? error.message, {
        code: error.code,
      });
    }

    if (error.details) {
      return Response.json(
        {
          error: message,
          code: error.code,
          ...error.details,
        },
        {
          headers: error.headers,
          status: error.status,
        }
      );
    }

    return new Response(message, {
      headers: error.headers,
      status: error.status,
    });
  }

  logger.error(options.logMessage ?? "Unhandled API error.", {
    error,
  });

  return new Response(options.fallbackMessage ?? "Internal Server Error", {
    status: 500,
  });
}

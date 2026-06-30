type LogContext = Record<string, unknown>;

function writeLog(
  level: "info" | "warn" | "error",
  message: string,
  context?: LogContext
) {
  const payload = context ? [message, context] : [message];

  if (level === "error") {
    console.error(...payload);
    return;
  }

  if (level === "warn") {
    console.warn(...payload);
    return;
  }

  console.info(...payload);
}

export const logger = {
  info(message: string, context?: LogContext) {
    writeLog("info", message, context);
  },

  warn(message: string, context?: LogContext) {
    writeLog("warn", message, context);
  },

  error(message: string, context?: LogContext) {
    writeLog("error", message, context);
  },
};

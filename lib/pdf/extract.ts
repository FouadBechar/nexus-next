import "server-only";
import path from "node:path";
import { createRequire } from "node:module";

const MAX_EXTRACTED_TEXT_CHARS = 60_000;
let canvasPolyfillsLoaded = false;

export type PdfExtractionDetail =
  | "password_required"
  | "invalid_pdf"
  | "format_error"
  | "worker_error"
  | "font_error"
  | "canvas_error"
  | "unknown_error";

export class PdfExtractionError extends Error {
  constructor(
    message: string,
    public detail: PdfExtractionDetail,
    public cause?: unknown,
    public diagnostic?: string
  ) {
    super(message);
    this.name = "PdfExtractionError";
  }
}

export async function extractPdfText(file: File) {
  ensurePdfCanvasPolyfills();

  const { PDFParse } = await import("pdf-parse");
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    return await parsePdfText(PDFParse, bytes, {
      disableFontFace: true,
      isEvalSupported: false,
      maxImageSize: 0,
      stopAtErrors: false,
      useSystemFonts: false,
      useWasm: false,
      useWorkerFetch: false,
    });
  } catch (primaryError) {
    try {
      return await parsePdfText(PDFParse, bytes, {
        disableFontFace: false,
        isEvalSupported: false,
        maxImageSize: 0,
        stopAtErrors: false,
        useSystemFonts: true,
        useWasm: false,
        useWorkerFetch: false,
      });
    } catch (fallbackError) {
      const detail = classifyPdfExtractionError(fallbackError);
      const diagnostic = buildPdfExtractionDiagnostic(
        detail,
        primaryError,
        fallbackError
      );

      throw new PdfExtractionError(
        `PDF text extraction failed after fallback parser attempt: ${diagnostic}.`,
        detail,
        fallbackError || primaryError,
        diagnostic
      );
    }
  }
}

function ensurePdfCanvasPolyfills() {
  const globals = globalThis as typeof globalThis & {
    DOMMatrix?: unknown;
    ImageData?: unknown;
    Path2D?: unknown;
  };

  if (
    canvasPolyfillsLoaded ||
    (globals.DOMMatrix && globals.ImageData && globals.Path2D)
  ) {
    canvasPolyfillsLoaded = true;
    return;
  }

  try {
    const nodeRequire = createRequire(import.meta.url);
    const pdfParseEntry = nodeRequire.resolve("pdf-parse");
    const workerEntry = path.resolve(
      path.dirname(pdfParseEntry),
      "../../worker/cjs/index.cjs"
    );

    Reflect.apply(nodeRequire, undefined, [workerEntry]);
    canvasPolyfillsLoaded = true;
  } catch (error) {
    const diagnostic = [
      "canvas_error",
      summarizePdfError(error) || "PDF canvas polyfill could not be loaded",
    ].join(": ");

    throw new PdfExtractionError(
      `PDF canvas polyfill could not be loaded: ${diagnostic}.`,
      "canvas_error",
      error,
      diagnostic.slice(0, 240)
    );
  }
}

async function parsePdfText(
  PDFParse: typeof import("pdf-parse").PDFParse,
  bytes: Uint8Array,
  options: Record<string, unknown>
) {
  const parser = new PDFParse({
    ...options,
    data: new Uint8Array(bytes),
  });

  try {
    const result = await parser.getText({
      lineEnforce: true,
      pageJoiner: "\n\n",
    });
    const text = result.text.trim();

    if (!text) {
      return {
        extractedText: "",
        truncated: false,
      };
    }

    return {
      extractedText:
        text.length > MAX_EXTRACTED_TEXT_CHARS
          ? text.slice(0, MAX_EXTRACTED_TEXT_CHARS)
          : text,
      truncated: text.length > MAX_EXTRACTED_TEXT_CHARS,
    };
  } finally {
    await parser.destroy();
  }
}

function classifyPdfExtractionError(error: unknown): PdfExtractionDetail {
  const name = error instanceof Error ? error.name.toLowerCase() : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  const detail = `${name} ${message}`;

  if (name.includes("passwordexception")) {
    return "password_required";
  }

  if (name.includes("invalidpdfexception")) {
    return "invalid_pdf";
  }

  if (name.includes("formaterror")) {
    return "format_error";
  }

  if (detail.includes("password") || detail.includes("encrypted") || detail.includes("protected")) {
    return "password_required";
  }

  if (detail.includes("invalidpdf") || detail.includes("invalid pdf")) {
    return "invalid_pdf";
  }

  if (detail.includes("formaterror") || detail.includes("format error")) {
    return "format_error";
  }

  if (detail.includes("worker")) {
    return "worker_error";
  }

  if (detail.includes("font") || detail.includes("cmap")) {
    return "font_error";
  }

  if (
    detail.includes("canvas") ||
    detail.includes("dommatrix") ||
    detail.includes("image")
  ) {
    return "canvas_error";
  }

  return "unknown_error";
}

function buildPdfExtractionDiagnostic(
  detail: PdfExtractionDetail,
  primaryError: unknown,
  fallbackError: unknown
) {
  const fallbackSummary = summarizePdfError(fallbackError);
  const primarySummary = summarizePdfError(primaryError);
  const summaries =
    primarySummary && primarySummary !== fallbackSummary
      ? [fallbackSummary, `primary: ${primarySummary}`]
      : [fallbackSummary];
  const diagnostic = [detail, ...summaries.filter(Boolean)].join(": ");

  return diagnostic.slice(0, 240);
}

function summarizePdfError(error: unknown) {
  if (!(error instanceof Error)) {
    return "";
  }

  const name = error.name || "Error";
  const message = error.message
    .replace(/\s+/g, " ")
    .replace(/[^\w .,:;()[\]#/-]/g, "")
    .trim();

  return message ? `${name}: ${message}` : name;
}

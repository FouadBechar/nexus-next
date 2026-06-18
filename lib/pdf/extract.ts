import "server-only";

const MAX_EXTRACTED_TEXT_CHARS = 60_000;

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
    public cause?: unknown
  ) {
    super(message);
    this.name = "PdfExtractionError";
  }
}

export async function extractPdfText(file: File) {
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

      throw new PdfExtractionError(
        `PDF text extraction failed after fallback parser attempt: ${detail}.`,
        detail,
        fallbackError || primaryError
      );
    }
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

  if (
    detail.includes("password") ||
    detail.includes("encrypted") ||
    detail.includes("protected")
  ) {
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

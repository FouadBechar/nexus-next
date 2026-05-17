import "server-only";

const MAX_EXTRACTED_TEXT_CHARS = 60_000;

export async function extractPdfText(file: File) {
  const { PDFParse } = await import("pdf-parse");
  const buffer = Buffer.from(await file.arrayBuffer());
  const parser = new PDFParse({
    data: buffer,
    disableFontFace: true,
    isEvalSupported: false,
  });

  try {
    const result = await parser.getText();
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

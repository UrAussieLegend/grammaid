import mammoth from "mammoth";

export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".markdown", ".rtf", ".docx", ".html", ".htm"];

export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value.trim();
  }

  const raw = buffer.toString("utf8");

  if (name.endsWith(".rtf")) {
    return raw
      .replace(/\\'[0-9a-f]{2}/gi, "")
      .replace(/\\[a-z]+-?\d* ?/gi, "")
      .replace(/[{}]/g, "")
      .trim();
  }

  if (name.endsWith(".html") || name.endsWith(".htm")) {
    return raw
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .trim();
  }

  return raw.trim();
}

export function wordCount(text: string): number {
  return (text.match(/\b[\w''-]+\b/g) ?? []).length;
}

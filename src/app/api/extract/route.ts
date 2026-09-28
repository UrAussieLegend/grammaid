import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { SUPPORTED_EXTENSIONS, extractText, wordCount } from "@/lib/extract";

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "File is larger than the 8MB limit." }, { status: 413 });
  }
  const name = file.name.toLowerCase();
  if (!SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return NextResponse.json(
      { error: `Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}` },
      { status: 415 },
    );
  }

  try {
    const text = await extractText(file);
    if (!text) return NextResponse.json({ error: "No readable text found in that file." }, { status: 422 });
    return NextResponse.json({ text, wordCount: wordCount(text), filename: file.name });
  } catch (error) {
    return NextResponse.json(
      { error: `Could not read that file: ${(error as Error).message}` },
      { status: 422 },
    );
  }
}

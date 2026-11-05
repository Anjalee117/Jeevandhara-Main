import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function errorResponse(detail: string, status: number) {
  return NextResponse.json({ detail }, { status });
}

export async function POST(request: Request) {
  const apiBaseUrl = process.env.CROP_HEALTH_API_URL?.replace(/\/$/, "");
  if (!apiBaseUrl) {
    return errorResponse(
      "Crop analysis is not configured. Set CROP_HEALTH_API_URL on the server.",
      503,
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("Upload the image as multipart form data.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return errorResponse("An image file is required.", 400);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return errorResponse("Upload a JPEG, PNG, or WebP image.", 415);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return errorResponse("Image exceeds the 10 MB limit.", 413);
  }

  const upstreamForm = new FormData();
  upstreamForm.set("file", file, file.name);
  try {
    const response = await fetch(`${apiBaseUrl}/v1/predict`, {
      method: "POST",
      body: upstreamForm,
      signal: AbortSignal.timeout(45_000),
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({
      detail: "The model server returned an unreadable response.",
    }));
    return NextResponse.json(body, { status: response.status });
  } catch {
    return errorResponse(
      "The crop model is unavailable. Check the model server and try again.",
      502,
    );
  }
}

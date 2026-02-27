import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

const ADMIN_HEADER = "x-admin-token";
const FALLBACK_ADMIN_TOKEN = "ADMINRMA";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 80 * 1024 * 1024;
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".ogv", ".ogg", ".mov", ".m4v"]);

const isAuthorized = (request: NextRequest) => {
  const expectedToken = process.env.RMA_ADMIN_TOKEN ?? FALLBACK_ADMIN_TOKEN;
  const token = request.headers.get(ADMIN_HEADER);
  return token === expectedToken;
};

const unauthorizedResponse = () =>
  NextResponse.json(
    {
      error: "Unauthorized",
      message:
        "Use o header x-admin-token com o token correto. Defina RMA_ADMIN_TOKEN para producao.",
    },
    { status: 401 }
  );

const getFileExtension = (file: File) => {
  const ext = path.extname(file.name).toLowerCase();
  if (ext) return ext;

  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/gif") return ".gif";
  if (file.type === "video/webm") return ".webm";
  if (file.type === "video/ogg") return ".ogv";
  if (file.type === "video/quicktime") return ".mov";
  if (file.type === "video/mp4") return ".mp4";
  return ".jpg";
};

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: "Arquivo de imagem nao enviado." }, { status: 400 });
    }

    const extension = path.extname(fileValue.name).toLowerCase();
    const isImage =
      fileValue.type.startsWith("image/") ||
      (!fileValue.type && IMAGE_EXTENSIONS.has(extension));
    const isVideo =
      fileValue.type.startsWith("video/") ||
      (!fileValue.type && VIDEO_EXTENSIONS.has(extension));

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Arquivo invalido. Envie imagem ou video." },
        { status: 400 }
      );
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (fileValue.size > maxSize) {
      const maxLabel = isVideo ? "80MB" : "8MB";
      return NextResponse.json(
        { error: `Arquivo muito grande. Limite de ${maxLabel}.` },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "projects");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${getFileExtension(fileValue)}`;
    const destination = path.join(uploadsDir, filename);

    const arrayBuffer = await fileValue.arrayBuffer();
    await fs.writeFile(destination, Buffer.from(arrayBuffer));

    return NextResponse.json(
      {
        media: `/uploads/projects/${filename}`,
        kind: isVideo ? "video" : "image",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Falha ao enviar arquivo." }, { status: 500 });
  }
}

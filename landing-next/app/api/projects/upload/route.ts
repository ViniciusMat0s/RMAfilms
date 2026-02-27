import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

const ADMIN_HEADER = "x-admin-token";
const FALLBACK_ADMIN_TOKEN = "ADMINRMA";
const MAX_FILE_SIZE = 8 * 1024 * 1024;

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

    if (!fileValue.type.startsWith("image/")) {
      return NextResponse.json({ error: "Arquivo invalido. Envie uma imagem." }, { status: 400 });
    }

    if (fileValue.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Imagem muito grande. Limite de 8MB." },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "projects");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${getFileExtension(fileValue)}`;
    const destination = path.join(uploadsDir, filename);

    const arrayBuffer = await fileValue.arrayBuffer();
    await fs.writeFile(destination, Buffer.from(arrayBuffer));

    return NextResponse.json({ image: `/uploads/projects/${filename}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Falha ao enviar imagem." }, { status: 500 });
  }
}

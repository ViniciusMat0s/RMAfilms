import { NextRequest, NextResponse } from "next/server";

import {
  createProject,
  normalizeProjectInput,
  readProjects,
} from "@/lib/projects-store";

const ADMIN_HEADER = "x-admin-token";
const FALLBACK_ADMIN_TOKEN = "ADMINRMA";

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

export async function GET() {
  const projects = await readProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const payload = (await request.json()) as Partial<{
      tag: string;
      title: string;
      copy: string;
      image: string | null;
      media: string[];
    }>;

    const normalized = normalizeProjectInput(payload);
    if (!normalized) {
      return NextResponse.json(
        { error: "Dados invalidos. Informe tag, title e copy." },
        { status: 400 }
      );
    }

    const project = await createProject(normalized);
    return NextResponse.json({ project }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Falha ao criar projeto." }, { status: 500 });
  }
}

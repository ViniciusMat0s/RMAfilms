import { NextRequest, NextResponse } from "next/server";

import {
  deleteProject,
  normalizeProjectInput,
  updateProject,
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  const { id } = await context.params;

  try {
    const payload = (await request.json()) as Partial<{
      tag: string;
      title: string;
      copy: string;
      image: string | null;
    }>;

    const normalized = normalizeProjectInput(payload);
    if (!normalized) {
      return NextResponse.json(
        { error: "Dados invalidos. Informe tag, title e copy." },
        { status: 400 }
      );
    }

    const updatedProject = await updateProject(id, normalized);
    if (!updatedProject) {
      return NextResponse.json({ error: "Projeto nao encontrado." }, { status: 404 });
    }

    return NextResponse.json({ project: updatedProject });
  } catch {
    return NextResponse.json({ error: "Falha ao atualizar projeto." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  const { id } = await context.params;

  try {
    const deleted = await deleteProject(id);
    if (!deleted) {
      return NextResponse.json({ error: "Projeto nao encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Falha ao remover projeto." }, { status: 500 });
  }
}

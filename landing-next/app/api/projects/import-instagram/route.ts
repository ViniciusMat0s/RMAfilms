import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";
import { instagramGetUrl } from "instagram-url-direct";

const ADMIN_HEADER = "x-admin-token";
const FALLBACK_ADMIN_TOKEN = "ADMINRMA";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 80 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".ogg", ".ogv", ".mov", ".m4v"]);

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

const normalizeInstagramUrl = (raw: string) => {
  const match = raw
    .trim()
    .match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  if (!match) return null;
  const [, kind, shortcode] = match;
  return `https://www.instagram.com/${kind}/${shortcode}/`;
};

const extensionFromContentType = (contentType: string | null) => {
  if (!contentType) return null;
  if (contentType.includes("image/jpeg")) return ".jpg";
  if (contentType.includes("image/png")) return ".png";
  if (contentType.includes("image/webp")) return ".webp";
  if (contentType.includes("image/gif")) return ".gif";
  if (contentType.includes("image/avif")) return ".avif";
  if (contentType.includes("video/mp4")) return ".mp4";
  if (contentType.includes("video/webm")) return ".webm";
  if (contentType.includes("video/ogg")) return ".ogv";
  if (contentType.includes("video/quicktime")) return ".mov";
  return null;
};

const getFileExtension = (mediaUrl: string, contentType: string | null) => {
  try {
    const parsedUrl = new URL(mediaUrl);
    const ext = path.extname(parsedUrl.pathname).toLowerCase();
    if (ext) return ext;
  } catch {
    // Falls back below.
  }

  const byType = extensionFromContentType(contentType);
  if (byType) return byType;
  return ".jpg";
};

const isVideoExtension = (ext: string) => VIDEO_EXTENSIONS.has(ext);
const isImageExtension = (ext: string) => IMAGE_EXTENSIONS.has(ext);

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const payload = (await request.json()) as Partial<{ url: string; urls: string[] }>;
    const rawUrls: string[] = [];

    if (typeof payload.url === "string") {
      rawUrls.push(payload.url);
    }
    if (Array.isArray(payload.urls)) {
      rawUrls.push(
        ...payload.urls.filter((item): item is string => typeof item === "string")
      );
    }

    const normalizedUrls = Array.from(
      new Set(
        rawUrls
          .map((item) => normalizeInstagramUrl(item))
          .filter((item): item is string => typeof item === "string")
      )
    );

    if (!normalizedUrls.length) {
      return NextResponse.json({ error: "Link do Instagram invalido." }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "projects");
    await fs.mkdir(uploadsDir, { recursive: true });

    const importedMedia: string[] = [];
    const failedPosts: string[] = [];
    let importedPosts = 0;

    for (const instagramUrl of normalizedUrls) {
      let extractedUrls: string[] = [];

      try {
        const extracted = await instagramGetUrl(instagramUrl);
        extractedUrls = Array.isArray(extracted.url_list)
          ? extracted.url_list.filter((item): item is string => typeof item === "string")
          : [];
      } catch {
        failedPosts.push(instagramUrl);
        continue;
      }

      if (!extractedUrls.length) {
        failedPosts.push(instagramUrl);
        continue;
      }

      let importedSomethingFromPost = false;
      let postImportFailed = false;

      try {
        for (const mediaUrl of extractedUrls) {
          const sourceResponse = await fetch(mediaUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0",
            },
          });

          if (!sourceResponse.ok) {
            throw new Error("Falha ao baixar midia do Instagram.");
          }

          const contentType = sourceResponse.headers.get("content-type");
          const ext = getFileExtension(mediaUrl, contentType);
          const arrayBuffer = await sourceResponse.arrayBuffer();
          const fileSize = arrayBuffer.byteLength;

          const isVideo = isVideoExtension(ext);
          const isImage = isImageExtension(ext);

          if (!isVideo && !isImage) {
            continue;
          }

          if (isVideo && fileSize > MAX_VIDEO_SIZE) {
            throw new Error("Uma das midias ultrapassa 80MB.");
          }

          if (isImage && fileSize > MAX_IMAGE_SIZE) {
            throw new Error("Uma das imagens ultrapassa 8MB.");
          }

          const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
          const destination = path.join(uploadsDir, filename);
          await fs.writeFile(destination, Buffer.from(arrayBuffer));
          importedMedia.push(`/uploads/projects/${filename}`);
          importedSomethingFromPost = true;
        }
      } catch {
        postImportFailed = true;
      }

      if (importedSomethingFromPost && !postImportFailed) {
        importedPosts += 1;
      } else {
        failedPosts.push(instagramUrl);
      }
    }

    const uniqueMedia = Array.from(new Set(importedMedia));
    if (!uniqueMedia.length) {
      return NextResponse.json(
        { error: "Nao foi possivel converter midias validas dos links enviados." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        media: uniqueMedia,
        imported_posts: importedPosts,
        failed_posts: failedPosts,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Falha ao importar midias do Instagram." }, { status: 500 });
  }
}

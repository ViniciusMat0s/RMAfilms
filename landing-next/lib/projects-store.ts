import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { projects as fallbackProjects } from "@/app/content";

export type ProjectInput = {
  tag: string;
  title: string;
  copy: string;
  image: string | null;
  media: string[];
};

export type ProjectRecord = ProjectInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");

const normalizeMediaList = (value: unknown) => {
  if (!Array.isArray(value)) return [] as string[];

  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(cleaned));
};

const pickCoverMedia = (media: string[]) => media[0] ?? null;

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildProjectId = (title: string, index: number) => {
  const base = slugify(title) || `projeto-${index + 1}`;
  return `${base}-${randomUUID().slice(0, 8)}`;
};

const buildFallbackProjects = (): ProjectRecord[] => {
  const timestamp = new Date().toISOString();
  return fallbackProjects.map((project, index) => ({
    id: buildProjectId(project.title, index),
    tag: normalizeText(project.tag),
    title: normalizeText(project.title),
    copy: project.copy.trim(),
    image: null,
    media: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
};

const isProjectRecord = (value: unknown): value is ProjectRecord => {
  if (!value || typeof value !== "object") return false;
  const project = value as Partial<ProjectRecord>;
  return (
    typeof project.id === "string" &&
    typeof project.tag === "string" &&
    typeof project.title === "string" &&
    typeof project.copy === "string" &&
    (typeof project.image === "string" ||
      project.image === null ||
      typeof project.image === "undefined") &&
    (typeof project.media === "undefined" ||
      (Array.isArray(project.media) &&
        project.media.every((item) => typeof item === "string"))) &&
    typeof project.createdAt === "string" &&
    typeof project.updatedAt === "string"
  );
};

const ensureProjectsFileExists = async () => {
  try {
    await fs.access(PROJECTS_FILE);
  } catch {
    const fallback = buildFallbackProjects();
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(PROJECTS_FILE, `${JSON.stringify(fallback, null, 2)}\n`, "utf8");
  }
};

export const normalizeProjectInput = (payload: Partial<ProjectInput>) => {
  const tag = normalizeText(payload.tag ?? "");
  const title = normalizeText(payload.title ?? "");
  const copy = (payload.copy ?? "").trim();
  const imageRaw = typeof payload.image === "string" ? payload.image.trim() : "";
  const image = imageRaw || null;
  const media = normalizeMediaList(payload.media);

  if (!tag || !title || !copy) {
    return null;
  }

  if (image && !media.includes(image)) {
    media.unshift(image);
  }

  const coverImage = image && media.includes(image) ? image : pickCoverMedia(media);

  return {
    tag,
    title,
    copy,
    image: coverImage,
    media,
  } satisfies ProjectInput;
};

export const readProjects = async (): Promise<ProjectRecord[]> => {
  await ensureProjectsFileExists();

  try {
    const raw = await fs.readFile(PROJECTS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (Array.isArray(parsed) && parsed.every(isProjectRecord)) {
      const normalizedProjects = parsed.map((project) => {
        const media = normalizeMediaList(project.media);
        const rawImage = typeof project.image === "string" ? project.image.trim() : "";

        if (rawImage && !media.includes(rawImage)) {
          media.unshift(rawImage);
        }

        const image = rawImage && media.includes(rawImage) ? rawImage : pickCoverMedia(media);

        return {
          ...project,
          media,
          image,
        };
      });
      return normalizedProjects;
    }
  } catch {
    // Falls back below.
  }

  const fallback = buildFallbackProjects();
  await writeProjects(fallback);
  return fallback;
};

export const writeProjects = async (projects: ProjectRecord[]) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(PROJECTS_FILE, `${JSON.stringify(projects, null, 2)}\n`, "utf8");
};

export const createProject = async (input: ProjectInput) => {
  const projects = await readProjects();
  const now = new Date().toISOString();

  const project: ProjectRecord = {
    id: buildProjectId(input.title, projects.length),
    tag: input.tag,
    title: input.title,
    copy: input.copy,
    image: input.image,
    media: input.media,
    createdAt: now,
    updatedAt: now,
  };

  projects.push(project);
  await writeProjects(projects);
  return project;
};

export const updateProject = async (id: string, input: ProjectInput) => {
  const projects = await readProjects();
  const index = projects.findIndex((project) => project.id === id);

  if (index === -1) {
    return null;
  }

  const current = projects[index];
  const updated: ProjectRecord = {
    ...current,
    tag: input.tag,
    title: input.title,
    copy: input.copy,
    image: input.image,
    media: input.media,
    updatedAt: new Date().toISOString(),
  };

  projects[index] = updated;
  await writeProjects(projects);
  return updated;
};

export const deleteProject = async (id: string) => {
  const projects = await readProjects();
  const nextProjects = projects.filter((project) => project.id !== id);

  if (nextProjects.length === projects.length) {
    return false;
  }

  await writeProjects(nextProjects);
  return true;
};

"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";

import styles from "./page.module.css";

type ProjectRecord = {
  id: string;
  tag: string;
  title: string;
  copy: string;
  image: string | null;
  media: string[];
  createdAt: string;
  updatedAt: string;
};

type ProjectForm = {
  tag: string;
  title: string;
  copy: string;
  image: string | null;
  media: string[];
};

type InstagramImportMode = "single" | "multiple";

const TOKEN_STORAGE_KEY = "rma_admin_token";
const FALLBACK_TOKEN_HINT = "ADMINRMA";
const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|ogg|mov|m4v)$/i;
const INSTAGRAM_POST_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i;

const EMPTY_FORM: ProjectForm = {
  tag: "",
  title: "",
  copy: "",
  image: null,
  media: [],
};

const isVideoMedia = (value: string) => VIDEO_EXTENSION_PATTERN.test(value);
const isInstagramMedia = (value: string) => INSTAGRAM_POST_PATTERN.test(value);

const normalizeInstagramUrl = (raw: string) => {
  const value = raw.trim();
  if (!value) return null;

  const match = value.match(INSTAGRAM_POST_PATTERN);
  if (!match) return null;

  const [, kind, shortcode] = match;
  return `https://www.instagram.com/${kind}/${shortcode}/`;
};

const normalizeMediaList = (media: unknown, image: string | null) => {
  const parsed = Array.isArray(media)
    ? media.filter((item): item is string => typeof item === "string")
    : [];

  const cleaned = parsed.map((item) => item.trim()).filter(Boolean);
  const imagePath = typeof image === "string" ? image.trim() : "";

  if (imagePath && !cleaned.includes(imagePath)) {
    cleaned.unshift(imagePath);
  }

  return Array.from(new Set(cleaned));
};

const normalizeCoverFromMedia = (media: string[], image: string | null) => {
  const cleanedImage = typeof image === "string" ? image.trim() : "";
  if (
    cleanedImage &&
    media.includes(cleanedImage) &&
    !isVideoMedia(cleanedImage) &&
    !isInstagramMedia(cleanedImage)
  ) {
    return cleanedImage;
  }

  return media.find((item) => !isVideoMedia(item) && !isInstagramMedia(item)) ?? null;
};

const getProjectCover = (project: Pick<ProjectRecord, "media" | "image">) => {
  if (
    project.image &&
    project.media.includes(project.image) &&
    !isInstagramMedia(project.image) &&
    !isVideoMedia(project.image)
  ) {
    return project.image;
  }

  if (project.media.length > 0) {
    return (
      project.media.find((item) => !isVideoMedia(item) && !isInstagramMedia(item)) ??
      project.media.find((item) => isVideoMedia(item)) ??
      null
    );
  }
  if (project.image && !isInstagramMedia(project.image)) {
    return project.image;
  }
  return null;
};

const getFileLabel = (path: string) => path.split("/").filter(Boolean).pop() ?? path;

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [instagramInput, setInstagramInput] = useState("");
  const [instagramBatchInputs, setInstagramBatchInputs] = useState<string[]>([""]);
  const [instagramImportMode, setInstagramImportMode] =
    useState<InstagramImportMode>("single");
  const [importingInstagram, setImportingInstagram] = useState(false);
  const projectsWithMedia = projects.filter((project) => project.media.length > 0).length;

  const loadProjects = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Falha ao carregar projetos.");
      }

      const payload = (await response.json()) as Partial<{
        projects: Array<
          Partial<{
            id: string;
            tag: string;
            title: string;
            copy: string;
            image: string | null;
            media: string[];
            createdAt: string;
            updatedAt: string;
          }>
        >;
      }>;

      if (!Array.isArray(payload.projects)) {
        setProjects([]);
      } else {
        setProjects(
          payload.projects
            .filter(
              (project) =>
                typeof project.id === "string" &&
                typeof project.tag === "string" &&
                typeof project.title === "string" &&
                typeof project.copy === "string" &&
                typeof project.createdAt === "string" &&
                typeof project.updatedAt === "string"
            )
            .map((project) => {
              const image = typeof project.image === "string" ? project.image : null;
              const media = normalizeMediaList(project.media, image);
              return {
                id: project.id!,
                tag: project.tag!,
                title: project.title!,
                copy: project.copy!,
                image: normalizeCoverFromMedia(media, image),
                media,
                createdAt: project.createdAt!,
                updatedAt: project.updatedAt!,
              } satisfies ProjectRecord;
            })
        );
      }
    } catch {
      setError("Nao foi possivel carregar os projetos agora.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.classList.add("admin-projects-page");
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
      setToken(storedToken);
    }

    void loadProjects();

    return () => {
      document.body.classList.remove("admin-projects-page");
    };
  }, []);

  useEffect(() => {
    if (!token.trim()) return;
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }, [token]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSelectedFiles([]);
    setInstagramInput("");
    setInstagramBatchInputs([""]);
    setInstagramImportMode("single");
  };

  const startEdit = (project: ProjectRecord) => {
    setEditingId(project.id);
    setForm({
      tag: project.tag,
      title: project.title,
      copy: project.copy,
      image: project.image,
      media: project.media,
    });
    setSelectedFiles([]);
    setInstagramInput("");
    setInstagramBatchInputs([""]);
    setInstagramImportMode("single");
    setMessage("");
    setError("");
  };

  const removeMediaFromForm = (mediaPath: string) => {
    setForm((current) => {
      const media = current.media.filter((item) => item !== mediaPath);
      return {
        ...current,
        media,
        image: normalizeCoverFromMedia(media, current.image === mediaPath ? null : current.image),
      };
    });
  };

  const setMediaAsCover = (mediaPath: string) => {
    if (isVideoMedia(mediaPath) || isInstagramMedia(mediaPath)) {
      return;
    }

    setForm((current) => ({
      ...current,
      image: mediaPath,
    }));
    setError("");
  };

  const updateInstagramBatchInput = (index: number, value: string) => {
    setInstagramBatchInputs((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item))
    );
  };

  const addInstagramBatchInput = () => {
    setInstagramBatchInputs((current) => [...current, ""]);
  };

  const removeInstagramBatchInput = (index: number) => {
    setInstagramBatchInputs((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length ? next : [""];
    });
  };

  const getInstagramImportUrls = () => {
    if (instagramImportMode === "single") {
      const normalized = normalizeInstagramUrl(instagramInput);
      if (!normalized) {
        return {
          urls: [] as string[],
          errorMessage: "Link do Instagram invalido. Use URL de post, reel ou tv.",
        };
      }
      return { urls: [normalized], errorMessage: null };
    }

    const rawUrls = instagramBatchInputs.map((item) => item.trim()).filter(Boolean);

    if (!rawUrls.length) {
      return {
        urls: [] as string[],
        errorMessage: "Cole pelo menos um link do Instagram para importar.",
      };
    }

    const normalizedUrls: string[] = [];
    for (const rawUrl of rawUrls) {
      const normalized = normalizeInstagramUrl(rawUrl);
      if (!normalized) {
        return {
          urls: [] as string[],
          errorMessage: `Link invalido na lista: ${rawUrl}`,
        };
      }
      normalizedUrls.push(normalized);
    }

    return {
      urls: Array.from(new Set(normalizedUrls)),
      errorMessage: null,
    };
  };

  const addInstagramLink = async () => {
    const importInput = getInstagramImportUrls();
    if (importInput.errorMessage) {
      setError(importInput.errorMessage);
      return;
    }

    if (!token.trim()) {
      setError("Informe o token admin para importar midias.");
      return;
    }

    setImportingInstagram(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/projects/import-instagram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token.trim(),
        },
        body: JSON.stringify({ urls: importInput.urls }),
      });

      const payload = (await response.json()) as Partial<{
        media: string[];
        error: string;
        imported_posts: number;
        failed_posts: string[];
      }>;

      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao importar midias do Instagram.");
      }

      const importedMedia = Array.isArray(payload.media)
        ? payload.media.filter((item): item is string => typeof item === "string")
        : [];

      if (!importedMedia.length) {
        throw new Error("Nenhuma midia valida foi encontrada nesse link.");
      }

      setForm((current) => {
        const media = Array.from(new Set([...current.media, ...importedMedia]));
        return {
          ...current,
          media,
          image: normalizeCoverFromMedia(media, current.image),
        };
      });
      setInstagramInput("");
      setInstagramBatchInputs([""]);
      const importedPosts =
        typeof payload.imported_posts === "number"
          ? payload.imported_posts
          : importInput.urls.length;
      const failedPosts = Array.isArray(payload.failed_posts)
        ? payload.failed_posts.filter((item): item is string => typeof item === "string")
        : [];
      setMessage(
        `${importedPosts} ${
          importedPosts === 1 ? "publicacao importada" : "publicacoes importadas"
        } com ${importedMedia.length} ${
          importedMedia.length === 1 ? "midia" : "midias"
        }.${
          failedPosts.length
            ? ` ${failedPosts.length} ${failedPosts.length === 1 ? "link falhou" : "links falharam"}.`
            : ""
        }`
      );
    } catch (importError) {
      if (importError instanceof Error) {
        setError(importError.message);
      } else {
        setError("Falha ao importar midias do Instagram.");
      }
    } finally {
      setImportingInstagram(false);
    }
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const trimmed = {
      tag: form.tag.trim(),
      title: form.title.trim(),
      copy: form.copy.trim(),
      image: typeof form.image === "string" ? form.image.trim() : "",
      media: form.media.map((item) => item.trim()).filter(Boolean),
    };

    if (!trimmed.tag || !trimmed.title || !trimmed.copy) {
      setError("Preencha tag, titulo e descricao antes de salvar.");
      return;
    }

    if (!token.trim()) {
      setError("Informe o token admin para salvar.");
      return;
    }

    setSaving(true);

    const endpoint = editingId ? `/api/projects/${editingId}` : "/api/projects";
    const method = editingId ? "PATCH" : "POST";

    try {
      let mediaPaths = [...trimmed.media];
      let selectedCoverImage = trimmed.image || null;

      if (selectedFiles.length) {
        for (const file of selectedFiles) {
          const uploadPayload = new FormData();
          uploadPayload.append("file", file);

          const uploadResponse = await fetch("/api/projects/upload", {
            method: "POST",
            headers: {
              "x-admin-token": token.trim(),
            },
            body: uploadPayload,
          });

          if (!uploadResponse.ok) {
            const payload = (await uploadResponse.json()) as Partial<{
              error: string;
            }>;
            throw new Error(payload.error ?? `Falha ao enviar o arquivo ${file.name}.`);
          }

          const uploadResult = (await uploadResponse.json()) as Partial<{
            media: string;
            image: string;
            kind: "image" | "video";
          }>;
          const uploadedPath =
            typeof uploadResult.media === "string"
              ? uploadResult.media
              : typeof uploadResult.image === "string"
                ? uploadResult.image
                : "";

          if (!uploadedPath) {
            throw new Error(`Falha ao obter caminho do arquivo ${file.name}.`);
          }

          mediaPaths.push(uploadedPath);
          if (!selectedCoverImage && uploadResult.kind === "image") {
            selectedCoverImage = uploadedPath;
          }
        }
      }

      mediaPaths = Array.from(new Set(mediaPaths));
      const coverImage = normalizeCoverFromMedia(mediaPaths, selectedCoverImage);

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token.trim(),
        },
        body: JSON.stringify({
          tag: trimmed.tag,
          title: trimmed.title,
          copy: trimmed.copy,
          image: coverImage,
          media: mediaPaths,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as Partial<{
          error: string;
          message: string;
        }>;
        throw new Error(payload.message ?? payload.error ?? "Falha ao salvar projeto.");
      }

      await loadProjects();
      resetForm();
      setMessage(editingId ? "Projeto atualizado com sucesso." : "Projeto criado com sucesso.");
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError("Falha ao salvar projeto.");
      }
    } finally {
      setSaving(false);
    }
  };

  const removeProject = async (project: ProjectRecord) => {
    if (!token.trim()) {
      setError("Informe o token admin para remover.");
      return;
    }

    const confirmed = window.confirm(`Remover o projeto \"${project.title}\"?`);
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": token.trim(),
        },
      });

      if (!response.ok) {
        const payload = (await response.json()) as Partial<{
          error: string;
          message: string;
        }>;
        throw new Error(payload.message ?? payload.error ?? "Falha ao remover projeto.");
      }

      if (editingId === project.id) {
        resetForm();
      }

      await loadProjects();
      setMessage("Projeto removido com sucesso.");
    } catch (deleteError) {
      if (deleteError instanceof Error) {
        setError(deleteError.message);
      } else {
        setError("Falha ao remover projeto.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.kicker}>Painel administrativo</span>
          <h1>Gestao de Projetos</h1>
          <p>
            Cadastre, edite e remova os cards da secao &quot;Projetos&quot;. O layout no site
            principal continua o mesmo, mudando apenas os dados.
          </p>
          <div className={styles.stats}>
            <article className={styles.stat}>
              <strong>{loading ? "--" : projects.length}</strong>
              <span>Projetos ativos</span>
            </article>
            <article className={styles.stat}>
              <strong>{loading ? "--" : projectsWithMedia}</strong>
              <span>Com midias</span>
            </article>
            <article className={styles.stat}>
              <strong>{editingId ? "ON" : "OFF"}</strong>
              <span>Modo edicao</span>
            </article>
          </div>
        </header>

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>
                {editingId ? "Editar Projeto" : "Novo Projeto"}
              </h2>
              <span className={styles.sectionPill}>{editingId ? "Atualizacao" : "Criacao"}</span>
            </div>

            <form onSubmit={submitForm}>
              <div className={styles.field}>
                <label htmlFor="admin-token">Token admin</label>
                <input
                  id="admin-token"
                  className={styles.input}
                  type="password"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="Digite seu token"
                  autoComplete="off"
                />
              </div>

              <p className={styles.helper}>
                Defina <code>RMA_ADMIN_TOKEN</code> no servidor para producao. Em dev local,
                o fallback e <code>{FALLBACK_TOKEN_HINT}</code>.
              </p>

              <div className={styles.field}>
                <label htmlFor="project-tag">Tag</label>
                <input
                  id="project-tag"
                  className={styles.input}
                  value={form.tag}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, tag: event.target.value }))
                  }
                  placeholder="Ex.: Institucional"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="project-title">Titulo</label>
                <input
                  id="project-title"
                  className={styles.input}
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Ex.: Lancamento Imobiliario"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="project-copy">Descricao</label>
                <textarea
                  id="project-copy"
                  className={styles.textarea}
                  value={form.copy}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, copy: event.target.value }))
                  }
                  placeholder="Texto do card"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="project-media">Midias do projeto</label>
                <input
                  id="project-media"
                  className={styles.input}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(event) => {
                    const files = event.target.files ? Array.from(event.target.files) : [];
                    setSelectedFiles(files);
                  }}
                />
                <p className={styles.helper}>
                  Envie imagens (8MB) ou videos (80MB). Tambem e possivel colar um link de
                  post/reel do Instagram para importar todas as midias automaticamente.
                </p>

                <div className={styles.instagramMode}>
                  <button
                    className={`${styles.modeButton}${
                      instagramImportMode === "single" ? ` ${styles.modeButtonActive}` : ""
                    }`}
                    type="button"
                    onClick={() => setInstagramImportMode("single")}
                    disabled={saving || importingInstagram}
                  >
                    Uma publicacao
                  </button>
                  <button
                    className={`${styles.modeButton}${
                      instagramImportMode === "multiple" ? ` ${styles.modeButtonActive}` : ""
                    }`}
                    type="button"
                    onClick={() => setInstagramImportMode("multiple")}
                    disabled={saving || importingInstagram}
                  >
                    Varias publicacoes
                  </button>
                </div>

                <div className={styles.instagramRow}>
                  {instagramImportMode === "single" ? (
                    <input
                      className={styles.input}
                      type="url"
                      value={instagramInput}
                      onChange={(event) => setInstagramInput(event.target.value)}
                      placeholder="Cole 1 link do Instagram (post/reel)"
                    />
                  ) : (
                    <div className={styles.instagramBatchList}>
                      {instagramBatchInputs.map((value, index) => (
                        <div className={styles.instagramBatchItem} key={`ig-link-${index}`}>
                          <input
                            className={styles.input}
                            type="url"
                            value={value}
                            onChange={(event) =>
                              updateInstagramBatchInput(index, event.target.value)
                            }
                            placeholder={`Link Instagram ${index + 1}`}
                          />
                          <button
                            className={styles.batchRemoveButton}
                            type="button"
                            onClick={() => removeInstagramBatchInput(index)}
                            disabled={
                              saving || importingInstagram || instagramBatchInputs.length === 1
                            }
                            aria-label={`Remover link ${index + 1}`}
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                      <button
                        className={styles.batchAddButton}
                        type="button"
                        onClick={addInstagramBatchInput}
                        disabled={saving || importingInstagram}
                      >
                        + Adicionar link
                      </button>
                    </div>
                  )}
                  <button
                    className={styles.buttonGhost}
                    type="button"
                    onClick={() => void addInstagramLink()}
                    disabled={saving || importingInstagram}
                  >
                    {importingInstagram
                      ? "Importando..."
                      : instagramImportMode === "single"
                        ? "Importar publicacao"
                        : "Importar publicacoes"}
                  </button>
                </div>

                {selectedFiles.length ? (
                  <ul className={styles.selectedFilesList}>
                    {selectedFiles.map((file) => (
                      <li key={`${file.name}-${file.size}`} className={styles.selectedFileItem}>
                        <span>{file.name}</span>
                        <strong>{file.type.startsWith("video/") ? "Video" : "Imagem"}</strong>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {form.media.length ? (
                  <div className={styles.previewWrap}>
                    {form.media.map((mediaPath) => (
                      <article className={styles.mediaCard} key={mediaPath}>
                        <div className={styles.previewMedia}>
                          {isInstagramMedia(mediaPath) ? (
                            <div className={styles.instagramPreview}>
                              <span>Instagram</span>
                              <small>{getFileLabel(mediaPath)}</small>
                            </div>
                          ) : isVideoMedia(mediaPath) ? (
                            <video src={mediaPath} muted playsInline preload="metadata" />
                          ) : (
                            <Image
                              src={mediaPath}
                              alt={`Midia ${form.title || "projeto"}`}
                              fill
                              sizes="(max-width: 900px) 100vw, 340px"
                            />
                          )}
                        </div>
                        <div className={styles.mediaMeta}>
                          <span className={styles.mediaBadge}>
                            {isInstagramMedia(mediaPath)
                              ? "Instagram"
                              : isVideoMedia(mediaPath)
                                ? "Video"
                                : "Imagem"}
                          </span>
                          <code>{getFileLabel(mediaPath)}</code>
                        </div>
                        <div className={styles.mediaActions}>
                          {!isVideoMedia(mediaPath) && !isInstagramMedia(mediaPath) ? (
                            <button
                              className={styles.buttonGhost}
                              type="button"
                              onClick={() => setMediaAsCover(mediaPath)}
                              disabled={saving || form.image === mediaPath}
                            >
                              {form.image === mediaPath ? "Capa atual" : "Definir como capa"}
                            </button>
                          ) : (
                            <span className={styles.coverHint}>
                              {isInstagramMedia(mediaPath)
                                ? "Instagram nao pode ser capa"
                                : "Video nao pode ser capa"}
                            </span>
                          )}
                          <button
                            className={styles.buttonGhost}
                            type="button"
                            onClick={() => removeMediaFromForm(mediaPath)}
                            disabled={saving}
                          >
                            Remover da galeria
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className={styles.formActions}>
                <button className={styles.button} type="submit" disabled={saving}>
                  {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
                </button>

                {editingId ? (
                  <button
                    className={styles.buttonGhost}
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancelar edicao
                  </button>
                ) : null}
              </div>
            </form>

            {message || error ? (
              <div className={styles.statusStack}>
                {message ? (
                  <p className={`${styles.message} ${styles.messageSuccess}`}>{message}</p>
                ) : null}
                {error ? <p className={`${styles.message} ${styles.error}`}>{error}</p> : null}
              </div>
            ) : null}
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Projetos cadastrados</h2>
              <span className={styles.sectionPill}>{projects.length}</span>
            </div>

            {loading ? <p className={styles.message}>Carregando...</p> : null}

            {!loading && projects.length === 0 ? (
              <p className={styles.message}>Nenhum projeto cadastrado.</p>
            ) : null}

            <div className={styles.list}>
              {projects.map((project) => {
                const coverImage = getProjectCover(project);
                const firstInstagram = project.media.find((item) => isInstagramMedia(item));

                return (
                  <article key={project.id} className={styles.item}>
                    <div className={styles.topline}>
                      <span className={styles.tag}>{project.tag}</span>
                      <code className={styles.projectId}>{project.id}</code>
                    </div>
                    <h3 className={styles.title}>{project.title}</h3>
                    {coverImage ? (
                      <div className={styles.itemImageWrap}>
                        {isVideoMedia(coverImage) ? (
                          <video src={coverImage} muted playsInline preload="metadata" />
                        ) : (
                          <Image
                            src={coverImage}
                            alt={project.title}
                            fill
                            sizes="(max-width: 900px) 100vw, 420px"
                          />
                        )}
                      </div>
                    ) : firstInstagram ? (
                      <div className={styles.itemImageWrap}>
                        <div className={styles.instagramPreview}>
                          <span>Instagram</span>
                          <small>{getFileLabel(firstInstagram)}</small>
                        </div>
                      </div>
                    ) : null}
                    <p className={styles.copy}>{project.copy}</p>
                    <p className={styles.mediaCount}>{project.media.length} midias cadastradas</p>
                    <div className={styles.itemActions}>
                      <button
                        className={styles.buttonGhost}
                        type="button"
                        onClick={() => startEdit(project)}
                        disabled={saving}
                      >
                        Editar
                      </button>
                      <button
                        className={styles.buttonDanger}
                        type="button"
                        onClick={() => removeProject(project)}
                        disabled={saving}
                      >
                        Remover
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <Link className={styles.linkBack} href="/">
          Voltar para o site
        </Link>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
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
type FloatingModalMode = "alert" | "confirm";
type FloatingModalState = {
  mode: FloatingModalMode;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
};
type ProjectSubmitPayload = {
  tag: string;
  title: string;
  copy: string;
  image: string;
  media: string[];
};
type EditorStepKey = "auth" | "details" | "media" | "review";

const TOKEN_STORAGE_KEY = "rma_admin_token";
const FALLBACK_TOKEN_HINT = "ADMINRMA";
const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|ogg|mov|m4v)$/i;
const INSTAGRAM_POST_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i;
const EDITOR_STEPS: Array<{
  key: EditorStepKey;
  label: string;
  title: string;
  hint: string;
}> = [
  {
    key: "auth",
    label: "Token",
    title: "Autenticacao",
    hint: "Configure o token admin para liberar operacoes de salvamento.",
  },
  {
    key: "details",
    label: "Projeto",
    title: "Informacoes do Projeto",
    hint: "Defina tag, titulo e descricao do card.",
  },
  {
    key: "media",
    label: "Midias",
    title: "Midias e Importacao",
    hint: "Envie arquivos e importe publicacoes do Instagram.",
  },
  {
    key: "review",
    label: "Revisao",
    title: "Revisao Final",
    hint: "Confira o resumo antes de criar ou atualizar.",
  },
];

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
  if (cleanedImage && media.includes(cleanedImage)) {
    return cleanedImage;
  }

  return media[0] ?? null;
};

const getProjectCover = (project: Pick<ProjectRecord, "media" | "image">) => {
  if (project.image && project.media.includes(project.image)) {
    return project.image;
  }

  if (project.media.length > 0) {
    return project.media[0];
  }
  if (project.image) {
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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorStep, setEditorStep] = useState(0);
  const [floatingModal, setFloatingModal] = useState<FloatingModalState | null>(null);
  const floatingConfirmActionRef = useRef<(() => void) | null>(null);
  const projectsWithMedia = projects.filter((project) => project.media.length > 0).length;
  const currentEditorStep = EDITOR_STEPS[editorStep];
  const isFirstEditorStep = editorStep === 0;
  const isLastEditorStep = editorStep === EDITOR_STEPS.length - 1;

  const closeFloatingModal = () => {
    setFloatingModal(null);
    floatingConfirmActionRef.current = null;
  };

  const openAlert = (title: string, message: string, confirmLabel = "Entendi") => {
    floatingConfirmActionRef.current = null;
    setFloatingModal({
      mode: "alert",
      title,
      message,
      confirmLabel,
    });
  };

  const openConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar"
  ) => {
    floatingConfirmActionRef.current = onConfirm;
    setFloatingModal({
      mode: "confirm",
      title,
      message,
      confirmLabel,
      cancelLabel,
    });
  };

  const handleFloatingConfirm = () => {
    const action = floatingConfirmActionRef.current;
    closeFloatingModal();
    if (action) {
      action();
    }
  };

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

  useEffect(() => {
    if (!floatingModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setFloatingModal(null);
      floatingConfirmActionRef.current = null;
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [floatingModal]);

  useEffect(() => {
    if (!isEditorOpen || floatingModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsEditorOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      setSelectedFiles([]);
      setInstagramInput("");
      setInstagramBatchInputs([""]);
      setInstagramImportMode("single");
      setEditorStep(0);
      setMessage("");
      setError("");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditorOpen, floatingModal]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSelectedFiles([]);
    setInstagramInput("");
    setInstagramBatchInputs([""]);
    setInstagramImportMode("single");
    setEditorStep(0);
  };

  const openCreateModal = () => {
    resetForm();
    setMessage("");
    setError("");
    setIsEditorOpen(true);
  };

  const closeEditorModal = () => {
    setIsEditorOpen(false);
    resetForm();
    setMessage("");
    setError("");
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
    setEditorStep(0);
    setMessage("");
    setError("");
    setIsEditorOpen(true);
  };

  const goToEditorStep = (nextStep: number) => {
    const bounded = Math.min(Math.max(nextStep, 0), EDITOR_STEPS.length - 1);
    setEditorStep(bounded);
  };

  const validateCurrentStep = () => {
    if (editorStep === 0 && !token.trim()) {
      openAlert("Token admin ausente", "Informe o token admin para continuar para a proxima etapa.");
      return false;
    }

    if (editorStep === 1) {
      const missingFields: string[] = [];
      if (!form.tag.trim()) missingFields.push("Tag");
      if (!form.title.trim()) missingFields.push("Titulo");
      if (!form.copy.trim()) missingFields.push("Descricao");
      if (missingFields.length) {
        openAlert(
          "Campos obrigatorios",
          `Preencha ${missingFields.join(", ")} antes de continuar.`
        );
        return false;
      }
    }

    if (editorStep === 2 && importingInstagram) {
      openAlert(
        "Importacao em andamento",
        "Aguarde a importacao de midias do Instagram finalizar para continuar."
      );
      return false;
    }

    return true;
  };

  const goToNextEditorStep = () => {
    if (!validateCurrentStep()) return;
    goToEditorStep(editorStep + 1);
  };

  const goToPreviousEditorStep = () => {
    goToEditorStep(editorStep - 1);
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

  const persistProject = async (trimmed: ProjectSubmitPayload) => {
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

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const trimmed: ProjectSubmitPayload = {
      tag: form.tag.trim(),
      title: form.title.trim(),
      copy: form.copy.trim(),
      image: typeof form.image === "string" ? form.image.trim() : "",
      media: form.media.map((item) => item.trim()).filter(Boolean),
    };

    if (importingInstagram) {
      openAlert(
        "Importacao em andamento",
        "Aguarde a importacao das midias terminar antes de salvar o projeto."
      );
      return;
    }

    const missingFields: string[] = [];
    if (!trimmed.tag) missingFields.push("Tag");
    if (!trimmed.title) missingFields.push("Titulo");
    if (!trimmed.copy) missingFields.push("Descricao");

    if (missingFields.length) {
      openAlert(
        "Campos obrigatorios",
        `Preencha ${missingFields.join(", ")} antes de salvar o projeto.`
      );
      return;
    }

    if (!token.trim()) {
      openAlert("Token admin ausente", "Informe o token admin antes de salvar.");
      return;
    }

    const hasPendingInstagramLinks =
      instagramImportMode === "single"
        ? Boolean(instagramInput.trim())
        : instagramBatchInputs.some((item) => item.trim().length > 0);

    const hasAnyMedia = trimmed.media.length > 0 || selectedFiles.length > 0;
    const continueSave = () => void persistProject(trimmed);

    const confirmWithoutMedia = () => {
      openConfirm(
        "Salvar sem midia?",
        "Nenhuma midia foi importada ou enviada. Deseja continuar mesmo assim?",
        continueSave,
        editingId ? "Atualizar sem midia" : "Criar sem midia",
        "Voltar e revisar"
      );
    };

    if (hasPendingInstagramLinks) {
      openConfirm(
        "Importacao pendente",
        "Ha links do Instagram preenchidos sem importacao. Se continuar, eles nao entram na galeria deste projeto.",
        () => {
          if (!hasAnyMedia) {
            confirmWithoutMedia();
            return;
          }
          continueSave();
        },
        "Salvar assim",
        "Revisar links"
      );
      return;
    }

    if (!hasAnyMedia) {
      confirmWithoutMedia();
      return;
    }

    continueSave();
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

  const pendingInstagramLinksCount =
    instagramImportMode === "single"
      ? instagramInput.trim().length
        ? 1
        : 0
      : instagramBatchInputs.filter((item) => item.trim().length > 0).length;
  const hasAnyMediaInForm = form.media.length > 0 || selectedFiles.length > 0;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={`${styles.card} ${styles.projectsBoard}`}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionHeadBlock}>
              <span className={styles.boardKicker}>Painel projetos</span>
              <h2 className={styles.sectionTitle}>Projetos cadastrados</h2>
              <p className={styles.sectionSubtitle}>
                Crie e edite cards em uma janela flutuante.
              </p>
              <div className={styles.boardStats}>
                <span className={styles.boardStat}>
                  Ativos: <strong>{loading ? "--" : projects.length}</strong>
                </span>
                <span className={styles.boardStat}>
                  Midias: <strong>{loading ? "--" : projectsWithMedia}</strong>
                </span>
                <span className={styles.boardStat}>
                  Edicao: <strong>{editingId ? "ON" : "OFF"}</strong>
                </span>
              </div>
            </div>
            <div className={styles.sectionHeadActions}>
              <span className={styles.sectionPill}>{projects.length}</span>
              <button
                className={styles.addProjectButton}
                type="button"
                onClick={openCreateModal}
                disabled={saving}
                aria-label="Adicionar novo projeto"
              >
                <span className={styles.addProjectIcon} aria-hidden="true">
                  +
                </span>
                Adicionar
              </button>
            </div>
          </div>

          {loading ? <p className={styles.message}>Carregando...</p> : null}

          {!loading && projects.length === 0 ? (
            <p className={styles.message}>Nenhum projeto cadastrado.</p>
          ) : null}

          <div className={styles.list}>
            {projects.map((project) => {
              const coverMedia = getProjectCover(project);

              return (
                <article key={project.id} className={styles.item}>
                  <div className={styles.topline}>
                    <span className={styles.tag}>{project.tag}</span>
                    <code className={styles.projectId}>{project.id}</code>
                  </div>
                  <h3 className={styles.title}>{project.title}</h3>
                  {coverMedia ? (
                    <div className={styles.itemImageWrap}>
                      {isInstagramMedia(coverMedia) ? (
                        <div className={styles.instagramPreview}>
                          <span>Instagram</span>
                          <small>{getFileLabel(coverMedia)}</small>
                        </div>
                      ) : isVideoMedia(coverMedia) ? (
                        <video src={coverMedia} muted playsInline preload="metadata" />
                      ) : (
                        <Image
                          src={coverMedia}
                          alt={project.title}
                          fill
                          sizes="(max-width: 900px) 100vw, 420px"
                        />
                      )}
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

        {!isEditorOpen && (message || error) ? (
          <div className={styles.statusStack}>
            {message ? <p className={`${styles.message} ${styles.messageSuccess}`}>{message}</p> : null}
            {error ? <p className={`${styles.message} ${styles.error}`}>{error}</p> : null}
          </div>
        ) : null}

        <Link className={styles.linkBack} href="/">
          Voltar para o site
        </Link>
      </div>
      {isEditorOpen ? (
        <div className={styles.editorBackdrop} onClick={closeEditorModal}>
          <section
            className={`${styles.card} ${styles.editorWindow}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-editor-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.editorHeader}>
              <div className={styles.sectionHeadBlock}>
                <h2 id="project-editor-title" className={styles.sectionTitle}>
                  {editingId ? "Editar Projeto" : "Novo Projeto"}
                </h2>
                <p className={styles.sectionSubtitle}>
                  Os dados salvos aqui atualizam automaticamente os cards da secao de projetos.
                </p>
              </div>
              <div className={styles.sectionHeadActions}>
                <span className={styles.sectionPill}>{editingId ? "Atualizacao" : "Criacao"}</span>
                <button
                  className={styles.closeEditorButton}
                  type="button"
                  onClick={closeEditorModal}
                  disabled={saving}
                >
                  Fechar
                </button>
              </div>
            </div>

            <form
              onSubmit={(event) => {
                if (!isLastEditorStep) {
                  event.preventDefault();
                  goToNextEditorStep();
                  return;
                }
                void submitForm(event);
              }}
              className={styles.editorForm}
            >
              <div className={styles.editorWizard}>
                <aside className={styles.wizardSidebar} aria-label="Etapas de criacao de projeto">
                  {EDITOR_STEPS.map((step, stepIndex) => {
                    const isActive = stepIndex === editorStep;
                    const isDone = stepIndex < editorStep;

                    return (
                      <button
                        key={step.key}
                        className={`${styles.wizardStep}${
                          isActive ? ` ${styles.wizardStepActive}` : ""
                        }${isDone ? ` ${styles.wizardStepDone}` : ""}`}
                        type="button"
                        onClick={() => goToEditorStep(stepIndex)}
                      >
                        <span className={styles.wizardStepDot} aria-hidden="true" />
                        <div className={styles.wizardStepText}>
                          <strong>{step.label}</strong>
                          <small>{step.title}</small>
                        </div>
                      </button>
                    );
                  })}
                </aside>

                <div className={styles.wizardMain}>
                  <div className={styles.wizardMainHead}>
                    <h3>{currentEditorStep.title}</h3>
                    <p>{currentEditorStep.hint}</p>
                  </div>

                  {editorStep === 0 ? (
                    <div className={styles.wizardStepBody}>
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
                        Defina <code>RMA_ADMIN_TOKEN</code> no servidor para producao. Em dev
                        local, o fallback e <code>{FALLBACK_TOKEN_HINT}</code>.
                      </p>
                    </div>
                  ) : null}

                  {editorStep === 1 ? (
                    <div className={styles.wizardStepBody}>
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
                    </div>
                  ) : null}

                  {editorStep === 2 ? (
                    <div className={styles.wizardStepBody}>
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
                              instagramImportMode === "multiple"
                                ? ` ${styles.modeButtonActive}`
                                : ""
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
                                      saving ||
                                      importingInstagram ||
                                      instagramBatchInputs.length === 1
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
                              <li
                                key={`${file.name}-${file.size}`}
                                className={styles.selectedFileItem}
                              >
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
                                  <button
                                    className={styles.buttonGhost}
                                    type="button"
                                    onClick={() => setMediaAsCover(mediaPath)}
                                    disabled={saving || form.image === mediaPath}
                                  >
                                    {form.image === mediaPath ? "Capa atual" : "Definir como capa"}
                                  </button>
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
                    </div>
                  ) : null}

                  {editorStep === 3 ? (
                    <div className={styles.wizardStepBody}>
                      <div className={styles.reviewGrid}>
                        <article className={styles.reviewCard}>
                          <span>Token</span>
                          <strong>{token.trim() ? "Configurado" : "Nao informado"}</strong>
                        </article>
                        <article className={styles.reviewCard}>
                          <span>Tag</span>
                          <strong>{form.tag.trim() || "Sem tag"}</strong>
                        </article>
                        <article className={styles.reviewCard}>
                          <span>Titulo</span>
                          <strong>{form.title.trim() || "Sem titulo"}</strong>
                        </article>
                        <article className={styles.reviewCard}>
                          <span>Midias</span>
                          <strong>{hasAnyMediaInForm ? "Pronto" : "Sem midia"}</strong>
                        </article>
                      </div>
                      <p className={styles.helper}>
                        {form.copy.trim() || "Sem descricao definida ainda."}
                      </p>
                      <div className={styles.reviewMeta}>
                        <span>{form.media.length} midias importadas</span>
                        <span>{selectedFiles.length} arquivos locais selecionados</span>
                        <span>{pendingInstagramLinksCount} links pendentes para importar</span>
                      </div>
                    </div>
                  ) : null}

                  <div className={styles.wizardActions}>
                    {!isFirstEditorStep ? (
                      <button
                        className={styles.buttonGhost}
                        type="button"
                        onClick={goToPreviousEditorStep}
                        disabled={saving}
                      >
                        Voltar
                      </button>
                    ) : null}

                    {!isLastEditorStep ? (
                      <button
                        className={styles.button}
                        type="button"
                        onClick={goToNextEditorStep}
                        disabled={saving}
                      >
                        Continuar
                      </button>
                    ) : (
                      <button className={styles.button} type="submit" disabled={saving}>
                        {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
                      </button>
                    )}

                    <button
                      className={styles.buttonGhost}
                      type="button"
                      onClick={closeEditorModal}
                      disabled={saving}
                    >
                      {editingId ? "Cancelar edicao" : "Fechar"}
                    </button>
                  </div>
                </div>
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
        </div>
      ) : null}
      {floatingModal ? (
        <div className={styles.floatingBackdrop} onClick={closeFloatingModal}>
          <section
            className={styles.floatingWindow}
            role="dialog"
            aria-modal="true"
            aria-labelledby="floating-modal-title"
            aria-describedby="floating-modal-message"
            onClick={(event) => event.stopPropagation()}
          >
            <p id="floating-modal-title" className={styles.floatingTitle}>
              {floatingModal.title}
            </p>
            <p id="floating-modal-message" className={styles.floatingMessage}>
              {floatingModal.message}
            </p>
            <div className={styles.floatingActions}>
              {floatingModal.mode === "confirm" ? (
                <button
                  className={styles.floatingSecondary}
                  type="button"
                  onClick={closeFloatingModal}
                >
                  {floatingModal.cancelLabel ?? "Cancelar"}
                </button>
              ) : null}
              <button
                className={styles.floatingPrimary}
                type="button"
                onClick={handleFloatingConfirm}
              >
                {floatingModal.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

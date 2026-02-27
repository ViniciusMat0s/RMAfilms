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
  createdAt: string;
  updatedAt: string;
};

type ProjectForm = {
  tag: string;
  title: string;
  copy: string;
  image: string;
};

const TOKEN_STORAGE_KEY = "rma_admin_token";
const FALLBACK_TOKEN_HINT = "ADMINRMA";

const EMPTY_FORM: ProjectForm = {
  tag: "",
  title: "",
  copy: "",
  image: "",
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const projectsWithImage = projects.filter((project) => Boolean(project.image)).length;

  const loadProjects = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Falha ao carregar projetos.");
      }

      const payload = (await response.json()) as Partial<{
        projects: ProjectRecord[];
      }>;

      if (!Array.isArray(payload.projects)) {
        setProjects([]);
      } else {
        setProjects(
          payload.projects.map((project) => ({
            ...project,
            image: typeof project.image === "string" ? project.image : null,
          }))
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
    setSelectedFile(null);
  };

  const startEdit = (project: ProjectRecord) => {
    setEditingId(project.id);
    setForm({
      tag: project.tag,
      title: project.title,
      copy: project.copy,
      image: project.image ?? "",
    });
    setSelectedFile(null);
    setMessage("");
    setError("");
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const trimmed = {
      tag: form.tag.trim(),
      title: form.title.trim(),
      copy: form.copy.trim(),
      image: form.image.trim(),
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
      let imagePath = trimmed.image || null;
      if (selectedFile) {
        const uploadPayload = new FormData();
        uploadPayload.append("file", selectedFile);

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
          throw new Error(payload.error ?? "Falha ao enviar imagem.");
        }

        const uploadResult = (await uploadResponse.json()) as Partial<{
          image: string;
        }>;
        if (!uploadResult.image) {
          throw new Error("Falha ao obter caminho da imagem.");
        }

        imagePath = uploadResult.image;
      }

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
          image: imagePath,
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
              <strong>{loading ? "--" : projectsWithImage}</strong>
              <span>Com foto</span>
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
                <label htmlFor="project-image">Foto do projeto</label>
                <input
                  id="project-image"
                  className={styles.input}
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setSelectedFile(file);
                  }}
                />
                <p className={styles.helper}>
                  Envie JPG, PNG, WEBP ou GIF (maximo 8MB). Se enviar um novo arquivo, ele
                  substitui a imagem atual no projeto.
                </p>
                {selectedFile ? (
                  <p className={styles.message}>Arquivo selecionado: {selectedFile.name}</p>
                ) : null}
                {form.image ? (
                  <div className={styles.previewWrap}>
                    <div className={styles.previewMedia}>
                      <Image
                        src={form.image}
                        alt={`Preview ${form.title || "projeto"}`}
                        fill
                        sizes="(max-width: 900px) 100vw, 320px"
                      />
                    </div>
                    <button
                      className={styles.buttonGhost}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          image: "",
                        }))
                      }
                      disabled={saving}
                    >
                      Remover foto atual
                    </button>
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
                {message ? <p className={`${styles.message} ${styles.messageSuccess}`}>{message}</p> : null}
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
              {projects.map((project) => (
                <article key={project.id} className={styles.item}>
                  <div className={styles.topline}>
                    <span className={styles.tag}>{project.tag}</span>
                    <code className={styles.projectId}>{project.id}</code>
                  </div>
                  <h3 className={styles.title}>{project.title}</h3>
                  {project.image ? (
                    <div className={styles.itemImageWrap}>
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        sizes="(max-width: 900px) 100vw, 420px"
                      />
                    </div>
                  ) : null}
                  <p className={styles.copy}>{project.copy}</p>
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
              ))}
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

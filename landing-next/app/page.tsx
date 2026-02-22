"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

const marqueeItems = [
  "story systems",
  "scroll choreography",
  "editorial grids",
  "cinematic motion",
  "tactile UI",
  "precision craft",
  "story systems",
  "scroll choreography",
  "editorial grids",
  "cinematic motion",
  "tactile UI",
  "precision craft",
];

const capabilities = [
  {
    label: "01",
    title: "Narrative architecture",
    copy: "We map stories like a film edit: tension, pause, release.",
  },
  {
    label: "02",
    title: "Motion direction",
    copy: "Micro and macro motion tuned to feel alive, never noisy.",
  },
  {
    label: "03",
    title: "Design systems",
    copy: "Tokenized grids, typography, and color for scalable rollouts.",
  },
  {
    label: "04",
    title: "Launch engineering",
    copy: "High performance builds with scroll triggers and responsive polish.",
  },
];

const projects = [
  {
    tag: "Luxury",
    title: "Velvet Signal",
    copy: "A gallery like launch that feels cinematic from the first scroll.",
    stats: ["12 scene rail", "parallax stack", "global press"],
  },
  {
    tag: "Culture",
    title: "Echo Atlas",
    copy: "Editorial landing experience with audio cues and kinetic type.",
    stats: ["94% scroll depth", "7 languages", "live debut"],
  },
  {
    tag: "Tech",
    title: "Polar Vector",
    copy: "Product reveal with interactive storytelling and rapid load times.",
    stats: ["2.1s load", "custom cursor", "GSAP core"],
  },
  {
    tag: "Retail",
    title: "Lumen Market",
    copy: "Shoppable narrative that blends tactile textures and data layers.",
    stats: ["24 modules", "soft scroll", "50% lift"],
  },
];

const process = [
  {
    step: "01",
    title: "Signal capture",
    copy: "We decode brand energy, audience intent, and launch purpose.",
  },
  {
    step: "02",
    title: "Experience map",
    copy: "We blueprint layout rhythm, motion beats, and interaction flow.",
  },
  {
    step: "03",
    title: "Build and polish",
    copy: "We craft components, animate with intent, and tune performance.",
  },
  {
    step: "04",
    title: "Launch system",
    copy: "We ship with documentation, analytics hooks, and future modules.",
  },
];

const studioValues = [
  "Bold typography",
  "Scroll storytelling",
  "Tactile color",
  "Premium motion",
  "Modular scenes",
];

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    let heroStage: HTMLElement | null = null;
    let onHeroMove: ((event: MouseEvent) => void) | null = null;
    let onHeroLeave: (() => void) | null = null;
    let recordingTimerId: ReturnType<typeof setInterval> | null = null;
    const pad2 = (value: number) => String(value).padStart(2, "0");

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        const direction = el.dataset.reveal || "up";
        const x = direction === "left" ? -80 : direction === "right" ? 80 : 0;
        const y = direction === "up" ? 60 : 0;

        gsap.fromTo(
          el,
          { autoAlpha: 0, x, y },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 82%",
            },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((wrapper) => {
        const items = wrapper.querySelectorAll<HTMLElement>("[data-stagger-item]");
        gsap.fromTo(
          items,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.16,
            scrollTrigger: {
              trigger: wrapper,
              start: "top 85%",
            },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const strength = Number(el.dataset.parallax || 0.2);
        gsap.to(el, {
          y: () => -120 * strength,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count || 0);
        const suffix = el.dataset.suffix || "";
        const counter = { value: 0 };
        gsap.to(counter, {
          value: target,
          duration: 1.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
          },
          onUpdate: () => {
            el.textContent = `${Math.round(counter.value)}${suffix}`;
          },
        });
      });

      gsap.to(".progress-bar", {
        scaleX: 1,
        ease: "none",
        transformOrigin: "left",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.2,
        },
      });

      heroStage = document.querySelector<HTMLElement>(".hero-stage");
      const heroTimeValue =
        rootRef.current?.querySelector<HTMLElement>("[data-recording-timer]") ??
        null;
      const heroZoomValue =
        heroStage?.querySelector<HTMLElement>(".hud-zoom-value") ?? null;
      const heroMainWords = gsap.utils.toArray<HTMLElement>("[data-hero-main-word]");
      const heroWords = gsap.utils.toArray<HTMLElement>(".hero-word");

      if (heroTimeValue) {
        const startedAt = Date.now();
        const fps = 30;
        const tickMs = Math.round(1000 / fps);
        const updateTimecode = () => {
          const elapsedMs = Date.now() - startedAt;
          const totalSeconds = Math.floor(elapsedMs / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          const frames = Math.floor((elapsedMs % 1000) / tickMs) % fps;
          heroTimeValue.textContent = `${pad2(hours)}:${pad2(minutes)}:${pad2(
            seconds
          )}:${pad2(frames)}`;
        };

        updateTimecode();
        recordingTimerId = setInterval(updateTimecode, tickMs);
      }

      if (heroStage || heroWords.length || heroMainWords.length) {
        const heroTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: ".hero--statement",
            start: "top top",
            end: "+=160%",
            scrub: true,
            pin: true,
            anticipatePin: 1,
          },
        });

        if (heroStage) {
          heroTimeline.fromTo(
            heroStage,
            { "--zoom-level": 0 },
            { "--zoom-level": 1, ease: "none" },
            0
          );
          heroTimeline.eventCallback("onUpdate", () => {
            if (!heroZoomValue) return;
            const minZoom = 1;
            const maxZoom = 3;
            const zoom =
              minZoom + (maxZoom - minZoom) * heroTimeline.progress();
            heroZoomValue.textContent = `${zoom.toFixed(1)}x`;
          });
        }

        if (heroMainWords.length) {
          gsap.set(heroMainWords, { autoAlpha: 0, y: 20 });
          gsap.set(heroMainWords[0], { autoAlpha: 1, y: 0 });

          const mainWordStops = [0.16, 0.28, 0.4, 0.56, 0.72];
          heroMainWords.forEach((word, index) => {
            if (index === 0) return;
            const position =
              mainWordStops[index - 1] ??
              0.16 + (0.56 * (index - 1)) / Math.max(heroMainWords.length - 2, 1);

            heroTimeline.to(
              word,
              { autoAlpha: 1, y: 0, duration: 0.12, ease: "power3.out" },
              position
            );
          });
        }

        if (heroWords.length) {
          gsap.set(heroWords, { autoAlpha: 0, y: 18 });
          gsap.set(heroWords[0], { autoAlpha: 1, y: 0 });

          const wordStops = [0.2, 0.52, 0.84];
          heroWords.forEach((word, index) => {
            if (index === 0) return;
            const prev = heroWords[index - 1];
            const position = wordStops[index] ?? index / heroWords.length;
            heroTimeline.to(prev, { autoAlpha: 0, y: -18, duration: 0.1 }, position);
            heroTimeline.to(word, { autoAlpha: 1, y: 0, duration: 0.1 }, position);
          });
        }
      }

      const railTrack = railRef.current;
      if (railTrack) {
        const getScrollDistance = () =>
          railTrack.scrollWidth - window.innerWidth + 120;

        gsap.to(railTrack, {
          x: () => -getScrollDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: ".rail-section",
            start: "top top",
            end: () => `+=${railTrack.scrollWidth}`,
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
          },
        });
      }

      const magneticItems = gsap.utils.toArray<HTMLElement>(".magnetic");
      magneticItems.forEach((item) => {
        const strength = 16;
        const onMove = (event: MouseEvent) => {
          const bounds = item.getBoundingClientRect();
          const relX = event.clientX - bounds.left - bounds.width / 2;
          const relY = event.clientY - bounds.top - bounds.height / 2;
          gsap.to(item, {
            x: relX / strength,
            y: relY / strength,
            duration: 0.3,
            ease: "power3.out",
          });
        };
        const onLeave = () => {
          gsap.to(item, { x: 0, y: 0, duration: 0.4, ease: "power3.out" });
        };
        item.addEventListener("mousemove", onMove);
        item.addEventListener("mouseleave", onLeave);
      });

      const cursor = document.querySelector<HTMLElement>(".cursor");
      if (cursor && window.matchMedia("(pointer: fine)").matches) {
        const xTo = gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3" });
        const yTo = gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3" });

        const onMove = (event: MouseEvent) => {
          xTo(event.clientX);
          yTo(event.clientY);
        };

        window.addEventListener("mousemove", onMove);

        const hoverTargets = document.querySelectorAll<HTMLElement>(
          "a, button, .magnetic"
        );
        hoverTargets.forEach((el) => {
          el.addEventListener("mouseenter", () =>
            cursor.classList.add("cursor--active")
          );
          el.addEventListener("mouseleave", () =>
            cursor.classList.remove("cursor--active")
          );
        });
      }

      if (heroStage && window.matchMedia("(pointer: fine)").matches) {
        const currentHeroStage = heroStage;
        const setX = gsap.quickTo(heroStage, "--mx", {
          duration: 0.5,
          ease: "power3.out",
        });
        const setY = gsap.quickTo(heroStage, "--my", {
          duration: 0.5,
          ease: "power3.out",
        });

        onHeroMove = (event: MouseEvent) => {
          const bounds = currentHeroStage.getBoundingClientRect();
          const x = ((event.clientX - bounds.left) / bounds.width) * 100;
          const y = ((event.clientY - bounds.top) / bounds.height) * 100;
          setX(x);
          setY(y);
        };

        onHeroLeave = () => {
          setX(50);
          setY(50);
        };

        currentHeroStage.addEventListener("mousemove", onHeroMove);
        currentHeroStage.addEventListener("mouseleave", onHeroLeave);
      }
    }, rootRef);

    return () => {
      if (heroStage && onHeroMove && onHeroLeave) {
        heroStage.removeEventListener("mousemove", onHeroMove);
        heroStage.removeEventListener("mouseleave", onHeroLeave);
      }
      if (recordingTimerId) {
        clearInterval(recordingTimerId);
      }
      lenis.destroy();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="page">
      <div className="cursor">
        <span className="cursor-dot" />
        <span className="cursor-ring" />
      </div>

      <div className="progress">
        <span className="progress-bar" />
      </div>

      <header className="nav">
        <div className="nav-spacer" aria-hidden="true" />
        <nav className="nav-links">
          <a href="#capabilities">Capabilities</a>
          <a href="#work">Work</a>
          <a href="#process">Process</a>
          <a href="#studio">Studio</a>
        </nav>
        <a className="button magnetic" href="#contact">
          Start a project
        </a>
      </header>

      <main>
        <section className="hero hero--statement" id="top">
          <div className="hero-stage">
            <div className="hero-flash" aria-hidden="true" />
            <div className="hero-hud" aria-hidden="true">
              <span className="hud-corner hud-corner--tl" />
              <span className="hud-corner hud-corner--tr" />
              <span className="hud-corner hud-corner--bl" />
              <span className="hud-corner hud-corner--br" />
              <div className="hud-rec">
                <span className="hud-dot" />
                REC
              </div>
              <div className="hud-time" data-recording-timer>
                00:00:00:00
              </div>
              <div className="hud-mode">AUTO<br />AWB</div>
              <div className="hud-battery">
                <span />
                <span />
                <span />
              </div>
              <div className="hud-crosshair">
                <span />
                <span />
              </div>
              <div className="hud-zoom">
                <span>ZOOM</span>
                <strong className="hud-zoom-value">1.0x</strong>
                <div className="hud-zoom-bar">
                  <span />
                </div>
              </div>
              <div className="hud-meter">-3..2..1..1..2..3</div>
              <div className="hud-iso">ISO 100 1/100 F2.8</div>
              <div className="hud-audio">
                <span>L</span>
                <div className="hud-bars" />
                <span>R</span>
              </div>
              <div className="hud-res">
                HD 2K 4K 6K FPS60<br />3840x2160<br />1h30m
              </div>
            </div>
            <div className="hero-grid">
              <h1 className="hero-text">
                <span className="hero-line hero-line--main">
                  <span className="hero-main-word" data-hero-main-word>
                    FILMES
                  </span>{" "}
                  <span className="hero-main-word" data-hero-main-word>
                    ESTRAT&Eacute;GICOS
                  </span>
                </span>
                <span className="hero-line hero-line--main">
                  <span className="hero-main-word" data-hero-main-word>
                    PARA
                  </span>{" "}
                  <span className="hero-main-word" data-hero-main-word>
                    MARCAS
                  </span>{" "}
                  <span className="hero-main-word" data-hero-main-word>
                    QUE
                  </span>
                </span>
                <span className="hero-line hero-line--accent">
                  <span
                    className="hero-highlight hero-main-word"
                    data-hero-main-word
                  >
                    LIDERAM
                  </span>
                </span>
              </h1>
              <div className="hero-right">
                <div className="hero-words">
                  <span className="hero-word">Reputa&ccedil;&atilde;o.</span>
                  <span className="hero-word">Marca.</span>
                  <span className="hero-word">Autoridade.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="marquee">
          <div className="marquee-track">
            {marqueeItems.map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>

        <section className="section" id="capabilities">
          <div className="section-head">
            <p className="eyebrow" data-reveal="left">
              Capabilities
            </p>
            <h2 data-reveal="left">A studio tuned for premium launches.</h2>
            <p className="section-lead" data-reveal="right">
              We combine editorial systems, motion direction, and technical
              excellence to shape experiences with intent.
            </p>
          </div>
          <div className="card-grid" data-stagger>
            {capabilities.map((card) => (
              <article className="card" key={card.title} data-stagger-item>
                <span className="card-label">{card.label}</span>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rail-section" id="work">
          <div className="rail-head">
            <div>
              <p className="eyebrow" data-reveal="left">
                Selected work
              </p>
              <h2 data-reveal="left">A curated set of launches.</h2>
            </div>
            <p className="section-lead" data-reveal="right">
              Horizontal scroll storytelling inspired by the highest level
              award sites.
            </p>
          </div>
          <div className="rail-track" ref={railRef}>
            {projects.map((project) => (
              <article className="rail-card" key={project.title}>
                <div className="rail-image" aria-hidden="true" />
                <div className="rail-body">
                  <div className="rail-top">
                    <span>{project.tag}</span>
                    <span>2026</span>
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.copy}</p>
                  <ul>
                    {project.stats.map((stat) => (
                      <li key={stat}>{stat}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="process">
          <div className="section-head">
            <p className="eyebrow" data-reveal="left">
              Process
            </p>
            <h2 data-reveal="left">Precision, rhythm, velocity.</h2>
            <p className="section-lead" data-reveal="right">
              Every step is choreographed so the experience feels inevitable.
            </p>
          </div>
          <div className="process-grid" data-stagger>
            {process.map((step) => (
              <article className="process-card" key={step.step} data-stagger-item>
                <span>{step.step}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="studio">
          <div className="split">
            <div>
              <p className="eyebrow" data-reveal="left">
                Studio lens
              </p>
              <h2 data-reveal="left">Built to feel tactile, never template.</h2>
              <p className="section-lead" data-reveal="right">
                We treat every landing as a stage. Typography moves from the
                side, sections breathe, and motion supports the narrative.
              </p>
              <div className="pill-row" data-stagger>
                {studioValues.map((pill) => (
                  <span className="pill" key={pill} data-stagger-item>
                    {pill}
                  </span>
                ))}
              </div>
            </div>
            <div className="stats-panel" data-reveal="right">
              <div className="stats-row">
                <div>
                  <strong data-count="96" data-suffix="%">
                    0
                  </strong>
                  <span>client retention</span>
                </div>
                <div>
                  <strong data-count="4" data-suffix="x">
                    0
                  </strong>
                  <span>scroll depth lift</span>
                </div>
                <div>
                  <strong data-count="18" data-suffix="">
                    0
                  </strong>
                  <span>countries shipped</span>
                </div>
              </div>
              <div className="stats-note">
                <p>
                  Built with Next.js, GSAP, and Lenis for silky scroll and
                  precise timing.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta" id="contact">
          <div className="cta-inner" data-reveal="up">
            <div>
              <p className="eyebrow">Ready to launch</p>
              <h2>Lets craft a landing page that feels alive.</h2>
              <p>
                Share your brief and receive a concept outline with timelines,
                motion notes, and layout direction.
              </p>
            </div>
            <div className="cta-actions">
              <a className="button magnetic" href="mailto:hello@lumen.studio">
                hello@lumen.studio
              </a>
              <a className="button button--ghost magnetic" href="#top">
                Back to top
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <strong>Lumen Atelier</strong>
          <p>Immersive landing systems for brands that move fast.</p>
        </div>
        <div>
          <span>Based in Sao Paulo, Lisbon, and Paris</span>
          <span>2026</span>
        </div>
      </footer>
    </div>
  );
}
